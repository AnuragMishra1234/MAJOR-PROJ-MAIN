/**
 * @file planner.js
 * @module agent/planner
 *
 * The Planner — converts a natural-language user goal into a structured
 * task plan compatible with the Phase 2 WorkflowEngine.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE RULE
 * ═══════════════════════════════════════════════════════════════════════════
 * The Planner ONLY does:
 *   Natural-language goal → Structured task plan
 *
 * The Planner does NOT:
 *   • Execute tasks                  • Call AI generation APIs
 *   • Generate text/websites/code    • Connect to the database
 *   • Manage HTTP routes             • Handle Auto-Healing
 *   • Manage workflow execution state
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PUBLIC INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * const planner = createPlanner({ provider: 'groq' });
 * const result  = await planner.plan(goal);
 *
 * Success: { success: true,  plan: { goal, tasks: [...] } }
 * Failure: { success: false, error: { code, message, details? } }
 *
 * loadPlanIntoEngine(plan, engine) — bridge: populates an existing engine
 * with the tasks from a validated plan.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RETRY LOGIC
 * ═══════════════════════════════════════════════════════════════════════════
 * If the LLM returns an invalid plan:
 *   1. normalisePlan() attempts to fix common quirks.
 *   2. validatePlan() checks all 11 rules.
 *   3. If invalid → retry with a correction prompt (includes errors).
 *   4. Up to MAX_PLANNER_RETRIES additional attempts.
 *   5. If still invalid → return structured PlannerError.
 */

import { createProvider } from './plannerProvider.js';
import { buildPlanningMessages, buildCorrectionMessages } from './plannerPrompt.js';
import { normalisePlan, validatePlan } from './plannerValidator.js';
import { ErrorCode } from '../workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum number of RETRY attempts after an initial failure (not counting the first try). */
export const MAX_PLANNER_RETRIES = 2;

/** Minimum meaningful goal length (characters). */
const MIN_GOAL_LENGTH = 5;

// ─────────────────────────────────────────────────────────────────────────────
// PLANNER ERROR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Structured planning error.
 * Returned (not thrown) via { success: false, error } — keeps the interface
 * clean so callers don't need try/catch for expected failure cases.
 */
