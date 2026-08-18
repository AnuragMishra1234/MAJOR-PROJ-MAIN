/**
 * @file workflowEngine.js
 * @module agent/workflow
 *
 * WorkflowEngine — the stateful orchestrator that manages task lifecycle,
 * dependency resolution, and workflow completion/failure detection.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE RULE (enforced here)
 * ═══════════════════════════════════════════════════════════════════════════
 * The engine contains NO:
 *   • LLM / AI calls          • HTTP / API logic
 *   • Prompt engineering       • Database queries
 *   • Website generation       • Frontend logic
 *   • Auto-Healing logic       • External service calls
 *
 * It ONLY manages: TASKS · WORKFLOWS · DEPENDENCIES · STATUS · EXECUTION STATE
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 1 objects are FROZEN plain objects (immutable).
 * The engine maintains its own mutable internal state:
 *
 *   _meta   — mutable workflow-level fields (id, projectId, goal, status, …)
 *   _tasks  — Map<taskId, MutableTaskRecord>  (mutable copies of task state)
 *   _queue  — TaskQueue  (ordered list of task IDs currently READY to run)
 *
 * The engine is the ONLY thing that writes to these. All reads return snapshots.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * STATE MACHINE INVARIANTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Task transitions enforced by the engine:
 *   PENDING  → READY      (dep resolution after another task completes)
 *   PENDING  → BLOCKED    (dep fails)
 *   READY    → RUNNING    (startTask)
 *   READY    → BLOCKED    (dep fails after already becoming READY)
 *   RUNNING  → COMPLETED  (completeTask with success result)
 *   RUNNING  → FAILED     (failTask with permanent failure)
 *   RUNNING  → RETRYING   (failTask with retryable failure — sets intermediate state)
 *   RETRYING → RUNNING    (retryTask — increments retryCount, re-dispatches)
 *   RETRYING → FAILED     (retryTask when maxRetries exceeded)
 *   FAILED   → BLOCKED    (propagation — dependent tasks already blocked)
 *   BLOCKED  → READY      (if a sibling dep completes and all deps now done)
 *
 * Workflow transitions enforced by the engine:
 *   PENDING  → RUNNING    (first startTask)
 *   RUNNING  → COMPLETED  (all tasks COMPLETED)
 *   RUNNING  → FAILED     (unrecoverable failure — nothing left can run)
 *   RUNNING  → PAUSED     (external call — not implemented in this phase)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LATER ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   Agent → Planner → WorkflowEngine → Task → AI / Execution modules
 *                                    ↑         ↓
 *                               result ←────────┘
 *
 * The Agent / Planner call addTask() to register tasks, then call
 * getNextTask() + startTask() in a loop. AI / Execution modules produce
 * a result object (from taskResult.js), then call completeTask() or
 * failTask() with it.
 */

import { randomUUID } from 'crypto';
import { TaskStatus, WorkflowStatus, TaskResultStatus, ErrorCode } from './constants.js';
import { createTask, WorkflowValidationError } from './task.js';
import { validateDependencies, isTaskReady } from './validators.js';
import { TaskQueue } from './taskQueue.js';

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE ERROR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when the engine rejects an operation due to a state violation.
 * Distinct from WorkflowValidationError (schema issues) so callers can
 * catch operational errors separately.
 */
