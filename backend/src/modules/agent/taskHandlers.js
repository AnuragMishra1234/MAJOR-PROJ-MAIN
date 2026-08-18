/**
 * @file taskHandlers.js
 * @module agent
 *
 * Task handler registry and mock handlers for Phase 4.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE RULE
 * ═══════════════════════════════════════════════════════════════════════════
 * This file defines the DELEGATION CONTRACT between the Agent and the
 * modules that actually execute tasks.
 *
 * Handler interface:
 *   handler.execute(task, context) →
 *     { success: true,  output: object } |
 *     { success: false, error:  { code, message, details? } }
 *
 * The Agent never touches handler internals. It only calls execute().
 * This means Person 3 (AI module) and Person 4 (Execution module) can
 * replace mock handlers with real ones via registry.register() without
 * touching Agent logic.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MOCK HANDLERS (Phase 4)
 * ═══════════════════════════════════════════════════════════════════════════
 * All handlers here are MOCKS — they return realistic-shaped output without
 * calling any real AI API or execution engine.
 *
 * Replace by calling:
 *   registry.register(TaskType.TEXT_GENERATION, realAIHandler);
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTEXT INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════
 * Each handler receives the full executionContext so it can incorporate
 * outputs from prior tasks. Mock handlers include priorOutputs in their
 * response to demonstrate the wiring is correct.
 */

import { TaskType, ErrorCode } from '../agent/workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER ERROR
// ─────────────────────────────────────────────────────────────────────────────