export class PlannerError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]    - One of PlannerErrorCode values.
   * @param {object} [details] - Extra context (e.g., validation errors list).
   */
  constructor(message, code = PlannerErrorCode.PLANNING_FAILED, details = {}) {
    super(message);
    this.name = 'PlannerError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Machine-readable error codes for planning failures.
 */
export const PlannerErrorCode = Object.freeze({
  INVALID_GOAL:       'INVALID_GOAL',
  PLANNING_FAILED:    'PLANNING_FAILED',
  PROVIDER_ERROR:     'PROVIDER_ERROR',
  MAX_RETRIES:        'MAX_RETRIES_EXCEEDED',
  VALIDATION_FAILED:  'VALIDATION_FAILED',
  ENGINE_LOAD_FAILED: 'ENGINE_LOAD_FAILED',
});

// ─────────────────────────────────────────────────────────────────────────────
// PLANNER CLASS
// ─────────────────────────────────────────────────────────────────────────────

class Planner {
  #provider;
  #maxRetries;

  /**
   * @param {object} provider   - An LLM provider instance (from plannerProvider.js).
   * @param {number} maxRetries - Max retry attempts on validation failure.
   */
  constructor(provider, maxRetries = MAX_PLANNER_RETRIES) {
    this.#provider = provider;
    this.#maxRetries = maxRetries;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Convert a natural-language goal into a validated task plan.
   *
   * @param {string} goal - The user's natural-language goal.
   * @returns {Promise<
   *   { success: true, plan: { goal: string, tasks: object[] } } |
   *   { success: false, error: { code: string, message: string, details?: object } }
   * >}
   *
   * @example
   * const result = await planner.plan('Create a website for an eco-friendly startup.');
   * if (result.success) {
   *   const { plan } = result;
   *   plan.tasks.forEach(t => engine.addTask(t));
   * }
   */
  async plan(goal) {
    // ── 1. Validate goal input ─────────────────────────────────────────────
    const goalError = this.#validateGoal(goal);
    if (goalError) {
      return {
        success: false,
        error: { code: PlannerErrorCode.INVALID_GOAL, message: goalError },
      };
    }

    const trimmedGoal = goal.trim();
    let lastRawResponse = '';
    let lastErrors = [];

    // ── 2. Initial attempt ────────────────────────────────────────────────
    const messages = buildPlanningMessages(trimmedGoal);
    const firstResult = await this.#attempt(messages);

    if (firstResult.success) {
      return { success: true, plan: firstResult.plan };
    }

    lastRawResponse = firstResult.rawResponse;
    lastErrors = firstResult.errors;

    // ── 3. Retry loop ─────────────────────────────────────────────────────
    for (let attempt = 1; attempt <= this.#maxRetries; attempt++) {
      const correctionMessages = buildCorrectionMessages(
        trimmedGoal,
        lastRawResponse,
        lastErrors,
      );

      const retryResult = await this.#attempt(correctionMessages);

      if (retryResult.success) {
        return { success: true, plan: retryResult.plan };
      }

      lastRawResponse = retryResult.rawResponse;
      lastErrors = retryResult.errors;
    }

    // ── 4. All retries exhausted ──────────────────────────────────────────
    return {
      success: false,
      error: {
        code: PlannerErrorCode.MAX_RETRIES,
        message: `The task plan could not be generated after ${this.#maxRetries + 1} attempts.`,
        details: { lastErrors },
      },
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Validate the goal string.
   * @param {string} goal
   * @returns {string | null} Error message, or null if valid.
   * @private
   */
  #validateGoal(goal) {
    if (typeof goal !== 'string') {
      return 'Goal must be a string.';
    }
    if (goal.trim().length === 0) {
      return 'Goal cannot be empty.';
    }
    if (goal.trim().length < MIN_GOAL_LENGTH) {
      return `Goal is too short — please provide a more descriptive goal (at least ${MIN_GOAL_LENGTH} characters).`;
    }
    return null;
  }

  /**
   * Make a single LLM call, normalise and validate the response.
   *
   * @param {Array<{ role: string, content: string }>} messages
   * @returns {Promise<
   *   { success: true, plan: object } |
   *   { success: false, rawResponse: string, errors: string[] }
   * >}
   * @private
   */
  async #attempt(messages) {
    let rawContent = '';

    try {
      const response = await this.#provider.complete(messages);
      rawContent = response.content ?? '';
    } catch (providerErr) {
      // Provider errors (network, auth, etc.) are surfaced as a planning failure.
      // We treat them as a non-retryable failure to avoid burning retries on
      // configuration errors (missing API key, etc.).
      return {
        success: false,
        rawResponse: '',
        errors: [`Provider error: ${providerErr.message}`],
      };
    }

    // Normalise
    const normalised = normalisePlan(rawContent);
    if (!normalised.ok) {
      return {
        success: false,
        rawResponse: rawContent,
        errors: [normalised.error],
      };
    }

    // Validate
    const validation = validatePlan(normalised.plan);
    if (!validation.valid) {
      return {
        success: false,
        rawResponse: rawContent,
        errors: validation.errors,
      };
    }

    return { success: true, plan: validation.plan };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a Planner instance.
 *
 * @param {object} [options]
 * @param {'groq' | 'openai' | 'mock'} [options.providerType]
 *   Which LLM provider to use. If omitted, auto-detects from environment.
 * @param {object} [options.provider]
 *   A pre-constructed provider instance (takes precedence over providerType).
 *   Useful for injecting mocks in tests.
 * @param {number} [options.maxRetries]
 *   Max retry attempts. Defaults to MAX_PLANNER_RETRIES.
 * @returns {Planner}
 *
 * @example
 * // Production:
 * const planner = createPlanner({ providerType: 'groq' });
 *
 * // Tests (mock injection):
 * const mock = new MockProvider();
 * const planner = createPlanner({ provider: mock });
 */
export function createPlanner(options = {}) {
  const provider = options.provider ?? createProvider(options.providerType);
  const maxRetries = options.maxRetries ?? MAX_PLANNER_RETRIES;
  return new Planner(provider, maxRetries);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE BRIDGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load a validated plan into an existing WorkflowEngine instance.
 *
 * This is the "bridge" between Planner output and the Workflow Engine.
 * The caller must create the engine with the correct projectId first:
 *
 *   const engine = WorkflowEngine.create({ projectId, goal });
 *   const result = await planner.plan(goal);
 *   if (result.success) {
 *     const loadResult = loadPlanIntoEngine(result.plan, engine);
 *   }
 *
 * @param {{ goal: string, tasks: object[] }} plan   - A validated plan.
 * @param {import('../workflow/workflowEngine.js').WorkflowEngine} engine
 *   A WorkflowEngine instance (created externally with the correct projectId).
 *
 * @returns {{
 *   success: true,  engine: WorkflowEngine, taskIds: string[] } |
 *   { success: false, error: { code: string, message: string, details?: object }
 * }}
 */
export function loadPlanIntoEngine(plan, engine) {
  const taskIds = [];

  try {
    for (const task of plan.tasks) {
      const id = engine.addTask({
        id: task.id,
        type: task.type,
        title: task.title,
        description: task.description,
        dependencies: task.dependencies ?? [],
        metadata: task.metadata ?? {},
      });
      taskIds.push(id);
    }

    // Final dependency graph validation
    const graphCheck = engine.validateGraph();
    if (!graphCheck.valid) {
      return {
        success: false,
        error: {
          code: PlannerErrorCode.ENGINE_LOAD_FAILED,
          message: 'Plan loaded but dependency graph validation failed.',
          details: { errors: graphCheck.errors },
        },
      };
    }

    return { success: true, engine, taskIds };
  } catch (err) {
    return {
      success: false,
      error: {
        code: PlannerErrorCode.ENGINE_LOAD_FAILED,
        message: `Failed to load plan into engine: ${err.message}`,
        details: { originalError: err.message },
      },
    };
  }
}