export class WorkflowEngineError extends Error {
  /**
   * @param {string} message
   * @param {string} [code] - One of ErrorCode values.
   * @param {object} [context] - Extra debug info (taskId, status, etc.)
   */
  constructor(message, code = ErrorCode.UNKNOWN, context = {}) {
    super(message);
    this.name = 'WorkflowEngineError';
    this.code = code;
    this.context = context;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a plain mutable task record from a Phase 1 frozen task object.
 * The engine stores these internally and mutates them as the task progresses.
 *
 * @param {object} frozenTask - Result of createTask()
 * @returns {object} Mutable task record
 * @private
 */
function _toMutableRecord(frozenTask) {
  return {
    id: frozenTask.id,
    type: frozenTask.type,
    title: frozenTask.title,
    description: frozenTask.description,
    status: frozenTask.status,
    dependencies: [...frozenTask.dependencies],
    input: frozenTask.input ? { ...frozenTask.input } : null,
    output: frozenTask.output ? { ...frozenTask.output } : null,
    error: frozenTask.error ? { ...frozenTask.error } : null,
    retryCount: frozenTask.retryCount,
    maxRetries: frozenTask.maxRetries,
    metadata: { ...frozenTask.metadata },
  };
}

/**
 * Take a snapshot of an internal mutable task record (safe copy for callers).
 *
 * @param {object} record - Internal mutable task record
 * @returns {object} Plain object snapshot
 * @private
 */
function _snapshot(record) {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    description: record.description,
    status: record.status,
    dependencies: [...record.dependencies],
    input: record.input ? { ...record.input } : null,
    output: record.output ? { ...record.output } : null,
    error: record.error ? { ...record.error } : null,
    retryCount: record.retryCount,
    maxRetries: record.maxRetries,
    metadata: { ...record.metadata },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class WorkflowEngine {
  // Private internal state
  /** @type {{ id: string, projectId: string, goal: string, status: string, currentTaskId: string|null, createdAt: Date, updatedAt: Date, metadata: object }} */
  #meta;

  /** @type {Map<string, object>} taskId → mutable task record */
  #tasks;

  /** @type {TaskQueue} IDs of tasks currently READY for execution */
  #readyQueue;

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTRUCTOR (private-style — use WorkflowEngine.create() instead)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * @param {object} meta - Workflow-level metadata fields.
   */
  constructor(meta) {
    this.#meta = {
      id: meta.id ?? randomUUID(),
      projectId: meta.projectId,
      goal: meta.goal,
      status: meta.status ?? WorkflowStatus.PENDING,
      currentTaskId: meta.currentTaskId ?? null,
      createdAt: meta.createdAt ?? new Date(),
      updatedAt: meta.updatedAt ?? new Date(),
      metadata: meta.metadata ?? {},
    };
    this.#tasks = new Map();
    this.#readyQueue = new TaskQueue();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FACTORY
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a WorkflowEngine instance.
   * Validates that at least `projectId` and `goal` are provided.
   *
   * @param {object} fields
   * @param {string}  fields.projectId   - Parent project ID.
   * @param {string}  fields.goal        - Natural language workflow goal.
   * @param {string} [fields.id]         - UUID. Auto-generated if omitted.
   * @param {object} [fields.metadata]   - Arbitrary metadata.
   * @returns {WorkflowEngine}
   * @throws {WorkflowValidationError}   - If required fields are missing.
   *
   * @example
   * const engine = WorkflowEngine.create({
   *   projectId: 'proj-123',
   *   goal: 'Create a launch package for an eco-friendly startup',
   * });
   */
  static create(fields = {}) {
    if (!fields.projectId || typeof fields.projectId !== 'string' || !fields.projectId.trim()) {
      throw new WorkflowValidationError('WorkflowEngine.create: projectId is required', [
        { path: ['projectId'], message: 'projectId must be a non-empty string' },
      ]);
    }
    if (!fields.goal || typeof fields.goal !== 'string' || !fields.goal.trim()) {
      throw new WorkflowValidationError('WorkflowEngine.create: goal is required', [
        { path: ['goal'], message: 'goal must be a non-empty string' },
      ]);
    }
    return new WorkflowEngine(fields);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TASK REGISTRATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a new task with the engine.
   *
   * Rules:
   * • Cannot add tasks to a COMPLETED or FAILED workflow.
   * • Duplicate task IDs are rejected.
   * • Dependency IDs are validated against already-registered tasks
   *   AND the task being added (forward references are allowed — the engine
   *   resolves readiness lazily when tasks complete).
   *
   * @param {object} taskFields - Fields accepted by createTask().
   * @returns {string} The task's ID (for chaining / reference).
   * @throws {WorkflowEngineError}      - On state violations.
   * @throws {WorkflowValidationError}  - On invalid task data.
   *
   * @example
   * const t1 = engine.addTask({ type: TaskType.TEXT_GENERATION, title: 'Generate content' });
   * const t2 = engine.addTask({ type: TaskType.WEBSITE_GENERATION, title: 'Build site', dependencies: [t1] });
   */
  addTask(taskFields = {}) {
    // Guard: cannot add to a terminal workflow
    if (
      this.#meta.status === WorkflowStatus.COMPLETED ||
      this.#meta.status === WorkflowStatus.FAILED
    ) {
      throw new WorkflowEngineError(
        `Cannot add tasks to a ${this.#meta.status} workflow`,
        ErrorCode.INVALID_INPUT,
        { workflowStatus: this.#meta.status },
      );
    }

    // Create and validate via Phase 1 factory
    const task = createTask(taskFields);

    // Guard: duplicate ID
    if (this.#tasks.has(task.id)) {
      throw new WorkflowEngineError(
        `Task ID "${task.id}" already exists in this workflow`,
        ErrorCode.VALIDATION_ERROR,
        { taskId: task.id },
      );
    }

    // Store as mutable internal record
    const record = _toMutableRecord(task);
    this.#tasks.set(task.id, record);

    // Resolve initial status:
    // If the task has no dependencies, it is immediately READY.
    // If it has dependencies, check if they are already all COMPLETED
    // (handles the case where tasks are added after some have already run).
    this.#resolveTaskStatus(record);

    this.#meta.updatedAt = new Date();
    return task.id;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DEPENDENCY GRAPH VALIDATION (full-batch)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validate the dependency graph of all currently registered tasks.
   * Calls Phase 1 validateDependencies() — checks duplicates, missing refs,
   * and circular dependencies.
   *
   * Call this after all tasks have been added (before starting the workflow)
   * to catch any cross-task dependency problems.
   *
   * @returns {{ valid: boolean, errors: object[] }}
   */
  validateGraph() {
    const tasks = Array.from(this.#tasks.values());
    return validateDependencies(tasks);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // READY TASK QUERIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Return an array of all tasks that are currently READY to execute
   * (in insertion order — stable and deterministic).
   *
   * @returns {object[]} Array of task snapshots.
   */
  getReadyTasks() {
    return this.#readyQueue
      .toArray()
      .map((id) => _snapshot(this.#tasks.get(id)));
  }

  /**
   * Return the next task to execute (the front of the ready queue).
   * Does NOT remove it from the queue — call startTask() to do that.
   *
   * @returns {object | null} Task snapshot, or null if no tasks are ready.
   */
  getNextTask() {
    const id = this.#readyQueue.peek();
    if (!id) return null;
    return _snapshot(this.#tasks.get(id));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TASK LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Mark a task as RUNNING.
   *
   * Transitions: PENDING → RUNNING  or  READY → RUNNING
   * Also transitions workflow from PENDING → RUNNING on the first call.
   *
   * @param {string} taskId
   * @param {object} [input] - Optional input payload { data, context? }
   * @returns {object} Updated task snapshot.
   * @throws {WorkflowEngineError} - If the task is not in a startable state.
   */
  startTask(taskId, input = null) {
    const record = this.#requireTask(taskId);

    // Guard: must be PENDING or READY
    if (record.status !== TaskStatus.PENDING && record.status !== TaskStatus.READY) {
      throw new WorkflowEngineError(
        `Cannot start task "${taskId}" — current status is ${record.status}`,
        ErrorCode.INVALID_INPUT,
        { taskId, currentStatus: record.status },
      );
    }

    // Guard: workflow must not be terminal
    if (
      this.#meta.status === WorkflowStatus.COMPLETED ||
      this.#meta.status === WorkflowStatus.FAILED
    ) {
      throw new WorkflowEngineError(
        `Cannot start tasks on a ${this.#meta.status} workflow`,
        ErrorCode.INVALID_INPUT,
        { workflowStatus: this.#meta.status },
      );
    }

    // Apply transition
    record.status = TaskStatus.RUNNING;
    if (input !== null) {
      record.input = typeof input === 'object' ? { ...input } : input;
    }

    // Remove from ready queue (it's no longer just "ready", it's running)
    this.#readyQueue.remove(taskId);
    this.#meta.currentTaskId = taskId;
    this.#meta.updatedAt = new Date();

    // Transition workflow PENDING → RUNNING on first task start
    if (this.#meta.status === WorkflowStatus.PENDING) {
      this.#meta.status = WorkflowStatus.RUNNING;
    }

    return _snapshot(record);
  }

  /**
   * Mark a task as COMPLETED and propagate dependency resolution.
   *
   * After completion:
   * 1. Store the output on the task record.
   * 2. For every task that depends on this one, re-evaluate readiness.
   * 3. Check if the workflow is now fully complete.
   *
   * @param {string} taskId
   * @param {object} result - A success result from createSuccessResult().
   *   Must have `status === 'COMPLETED'` and `output` field.
   * @returns {object} Updated task snapshot.
   * @throws {WorkflowEngineError} - If the task is not RUNNING.
   */
  completeTask(taskId, result) {
    const record = this.#requireTask(taskId);

    // Guard: must be RUNNING
    if (record.status !== TaskStatus.RUNNING) {
      throw new WorkflowEngineError(
        `Cannot complete task "${taskId}" — current status is ${record.status} (expected RUNNING)`,
        ErrorCode.INVALID_INPUT,
        { taskId, currentStatus: record.status },
      );
    }

    // Guard: result must be a success result
    if (!result || result.status !== TaskResultStatus.COMPLETED) {
      throw new WorkflowEngineError(
        `completeTask requires a COMPLETED result (received status: ${result?.status})`,
        ErrorCode.INVALID_INPUT,
        { taskId, resultStatus: result?.status },
      );
    }

    // Apply transition
    record.status = TaskStatus.COMPLETED;
    record.output = result.output ? { ...result.output } : null;
    record.error = null;

    if (this.#meta.currentTaskId === taskId) {
      this.#meta.currentTaskId = null;
    }
    this.#meta.updatedAt = new Date();

    // Propagate: re-evaluate readiness of all dependent tasks
    this.#propagateCompletion(taskId);

    // Check whether the entire workflow is done
    this.#checkWorkflowCompletion();

    return _snapshot(record);
  }

  /**
   * Mark a task as FAILED (permanently) or RETRYING (retryable), propagate
   * BLOCKED status to dependent tasks, and detect workflow failure.
   *
   * Behaviour by result type:
   * • COMPLETED result   → throws (use completeTask instead)
   * • FAILED result      → task → FAILED; deps → BLOCKED; check workflow
   * • RETRYABLE_FAILURE  → task → RETRYING; deps stay as-is (Auto-Healing
   *                         will call retryTask() or failTask() next)
   *
   * @param {string} taskId
   * @param {object} result - A failure result from createFailureResult() or
   *   createRetryableFailureResult().
   * @returns {object} Updated task snapshot.
   * @throws {WorkflowEngineError}
   */
  failTask(taskId, result) {
    const record = this.#requireTask(taskId);

    // Guard: must be RUNNING or RETRYING
    if (record.status !== TaskStatus.RUNNING && record.status !== TaskStatus.RETRYING) {
      throw new WorkflowEngineError(
        `Cannot fail task "${taskId}" — current status is ${record.status} (expected RUNNING or RETRYING)`,
        ErrorCode.INVALID_INPUT,
        { taskId, currentStatus: record.status },
      );
    }

    // Guard: must not receive a success result
    if (!result || result.status === TaskResultStatus.COMPLETED) {
      throw new WorkflowEngineError(
        `failTask requires a FAILED or RETRYABLE_FAILURE result`,
        ErrorCode.INVALID_INPUT,
        { taskId, resultStatus: result?.status },
      );
    }

    // Store the error on the record regardless of which failure type
    record.error = result.error ? { ...result.error } : null;

    if (result.status === TaskResultStatus.RETRYABLE_FAILURE) {
      // ── Retryable: put in RETRYING state — Auto-Healing will call retryTask()
      record.status = TaskStatus.RETRYING;
    } else {
      // ── Permanent failure: FAILED + block dependents + check workflow
      record.status = TaskStatus.FAILED;
      this.#readyQueue.remove(taskId);

      if (this.#meta.currentTaskId === taskId) {
        this.#meta.currentTaskId = null;
      }

      // Block all tasks that transitively depend on this one
      this.#propagateFailure(taskId);

      // Check if anything is still runnable
      this.#checkWorkflowFailure();
    }

    this.#meta.updatedAt = new Date();
    return _snapshot(record);
  }

  /**
   * Retry a task that is in RETRYING (or FAILED, if maxRetries allows).
   *
   * Transitions:
   *   RETRYING → RUNNING  (if retryCount < maxRetries → increments retryCount)
   *   RETRYING → FAILED   (if retryCount >= maxRetries → permanent failure)
   *
   * This method is the hook point for the Auto-Healing module (Phase 3).
   *
   * @param {string} taskId
   * @returns {object} Updated task snapshot.
   * @throws {WorkflowEngineError} - If the task is not in RETRYING state.
   */
  retryTask(taskId) {
    const record = this.#requireTask(taskId);

    // Guard: must be in RETRYING state
    if (record.status !== TaskStatus.RETRYING) {
      throw new WorkflowEngineError(
        `Cannot retry task "${taskId}" — current status is ${record.status} (expected RETRYING)`,
        ErrorCode.INVALID_INPUT,
        { taskId, currentStatus: record.status },
      );
    }

    if (record.retryCount >= record.maxRetries) {
      // Exhausted — permanently fail
      record.status = TaskStatus.FAILED;
      record.error = {
        code: ErrorCode.MAX_RETRIES_EXCEEDED,
        message: `Task exhausted all ${record.maxRetries} retries`,
      };
      // Block dependents and check workflow failure
      this.#propagateFailure(taskId);
      this.#checkWorkflowFailure();
    } else {
      // Increment and re-dispatch
      record.retryCount += 1;
      record.status = TaskStatus.RUNNING;
      this.#meta.currentTaskId = taskId;
    }

    this.#meta.updatedAt = new Date();
    return _snapshot(record);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS QUERIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Current workflow status string.
   * @returns {string} One of WorkflowStatus values.
   */
  getWorkflowStatus() {
    return this.#meta.status;
  }

  /**
   * @returns {boolean} True when all tasks are COMPLETED and workflow is done.
   */
  isWorkflowComplete() {
    return this.#meta.status === WorkflowStatus.COMPLETED;
  }

  /**
   * @returns {boolean} True when workflow has permanently failed.
   */
  isWorkflowFailed() {
    return this.#meta.status === WorkflowStatus.FAILED;
  }

  /**
   * Return a snapshot of a single task by ID.
   *
   * @param {string} taskId
   * @returns {object | null} Task snapshot, or null if not found.
   */
  getTask(taskId) {
    const record = this.#tasks.get(taskId);
    return record ? _snapshot(record) : null;
  }

  /**
   * Return snapshots of all registered tasks (insertion order).
   *
   * @returns {object[]}
   */
  getAllTasks() {
    return Array.from(this.#tasks.values()).map(_snapshot);
  }

  /**
   * Return the number of registered tasks.
   * @returns {number}
   */
  get taskCount() {
    return this.#tasks.size;
  }

  /**
   * Return the workflow ID.
   * @returns {string}
   */
  get id() {
    return this.#meta.id;
  }

  /**
   * Return the workflow goal.
   * @returns {string}
   */
  get goal() {
    return this.#meta.goal;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SNAPSHOT (for serialization / persistence)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Return a full plain-object snapshot of the engine's current state.
   * Suitable for JSON serialization and persisting via Person 2's DB layer.
   *
   * @returns {object}
   */
  snapshot() {
    return {
      id: this.#meta.id,
      projectId: this.#meta.projectId,
      goal: this.#meta.goal,
      status: this.#meta.status,
      currentTaskId: this.#meta.currentTaskId,
      createdAt: this.#meta.createdAt,
      updatedAt: this.#meta.updatedAt,
      metadata: { ...this.#meta.metadata },
      tasks: this.getAllTasks(),
      readyQueue: this.#readyQueue.toArray(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the internal task record, throwing if not found.
   * @param {string} taskId
   * @returns {object} Mutable internal record.
   * @private
   */
  #requireTask(taskId) {
    const record = this.#tasks.get(taskId);
    if (!record) {
      throw new WorkflowEngineError(
        `Task "${taskId}" not found in workflow`,
        ErrorCode.INVALID_INPUT,
        { taskId },
      );
    }
    return record;
  }

  /**
   * Resolve and set the initial status of a newly-added task record.
   * Also enqueues the task if it is immediately READY.
   *
   * @param {object} record - The new task's mutable internal record.
   * @private
   */
  #resolveTaskStatus(record) {
    // Build allTasks array from the engine's current Map (includes the new record)
    const allTasks = Array.from(this.#tasks.values());
    const { ready } = isTaskReady(record, allTasks);

    if (ready) {
      record.status = TaskStatus.READY;
      this.#readyQueue.enqueue(record.id);
    } else {
      // Check if any existing dependency is already FAILED — block immediately
      const hasFailedDep = record.dependencies.some((depId) => {
        const dep = this.#tasks.get(depId);
        return dep && dep.status === TaskStatus.FAILED;
      });
      record.status = hasFailedDep ? TaskStatus.BLOCKED : TaskStatus.PENDING;
    }
  }

  /**
   * After a task completes, re-evaluate readiness of every task that depends
   * on it (direct or indirect — we scan all tasks for simplicity since
   * workflows are small; a reverse-adjacency map could be added for scale).
   *
   * @param {string} completedTaskId
   * @private
   */
  #propagateCompletion(completedTaskId) {
    const allTasks = Array.from(this.#tasks.values());

    for (const record of this.#tasks.values()) {
      // Only consider tasks that haven't started or are blocked
      if (
        record.status !== TaskStatus.PENDING &&
        record.status !== TaskStatus.BLOCKED
      ) {
        continue;
      }

      // Only re-evaluate tasks that list the completed task as a dependency
      if (!record.dependencies.includes(completedTaskId)) {
        continue;
      }

      // Re-check full readiness (all deps must be COMPLETED)
      const { ready } = isTaskReady(record, allTasks);
      if (ready) {
        record.status = TaskStatus.READY;
        this.#readyQueue.enqueue(record.id);
      }
    }
  }

  /**
   * After a task permanently fails, block all tasks that directly or
   * transitively depend on it using a BFS traversal over the dependency graph.
   *
   * @param {string} failedTaskId
   * @private
   */
  #propagateFailure(failedTaskId) {
    // Build a reverse adjacency map: taskId → Set of task IDs that depend on it
    const dependents = new Map();
    for (const record of this.#tasks.values()) {
      for (const depId of record.dependencies) {
        if (!dependents.has(depId)) dependents.set(depId, new Set());
        dependents.get(depId).add(record.id);
      }
    }

    // BFS from the failed task outward
    const visited = new Set([failedTaskId]);
    const queue = [...(dependents.get(failedTaskId) ?? [])];

    while (queue.length > 0) {
      const dependentId = queue.shift();
      if (visited.has(dependentId)) continue;
      visited.add(dependentId);

      const depRecord = this.#tasks.get(dependentId);
      if (!depRecord) continue;

      // Block it if it hasn't already reached a terminal state
      if (
        depRecord.status !== TaskStatus.COMPLETED &&
        depRecord.status !== TaskStatus.FAILED
      ) {
        depRecord.status = TaskStatus.BLOCKED;
        this.#readyQueue.remove(dependentId);

        // Attach context error
        depRecord.error = {
          code: ErrorCode.DEPENDENCY_FAILED,
          message: `Task blocked because dependency "${failedTaskId}" failed`,
        };
      }

      // Continue BFS for tasks that depend on this dependent
      for (const nextId of dependents.get(dependentId) ?? []) {
        if (!visited.has(nextId)) queue.push(nextId);
      }
    }
  }

  /**
   * Check if all tasks are COMPLETED → mark workflow COMPLETED.
   * @private
   */
  #checkWorkflowCompletion() {
    const allDone = Array.from(this.#tasks.values()).every(
      (r) => r.status === TaskStatus.COMPLETED,
    );
    if (allDone && this.#tasks.size > 0) {
      this.#meta.status = WorkflowStatus.COMPLETED;
      this.#meta.currentTaskId = null;
    }
  }

  /**
   * Check if the workflow is now permanently stuck:
   * no tasks are PENDING, READY, RUNNING, or RETRYING.
   * If so, mark workflow FAILED.
   * @private
   */
  #checkWorkflowFailure() {
    const activeStatuses = new Set([
      TaskStatus.PENDING,
      TaskStatus.READY,
      TaskStatus.RUNNING,
      TaskStatus.RETRYING,
    ]);

    const canStillProgress = Array.from(this.#tasks.values()).some(
      (r) => activeStatuses.has(r.status),
    );

    if (!canStillProgress && this.#tasks.size > 0) {
      this.#meta.status = WorkflowStatus.FAILED;
      this.#meta.currentTaskId = null;
    }
  }
}
