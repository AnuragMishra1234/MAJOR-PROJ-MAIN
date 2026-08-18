/**
 * @file agent.js
 * @module agent
 *
 * The Agent — the central orchestrator of "Generative AI for Everyone".
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE RULE
 * ═══════════════════════════════════════════════════════════════════════════
 * The Agent ORCHESTRATES — it does NOT implement:
 *   • Dependency resolution    (Workflow Engine owns this)
 *   • Task planning            (Planner owns this)
 *   • AI/text generation       (Person 3's AI module)
 *   • Code execution           (Person 4's Execution module)
 *   • Auto-Healing / retries   (Phase 8)
 *   • Persistent memory        (Phase 5)
 *   • HTTP endpoints           (Routes layer)
 *   • Database persistence     (Services layer)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PUBLIC INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * const agent = createAgent({ planner, handlers, projectId });
 * const result = await agent.run(goal);
 *
 * Success: { success: true,  workflowId, status: 'COMPLETED', outputs, completedAt }
 * Failure: { success: false, workflowId, status: 'FAILED',    error, outputs }
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EXECUTION FLOW
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. Planner.plan(goal)              → { goal, tasks[] }
 * 2. WorkflowEngine.create(...)      → engine
 * 3. loadPlanIntoEngine(plan,engine) → tasks registered
 * 4. Loop:
 *      task = engine.getNextTask()   ← ENGINE owns readiness/deps
 *      engine.startTask(task.id)
 *      result = handlers.execute(task, ctx)
 *      success → engine.completeTask(task.id, successResult)
 *      failure → engine.failTask(task.id, failureResult)
 *      check termination
 * 5. Return structured result
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTEXT PASSING
 * ═══════════════════════════════════════════════════════════════════════════
 * executionContext.outputs accumulates task outputs keyed by task ID.
 * Each task's input payload includes all priorOutputs, so handler
 * implementations can incorporate previous results (e.g., text generated
 * by task-1 flows into the website generator in task-2).
 *
 * This in-memory context is the seed for Phase 5 Memory.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LOOP SAFETY
 * ═══════════════════════════════════════════════════════════════════════════
 * MAX_ITERATIONS = taskCount * 2 + 10
 * Prevents infinite loops. In Phase 8, retries will increment the counter
 * but stay within the same formula (retried tasks count double).
 */

import { WorkflowEngine, WorkflowStatus, createSuccessResult, createFailureResult, ErrorCode } from '../agent/workflow/index.js';
import { loadPlanIntoEngine } from '../agent/planner/index.js';
import { createHandlerRegistry } from './taskHandlers.js';
import { createPlanner } from '../agent/planner/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Safety multiplier on top of task count to bound the orchestration loop. */
export const LOOP_SAFETY_MULTIPLIER = 2;

/** Fixed padding added to the loop cap (headroom for edge cases). */
export const LOOP_SAFETY_PADDING    = 10;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT ERROR
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// LOGGER (lightweight — replaceable with a real logger in Phase 5+)
// ─────────────────────────────────────────────────────────────────────────────