export class HandlerError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]    - One of ErrorCode values.
   * @param {object} [context] - Extra debug info.
   */
  constructor(message, code = ErrorCode.EXECUTION_ERROR, context = {}) {
    super(message);
    this.name = 'HandlerError';
    this.code = code;
    this.context = context;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK HANDLER IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock handler for TEXT_GENERATION tasks.
 * Future: replaced by Person 3's AI generation module.
 */
const textGenerationHandler = {
  async execute(task, context) {
    const priorOutputs = context?.outputs ?? {};
    // Incorporate prior task outputs into the mock response (demonstrates context flow)
    const priorContent = Object.values(priorOutputs)
      .map((o) => o?.content ?? o?.result ?? '')
      .filter(Boolean)
      .join(', ');

    return {
      success: true,
      output: {
        content: priorContent
          ? `Mock generated text for "${task.title}" (using: ${priorContent})`
          : `Mock generated text for "${task.title}": This is a high-quality, AI-generated content block.`,
        wordCount: 42,
        taskId: task.id,
      },
    };
  },
};

/**
 * Mock handler for WEBSITE_GENERATION tasks.
 * Future: replaced by Person 3's website generation module.
 */
const websiteGenerationHandler = {
  async execute(task, context) {
    const priorOutputs = context?.outputs ?? {};
    const textContent = Object.values(priorOutputs)
      .map((o) => o?.content)
      .filter(Boolean)[0];

    return {
      success: true,
      output: {
        files: ['index.html', 'styles.css', 'app.js'],
        content: textContent
          ? `Mock website for "${task.title}" incorporating: "${textContent.substring(0, 60)}..."`
          : `Mock website for "${task.title}": <html><body><h1>Generated Site</h1></body></html>`,
        pageCount: 1,
        taskId: task.id,
      },
    };
  },
};

/**
 * Mock handler for CODE_GENERATION tasks.
 * Future: replaced by Person 4's code execution module.
 */
const codeGenerationHandler = {
  async execute(task, _context) {
    return {
      success: true,
      output: {
        code: `// Mock generated code for: ${task.title}\nconsole.log("Hello from generated code");`,
        language: 'javascript',
        linesOfCode: 2,
        taskId: task.id,
      },
    };
  },
};

/**
 * Mock handler for VALIDATION tasks.
 * Future: replaced by Person 4's validation module.
 */
const validationHandler = {
  async execute(task, context) {
    const priorOutputs = context?.outputs ?? {};
    // Check if there is anything to validate
    const hasPriorOutput = Object.keys(priorOutputs).length > 0;

    return {
      success: true,
      output: {
        valid: true,
        score: 0.97,
        checks: {
          structureValid: true,
          contentQuality: hasPriorOutput ? 'HIGH' : 'MEDIUM',
          dependencyOutputsPresent: hasPriorOutput,
        },
        notes: `Mock validation passed for "${task.title}"`,
        taskId: task.id,
      },
    };
  },
};

/**
 * Mock handler for OTHER task types.
 */
const otherHandler = {
  async execute(task, _context) {
    return {
      success: true,
      output: {
        result: `Mock result for "${task.title}"`,
        taskId: task.id,
      },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

class HandlerRegistry {
  /** @type {Map<string, { execute: function }>} */
  #handlers;

  constructor() {
    this.#handlers = new Map();
  }

  // ─── Registration ────────────────────────────────────────────────────────

  /**
   * Register a handler for a task type.
   * Replaces any existing handler for that type (allows real handlers
   * to override mocks at runtime without changing Agent logic).
   *
   * @param {string} taskType - A TaskType value (or any custom type string).
   * @param {{ execute: function }} handler - Handler implementing the execute() contract.
   */
  register(taskType, handler) {
    if (typeof taskType !== 'string' || !taskType.trim()) {
      throw new TypeError('HandlerRegistry.register: taskType must be a non-empty string');
    }
    if (!handler || typeof handler.execute !== 'function') {
      throw new TypeError('HandlerRegistry.register: handler must have an execute() method');
    }
    this.#handlers.set(taskType, handler);
  }

  // ─── Query ────────────────────────────────────────────────────────────────

  /**
   * Check whether a handler is registered for a given task type.
   * @param {string} taskType
   * @returns {boolean}
   */
  has(taskType) {
    return this.#handlers.has(taskType);
  }

  /**
   * Get the handler for a task type.
   * @param {string} taskType
   * @returns {{ execute: function } | undefined}
   */
  get(taskType) {
    return this.#handlers.get(taskType);
  }

  /**
   * Return all registered task types.
   * @returns {string[]}
   */
  registeredTypes() {
    return Array.from(this.#handlers.keys());
  }

  // ─── Execution ────────────────────────────────────────────────────────────

  /**
   * Execute a task using the registered handler for its type.
   *
   * @param {object} task - Task snapshot from WorkflowEngine.
   * @param {object} [context] - Execution context containing prior outputs.
   * @returns {Promise<
   *   { success: true, output: object } |
   *   { success: false, error: { code: string, message: string, details?: object } }
   * >}
   */
  async execute(task, context = {}) {
    const handler = this.#handlers.get(task.type);

    if (!handler) {
      return {
        success: false,
        error: {
          code: ErrorCode.INVALID_INPUT,
          message: `No handler registered for task type "${task.type}".`,
          details: {
            taskId: task.id,
            taskType: task.type,
            registeredTypes: this.registeredTypes(),
          },
        },
      };
    }

    try {
      const result = await handler.execute(task, context);

      // Validate handler response shape
      if (typeof result !== 'object' || result === null) {
        throw new HandlerError(
          `Handler for "${task.type}" returned an invalid result (not an object).`,
        );
      }

      return result;
    } catch (err) {
      return {
        success: false,
        error: {
          code: err.code ?? ErrorCode.EXECUTION_ERROR,
          message: `Handler execution failed for task "${task.id}" (${task.type}): ${err.message}`,
          details: { taskId: task.id, originalError: err.message },
        },
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a HandlerRegistry pre-loaded with all mock handlers.
 *
 * Person 3/4 can override any handler after creation:
 *   const registry = createHandlerRegistry();
 *   registry.register(TaskType.TEXT_GENERATION, realAIModule);
 *
 * @returns {HandlerRegistry}
 */
export function createHandlerRegistry() {
  const registry = new HandlerRegistry();

  registry.register(TaskType.TEXT_GENERATION,    textGenerationHandler);
  registry.register(TaskType.WEBSITE_GENERATION, websiteGenerationHandler);
  registry.register(TaskType.CODE_GENERATION,    codeGenerationHandler);
  registry.register(TaskType.VALIDATION,         validationHandler);
  registry.register(TaskType.OTHER,              otherHandler);

  return registry;
}
