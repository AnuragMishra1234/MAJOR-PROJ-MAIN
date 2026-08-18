/**
 * @file workflow.js
 * @module agent/workflow
 *
 * Factory function for creating validated Workflow objects.
 *
 * DESIGN NOTES
 * ─────────────
 * • Like createTask(), returns a frozen plain object — no DB coupling.
 * • Workflow does NOT validate referential integrity of task dependencies;
 *   that is the job of validateDependencies() in validators.js.
 * • createdAt / updatedAt default to the current timestamp so callers do
 *   not need to supply them (they can supply them when reconstructing
 *   from a DB record).
 */

import { randomUUID } from 'crypto';
import { WorkflowSchema } from './schemas.js';
import { WorkflowStatus, WORKFLOW_STATUS_TRANSITIONS, WORKFLOW_DEFAULTS } from './constants.js';
import { WorkflowValidationError } from './task.js';

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a validated, immutable Workflow object.
 *
 * @param {object} fields - Workflow fields. `projectId` and `goal` are required.
 * @param {string} [fields.id]            - UUID. Auto-generated if omitted.
 * @param {string}  fields.projectId      - ID of the parent project.
 * @param {string}  fields.goal           - Natural language description of what this workflow achieves.
 * @param {string} [fields.status]        - Defaults to WorkflowStatus.PENDING.
 * @param {object[]} [fields.tasks]       - Array of task objects. Defaults to [].
 * @param {string|null} [fields.currentTaskId] - ID of the currently active task.
 * @param {Date|string} [fields.createdAt]  - Defaults to now.
 * @param {Date|string} [fields.updatedAt]  - Defaults to now.
 * @param {object} [fields.metadata]      - Arbitrary extensible metadata.
 *
 * @returns {Readonly<object>} - A frozen, validated workflow object.
 * @throws {WorkflowValidationError} - If validation fails.
 *
 * @example
 * const workflow = createWorkflow({
 *   projectId: 'proj-123',
 *   goal: 'Generate a landing page for a coffee shop',
 * });
 */
export function createWorkflow(fields = {}) {
  const now = new Date();

  const raw = {
    id: fields.id ?? randomUUID(),
    projectId: fields.projectId,
    goal: fields.goal,
    status: fields.status ?? WORKFLOW_DEFAULTS.status,
    tasks: fields.tasks ?? [...WORKFLOW_DEFAULTS.tasks],
    currentTaskId: fields.currentTaskId ?? WORKFLOW_DEFAULTS.currentTaskId,
    createdAt: fields.createdAt ?? now,
    updatedAt: fields.updatedAt ?? now,
    metadata: fields.metadata ?? { ...WORKFLOW_DEFAULTS.metadata },
  };

  const result = WorkflowSchema.safeParse(raw);

  if (!result.success) {
    throw new WorkflowValidationError(
      'Invalid workflow data',
      result.error.issues.map((i) => ({ path: i.path, message: i.message })),
    );
  }

  return Object.freeze(result.data);
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRANSITION GUARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether transitioning a workflow from its current status to
 * `nextStatus` is a legal move according to WORKFLOW_STATUS_TRANSITIONS.
 *
 * @param {object} workflow      - A workflow object (from createWorkflow).
 * @param {string} nextStatus    - The desired next status (WorkflowStatus value).
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canTransitionWorkflow(workflow, nextStatus) {
  const allowed = WORKFLOW_STATUS_TRANSITIONS[workflow.status] ?? [];
  if (allowed.includes(nextStatus)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Cannot transition workflow from ${workflow.status} to ${nextStatus}`,
  };
}