function log(message, data = null) {
  if (data !== null) {
    console.log(`[AGENT] ${message}`, data);
  } else {
    console.log(`[AGENT] ${message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT CLASS
// ─────────────────────────────────────────────────────────────────────────────

class Agent {
  #planner;
  #handlers;
  #projectId;

  /**
   * @param {object} planner   - A Planner instance (from createPlanner()).
   * @param {object} handlers  - A HandlerRegistry instance.
   * @param {string} projectId - The project ID to associate workflows with.
   */
  constructor(planner, handlers, projectId) {
    this.#planner   = planner;
    this.#handlers  = handlers;
    this.#projectId = projectId;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

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

    // ── Step 1: Validate goal (fast path — before hitting the planner) ─────
    if (typeof goal !== 'string' || goal.trim().length === 0) {
      return this.#failure(null, WorkflowStatus.FAILED, {
        code: AgentErrorCode.INVALID_GOAL,
        message: 'Goal must be a non-empty string.',
      }, {});
    }

    // ── Step 2: Plan ──────────────────────────────────────────────────────
    log('Planning workflow');
    const planResult = await this.#planner.plan(goal);
    if (!planResult.success) {
      log('Planning failed', planResult.error);
      return this.#failure(null, WorkflowStatus.FAILED, {
        code: AgentErrorCode.PLANNING_FAILED,
        message: planResult.error.message,
        details: planResult.error,
      }, {});
    }

    const { plan } = planResult;
    log(`Plan created — ${plan.tasks.length} tasks`);

    // ── Step 3: Create Workflow Engine ────────────────────────────────────
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

    // ── Step 4: Load plan into engine ─────────────────────────────────────
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

    // ── Step 5: Execution context ─────────────────────────────────────────
    /** @type {{ workflowId: string, goal: string, projectId: string, outputs: object, startedAt: Date }} */
    const executionContext = {
      workflowId,
      goal: plan.goal,
      projectId: this.#projectId,
      outputs: {},       // keyed by taskId — grows as tasks complete
      startedAt: new Date(),
    };

    // ── Step 6: Orchestration loop ────────────────────────────────────────
    const maxIterations = plan.tasks.length * LOOP_SAFETY_MULTIPLIER + LOOP_SAFETY_PADDING;
    let iterations = 0;

    while (true) {
      iterations++;

      // Loop guard — prevents infinite loops
      if (iterations > maxIterations) {
        log('Loop guard exceeded', { iterations, maxIterations });
        return this.#failure(workflowId, engine.getWorkflowStatus(), {
          code: AgentErrorCode.LOOP_GUARD_EXCEEDED,
          message: `Orchestration loop exceeded max iterations (${maxIterations}). This is a bug.`,
          details: { iterations, maxIterations },
        }, executionContext.outputs);
      }

      // ── a. Get next ready task ─────────────────────────────────────────
      //   THE ENGINE OWNS DEPENDENCY RESOLUTION. We just ask.
      const task = engine.getNextTask();

      // ── b. No task ready — determine why ──────────────────────────────
      if (!task) {
        if (engine.isWorkflowComplete()) {
          log('Workflow completed', { workflowId });
          return this.#success(workflowId, executionContext.outputs);
        }
        if (engine.isWorkflowFailed()) {
          log('Workflow failed', { workflowId });
          return this.#failure(workflowId, WorkflowStatus.FAILED, {
            code: AgentErrorCode.TASK_EXECUTION_FAILED,
            message: 'Workflow failed — one or more tasks encountered a permanent error.',
          }, executionContext.outputs);
        }
        // Stall: workflow is RUNNING but no task is ready and none is running.
        // (This should not happen with a valid plan, but guards against edge cases.)
        log('Workflow stalled — no ready task', { workflowId });
        return this.#failure(workflowId, engine.getWorkflowStatus(), {
          code: AgentErrorCode.WORKFLOW_STALLED,
          message: 'Workflow stalled — no tasks are ready but the workflow is not complete.',
          details: { workflowStatus: engine.getWorkflowStatus() },
        }, executionContext.outputs);
      }

      // ── c. Start the task ──────────────────────────────────────────────
      log(`Executing task: ${task.id}`, { type: task.type, title: task.title });

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

      // ── d. Delegate to handler ─────────────────────────────────────────
      const handlerResult = await this.#handlers.execute(task, executionContext);

      if (handlerResult.success) {
        // ── e. Task succeeded ────────────────────────────────────────────
        log(`Task completed: ${task.id}`);

        // Store output in execution context (Phase 5 Memory will persist this)
        executionContext.outputs[task.id] = handlerResult.output;

        // Update the engine with the success result.
        // TaskOutputSchema requires { data: unknown, metadata?: object } — wrap the handler's
        // raw output in the { data } envelope so createSuccessResult() passes validation.
        const successResult = createSuccessResult({ data: handlerResult.output });
        engine.completeTask(task.id, successResult);

      } else {
        // ── f. Task failed ────────────────────────────────────────────────
        log(`Task failed: ${task.id}`, handlerResult.error);

        // Phase 4: All failures are permanent (no retry — that's Phase 8).
        const failureResult = createFailureResult({
          code: handlerResult.error?.code ?? ErrorCode.EXECUTION_ERROR,
          message: handlerResult.error?.message ?? 'Task execution failed.',
          details: handlerResult.error?.details,
        });

        engine.failTask(task.id, failureResult);

        // After failing, check if the workflow is terminal
        if (engine.isWorkflowFailed()) {
          log('Workflow failed', { workflowId, failedTaskId: task.id });
          return this.#failure(workflowId, WorkflowStatus.FAILED, {
            code: AgentErrorCode.TASK_EXECUTION_FAILED,
            message: `Task "${task.id}" failed: ${handlerResult.error?.message}`,
            taskId: task.id,
            details: handlerResult.error,
          }, executionContext.outputs);
        }
        // If somehow the workflow is still running (no dependents blocked),
        // continue the loop to pick up remaining tasks.
      }

      // ── g. Check terminal states ───────────────────────────────────────
      if (engine.isWorkflowComplete()) {
        log('Workflow completed', { workflowId });
        return this.#success(workflowId, executionContext.outputs);
      }
      if (engine.isWorkflowFailed()) {
        log('Workflow failed', { workflowId });
        return this.#failure(workflowId, WorkflowStatus.FAILED, {
          code: AgentErrorCode.TASK_EXECUTION_FAILED,
          message: 'Workflow failed after task execution.',
        }, executionContext.outputs);
      }

      // Otherwise: continue loop — engine will surface the next ready task.
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Build a success result envelope.
   * @private
   */
  #success(workflowId, outputs) {
    return {
      success: true,
      workflowId,
      status: WorkflowStatus.COMPLETED,
      outputs,
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

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an Agent instance.
 *
 * @param {object} options
 * @param {string}  options.projectId    - Project ID for workflow association.
 * @param {object} [options.planner]     - Planner instance. Defaults to auto-detect.
 * @param {object} [options.handlers]    - HandlerRegistry instance. Defaults to mock registry.
 * @param {string} [options.providerType] - LLM provider type for auto-created planner.
 * @returns {Agent}
 *
 * @example
 * // Production (auto-detects LLM provider from env):
 * const agent = createAgent({ projectId: 'proj-123' });
 *
 * // Tests (full mock injection):
 * const agent = createAgent({
 *   projectId: 'test-proj',
 *   planner: createPlanner({ provider: mockProvider }),
 *   handlers: customRegistry,
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

  const planner  = options.planner  ?? createPlanner({ providerType: options.providerType });
  const handlers = options.handlers ?? createHandlerRegistry();

  return new Agent(planner, handlers, options.projectId.trim());
}
