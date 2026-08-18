/**
 * @file validators.js
 * @module agent/workflow
 *
 * Reusable validation helpers for tasks, workflows, and dependency graphs.
 *
 * DESIGN NOTES
 * ─────────────
 * • All functions return structured result objects ({ valid, ... }) rather
 *   than throwing, so callers can handle errors gracefully.
 * • validateTask / validateWorkflow are thin wrappers around zod schemas —
 *   they exist so Phase 2 (Workflow Engine) can call validate* without
 *   importing zod directly.
 * • validateDependencies runs three checks:
 *     1. Duplicate task IDs
 *     2. References to non-existent task IDs
 *     3. Circular dependencies (depth-first search)
 * • isTaskReady answers the single most important question the Workflow
 *   Engine needs: "can I start this task right now?"
 */

import { TaskSchema, WorkflowSchema } from './schemas.js';
import { TaskStatus, ErrorCode } from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// TASK VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a raw task data object against the TaskSchema.
 *
 * @param {object} data - Raw task data (not necessarily from createTask).
 * @returns {{ valid: true, task: object } | { valid: false, errors: Array<{path: (string|number)[], message: string}> }}
 *
 * @example
 * const result = validateTask({ type: 'UNKNOWN_TYPE', title: '' });
 * if (!result.valid) console.log(result.errors);
 */
export function validateTask(data) {
  const parsed = TaskSchema.safeParse(data);
  if (parsed.success) {
    return { valid: true, task: parsed.data };
  }
  return {
    valid: false,
    errors: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a raw workflow data object against the WorkflowSchema.
 *
 * @param {object} data - Raw workflow data.
 * @returns {{ valid: true, workflow: object } | { valid: false, errors: Array<{path: (string|number)[], message: string}> }}
 */
export function validateWorkflow(data) {
  const parsed = WorkflowSchema.safeParse(data);
  if (parsed.success) {
    return { valid: true, workflow: parsed.data };
  }
  return {
    valid: false,
    errors: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPENDENCY GRAPH VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate the dependency graph of a set of tasks.
 *
 * Checks performed (in order):
 *   1. Duplicate task IDs
 *   2. Dependency references to non-existent task IDs
 *   3. Circular dependencies (depth-first search)
 *
 * @param {Array<{ id: string, dependencies: string[] }>} tasks
 *   An array of task objects. Each must have `id` and `dependencies`.
 *
 * @returns {{
 *   valid: boolean,
 *   errors: Array<{ code: string, message: string, taskId?: string }>
 * }}
 *
 * @example
 * const tasks = [
 *   { id: 'task-1', dependencies: [] },
 *   { id: 'task-2', dependencies: ['task-1'] },
 *   { id: 'task-3', dependencies: ['task-2'] },
 * ];
 * const result = validateDependencies(tasks);
 * // { valid: true, errors: [] }
 */
export function validateDependencies(tasks) {
  const errors = [];
  const idSet = new Set();

  // ── 1. Duplicate IDs ──────────────────────────────────────────────────────
  for (const task of tasks) {
    if (idSet.has(task.id)) {
      errors.push({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Duplicate task ID: "${task.id}"`,
        taskId: task.id,
      });
    } else {
      idSet.add(task.id);
    }
  }

  // If duplicates found, skip further checks (adjacency map would be broken).
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ── 2. Non-existent dependency references ─────────────────────────────────
  for (const task of tasks) {
    for (const depId of task.dependencies ?? []) {
      if (!idSet.has(depId)) {
        errors.push({
          code: ErrorCode.VALIDATION_ERROR,
          message: `Task "${task.id}" depends on unknown task ID: "${depId}"`,
          taskId: task.id,
        });
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ── 3. Circular dependency detection (DFS) ────────────────────────────────
  const adjacency = new Map(tasks.map((t) => [t.id, t.dependencies ?? []]));

  /** @type {'unvisited' | 'in-progress' | 'done'} */
  const state = new Map(tasks.map((t) => [t.id, 'unvisited']));

  /**
   * @param {string} nodeId
   * @param {string[]} path - Current DFS path (for error reporting)
   * @returns {boolean} true if a cycle was detected
   */
  function dfs(nodeId, path) {
    state.set(nodeId, 'in-progress');
    path.push(nodeId);

    for (const depId of adjacency.get(nodeId) ?? []) {
      if (state.get(depId) === 'in-progress') {
        const cycleStart = path.indexOf(depId);
        const cycle = [...path.slice(cycleStart), depId].join(' → ');
        errors.push({
          code: ErrorCode.CIRCULAR_DEPENDENCY,
          message: `Circular dependency detected: ${cycle}`,
          taskId: nodeId,
        });
        return true;
      }
      if (state.get(depId) === 'unvisited') {
        if (dfs(depId, path)) return true;
      }
    }

    path.pop();
    state.set(nodeId, 'done');
    return false;
  }

  for (const task of tasks) {
    if (state.get(task.id) === 'unvisited') {
      dfs(task.id, []);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// READINESS CHECK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine whether a task is ready to execute.
 *
 * A task is ready when ALL of the following are true:
 *   • Its status is PENDING or READY (not already running/done/failed)
 *   • Every task it depends on has status COMPLETED
 *
 * @param {{ id: string, status: string, dependencies: string[] }} task
 *   The task to check.
 * @param {Array<{ id: string, status: string }>} allTasks
 *   The complete list of tasks in the workflow (used to look up dependency statuses).
 *
 * @returns {{ ready: boolean, reason?: string }}
 *
 * @example
 * const { ready } = isTaskReady(task2, [task1, task2, task3]);
 */
export function isTaskReady(task, allTasks) {
  // Must be in a "waiting" state
  if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.READY) {
    return {
      ready: false,
      reason: `Task is not in a runnable state (current status: ${task.status})`,
    };
  }

  if (!task.dependencies || task.dependencies.length === 0) {
    return { ready: true };
  }

  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  for (const depId of task.dependencies) {
    const dep = taskMap.get(depId);

    if (!dep) {
      return {
        ready: false,
        reason: `Dependency task "${depId}" not found in workflow`,
      };
    }

    if (dep.status !== TaskStatus.COMPLETED) {
      return {
        ready: false,
        reason: `Dependency task "${depId}" is not yet completed (status: ${dep.status})`,
      };
    }
  }

  return { ready: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// RETRY VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a task can be retried.
 *
 * @param {{ retryCount: number, maxRetries: number }} task
 * @returns {{ canRetry: boolean, reason?: string }}
 */
export function canRetryTask(task) {
  if (task.retryCount >= task.maxRetries) {
    return {
      canRetry: false,
      reason: `Task has exhausted all retries (${task.retryCount}/${task.maxRetries})`,
    };
  }
  return { canRetry: true };
}
