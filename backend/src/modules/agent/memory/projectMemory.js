/**
 * @file projectMemory.js
 * @module agent/memory
 *
 * Project-scoped in-memory context store for a single workflow run.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN
 * ═══════════════════════════════════════════════════════════════════════════
 * Memory maintains three distinct layers:
 *
 *   1. Workflow metadata   — projectId, workflowId, goal (immutable after init)
 *   2. Task outputs        — Map<taskId, output>   (accumulated as tasks complete)
 *   3. Named project context — Map<key, value>     (extracted meaningful facts)
 *
 * These layers are kept separate so consumers can request exactly what they need.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTEXT SELECTION STRATEGY
 * ═══════════════════════════════════════════════════════════════════════════
 * getRelevantContext(task) returns a curated subset — NOT the full memory.
 * Selection is based on task.type:
 *
 *   TEXT_GENERATION    → goal + named context + prior text content (up to 3)
 *   CODE_GENERATION    → goal + named context + prior code outputs
 *   WEBSITE_GENERATION → goal + named context (startupName, description, tagline…)
 *   VALIDATION         → goal + all task outputs (need full picture to validate)
 *   OTHER              → goal + named context (trimmed)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ISOLATION GUARANTEE
 * ═══════════════════════════════════════════════════════════════════════════
 * Each workflow run creates its own ProjectMemory instance.
 * There is NO shared singleton. Project A context never leaks into Project B.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PERSISTENCE
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase 5 = in-memory only (no DB, no files, no Redis).
 * Phase 6+ can persist by reading/restoring from getSnapshot().
 */

import { TaskType } from '../workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Max prior text outputs included in relevant context for a single task. */
const MAX_PRIOR_TEXT_OUTPUTS = 3;

/** Max characters from a single prior output included in context strings. */
const MAX_CONTENT_CHARS = 500;

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT MEMORY CLASS
// ─────────────────────────────────────────────────────────────────────────────

class ProjectMemory {
  /** @type {string} */
  #projectId;
  /** @type {string} */
  #workflowId;
  /** @type {string} */
  #goal;
  /** @type {Map<string, object>} taskId → raw output object */
  #taskOutputs;
  /** @type {Map<string, unknown>} named context entries (e.g. 'startupName') */
  #projectContext;
  /** @type {Map<string, object>} taskId → error object */
  #errors;
  /** @type {Date} */
  #createdAt;

  /**
   * @param {object} params
   * @param {string} params.projectId
   * @param {string} params.workflowId
   * @param {string} params.goal
   */
  constructor({ projectId, workflowId, goal }) {
    this.#projectId     = projectId;
    this.#workflowId    = workflowId;
    this.#goal          = goal;
    this.#taskOutputs   = new Map();
    this.#projectContext = new Map();
    this.#errors        = new Map();
    this.#createdAt     = new Date();
  }

  // ─── Getters ─────────────────────────────────────────────────────────────

