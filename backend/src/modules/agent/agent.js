/**
 * @file agent.js
 * @module agent
 *
 * The Agent â€” the central orchestrator of "Generative AI for Everyone".
 *
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * ARCHITECTURE RULE
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * The Agent ORCHESTRATES â€” it does NOT implement:
 *   â€¢ Dependency resolution    (Workflow Engine owns this)
 *   â€¢ Task planning            (Planner owns this)
 *   â€¢ AI/text generation       (Person 3's AI module)
 *   â€¢ Code execution           (Person 4's Execution module)
 *   â€¢ Auto-Healing / retries   (Phase 8)
 *   â€¢ Persistent DB memory     (Phase 6+)
 *   â€¢ HTTP endpoints           (Routes layer)
 *   â€¢ Database persistence     (Services layer)
 *
 * Phase 5 Memory IS integrated here (in-memory, per-workflow isolation).
 *
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * PUBLIC INTERFACE
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *
 * const agent = createAgent({ planner, handlers, projectId });
 * const result = await agent.run(goal);
 *
 * Success: { success: true,  workflowId, status: 'COMPLETED', outputs, completedAt }
 * Failure: { success: false, workflowId, status: 'FAILED',    error, outputs }
 *
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * EXECUTION FLOW
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *
 * 1. Planner.plan(goal)              â†’ { goal, tasks[] }
 * 2. WorkflowEngine.create(...)      â†’ engine
 * 3. loadPlanIntoEngine(plan,engine) â†’ tasks registered
 * 4. Loop:
 *      task = engine.getNextTask()   â† ENGINE owns readiness/deps
 *      engine.startTask(task.id)
 *      result = handlers.execute(task, ctx)
 *      success â†’ engine.completeTask(task.id, successResult)
 *      failure â†’ engine.failTask(task.id, failureResult)
 *      check termination
 * 5. Return structured result
 *
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * CONTEXT PASSING (Phase 5)
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * A ProjectMemory instance is created per workflow run.
 * After each task completes, memory.addTaskOutput(taskId, output) is called.
 * The handler receives the executionContext which includes outputs, and the
 * Agent also passes memory.getContextString(task) as structured context.
 * This keeps Project A context completely isolated from Project B.
 *
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * LOOP SAFETY
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * MAX_ITERATIONS = taskCount * 2 + 10
 * Prevents infinite loops. In Phase 8, retries will increment the counter
 * but stay within the same formula (retried tasks count double).
 */

import { WorkflowEngine, WorkflowStatus, createSuccessResult, createFailureResult, ErrorCode } from '../agent/workflow/index.js';
import { loadPlanIntoEngine } from '../agent/planner/index.js';
import { createHandlerRegistry } from './taskHandlers.js';
import { createPlanner } from '../agent/planner/index.js';
import { createProjectMemory } from './memory/index.js';
import { createExecutionEngine, createValidationEngine } from './execution/index.js';
import { createAutoHealer } from './healing/autoHealer.js';

// â”€â”€â”€ Event types broadcast to SSE subscribers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const AgentEvent = Object.freeze({
  TASK_START:       'task_start',
  TASK_COMPLETE:    'task_complete',
  TASK_FAIL:        'task_fail',
  HEAL_START:       'heal_start',
  HEAL_SUCCESS:     'heal_success',
  HEAL_FAIL:        'heal_fail',
  WORKFLOW_COMPLETE:'workflow_complete',
  WORKFLOW_FAIL:    'workflow_fail',
  PLANNING:         'planning',
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CONSTANTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Safety multiplier on top of task count to bound the orchestration loop. */
export const LOOP_SAFETY_MULTIPLIER = 2;

/** Fixed padding added to the loop cap (headroom for edge cases). */
export const LOOP_SAFETY_PADDING    = 10;

