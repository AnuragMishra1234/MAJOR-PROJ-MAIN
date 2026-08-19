/**
 * @file executionErrors.js
 * @module agent/execution/errors
 *
 * Standardized error types, codes, and factory functions for
 * the Phase 6 Execution + Validation Engine.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN
 * ═══════════════════════════════════════════════════════════════════════════
 * Every error produced by the Execution or Validation layer carries:
 *
 *   type      — coarse classification (BUILD_ERROR, SYNTAX_ERROR, ...)
 *   code      — fine-grained machine-readable code (mirrors workflow ErrorCode)
 *   message   — human-readable description
 *   details   — optional structured debug payload
 *   source    — which runner/validator produced this error
 *   retryable — Phase 8 Auto-Healing reads this to decide whether to retry
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RETRYABLE FLAG
 * ═══════════════════════════════════════════════════════════════════════════
 * Retryable = true  → transient failure; a fresh AI generation might fix it.
 * Retryable = false → permanent failure; retrying will not help.
 *
 * Phase 8 will consume this flag. Phase 6 only PRODUCES it.
 */

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION ERROR TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coarse error-type classification.
 * Used in the `type` field of every ExecutionError.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ExecutionErrorType = Object.freeze({
  BUILD_ERROR:      'BUILD_ERROR',      // Code/website build failed
  RUNTIME_ERROR:    'RUNTIME_ERROR',    // Code threw an exception at runtime
  SYNTAX_ERROR:     'SYNTAX_ERROR',     // Code failed syntax check
  MISSING_FILE:     'MISSING_FILE',     // Expected output file not present
  INVALID_OUTPUT:   'INVALID_OUTPUT',   // AI output is null/empty/malformed
  VALIDATION_ERROR: 'VALIDATION_ERROR', // Validator check failed
  EXECUTION_ERROR:  'EXECUTION_ERROR',  // Generic execution failure
  TIMEOUT:          'TIMEOUT',          // Execution exceeded time limit
});

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION ERROR CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Structured error for the Execution/Validation layer.
 *
 * @example
 * throw new ExecutionError(
 *   ExecutionErrorType.BUILD_ERROR,
 *   'Website build failed: missing index.html',
 *   { file: 'index.html' },
 *   'websiteRunner',
 *   true   // retryable
 * );
 */
export class ExecutionError extends Error {
  /**
   * @param {string} type      - One of ExecutionErrorType.
   * @param {string} message   - Human-readable error message.
   * @param {object} [details] - Structured debug payload.
   * @param {string} [source]  - Which runner/validator emitted this.
   * @param {boolean} [retryable] - Whether Phase 8 should attempt a retry.
   */
  constructor(
    type = ExecutionErrorType.EXECUTION_ERROR,
    message = 'Execution failed.',
    details = null,
    source = 'unknown',
    retryable = false,
  ) {
    super(message);
    this.name = 'ExecutionError';
    this.type = type;
    this.code = type;           // code mirrors type for compatibility with ErrorCode conventions
    this.details = details;
    this.source = source;
    this.retryable = retryable;
  }

  /**
   * Serialize to a plain object (for JSON responses, workflow results, Auto-Healing).
   * @returns {object}
   */
  toJSON() {
    return {
      type:      this.type,
      code:      this.code,
      message:   this.message,
      details:   this.details,
      source:    this.source,
      retryable: this.retryable,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an INVALID_OUTPUT error (AI returned nothing usable).
 * Retryable = true: a fresh AI call might produce valid output.
 *
 * @param {string} taskType
 * @param {string} [detail]
 * @param {string} [source]
 */
export function invalidOutputError(taskType, detail = '', source = 'executionEngine') {
  return new ExecutionError(
    ExecutionErrorType.INVALID_OUTPUT,
    `AI output for task type "${taskType}" is missing or malformed.${detail ? ' ' + detail : ''}`,
    { taskType, detail },
    source,
    true,  // retryable — AI might produce valid output on retry
  );
}

/**
 * Create a MISSING_FILE error.
 * Retryable = true: regeneration might produce the missing file.
 *
 * @param {string} filename
 * @param {string} [source]
 */
export function missingFileError(filename, source = 'websiteRunner') {
  return new ExecutionError(
    ExecutionErrorType.MISSING_FILE,
    `Required file "${filename}" was not found in generated output.`,
    { filename },
    source,
    true,
  );
}

/**
 * Create a BUILD_ERROR.
 * Retryable = true: a fresh generation might fix the build.
 *
 * @param {string} message
 * @param {object} [details]
 * @param {string} [source]
 */
export function buildError(message, details = null, source = 'websiteRunner') {
  return new ExecutionError(
    ExecutionErrorType.BUILD_ERROR,
    message,
    details,
    source,
    true,
  );
}

/**
 * Create a SYNTAX_ERROR.
 * Retryable = true: fresh generation might fix syntax issues.
 *
 * @param {string} message
 * @param {object} [details]
 * @param {string} [source]
 */
export function syntaxError(message, details = null, source = 'codeRunner') {
  return new ExecutionError(
    ExecutionErrorType.SYNTAX_ERROR,
    message,
    details,
    source,
    true,
  );
}

/**
 * Create a RUNTIME_ERROR.
 * Retryable = true: code might behave differently with a fresh generation.
 *
 * @param {string} message
 * @param {object} [details]
 * @param {string} [source]
 */
export function runtimeError(message, details = null, source = 'codeRunner') {
  return new ExecutionError(
    ExecutionErrorType.RUNTIME_ERROR,
    message,
    details,
    source,
    true,
  );
}

/**
 * Create a VALIDATION_ERROR.
 * Retryable = true: a fresh generation might pass validation.
 *
 * @param {string} checkName
 * @param {string} message
 * @param {string} [source]
 */
export function validationError(checkName, message, source = 'validationEngine') {
  return new ExecutionError(
    ExecutionErrorType.VALIDATION_ERROR,
    message,
    { checkName },
    source,
    true,
  );
}

/**
 * Create a TIMEOUT error.
 * Retryable = false: timeouts are usually infrastructure problems.
 *
 * @param {number} limitMs
 * @param {string} [source]
 */
export function timeoutError(limitMs, source = 'executionEngine') {
  return new ExecutionError(
    ExecutionErrorType.TIMEOUT,
    `Execution timed out after ${limitMs}ms.`,
    { limitMs },
    source,
    false,  // not retryable — infrastructure issue
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert any thrown error (ExecutionError or native Error) into a normalized
 * plain-object error record suitable for workflow results and Auto-Healing.
 *
 * @param {Error|ExecutionError} err
 * @param {string} [fallbackSource]
 * @returns {object}
 */
export function normalizeExecutionError(err, fallbackSource = 'executionEngine') {
  if (err instanceof ExecutionError) {
    return err.toJSON();
  }
  return {
    type:      ExecutionErrorType.EXECUTION_ERROR,
    code:      ExecutionErrorType.EXECUTION_ERROR,
    message:   err?.message ?? 'Unknown execution error.',
    details:   null,
    source:    fallbackSource,
    retryable: false,
  };
}