  get projectId()  { return this.#projectId; }
  get workflowId() { return this.#workflowId; }
  get goal()       { return this.#goal; }

  // ─── Task Outputs ─────────────────────────────────────────────────────────

  /**
   * Store the output of a completed task.
   *
   * @param {string} taskId
   * @param {object} output - Raw handler output (e.g. { content, model, latencyMs })
   */
  addTaskOutput(taskId, output) {
    if (typeof taskId !== 'string' || !taskId.trim()) {
      throw new TypeError('addTaskOutput: taskId must be a non-empty string');
    }
    this.#taskOutputs.set(taskId, output ?? {});
  }

  /**
   * Retrieve the output of a specific task.
   * Returns null if the task has not completed yet.
   *
   * @param {string} taskId
   * @returns {object | null}
   */
  getTaskOutput(taskId) {
    return this.#taskOutputs.get(taskId) ?? null;
  }

  /**
   * Get all task outputs as a plain object (taskId → output).
   * @returns {Record<string, object>}
   */
  getAllOutputs() {
    return Object.fromEntries(this.#taskOutputs);
  }

  /**
   * Store a task error (does not affect task output).
   * @param {string} taskId
   * @param {object} error
   */
  addTaskError(taskId, error) {
    this.#errors.set(taskId, error ?? {});
  }

  /**
   * Retrieve the error for a specific task.
   * @param {string} taskId
   * @returns {object | null}
   */
  getTaskError(taskId) {
    return this.#errors.get(taskId) ?? null;
  }

  // ─── Named Project Context ─────────────────────────────────────────────────

  /**
   * Store a named context value.
   * Use this for semantically important facts (e.g. 'startupName', 'targetAudience').
   *
   * @param {string} key
   * @param {unknown} value
   */
  setContext(key, value) {
    if (typeof key !== 'string' || !key.trim()) {
      throw new TypeError('setContext: key must be a non-empty string');
    }
    this.#projectContext.set(key, value);
  }

  /**
   * Retrieve a named context value.
   * Returns undefined if the key has not been set.
   *
   * @param {string} key
   * @returns {unknown}
   */
  getContext(key) {
    return this.#projectContext.get(key);
  }

  /**
   * Check if a named context key exists.
   * @param {string} key
   * @returns {boolean}
   */
  hasContext(key) {
    return this.#projectContext.has(key);
  }

  /**
   * Get all named context as a plain object.
   * @returns {Record<string, unknown>}
   */
  getAllContext() {
    return Object.fromEntries(this.#projectContext);
  }

  // ─── Relevant Context (task-aware selection) ──────────────────────────────

  /**
   * Return context relevant to a specific task.
   * Selection is based on task.type — does NOT blindly dump everything.
   *
   * @param {object} task - Task snapshot from WorkflowEngine.
   * @returns {object} A curated context object for this task.
   */
  getRelevantContext(task) {
    const type = task?.type ?? 'OTHER';
    const base = {
      goal: this.#goal,
      namedContext: this.getAllContext(),
    };

    switch (type) {
      case TaskType.TEXT_GENERATION: {
        // Include recent prior text outputs to maintain narrative consistency
        const priorTexts = this.#extractTextOutputs(MAX_PRIOR_TEXT_OUTPUTS);
        return { ...base, priorTexts };
      }

      case TaskType.CODE_GENERATION: {
        // Include any prior code outputs and relevant named context
        const priorCode = this.#extractCodeOutputs();
        return { ...base, priorCode };
      }

      case TaskType.WEBSITE_GENERATION: {
        // Include all named context (startupName, description, etc.)
        // + most recent text content (the content to put on the site)
        const priorTexts = this.#extractTextOutputs(1);
        return { ...base, priorTexts };
      }

      case TaskType.VALIDATION: {
        // Validation needs the full picture to check against
        return {
          ...base,
          allOutputs: this.getAllOutputs(),
        };
      }

      default: {
        // For OTHER and unknown types: goal + named context only
        return base;
      }
    }
  }

  /**
   * Build a concise context string representation of getRelevantContext().
   * This is what gets passed to Person 3's AI module as the `context` param.
   *
   * @param {object} task
   * @returns {string}
   */
  getContextString(task) {
    const ctx = this.getRelevantContext(task);
    const parts = [];

    if (ctx.goal) {
      parts.push(`Goal: ${ctx.goal}`);
    }

    // Named context (key-value facts)
    const namedCtx = ctx.namedContext ?? {};
    if (Object.keys(namedCtx).length > 0) {
      parts.push('Project context:');
      for (const [k, v] of Object.entries(namedCtx)) {
        parts.push(`  ${k}: ${String(v).substring(0, 200)}`);
      }
    }

    // Prior text outputs
    if (ctx.priorTexts?.length > 0) {
      parts.push('Prior content:');
      for (const { taskId, content } of ctx.priorTexts) {
        parts.push(`  [${taskId}] ${content.substring(0, MAX_CONTENT_CHARS)}`);
      }
    }

    // Prior code outputs
    if (ctx.priorCode?.length > 0) {
      parts.push('Prior code:');
      for (const { taskId, code } of ctx.priorCode) {
        parts.push(`  [${taskId}] ${code.substring(0, MAX_CONTENT_CHARS)}`);
      }
    }

    // Validation: all outputs
    if (ctx.allOutputs) {
      parts.push('All task outputs:');
      for (const [taskId, output] of Object.entries(ctx.allOutputs)) {
        const summary = output?.content ?? output?.code ?? output?.result ?? JSON.stringify(output).substring(0, 200);
        parts.push(`  [${taskId}] ${String(summary).substring(0, 200)}`);
      }
    }

    return parts.join('\n');
  }

  // ─── State / Snapshot ──────────────────────────────────────────────────────

  /**
   * Return a full snapshot of current memory state (for debugging, persistence).
   * @returns {object}
   */
  getSnapshot() {
    return {
      projectId:      this.#projectId,
      workflowId:     this.#workflowId,
      goal:           this.#goal,
      taskOutputs:    this.getAllOutputs(),
      projectContext: this.getAllContext(),
      errors:         Object.fromEntries(this.#errors),
      createdAt:      this.#createdAt.toISOString(),
      snapshotAt:     new Date().toISOString(),
    };
  }

  /**
   * Reset all state (outputs, context, errors) while keeping metadata.
   * Useful for re-running a workflow on the same project.
   */
  clear() {
    this.#taskOutputs.clear();
    this.#projectContext.clear();
    this.#errors.clear();
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Extract text content from recent task outputs.
   * @param {number} maxItems
   * @returns {Array<{ taskId: string, content: string }>}
   * @private
   */
  #extractTextOutputs(maxItems) {
    const results = [];
    for (const [taskId, output] of this.#taskOutputs) {
      const content = output?.content;
      if (typeof content === 'string' && content.length > 0) {
        results.push({ taskId, content });
        if (results.length >= maxItems) break;
      }
    }
    return results;
  }

  /**
   * Extract code content from task outputs.
   * @returns {Array<{ taskId: string, code: string, language: string }>}
   * @private
   */
  #extractCodeOutputs() {
    const results = [];
    for (const [taskId, output] of this.#taskOutputs) {
      const code = output?.code;
      if (typeof code === 'string' && code.length > 0) {
        results.push({ taskId, code, language: output?.language ?? 'unknown' });
      }
    }
    return results;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new ProjectMemory instance for a workflow run.
 *
 * One instance per workflow — never share instances between workflows/projects.
 *
 * @param {object} params
 * @param {string} params.projectId
 * @param {string} params.workflowId
 * @param {string} params.goal
 * @returns {ProjectMemory}
 *
 * @example
 * const memory = createProjectMemory({ projectId: 'p1', workflowId: 'wf-1', goal: '...' });
 * memory.addTaskOutput('task-1', { content: 'EcoCampus is...' });
 * const ctx = memory.getRelevantContext({ type: TaskType.WEBSITE_GENERATION });
 */
export function createProjectMemory({ projectId, workflowId, goal }) {
  if (!projectId || typeof projectId !== 'string') {
    throw new TypeError('createProjectMemory: projectId is required');
  }
  if (!workflowId || typeof workflowId !== 'string') {
    throw new TypeError('createProjectMemory: workflowId is required');
  }
  if (!goal || typeof goal !== 'string') {
    throw new TypeError('createProjectMemory: goal is required');
  }
  return new ProjectMemory({ projectId, workflowId, goal });
}