/** Maximum heal+retry attempts per task before permanent failure. */
export const MAX_RETRIES = 2;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AGENT ERROR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class AgentError extends Error {
  /**
   * @param {string} message
   * @param {string} [code]    - One of AgentErrorCode values.
   * @param {object} [details] - Extra context (taskId, etc.).
   */
  constructor(message, code = AgentErrorCode.AGENT_ERROR, details = {}) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
    this.details = details;
  }
}

export const AgentErrorCode = Object.freeze({
  INVALID_GOAL:       'INVALID_GOAL',
  PLANNING_FAILED:    'PLANNING_FAILED',
  WORKFLOW_INIT_FAILED: 'WORKFLOW_INIT_FAILED',
  TASK_EXECUTION_FAILED: 'TASK_EXECUTION_FAILED',
  DELEGATION_FAILED:  'DELEGATION_FAILED',
  WORKFLOW_STALLED:   'WORKFLOW_STALLED',
  LOOP_GUARD_EXCEEDED: 'LOOP_GUARD_EXCEEDED',
  AGENT_ERROR:        'AGENT_ERROR',
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LOGGER (lightweight â€” replaceable with a real logger in Phase 5+)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function log(message, data = null) {
  if (data !== null) {
    console.log(`[AGENT] ${message}`, data);
  } else {
    console.log(`[AGENT] ${message}`);
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AGENT CLASS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class Agent {
  #planner;
  #handlers;
  #projectId;
  #executionEngine;
  #validationEngine;
  #healer;
  #maxRetries;
  #onEvent;

  /**
   * @param {object} planner          - A Planner instance.
   * @param {object} handlers         - A HandlerRegistry instance.
   * @param {string} projectId        - Project ID.
   * @param {object} executionEngine  - Phase 6 ExecutionEngine.
   * @param {object} validationEngine - Phase 6 ValidationEngine.
   * @param {object} [healer]         - AutoHealer instance (Phase 8).
   * @param {number} [maxRetries]     - Max heal retries per task.
   * @param {Function} [onEvent]      - Optional event callback(type, data) for SSE.
   */
  constructor(planner, handlers, projectId, executionEngine, validationEngine, healer, maxRetries, onEvent) {
    this.#planner          = planner;
    this.#handlers         = handlers;
    this.#projectId        = projectId;
    this.#executionEngine  = executionEngine;
    this.#validationEngine = validationEngine;
    this.#healer           = healer ?? null;
    this.#maxRetries       = maxRetries ?? 2;
    this.#onEvent          = typeof onEvent === 'function' ? onEvent : null;
  }

  /** Emit an event to the SSE subscriber (if any). */
  #emit(type, data = {}) {
    if (this.#onEvent) {
      try { this.#onEvent(type, data); } catch (_) { /* never let emit crash the agent */ }
    }
  }

  /** Expose projectId for external inspection (e.g. memory integration tests). */
  get projectId() { return this.#projectId; }


  // â”€â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Run the full agent lifecycle for a user goal.
   *
   * @param {string} goal - The user's natural-language goal.
   * @returns {Promise<
   *   { success: true,  workflowId: string, status: string, outputs: object, completedAt: Date } |
   *   { success: false, workflowId: string | null, status: string, error: object, outputs: object }
   * >}
   *
   * @example
   * const result = await agent.run('Create a website for an eco-friendly startup.');
   * if (result.success) {
   *   console.log(result.outputs); // { 'task-1': {...}, 'task-2': {...}, ... }
   * }
   */
  async run(goal) {
    log('Goal received', { goal });

    // â”€â”€ Step 1: Validate goal (fast path â€” before hitting the planner) â”€â”€â”€â”€â”€
    if (typeof goal !== 'string' || goal.trim().length === 0) {
      return this.#failure(null, WorkflowStatus.FAILED, {
        code: AgentErrorCode.INVALID_GOAL,
        message: 'Goal must be a non-empty string.',
      }, {});
    }

    // â”€â”€ Step 2: Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    log('Planning workflow');
    this.#emit(AgentEvent.PLANNING, { goal });
    const planResult = await this.#planner.plan(goal);
    if (!planResult.success) {
      log('Planning failed', planResult.error);
      this.#emit(AgentEvent.WORKFLOW_FAIL, { error: planResult.error });
      return this.#failure(null, WorkflowStatus.FAILED, {
        code: AgentErrorCode.PLANNING_FAILED,
        message: planResult.error.message,
        details: planResult.error,
      }, {});
    }

    const { plan } = planResult;
    log(`Plan created â€” ${plan.tasks.length} tasks`);

    // â”€â”€ Step 3: Create Workflow Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let engine;
    try {
      engine = WorkflowEngine.create({
        projectId: this.#projectId,
        goal: plan.goal,
      });
    } catch (err) {
      log('Workflow creation failed', err.message);
      return this.#failure(null, WorkflowStatus.FAILED, {
        code: AgentErrorCode.WORKFLOW_INIT_FAILED,
        message: `Failed to create workflow: ${err.message}`,
      }, {});
    }

    const workflowId = engine.snapshot().id;

    // â”€â”€ Step 4: Load plan into engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const loadResult = loadPlanIntoEngine(plan, engine);
    if (!loadResult.success) {
      log('Plan load failed', loadResult.error);
      return this.#failure(workflowId, WorkflowStatus.FAILED, {
        code: AgentErrorCode.WORKFLOW_INIT_FAILED,
        message: loadResult.error.message,
        details: loadResult.error,
      }, {});
    }

    log('Workflow created', { workflowId, taskCount: plan.tasks.length });

    // â”€â”€ Step 5: Execution context + Phase 5 Memory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // One ProjectMemory instance per workflow run â€” project isolation guaranteed.
    const memory = createProjectMemory({
      projectId: this.#projectId,
      workflowId,
      goal: plan.goal,
    });

    /** @type {{ workflowId: string, goal: string, projectId: string, outputs: object, startedAt: Date, memory: object }} */
    const executionContext = {
      workflowId,
      goal: plan.goal,
      projectId: this.#projectId,
      outputs: {},       // keyed by taskId â€” grows as tasks complete
      memory,            // Phase 5: live memory reference
      startedAt: new Date(),
    };

    // â”€â”€ Step 6: Orchestration loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const maxIterations = plan.tasks.length * LOOP_SAFETY_MULTIPLIER + LOOP_SAFETY_PADDING;
    let iterations = 0;
    /** Track heal retries per task: taskId -> retryCount */
    const taskRetryCounts = {};

    while (true) {
      iterations++;

      // Loop guard â€” prevents infinite loops
      if (iterations > maxIterations) {
        log('Loop guard exceeded', { iterations, maxIterations });
        return this.#failure(workflowId, engine.getWorkflowStatus(), {
          code: AgentErrorCode.LOOP_GUARD_EXCEEDED,
          message: `Orchestration loop exceeded max iterations (${maxIterations}). This is a bug.`,
          details: { iterations, maxIterations },
        }, executionContext.outputs);
      }

      // â”€â”€ a. Get next ready task â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      //   THE ENGINE OWNS DEPENDENCY RESOLUTION. We just ask.
      const task = engine.getNextTask();

      // â”€â”€ b. No task ready â€” determine why â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (!task) {
        if (engine.isWorkflowComplete()) {
          log('Workflow completed', { workflowId });
          return this.#success(workflowId, executionContext.outputs, memory);
        }
        if (engine.isWorkflowFailed()) {
          log('Workflow failed', { workflowId });
          return this.#failure(workflowId, WorkflowStatus.FAILED, {
            code: AgentErrorCode.TASK_EXECUTION_FAILED,
            message: 'Workflow failed â€” one or more tasks encountered a permanent error.',
          }, executionContext.outputs);
        }
        // Stall: workflow is RUNNING but no task is ready and none is running.
        // (This should not happen with a valid plan, but guards against edge cases.)
        log('Workflow stalled â€” no ready task', { workflowId });
        return this.#failure(workflowId, engine.getWorkflowStatus(), {
          code: AgentErrorCode.WORKFLOW_STALLED,
          message: 'Workflow stalled â€” no tasks are ready but the workflow is not complete.',
          details: { workflowStatus: engine.getWorkflowStatus() },
        }, executionContext.outputs);
      }

      // â”€â”€ c. Start the task â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      log(`Executing task: ${task.id}`, { type: task.type, title: task.title });
      this.#emit(AgentEvent.TASK_START, { taskId: task.id, type: task.type, title: task.title, description: task.description });

      const inputPayload = {
        data: {
          taskTitle: task.title,
          taskDescription: task.description,
          priorOutputs: { ...executionContext.outputs },
        },
        context: {
          goal: executionContext.goal,
          workflowId: executionContext.workflowId,
        },
      };

      engine.startTask(task.id, inputPayload);

      // â”€â”€ d. Delegate to handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const handlerResult = await this.#handlers.execute(task, executionContext);

      if (handlerResult.success) {
        // â”€â”€ e. Task succeeded (AI handler) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        log(`Task completed (AI): ${task.id}`);

        // â”€â”€ Phase 6: Execution Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const execResult = await this.#executionEngine.execute(task, handlerResult.output);

        if (!execResult.success) {
          log(`Execution failed: ${task.id}`, execResult.errors?.[0]);
          memory.addTaskError(task.id, execResult.errors?.[0]);

          const execError = execResult.errors?.[0] ?? { message: 'Execution failed.', code: 'EXECUTION_ERROR', retryable: true };
          taskRetryCounts[task.id] = taskRetryCounts[task.id] ?? 0;

          if (this.#healer && taskRetryCounts[task.id] < this.#maxRetries) {
            const retryNum = taskRetryCounts[task.id] + 1;
            log(`[HEAL] Healing exec failure for ${task.id} (retry ${retryNum}/${this.#maxRetries})`);
            this.#emit(AgentEvent.HEAL_START, { taskId: task.id, retryCount: retryNum, maxRetries: this.#maxRetries, errorMessage: execError.message, phase: 'execution' });
            const healResult = await this.#healer.heal({
              task, failureInfo: execError, previousOutput: handlerResult.output, executionContext,
            });
            if (healResult.healed) {
              taskRetryCounts[task.id]++;
              memory.setContext(`heal_${task.id}_${taskRetryCounts[task.id]}`, healResult.meta);
              const retryExec = await this.#executionEngine.execute(task, healResult.repairedOutput);
              if (retryExec.success) {
                const retryValid = this.#validationEngine.validate(task, retryExec);
                if (retryValid.valid) {
                  log(`[HEAL] Post-heal PASSED for ${task.id}`);
                  this.#emit(AgentEvent.HEAL_SUCCESS, { taskId: task.id, retryCount: taskRetryCounts[task.id], model: healResult.meta?.model });
                  const healedOutput = { ...retryExec.output, _healed: true };
                  executionContext.outputs[task.id] = healedOutput;
                  memory.addTaskOutput(task.id, healedOutput);
                  engine.completeTask(task.id, createSuccessResult({ data: { output: healedOutput, healed: true } }));
                  this.#emit(AgentEvent.TASK_COMPLETE, { taskId: task.id, healed: true, output: healedOutput });
                  if (engine.isWorkflowComplete()) return this.#success(workflowId, executionContext.outputs, memory);
                  continue;
                }
              }
              log(`[HEAL] Post-heal still failed for ${task.id}`);
              this.#emit(AgentEvent.HEAL_FAIL, { taskId: task.id, reason: 'Post-heal validation still failed' });
            } else {
              log(`[HEAL] Not healable: ${task.id} â€” ${healResult.reason}`);
              this.#emit(AgentEvent.HEAL_FAIL, { taskId: task.id, reason: healResult.reason });
            }
          } else if (taskRetryCounts[task.id] >= this.#maxRetries) {
            log(`[HEAL] Retry limit reached for ${task.id} â€” permanent failure`);
          }

          const execFailure = createFailureResult({
            code:    execError.code ?? 'EXECUTION_ERROR',
            message: execError.message ?? 'Execution failed.',
            details: { executionErrors: execResult.errors, logs: execResult.logs, retries: taskRetryCounts[task.id] ?? 0 },
          });
          engine.failTask(task.id, execFailure);
          this.#emit(AgentEvent.TASK_FAIL, { taskId: task.id, error: execError });

          if (engine.isWorkflowFailed()) {
            log('Workflow failed (execution)', { workflowId, failedTaskId: task.id });
            this.#emit(AgentEvent.WORKFLOW_FAIL, { error: { message: `Task "${task.id}" execution failed` }, outputs: executionContext.outputs });
            return this.#failure(workflowId, WorkflowStatus.FAILED, {
              code:    AgentErrorCode.TASK_EXECUTION_FAILED,
              message: `Task "${task.id}" execution failed: ${execError.message}`,
              taskId:  task.id,
              details: { executionErrors: execResult.errors },
            }, executionContext.outputs);
          }
          // Not yet workflow-failed -- continue loop
        } else {
          // â”€â”€ Phase 6: Validation Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          const validResult = this.#validationEngine.validate(task, execResult);

          if (!validResult.valid) {
            log(`Validation failed: ${task.id}`, validResult.errors?.[0]);
            memory.addTaskError(task.id, validResult.errors?.[0]);

            // Auto-Healing: attempt repair before permanent validation failure
            const validError = validResult.errors?.[0] ?? { message: 'Validation failed.', code: 'VALIDATION_ERROR', retryable: true };
            taskRetryCounts[task.id] = taskRetryCounts[task.id] ?? 0;

            if (this.#healer && taskRetryCounts[task.id] < this.#maxRetries) {
              const retryNum2 = taskRetryCounts[task.id] + 1;
              log(`[HEAL] Healing validation failure for ${task.id} (retry ${retryNum2}/${this.#maxRetries})`);
              this.#emit(AgentEvent.HEAL_START, { taskId: task.id, retryCount: retryNum2, maxRetries: this.#maxRetries, errorMessage: validError.message, phase: 'validation' });
              const healResult2 = await this.#healer.heal({
                task, failureInfo: { ...validError, retryable: true }, previousOutput: execResult.output, executionContext,
              });
              if (healResult2.healed) {
                taskRetryCounts[task.id]++;
                memory.setContext(`heal_val_${task.id}_${taskRetryCounts[task.id]}`, healResult2.meta);
                const retryExec2 = await this.#executionEngine.execute(task, healResult2.repairedOutput);
                if (retryExec2.success) {
                  const retryValid2 = this.#validationEngine.validate(task, retryExec2);
                  if (retryValid2.valid) {
                    log(`[HEAL] Post-heal validation PASSED for ${task.id}`);
                    this.#emit(AgentEvent.HEAL_SUCCESS, { taskId: task.id, retryCount: taskRetryCounts[task.id], model: healResult2.meta?.model });
                    const finalOutput2 = { ...retryExec2.output, _healed: true };
                    executionContext.outputs[task.id] = finalOutput2;
                    memory.addTaskOutput(task.id, finalOutput2);
                    engine.completeTask(task.id, createSuccessResult({ data: { output: finalOutput2, healed: true } }));
                    this.#emit(AgentEvent.TASK_COMPLETE, { taskId: task.id, healed: true, output: finalOutput2 });
                    if (engine.isWorkflowComplete()) return this.#success(workflowId, executionContext.outputs, memory);
                    continue;
                  }
                }
                log(`[HEAL] Post-heal still invalid for ${task.id}`);
                this.#emit(AgentEvent.HEAL_FAIL, { taskId: task.id, reason: 'Post-heal still invalid' });
              } else {
                log(`[HEAL] Validation not healable: ${task.id} â€” ${healResult2.reason}`);
                this.#emit(AgentEvent.HEAL_FAIL, { taskId: task.id, reason: healResult2.reason });
              }
            } else if (taskRetryCounts[task.id] >= this.#maxRetries) {
              log(`[HEAL] Retry limit reached for ${task.id} â€” permanent failure`);
            }

            const failureResult2 = createFailureResult({
              code:    validError.code ?? 'VALIDATION_ERROR',
              message: validError.message ?? 'Validation failed.',
              details: { validationChecks: validResult.checks, validationErrors: validResult.errors, retries: taskRetryCounts[task.id] ?? 0 },
            });
            engine.failTask(task.id, failureResult2);
            this.#emit(AgentEvent.TASK_FAIL, { taskId: task.id, error: validError });

            if (engine.isWorkflowFailed()) {
              log('Workflow failed (validation)', { workflowId, failedTaskId: task.id });
              this.#emit(AgentEvent.WORKFLOW_FAIL, { error: { message: `Task "${task.id}" validation failed` }, outputs: executionContext.outputs });
              return this.#failure(workflowId, WorkflowStatus.FAILED, {
                code:    AgentErrorCode.TASK_EXECUTION_FAILED,
                message: `Task "${task.id}" validation failed: ${validError.message}`,
                taskId:  task.id,
                details: { validationChecks: validResult.checks },
              }, executionContext.outputs);
            }
            // Not yet workflow-failed -- continue loop
          } else {
            // â”€â”€ PASS: store output, update memory, update engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            log(`Validation passed: ${task.id}`);

            // Use the execution engine's normalised output (not raw AI output)
            const finalOutput = execResult.output;
            executionContext.outputs[task.id] = finalOutput;
            memory.addTaskOutput(task.id, finalOutput);
            log(`Memory updated for task: ${task.id}`);

            // Also store validation metadata in memory context for future tasks
            memory.setContext(`validation_${task.id}`, {
              status: validResult.status,
              checks: validResult.checks,
            });

            const successResult = createSuccessResult({
              data: {
                output:     finalOutput,
                validation: { status: validResult.status, checks: validResult.checks },
              },
            });
            engine.completeTask(task.id, successResult);
            this.#emit(AgentEvent.TASK_COMPLETE, { taskId: task.id, healed: false, output: finalOutput, validation: validResult });
          }
        }

      } else {
        // â”€â”€ f. Task failed (handler delegation failed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        log(`Task failed: ${task.id}`, handlerResult.error);
        memory.addTaskError(task.id, handlerResult.error);

        const failureResult = createFailureResult({
          code: handlerResult.error?.code ?? ErrorCode.EXECUTION_ERROR,
          message: handlerResult.error?.message ?? 'Task execution failed.',
          details: handlerResult.error?.details,
        });

        engine.failTask(task.id, failureResult);
        this.#emit(AgentEvent.TASK_FAIL, { taskId: task.id, error: handlerResult.error });

        if (engine.isWorkflowFailed()) {
          log('Workflow failed', { workflowId, failedTaskId: task.id });
          this.#emit(AgentEvent.WORKFLOW_FAIL, { error: handlerResult.error, outputs: executionContext.outputs });
          return this.#failure(workflowId, WorkflowStatus.FAILED, {
            code: AgentErrorCode.TASK_EXECUTION_FAILED,
            message: `Task "${task.id}" failed: ${handlerResult.error?.message}`,
            taskId: task.id,
            details: handlerResult.error,
          }, executionContext.outputs);
        }
      }

      // â”€â”€ g. Check terminal states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (engine.isWorkflowComplete()) {
        log('Workflow completed', { workflowId });
        this.#emit(AgentEvent.WORKFLOW_COMPLETE, { workflowId, outputs: executionContext.outputs });
        return this.#success(workflowId, executionContext.outputs, memory);
      }
      if (engine.isWorkflowFailed()) {
        log('Workflow failed', { workflowId });
        this.#emit(AgentEvent.WORKFLOW_FAIL, { workflowId, outputs: executionContext.outputs });
        return this.#failure(workflowId, WorkflowStatus.FAILED, {
          code: AgentErrorCode.TASK_EXECUTION_FAILED,
          message: 'Workflow failed after task execution.',
        }, executionContext.outputs);
      }

      // Otherwise: continue loop â€” engine will surface the next ready task.
    }
  }

  // â”€â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Build a success result envelope.
   * @private
   */
  #success(workflowId, outputs, memory = null) {
    this.#emit(AgentEvent.WORKFLOW_COMPLETE, { workflowId, taskCount: Object.keys(outputs).length });
    return {
      success: true,
      workflowId,
      status: WorkflowStatus.COMPLETED,
      outputs,
      memorySnapshot: memory ? memory.getSnapshot() : null,
      completedAt: new Date(),
    };
  }

  /**
   * Build a failure result envelope.
   * @private
   */
  #failure(workflowId, status, error, outputs) {
    return {
      success: false,
      workflowId,
      status,
      error,
      outputs,
    };
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FACTORY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Create an Agent instance.
 *
 * @param {object} options
 * @param {string}  options.projectId      - Project ID for workflow association.
 * @param {object} [options.planner]       - Planner instance. Defaults to auto-detect from env.
 * @param {object} [options.handlers]      - HandlerRegistry instance. Defaults to base registry.
 * @param {string} [options.providerType]  - LLM provider type for auto-created planner.
 * @param {object} [options.healer]        - AutoHealer instance. Defaults to createAutoHealer().
 * @param {number} [options.maxRetries]    - Max heal retries per task. Default: MAX_RETRIES.
 * @param {Function} [options.onEvent]     - SSE event callback(type, data).
 * @returns {Agent}
 *
 * @example
 * // Production â€” auto-detects provider from env, healer always active:
 * const agent = createAgent({ projectId: 'proj-123', onEvent: (t,d) => sse.send(t,d) });
 *
 * // Tests â€” full mock injection:
 * const agent = createAgent({
 *   projectId: 'test-proj',
 *   planner: createPlanner({ provider: mockProvider }),
 *   handlers: customRegistry,
 *   healer: null,   // disable healer in tests that don't need it
 * });
 */
export function createAgent(options = {}) {
  if (!options.projectId || typeof options.projectId !== 'string' || !options.projectId.trim()) {
    throw new AgentError(
      'createAgent: projectId is required',
      AgentErrorCode.INVALID_GOAL,
      { hint: 'Pass a non-empty projectId string in options.' },
    );
  }

  const planner          = options.planner          ?? createPlanner({ providerType: options.providerType });
  const handlers         = options.handlers         ?? createHandlerRegistry();
  const executionEngine  = options.executionEngine  ?? createExecutionEngine();
  const validationEngine = options.validationEngine ?? createValidationEngine();
  // Always wire healer in production unless explicitly set to null/false
  const healer           = options.healer !== undefined ? options.healer : createAutoHealer();
  const maxRetries       = options.maxRetries ?? MAX_RETRIES;
  const onEvent          = options.onEvent ?? null;

  return new Agent(
    planner, handlers, options.projectId.trim(),
    executionEngine, validationEngine,
    healer, maxRetries, onEvent,
  );
}

// Re-export Memory factory for convenience
export { createProjectMemory } from './memory/index.js';
// Re-export Execution factories for convenience
export { createExecutionEngine, createValidationEngine } from './execution/index.js';

