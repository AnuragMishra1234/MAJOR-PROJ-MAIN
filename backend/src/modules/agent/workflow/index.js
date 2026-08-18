/**
 * @file index.js
 * @module agent/workflow
 *
 * Public barrel export for the workflow contract module.
 *
 * This is the ONLY file other modules should import from:
 *
 *   import { createTask, TaskStatus, WorkflowEngine, ... }
 *     from '../agent/workflow/index.js';
 *
 * EXPORTED SYMBOLS
 * ─────────────────────────────────────────────────────────────────
 * Constants
 *   TaskStatus, TaskType, WorkflowStatus, TaskResultStatus, ErrorCode
 *   TASK_STATUS_TRANSITIONS, WORKFLOW_STATUS_TRANSITIONS
 *   TASK_DEFAULTS, WORKFLOW_DEFAULTS
 *   extendTaskTypes, extendErrorCodes
 *
 * Schemas (for consumers that want raw zod schemas)
 *   TaskInputSchema, TaskOutputSchema, TaskErrorSchema
 *   TaskSchema, WorkflowSchema
 *   TaskSuccessResultSchema, TaskFailureResultSchema
 *   TaskRetryableFailureResultSchema, TaskResultSchema
 *
 * Task Factory  [Phase 1]
 *   createTask, canTransitionTask, WorkflowValidationError
 *
 * Workflow Factory  [Phase 1]
 *   createWorkflow, canTransitionWorkflow
 *
 * Task Result Factories  [Phase 1]
 *   createSuccessResult, createFailureResult, createRetryableFailureResult
 *
 * Validators  [Phase 1]
 *   validateTask, validateWorkflow, validateDependencies
 *   isTaskReady, canRetryTask
 *
 * Task Queue  [Phase 2]
 *   TaskQueue
 *
 * Workflow Engine  [Phase 2]
 *   WorkflowEngine, WorkflowEngineError
 */

export * from './constants.js';
export * from './schemas.js';
export * from './task.js';
export * from './workflow.js';
export * from './taskResult.js';
export * from './validators.js';
export * from './taskQueue.js';
export * from './workflowEngine.js';
