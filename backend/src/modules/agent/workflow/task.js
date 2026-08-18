/**
 * @file task.js
 * @module agent/workflow
 *
 * Factory function for creating validated Task objects.
 *
 * DESIGN NOTES
 * ─────────────
 * • Returns a frozen plain object — no class, no Mongoose model, no ORM.
 *   Persistence is handled entirely by Person 2's database layer.
 * • Throws a WorkflowValidationError (structured) on invalid input so
 *   callers can distinguish validation failures from runtime errors.
 * • crypto.randomUUID() is built into Node.js ≥ 15 — no extra dependency.
 */

import { randomUUID } from 'crypto';
import { TaskSchema } from './schemas.js';
import { TaskStatus, TASK_DEFAULTS, TASK_STATUS_TRANSITIONS } from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// ERROR TYPE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when task or workflow construction receives invalid data.
 * Wraps the raw zod error list into a structured, catchable error.
 */
export class WorkflowValidationError extends Error {
  /**
   * @param {string} message - Human-readable summary.
   * @param {Array<{path: (string|number)[], message: string}>} issues - Zod issue list.
   */
  constructor(message, issues = []) {
    super(message);
    this.name = 'WorkflowValidationError';
    this.issues = issues;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a validated, immutable Task object.
 *
 * @param {object} fields - Task fields. Only `type` and `title` are required.
 * @param {string} [fields.id]           - UUID. Auto-generated if omitted.
 * @param {string}  fields.type          - Task type (see TaskType constants).
 * @param {string}  fields.title         - Short human-readable label.
 * @param {string} [fields.description]  - Optional detailed description.
 * @param {string} [fields.status]       - Defaults to TaskStatus.PENDING.
 * @param {string[]} [fields.dependencies] - IDs of tasks that must complete first.
 * @param {object|null} [fields.input]   - Task input payload.
 * @param {object|null} [fields.output]  - Task output payload.
 * @param {object|null} [fields.error]   - Structured error (when failed/retrying).
 * @param {number} [fields.retryCount]   - Defaults to 0.
 * @param {number} [fields.maxRetries]   - Defaults to 3.
 * @param {object} [fields.metadata]     - Arbitrary extensible metadata.
 *
 * @returns {Readonly<object>} - A frozen, validated task object.
 * @throws {WorkflowValidationError} - If validation fails.
 *
 * @example
 * const task = createTask({
 *   type: TaskType.TEXT_GENERATION,
 *   title: 'Generate business content',
 * });
 */
export function createTask(fields = {}) {
  const raw = {
    id: fields.id ?? randomUUID(),
    type: fields.type,
    title: fields.title,
    description: fields.description,
    status: fields.status ?? TASK_DEFAULTS.status,
    dependencies: fields.dependencies ?? [...TASK_DEFAULTS.dependencies],
    input: fields.input ?? null,
    output: fields.output ?? null,
    error: fields.error ?? null,
    retryCount: fields.retryCount ?? TASK_DEFAULTS.retryCount,
    maxRetries: fields.maxRetries ?? TASK_DEFAULTS.maxRetries,
    metadata: fields.metadata ?? { ...TASK_DEFAULTS.metadata },
  };

  const result = TaskSchema.safeParse(raw);

  if (!result.success) {
    throw new WorkflowValidationError(
      'Invalid task data',
      result.error.issues.map((i) => ({ path: i.path, message: i.message })),
    );
  }

  return Object.freeze(result.data);
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRANSITION GUARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether transitioning a task from its current status to `nextStatus`
 * is a legal move according to TASK_STATUS_TRANSITIONS.
 *
 * NOTE: This function does NOT mutate the task. The Workflow Engine is
 * responsible for creating a new task object with the updated status.
 *
 * @param {object} task          - A task object (from createTask).
 * @param {string} nextStatus    - The desired next status (TaskStatus value).
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canTransitionTask(task, nextStatus) {
  const allowed = TASK_STATUS_TRANSITIONS[task.status] ?? [];
  if (allowed.includes(nextStatus)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Cannot transition task from ${task.status} to ${nextStatus}`,
  };
}
