/**
 * @file taskResult.js
 * @module agent/workflow
 *
 * Factory functions for the three task result variants.
 *
 * DESIGN NOTES
 * ─────────────
 * • Three distinct constructors make the caller's intent explicit.
 * • All results are validated through their respective zod schemas.
 * • The `status` field is the discriminant — downstream consumers
 *   (Auto-Healing, Workflow Engine) switch on it to decide next action.
 *
 * Consumer pattern:
 *
 *   const result = runTask(task);
 *   switch (result.status) {
 *     case TaskResultStatus.COMPLETED:          // success path
 *     case TaskResultStatus.RETRYABLE_FAILURE:  // retry path
 *     case TaskResultStatus.FAILED:             // permanent failure path
 *   }
 */

import {
  TaskSuccessResultSchema,
  TaskFailureResultSchema,
  TaskRetryableFailureResultSchema,
} from './schemas.js';
import { TaskResultStatus, ErrorCode } from './constants.js';
import { WorkflowValidationError } from './task.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise an error argument into a { code, message, details } object.
 * Accepts either a plain object or an Error instance.
 *
 * @param {object|Error} error
 * @returns {{ code: string, message: string, details?: unknown }}
 * @private
 */
function normaliseError(error) {
  if (error instanceof Error) {
    return {
      code: error.code ?? ErrorCode.UNKNOWN,
      message: error.message,
      details: error.stack,
    };
  }
  return {
    code: error.code ?? ErrorCode.UNKNOWN,
    message: error.message,
    details: error.details,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a successful task result.
 *
 * @param {{ data: unknown, metadata?: object }} output - Task output payload.
 * @param {object} [metadata] - Optional top-level result metadata.
 * @returns {Readonly<object>} Frozen success result.
 * @throws {WorkflowValidationError}
 *
 * @example
 * const result = createSuccessResult(
 *   { data: 'Generated text content here...' },
 *   { tokensUsed: 320, provider: 'groq' }
 * );
 */
export function createSuccessResult(output, metadata) {
  const raw = {
    status: TaskResultStatus.COMPLETED,
    output,
    ...(metadata !== undefined && { metadata }),
  };

  const parsed = TaskSuccessResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WorkflowValidationError(
      'Invalid success result data',
      parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    );
  }

  return Object.freeze(parsed.data);
}

/**
 * Create a permanent (non-retryable) failure result.
 *
 * Use this when the task has definitively failed and should NOT be retried
 * (e.g., invalid input, resource not found, max retries already exceeded).
 *
 * @param {{ code: string, message: string, details?: unknown }|Error} error - Error info.
 * @param {object} [metadata] - Optional top-level result metadata.
 * @returns {Readonly<object>} Frozen failure result.
 * @throws {WorkflowValidationError}
 *
 * @example
 * const result = createFailureResult({
 *   code: ErrorCode.INVALID_INPUT,
 *   message: 'Missing required field: projectId',
 * });
 */
export function createFailureResult(error, metadata) {
  const raw = {
    status: TaskResultStatus.FAILED,
    error: normaliseError(error),
    ...(metadata !== undefined && { metadata }),
  };

  const parsed = TaskFailureResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WorkflowValidationError(
      'Invalid failure result data',
      parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    );
  }

  return Object.freeze(parsed.data);
}

/**
 * Create a retryable failure result.
 *
 * Use this when the task failed due to a transient condition that may succeed
 * on retry (e.g., rate-limit, timeout, temporary network error).
 * The Auto-Healing module checks for this status before incrementing retryCount.
 *
 * @param {{ code: string, message: string, details?: unknown }|Error} error - Error info.
 * @param {object} [metadata] - Optional top-level result metadata.
 * @returns {Readonly<object>} Frozen retryable-failure result.
 * @throws {WorkflowValidationError}
 *
 * @example
 * const result = createRetryableFailureResult({
 *   code: ErrorCode.TIMEOUT,
 *   message: 'AI provider timed out after 30s',
 * });
 */
export function createRetryableFailureResult(error, metadata) {
  const raw = {
    status: TaskResultStatus.RETRYABLE_FAILURE,
    error: normaliseError(error),
    ...(metadata !== undefined && { metadata }),
  };

  const parsed = TaskRetryableFailureResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WorkflowValidationError(
      'Invalid retryable failure result data',
      parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    );
  }

  return Object.freeze(parsed.data);
}
