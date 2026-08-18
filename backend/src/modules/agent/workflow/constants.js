/**
 * @file constants.js
 * @module agent/workflow
 *
 * Frozen enum-like constant objects for the Task & Workflow contract.
 *
 * DESIGN NOTES
 * ─────────────
 * • All objects are Object.freeze()-d — downstream modules cannot mutate them.
 * • TaskType is intentionally NOT a closed enum. Person 3 (AI Engine) and
 *   Person 4 (Execution Engine) can register new types by calling
 *   extendTaskTypes(). The schema validates that a task's type is a
 *   non-empty string, so new types "just work" without touching schemas.js.
 * • ErrorCode is similarly extensible via extendErrorCodes().
 */

// ─────────────────────────────────────────────────────────────────────────────
// TASK STATUS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All valid lifecycle states a Task can occupy.
 *
 * @type {Readonly<{
 *   PENDING:   'PENDING',
 *   READY:     'READY',
 *   RUNNING:   'RUNNING',
 *   COMPLETED: 'COMPLETED',
 *   FAILED:    'FAILED',
 *   RETRYING:  'RETRYING',
 *   BLOCKED:   'BLOCKED'
 * }>}
 */
export const TaskStatus = Object.freeze({
  PENDING: 'PENDING',
  READY: 'READY',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
  BLOCKED: 'BLOCKED',
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK TYPE  (extensible — see extendTaskTypes below)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Internal mutable registry of task types.
 * Exposed as read-only through TaskType.
 * @private
 */
const _taskTypeRegistry = {
  TEXT_GENERATION: 'TEXT_GENERATION',
  WEBSITE_GENERATION: 'WEBSITE_GENERATION',
  CODE_GENERATION: 'CODE_GENERATION',
  VALIDATION: 'VALIDATION',
  OTHER: 'OTHER',
};

/**
 * The set of currently registered task types.
 * Use extendTaskTypes() to register new ones without modifying this file.
 *
 * @type {Readonly<Record<string, string>>}
 */
export let TaskType = Object.freeze({ ..._taskTypeRegistry });

/**
 * Register additional task types.
 * Call this at module-load time in any module that introduces new types.
 *
 * @param {Record<string, string>} newTypes - Key/value pairs to merge in.
 *   Both key and value should be SCREAMING_SNAKE_CASE strings.
 *
 * @example
 * // Person 4's execution module:
 * import { extendTaskTypes } from '../agent/workflow/index.js';
 * extendTaskTypes({ PPT_GENERATION: 'PPT_GENERATION' });
 */
export function extendTaskTypes(newTypes) {
  if (typeof newTypes !== 'object' || newTypes === null) {
    throw new TypeError('extendTaskTypes: argument must be a non-null object');
  }
  Object.assign(_taskTypeRegistry, newTypes);
  TaskType = Object.freeze({ ..._taskTypeRegistry });
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW STATUS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All valid lifecycle states a Workflow can occupy.
 *
 * @type {Readonly<{
 *   PENDING:   'PENDING',
 *   RUNNING:   'RUNNING',
 *   COMPLETED: 'COMPLETED',
 *   FAILED:    'FAILED',
 *   PAUSED:    'PAUSED'
 * }>}
 */
export const WorkflowStatus = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PAUSED: 'PAUSED',
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK RESULT STATUS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The three outcome states a completed task result can have.
 * RETRYABLE_FAILURE distinguishes transient failures (worth retrying)
 * from permanent failures.
 *
 * @type {Readonly<{
 *   COMPLETED:         'COMPLETED',
 *   FAILED:            'FAILED',
 *   RETRYABLE_FAILURE: 'RETRYABLE_FAILURE'
 * }>}
 */
export const TaskResultStatus = Object.freeze({
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  RETRYABLE_FAILURE: 'RETRYABLE_FAILURE',
});

// ─────────────────────────────────────────────────────────────────────────────
// ERROR CODES  (extensible — see extendErrorCodes below)
// ─────────────────────────────────────────────────────────────────────────────

/** @private */
const _errorCodeRegistry = {
  UNKNOWN: 'UNKNOWN',
  TIMEOUT: 'TIMEOUT',
  DEPENDENCY_FAILED: 'DEPENDENCY_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  INVALID_INPUT: 'INVALID_INPUT',
};

/**
 * The set of currently registered error codes.
 * Use extendErrorCodes() to add new ones.
 *
 * @type {Readonly<Record<string, string>>}
 */
export let ErrorCode = Object.freeze({ ..._errorCodeRegistry });

/**
 * Register additional error codes.
 *
 * @param {Record<string, string>} newCodes
 */
export function extendErrorCodes(newCodes) {
  if (typeof newCodes !== 'object' || newCodes === null) {
    throw new TypeError('extendErrorCodes: argument must be a non-null object');
  }
  Object.assign(_errorCodeRegistry, newCodes);
  ErrorCode = Object.freeze({ ..._errorCodeRegistry });
}

// ─────────────────────────────────────────────────────────────────────────────
// VALID STATUS TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Allowed status transitions for a Task.
 * The Workflow Engine uses this to guard against illegal state changes.
 *
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const TASK_STATUS_TRANSITIONS = Object.freeze({
  [TaskStatus.PENDING]: Object.freeze([TaskStatus.READY, TaskStatus.BLOCKED]),
  [TaskStatus.READY]: Object.freeze([TaskStatus.RUNNING, TaskStatus.BLOCKED]),
  [TaskStatus.RUNNING]: Object.freeze([
    TaskStatus.COMPLETED,
    TaskStatus.FAILED,
    TaskStatus.RETRYING,
  ]),
  [TaskStatus.RETRYING]: Object.freeze([
    TaskStatus.RUNNING,
    TaskStatus.FAILED,
  ]),
  [TaskStatus.FAILED]: Object.freeze([]),
  [TaskStatus.COMPLETED]: Object.freeze([]),
  [TaskStatus.BLOCKED]: Object.freeze([TaskStatus.READY]),
});

/**
 * Allowed status transitions for a Workflow.
 *
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const WORKFLOW_STATUS_TRANSITIONS = Object.freeze({
  [WorkflowStatus.PENDING]: Object.freeze([WorkflowStatus.RUNNING]),
  [WorkflowStatus.RUNNING]: Object.freeze([
    WorkflowStatus.COMPLETED,
    WorkflowStatus.FAILED,
    WorkflowStatus.PAUSED,
  ]),
  [WorkflowStatus.PAUSED]: Object.freeze([
    WorkflowStatus.RUNNING,
    WorkflowStatus.FAILED,
  ]),
  [WorkflowStatus.COMPLETED]: Object.freeze([]),
  [WorkflowStatus.FAILED]: Object.freeze([]),
});

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

export const TASK_DEFAULTS = Object.freeze({
  status: TaskStatus.PENDING,
  dependencies: [],
  retryCount: 0,
  maxRetries: 3,
  metadata: {},
});

export const WORKFLOW_DEFAULTS = Object.freeze({
  status: WorkflowStatus.PENDING,
  tasks: [],
  currentTaskId: null,
  metadata: {},
});
