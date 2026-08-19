/**
 * @file executionEngine.js
 * @module agent/execution
 *
 * The Execution Engine — routes tasks to the appropriate runner.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RESPONSIBILITY
 * ═══════════════════════════════════════════════════════════════════════════
 * Given a task and its AI-generated output:
 *   1. Determines the execution strategy based on task.type
 *   2. Delegates to the appropriate runner
 *   3. Returns a standardized ExecutionResult
 *
 * The engine does NOT contain execution logic itself — all logic lives in
 * the individual runners (textRunner, codeRunner, websiteRunner).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EXECUTION STRATEGIES BY TASK TYPE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   TEXT_GENERATION    → textRunner   (structural checks, no code execution)
 *   CODE_GENERATION    → codeRunner   (syntax check + mock sandbox execution)
 *   WEBSITE_GENERATION → websiteRunner (file checks + mock build)
 *   VALIDATION         → passthrough  (validation is handled separately)
 *   OTHER              → passthrough  (no execution needed)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   engine.execute(task, generatedOutput) → Promise<ExecutionResult>
 *
 *   ExecutionResult (success):
 *     { success: true, status: 'COMPLETED', output: object, logs: string[], errors: [] }
 *
 *   ExecutionResult (failure):
 *     { success: false, status: 'FAILED', output: null, logs: string[], errors: [ExecutionError] }
 */

import { TaskType } from '../workflow/index.js';
import { createTextRunner }    from './runners/textRunner.js';
import { createCodeRunner }    from './runners/codeRunner.js';
import { createWebsiteRunner } from './runners/websiteRunner.js';
import { normalizeExecutionError } from './errors/executionErrors.js';

const SOURCE = 'executionEngine';

// ─────────────────────────────────────────────────────────────────────────────
// PASSTHROUGH RESULT (no execution needed for this task type)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a pass-through execution result for task types that don't need
 * execution (VALIDATION, OTHER). The output is returned as-is.
 *
 * @param {object} output
 * @param {string} taskType
 * @returns {ExecutionResult}
 */
function passthroughResult(output, taskType) {
  return {
    success: true,
    status:  'COMPLETED',
    output:  output ?? {},
    logs:    [`[executionEngine] No execution required for task type "${taskType}".`],
    errors:  [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION ENGINE CLASS
// ─────────────────────────────────────────────────────────────────────────────

class ExecutionEngine {
  #textRunner;
  #codeRunner;
  #websiteRunner;

  /**
   * @param {object} runners
   * @param {object} runners.text    - TextRunner instance.
   * @param {object} runners.code    - CodeRunner instance.
   * @param {object} runners.website - WebsiteRunner instance.
   */
  constructor({ text, code, website }) {
    this.#textRunner    = text;
    this.#codeRunner    = code;
    this.#websiteRunner = website;
  }

  /**
   * Execute the generated output for a task.
   *
   * @param {object} task            - Task snapshot from WorkflowEngine.
   * @param {object} generatedOutput - Raw output from the AI handler.
   * @returns {Promise<ExecutionResult>}
   */
  async execute(task, generatedOutput) {
    try {
      switch (task.type) {
        case TaskType.TEXT_GENERATION:
          return await this.#textRunner.run(task, generatedOutput);

        case TaskType.CODE_GENERATION:
          return await this.#codeRunner.run(task, generatedOutput);

        case TaskType.WEBSITE_GENERATION:
          return await this.#websiteRunner.run(task, generatedOutput);

        case TaskType.VALIDATION:
        case TaskType.OTHER:
        default:
          return passthroughResult(generatedOutput, task.type);
      }
    } catch (err) {
      // Defensive catch — runners should never throw, but protect the agent loop
      const normalized = normalizeExecutionError(err, SOURCE);
      return {
        success: false,
        status:  'FAILED',
        output:  null,
        logs:    [`[executionEngine] Unexpected error during execution: ${err.message}`],
        errors:  [normalized],
      };
    }
  }

  /**
   * Check whether a task type requires execution processing.
   * @param {string} taskType
   * @returns {boolean}
   */
  requiresExecution(taskType) {
    return [
      TaskType.TEXT_GENERATION,
      TaskType.CODE_GENERATION,
      TaskType.WEBSITE_GENERATION,
    ].includes(taskType);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an ExecutionEngine with all runners pre-configured.
 *
 * Runners can be overridden for tests or to inject real sandboxes:
 *
 * @param {object} [options]
 * @param {object} [options.textRunner]    - Override TextRunner.
 * @param {object} [options.codeRunner]    - Override CodeRunner.
 * @param {object} [options.websiteRunner] - Override WebsiteRunner.
 * @returns {ExecutionEngine}
 *
 * @example
 * // Default (mock sandbox):
 * const engine = createExecutionEngine();
 *
 * // Custom sandbox for code:
 * const engine = createExecutionEngine({
 *   codeRunner: createCodeRunner({ sandbox: dockerSandbox })
 * });
 */
export function createExecutionEngine(options = {}) {
  return new ExecutionEngine({
    text:    options.textRunner    ?? createTextRunner(),
    code:    options.codeRunner    ?? createCodeRunner(),
    website: options.websiteRunner ?? createWebsiteRunner(),
  });
}
