/**
 * @file schemas.js
 * @module agent/workflow
 *
 * Zod schemas for runtime validation of Task, Workflow, and result objects.
 *
 * DESIGN NOTES
 * ─────────────
 * • TaskType is validated as a non-empty string rather than z.enum() so that
 *   extendTaskTypes() additions are automatically accepted — no schema update
 *   required when Person 3 or Person 4 adds a new type.
 * • Schemas are exported separately so any module can use them independently.
 * • All schemas use .strict() where appropriate to catch unexpected keys.
 */

import { z } from 'zod';
import { TaskStatus, WorkflowStatus } from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

/** Non-empty trimmed string helper */
const nonEmptyString = z.string().trim().min(1);

/** Positive integer (>= 0) */
const nonNegativeInt = z.number().int().min(0);

// ─────────────────────────────────────────────────────────────────────────────
// TASK INPUT / OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape of data passed INTO a task.
 */
export const TaskInputSchema = z
  .object({
    /** The primary payload the task will consume. */
    data: z.unknown(),
    /** Optional ambient context (user preferences, project settings, etc.) */
    context: z.record(z.unknown()).optional(),
  })
  .strict();

/**
 * Shape of data produced BY a task on success.
 */
export const TaskOutputSchema = z
  .object({
    /** The primary result produced by the task. */
    data: z.unknown(),
    /** Optional structured metadata about the result. */
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// TASK ERROR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Structured error attached to a failed task.
 */
export const TaskErrorSchema = z
  .object({
    /** Machine-readable error code from ErrorCode constants (or extension). */
    code: nonEmptyString,
    /** Human-readable explanation of what went wrong. */
    message: nonEmptyString,
    /** Optional raw error details (stack trace, upstream response, etc.) */
    details: z.unknown().optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// TASK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full Task object schema.
 *
 * Key design choices:
 * • `type`   — z.string().min(1): accepts any registered TaskType value.
 * • `status` — must be one of the TaskStatus values.
 * • `dependencies` — array of task ID strings; referential integrity is
 *   checked by validateDependencies() in validators.js, not here.
 * • `retryCount` must not exceed `maxRetries`.
 */
export const TaskSchema = z
  .object({
    /** Unique identifier for the task (UUID). */
    id: nonEmptyString,

    /**
     * Task type — non-empty string so extendTaskTypes() additions are accepted
     * without modifying this schema.
     */
    type: nonEmptyString,

    /** Short human-readable label for the task. */
    title: nonEmptyString,

    /** Optional detailed description of what this task does. */
    description: z.string().optional(),

    /** Current lifecycle status. */
    status: z.enum(Object.values(TaskStatus)),

    /** IDs of tasks that must be COMPLETED before this task can run. */
    dependencies: z.array(nonEmptyString).default([]),

    /** Data fed into this task. Null when task has not started. */
    input: TaskInputSchema.nullable().default(null),

    /** Data produced by this task. Null until task completes. */
    output: TaskOutputSchema.nullable().default(null),

    /** Structured error when status === FAILED or RETRYING. */
    error: TaskErrorSchema.nullable().default(null),

    /** How many times this task has been attempted so far. */
    retryCount: nonNegativeInt.default(0),

    /** Maximum number of retry attempts before permanently failing. */
    maxRetries: nonNegativeInt.default(3),

    /** Arbitrary extensible metadata for downstream consumers. */
    metadata: z.record(z.unknown()).default({}),
  })
  .strict()
  .refine((task) => task.retryCount <= task.maxRetries, {
    message: 'retryCount must not exceed maxRetries',
    path: ['retryCount'],
  });

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full Workflow object schema.
 */
export const WorkflowSchema = z
  .object({
    /** Unique identifier for the workflow (UUID). */
    id: nonEmptyString,

    /**
     * The project this workflow belongs to.
     * Supplied by Person 2's database/project layer.
     */
    projectId: nonEmptyString,

    /** Natural language description of what this workflow aims to achieve. */
    goal: nonEmptyString,

    /** Current lifecycle status of the workflow. */
    status: z.enum(Object.values(WorkflowStatus)),

    /**
     * Ordered list of tasks belonging to this workflow.
     * May be empty at creation time (Planner fills this in).
     */
    tasks: z.array(TaskSchema).default([]),

    /**
     * ID of the task currently being processed.
     * Null when workflow is PENDING or COMPLETED.
     */
    currentTaskId: z.string().nullable().default(null),

    /** ISO timestamp when the workflow was created. */
    createdAt: z.coerce.date(),

    /** ISO timestamp of the last status update. */
    updatedAt: z.coerce.date(),

    /** Arbitrary extensible metadata. */
    metadata: z.record(z.unknown()).default({}),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// TASK RESULT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Successful task result shape.
 */
export const TaskSuccessResultSchema = z
  .object({
    status: z.literal('COMPLETED'),
    output: TaskOutputSchema,
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

/**
 * Failed (non-retryable) task result shape.
 */
export const TaskFailureResultSchema = z
  .object({
    status: z.literal('FAILED'),
    error: TaskErrorSchema,
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

/**
 * Retryable failure task result shape.
 * The Workflow Engine / Auto-Healing module uses this to decide whether to
 * retry the task rather than marking the workflow as permanently failed.
 */
export const TaskRetryableFailureResultSchema = z
  .object({
    status: z.literal('RETRYABLE_FAILURE'),
    error: TaskErrorSchema,
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

/**
 * Union of all task result types.
 * Discriminated on the `status` field.
 */
export const TaskResultSchema = z.discriminatedUnion('status', [
  TaskSuccessResultSchema,
  TaskFailureResultSchema,
  TaskRetryableFailureResultSchema,
]);
