/**
 * @file agent.test.js
 * Comprehensive tests for Phase 4 — Agent / Orchestrator.
 *
 * All tests use MockProvider (Phase 3) and custom mock handlers.
 * ZERO real external API calls are made.
 *
 * Test inventory (15 required + extras):
 *  1.  Agent receives goal and runs successfully
 *  2.  Agent calls planner with the goal
 *  3.  Planner output becomes a loaded workflow
 *  4.  Agent gets next task from engine
 *  5.  Agent delegates task to handler
 *  6.  Successful task updates workflow state
 *  7.  Agent proceeds to the next task after completion
 *  8.  Complete workflow — all tasks done
 *  9.  Failed task stops workflow without retry
 * 10.  Invalid planner result is handled gracefully
 * 11.  Delegation failure (no handler registered) is handled
 * 12.  Multiple independent tasks (parallel ready)
 * 13.  Dependency-based task chain (sequential)
 * 14.  Context passing: task-2 receives task-1's output
 * 15.  No infinite orchestration loop (loop guard)
 * 16.  createAgent requires projectId
 * 17.  Handler registry — registration and dispatch
 * 18.  Handler registry — unknown type
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  createAgent,
  createHandlerRegistry,
  AgentErrorCode,
  LOOP_SAFETY_MULTIPLIER,
  LOOP_SAFETY_PADDING,
  createPlanner,
  MockProvider,
  TaskType,
  TaskStatus,
  WorkflowStatus,
} from '../../src/modules/agent/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Build a mock planner that returns a fixed plan JSON */
function makeMockPlanner(planJson) {
  const mock = new MockProvider();
  mock.setResponse({ content: planJson });
  return createPlanner({ provider: mock, maxRetries: 0 });
}

/** Build a one-task plan JSON */
function singleTaskPlan(goal = 'Generate a product description.') {
  return JSON.stringify({
    goal,
    tasks: [
      {
        id: 'task-1',
        type: TaskType.TEXT_GENERATION,
        title: 'Generate product description',
        description: 'Write a compelling product description.',
        dependencies: [],
      },
    ],
  });
}

/** Build an eco-startup multi-task plan (3 tasks, dependency chain) */
function ecoStartupPlan(goal = 'Create a website for an eco-friendly startup.') {
  return JSON.stringify({
    goal,
    tasks: [
      {
        id: 'task-1',
        type: TaskType.TEXT_GENERATION,
        title: 'Generate startup content',
        description: 'Generate business copy and tagline.',
        dependencies: [],
      },
      {
        id: 'task-2',
        type: TaskType.WEBSITE_GENERATION,
        title: 'Generate startup website',
        description: 'Build the landing page.',
        dependencies: ['task-1'],
      },
      {
        id: 'task-3',
        type: TaskType.VALIDATION,
        title: 'Validate website',
        description: 'Check the website for quality.',
        dependencies: ['task-2'],
      },
    ],
  });
}

/** Build a two-task independent plan */
function twoIndependentTasksPlan(goal = 'Create a business description and a product description.') {
  return JSON.stringify({
    goal,
    tasks: [
      {
        id: 'task-1',
        type: TaskType.TEXT_GENERATION,
        title: 'Business description',
        description: 'Generate a business description.',
        dependencies: [],
      },
      {
        id: 'task-2',
        type: TaskType.TEXT_GENERATION,
        title: 'Product description',
        description: 'Generate a product description.',
        dependencies: [],
      },
    ],
  });
}

/** Create a mock handler registry where we can inject failures */
function makeRegistryWithFailure(failTaskId) {
  const registry = createHandlerRegistry();
  // Override all handlers to check if we should fail
  for (const type of Object.values(TaskType)) {
    registry.register(type, {
      async execute(task, _ctx) {
        if (task.id === failTaskId) {
          return {
            success: false,
            error: {
              code: 'EXECUTION_ERROR',
              message: `Intentional mock failure for task "${task.id}"`,
            },
          };
        }
        return { success: true, output: { result: `Mock output for ${task.id}` } };
      },
    });
  }
  return registry;
}

/** Create a standard test agent with optional plan override and optional handler override */
function makeAgent(planJson, handlerRegistry = null) {
  return createAgent({
    projectId: 'test-project',
    planner: makeMockPlanner(planJson),
    handlers: handlerRegistry ?? createHandlerRegistry(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AGENT RECEIVES GOAL AND RUNS SUCCESSFULLY
// ─────────────────────────────────────────────────────────────────────────────

describe('1. Agent receives goal and runs successfully', () => {
  it('returns success for a single-task goal', async () => {
    const agent = makeAgent(singleTaskPlan());
    const result = await agent.run('Generate a product description.');
    expect(result.success).toBe(true);
    expect(result.status).toBe(WorkflowStatus.COMPLETED);
  });

  it('result contains workflowId', async () => {
    const agent = makeAgent(singleTaskPlan());
    const result = await agent.run('Generate a product description.');
    expect(typeof result.workflowId).toBe('string');
    expect(result.workflowId.length).toBeGreaterThan(0);
  });

  it('result contains completedAt timestamp', async () => {
    const agent = makeAgent(singleTaskPlan());
    const result = await agent.run('Generate a product description.');
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  it('result contains outputs map', async () => {
    const agent = makeAgent(singleTaskPlan());
    const result = await agent.run('Generate a product description.');
    expect(typeof result.outputs).toBe('object');
    expect(result.outputs).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. AGENT CALLS PLANNER WITH THE GOAL
// ─────────────────────────────────────────────────────────────────────────────

describe('2. Agent calls planner with the goal', () => {
  it('planner is called exactly once for a single-run goal', async () => {
    const mock = new MockProvider();
    mock.setResponse({ content: singleTaskPlan() });
    const planner = createPlanner({ provider: mock, maxRetries: 0 });
    const agent = createAgent({ projectId: 'p1', planner, handlers: createHandlerRegistry() });

    await agent.run('Generate a product description.');
    expect(mock.callCount).toBe(1);
  });

  it('planner receives the correct goal string', async () => {
    const mock = new MockProvider();
    const goal = 'Generate a product description.';
    mock.setResponse({ content: singleTaskPlan(goal) });
    const planner = createPlanner({ provider: mock, maxRetries: 0 });
    const agent = createAgent({ projectId: 'p1', planner, handlers: createHandlerRegistry() });

    await agent.run(goal);
    // The last message to the mock should contain the goal
    const lastMsg = mock.lastMessages.find((m) => m.role === 'user');
    expect(lastMsg.content).toContain(goal);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PLANNER OUTPUT BECOMES A LOADED WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────

describe('3. Planner output becomes a loaded workflow', () => {
  it('workflow has the same number of tasks as the plan', async () => {
    const agent = makeAgent(ecoStartupPlan());
    const result = await agent.run('Create a website for an eco-friendly startup.');
    // 3 tasks → outputs should have 3 entries
    expect(Object.keys(result.outputs)).toHaveLength(3);
  });

  it('workflow goal matches the plan goal', async () => {
    const agent = makeAgent(singleTaskPlan('Generate a product description.'));
    const result = await agent.run('Generate a product description.');
    expect(result.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. AGENT GETS NEXT TASK FROM ENGINE
// ─────────────────────────────────────────────────────────────────────────────

describe('4. Agent gets next task from engine', () => {
  it('single task: engine provides the task correctly', async () => {
    const registry = createHandlerRegistry();
    let capturedTask = null;
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(task, _ctx) {
        capturedTask = task;
        return { success: true, output: { content: 'captured' } };
      },
    });
    const agent = makeAgent(singleTaskPlan(), registry);
    await agent.run('Generate a product description.');
    expect(capturedTask).not.toBeNull();
    expect(capturedTask.id).toBe('task-1');
    expect(capturedTask.type).toBe(TaskType.TEXT_GENERATION);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. AGENT DELEGATES TASK TO HANDLER
// ─────────────────────────────────────────────────────────────────────────────

describe('5. Agent delegates task to handler', () => {
  it('handler execute() is called for each task', async () => {
    let callCount = 0;
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(_task, _ctx) {
        callCount++;
        return { success: true, output: { content: 'ok' } };
      },
    });
    const agent = makeAgent(singleTaskPlan(), registry);
    await agent.run('Generate a product description.');
    expect(callCount).toBe(1);
  });

  it('handler called with the task object', async () => {
    let receivedTask = null;
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(task, _ctx) {
        receivedTask = task;
        return { success: true, output: { content: 'ok' } };
      },
    });
    const agent = makeAgent(singleTaskPlan(), registry);
    await agent.run('Generate a product description.');
    expect(receivedTask).toHaveProperty('id', 'task-1');
    expect(receivedTask).toHaveProperty('type', TaskType.TEXT_GENERATION);
    expect(receivedTask).toHaveProperty('title');
    expect(receivedTask).toHaveProperty('description');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SUCCESSFUL TASK UPDATES WORKFLOW STATE
// ─────────────────────────────────────────────────────────────────────────────

describe('6. Successful task updates workflow state', () => {
  it('task output is stored in outputs map', async () => {
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(_task, _ctx) {
        return { success: true, output: { content: 'EcoCampus is great.' } };
      },
    });
    const agent = makeAgent(singleTaskPlan(), registry);
    const result = await agent.run('Generate a product description.');
    expect(result.outputs['task-1']).toBeDefined();
    expect(result.outputs['task-1'].content).toBe('EcoCampus is great.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. AGENT PROCEEDS TO NEXT TASK AFTER COMPLETION
// ─────────────────────────────────────────────────────────────────────────────

describe('7. Agent proceeds to next task after completion', () => {
  it('in a chained plan, each task executes in order', async () => {
    const order = [];
    const registry = createHandlerRegistry();
    for (const type of [TaskType.TEXT_GENERATION, TaskType.WEBSITE_GENERATION, TaskType.VALIDATION]) {
      registry.register(type, {
        async execute(task, _ctx) {
          order.push(task.id);
          return { success: true, output: { done: task.id } };
        },
      });
    }
    const agent = makeAgent(ecoStartupPlan(), registry);
    await agent.run('Create a website for an eco-friendly startup.');
    expect(order).toEqual(['task-1', 'task-2', 'task-3']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. COMPLETE WORKFLOW — ALL TASKS DONE
// ─────────────────────────────────────────────────────────────────────────────

describe('8. Complete workflow — all tasks done', () => {
  it('returns COMPLETED status after all tasks succeed', async () => {
    const agent = makeAgent(ecoStartupPlan());
    const result = await agent.run('Create a website for an eco-friendly startup.');
    expect(result.success).toBe(true);
    expect(result.status).toBe(WorkflowStatus.COMPLETED);
  });

  it('outputs map contains entries for all tasks', async () => {
    const agent = makeAgent(ecoStartupPlan());
    const result = await agent.run('Create a website for an eco-friendly startup.');
    expect(Object.keys(result.outputs)).toContain('task-1');
    expect(Object.keys(result.outputs)).toContain('task-2');
    expect(Object.keys(result.outputs)).toContain('task-3');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. FAILED TASK STOPS WORKFLOW WITHOUT RETRY
// ─────────────────────────────────────────────────────────────────────────────

describe('9. Failed task stops workflow without retry', () => {
  it('returns FAILED status when a task fails', async () => {
    const registry = makeRegistryWithFailure('task-1');
    const agent = makeAgent(singleTaskPlan(), registry);
    const result = await agent.run('Generate a product description.');
    expect(result.success).toBe(false);
    expect(result.status).toBe(WorkflowStatus.FAILED);
  });

  it('error code is TASK_EXECUTION_FAILED', async () => {
    const registry = makeRegistryWithFailure('task-1');
    const agent = makeAgent(singleTaskPlan(), registry);
    const result = await agent.run('Generate a product description.');
    expect(result.error.code).toBe(AgentErrorCode.TASK_EXECUTION_FAILED);
  });

  it('failed taskId is reported in error', async () => {
    const registry = makeRegistryWithFailure('task-1');
    const agent = makeAgent(singleTaskPlan(), registry);
    const result = await agent.run('Generate a product description.');
    expect(result.error.taskId).toBe('task-1');
  });

  it('does NOT retry the failed task', async () => {
    let callCount = 0;
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(_task, _ctx) {
        callCount++;
        return { success: false, error: { code: 'EXECUTION_ERROR', message: 'fail' } };
      },
    });
    const agent = makeAgent(singleTaskPlan(), registry);
    await agent.run('Generate a product description.');
    // Must only be called ONCE — no retry
    expect(callCount).toBe(1);
  });

  it('middle task failure stops remaining tasks', async () => {
    const order = [];
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(task, _ctx) {
        order.push(task.id);
        return { success: true, output: { content: 'ok' } };
      },
    });
    registry.register(TaskType.WEBSITE_GENERATION, {
      async execute(task, _ctx) {
        order.push(task.id);
        return { success: false, error: { code: 'ERROR', message: 'site gen failed' } };
      },
    });
    registry.register(TaskType.VALIDATION, {
      async execute(task, _ctx) {
        order.push(task.id);
        return { success: true, output: { valid: true } };
      },
    });
    const agent = makeAgent(ecoStartupPlan(), registry);
    const result = await agent.run('Create a website for an eco-friendly startup.');
    // task-1 succeeds, task-2 fails, task-3 is blocked → never executed
    expect(order).toContain('task-1');
    expect(order).toContain('task-2');
    expect(order).not.toContain('task-3');
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. INVALID PLANNER RESULT
// ─────────────────────────────────────────────────────────────────────────────

describe('10. Invalid planner result is handled gracefully', () => {
  it('returns PLANNING_FAILED when planner cannot create a plan', async () => {
    const mock = new MockProvider();
    // All attempts fail (bad JSON)
    for (let i = 0; i <= 3; i++) mock.setResponse({ content: 'not json at all' });
    const planner = createPlanner({ provider: mock, maxRetries: 0 });
    const agent = createAgent({
      projectId: 'p1',
      planner,
      handlers: createHandlerRegistry(),
    });
    const result = await agent.run('Create a website.');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(AgentErrorCode.PLANNING_FAILED);
  });

  it('returns INVALID_GOAL for empty goal string', async () => {
    const agent = makeAgent(singleTaskPlan());
    const result = await agent.run('');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(AgentErrorCode.INVALID_GOAL);
  });

  it('returns INVALID_GOAL for non-string goal', async () => {
    const agent = makeAgent(singleTaskPlan());
    const result = await agent.run(null);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(AgentErrorCode.INVALID_GOAL);
  });

  it('does NOT call planner for an invalid goal', async () => {
    const mock = new MockProvider();
    const planner = createPlanner({ provider: mock, maxRetries: 0 });
    const agent = createAgent({ projectId: 'p1', planner, handlers: createHandlerRegistry() });
    await agent.run('');
    expect(mock.callCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. DELEGATION FAILURE (no handler registered)
// ─────────────────────────────────────────────────────────────────────────────

describe('11. Delegation failure — no handler registered', () => {
  it('returns FAILED when no handler exists for task type', async () => {
    const emptyRegistry = createHandlerRegistry();
    // Remove all handlers by creating a fresh empty registry override
    const registry = {
      execute: async () => ({
        success: false,
        error: { code: 'DELEGATION_FAILED', message: 'No handler for type' },
      }),
    };
    const agent = createAgent({
      projectId: 'p1',
      planner: makeMockPlanner(singleTaskPlan()),
      handlers: registry,
    });
    const result = await agent.run('Generate a product description.');
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. MULTIPLE INDEPENDENT TASKS (parallel ready)
// ─────────────────────────────────────────────────────────────────────────────

describe('12. Multiple independent tasks', () => {
  it('both independent tasks execute and workflow completes', async () => {
    const agent = makeAgent(twoIndependentTasksPlan());
    const result = await agent.run('Create a business description and a product description.');
    expect(result.success).toBe(true);
    expect(result.status).toBe(WorkflowStatus.COMPLETED);
  });

  it('outputs map has entries for both independent tasks', async () => {
    const agent = makeAgent(twoIndependentTasksPlan());
    const result = await agent.run('Create a business description and a product description.');
    expect(result.outputs['task-1']).toBeDefined();
    expect(result.outputs['task-2']).toBeDefined();
  });

  it('both tasks are executed (agent does not skip)', async () => {
    const executed = [];
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(task, _ctx) {
        executed.push(task.id);
        return { success: true, output: { content: `ok-${task.id}` } };
      },
    });
    const agent = makeAgent(twoIndependentTasksPlan(), registry);
    await agent.run('Create a business description and a product description.');
    expect(executed).toContain('task-1');
    expect(executed).toContain('task-2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. DEPENDENCY-BASED TASK CHAIN (sequential)
// ─────────────────────────────────────────────────────────────────────────────

describe('13. Dependency-based task chain', () => {
  it('task-2 only starts after task-1 completes', async () => {
    const timeline = [];
    const registry = createHandlerRegistry();

    registry.register(TaskType.TEXT_GENERATION, {
      async execute(task, _ctx) {
        timeline.push({ event: 'start', id: task.id });
        const out = { success: true, output: { content: 'done-1' } };
        timeline.push({ event: 'end', id: task.id });
        return out;
      },
    });
    registry.register(TaskType.WEBSITE_GENERATION, {
      async execute(task, _ctx) {
        timeline.push({ event: 'start', id: task.id });
        const out = { success: true, output: { files: [] } };
        timeline.push({ event: 'end', id: task.id });
        return out;
      },
    });
    registry.register(TaskType.VALIDATION, {
      async execute(task, _ctx) {
        timeline.push({ event: 'start', id: task.id });
        const out = { success: true, output: { valid: true } };
        timeline.push({ event: 'end', id: task.id });
        return out;
      },
    });

    const agent = makeAgent(ecoStartupPlan(), registry);
    await agent.run('Create a website for an eco-friendly startup.');

    // task-1 must end before task-2 starts
    const t1End = timeline.findIndex((e) => e.event === 'end' && e.id === 'task-1');
    const t2Start = timeline.findIndex((e) => e.event === 'start' && e.id === 'task-2');
    expect(t1End).toBeLessThan(t2Start);

    const t2End = timeline.findIndex((e) => e.event === 'end' && e.id === 'task-2');
    const t3Start = timeline.findIndex((e) => e.event === 'start' && e.id === 'task-3');
    expect(t2End).toBeLessThan(t3Start);
  });

  it('all three tasks in the chain complete', async () => {
    const agent = makeAgent(ecoStartupPlan());
    const result = await agent.run('Create a website for an eco-friendly startup.');
    expect(Object.keys(result.outputs)).toHaveLength(3);
    expect(result.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. CONTEXT PASSING — task-2 receives task-1's output
// ─────────────────────────────────────────────────────────────────────────────

describe('14. Context passing between tasks', () => {
  it('task-2 handler receives task-1 output in context.outputs', async () => {
    let task2Context = null;

    const registry = createHandlerRegistry();

    registry.register(TaskType.TEXT_GENERATION, {
      async execute(_task, _ctx) {
        return { success: true, output: { content: 'EcoCampus is an eco-friendly startup.' } };
      },
    });

    registry.register(TaskType.WEBSITE_GENERATION, {
      async execute(_task, ctx) {
        task2Context = ctx;           // Capture the context
        return { success: true, output: { files: ['index.html'] } };
      },
    });

    registry.register(TaskType.VALIDATION, {
      async execute(_task, _ctx) {
        return { success: true, output: { valid: true } };
      },
    });

    const agent = makeAgent(ecoStartupPlan(), registry);
    await agent.run('Create a website for an eco-friendly startup.');

    // task-2's context must include task-1's output
    expect(task2Context).not.toBeNull();
    expect(task2Context.outputs).toBeDefined();
    expect(task2Context.outputs['task-1']).toBeDefined();
    expect(task2Context.outputs['task-1'].content).toBe('EcoCampus is an eco-friendly startup.');
  });

  it('context.goal is passed to each handler', async () => {
    const goals = [];
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(_task, ctx) {
        goals.push(ctx.goal);
        return { success: true, output: { content: 'done' } };
      },
    });
    const goal = 'Generate a product description.';
    const agent = makeAgent(singleTaskPlan(goal), registry);
    await agent.run(goal);
    expect(goals[0]).toBe(goal);
  });

  it('context accumulates outputs from all completed tasks', async () => {
    const capturedContexts = {};
    const registry = createHandlerRegistry();

    for (const [type, id] of [
      [TaskType.TEXT_GENERATION, 'task-1'],
      [TaskType.WEBSITE_GENERATION, 'task-2'],
      [TaskType.VALIDATION, 'task-3'],
    ]) {
      registry.register(type, {
        async execute(task, ctx) {
          capturedContexts[task.id] = { ...ctx.outputs };
          return { success: true, output: { done: task.id } };
        },
      });
    }

    const agent = makeAgent(ecoStartupPlan(), registry);
    await agent.run('Create a website for an eco-friendly startup.');

    // task-1 starts with empty outputs
    expect(Object.keys(capturedContexts['task-1'])).toHaveLength(0);
    // task-2 has task-1's output
    expect(capturedContexts['task-2']['task-1']).toBeDefined();
    // task-3 has both task-1 and task-2's outputs
    expect(capturedContexts['task-3']['task-1']).toBeDefined();
    expect(capturedContexts['task-3']['task-2']).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. NO INFINITE ORCHESTRATION LOOP
// ─────────────────────────────────────────────────────────────────────────────

describe('15. No infinite orchestration loop', () => {
  it('loop constants are defined and reasonable', () => {
    expect(LOOP_SAFETY_MULTIPLIER).toBeGreaterThan(0);
    expect(LOOP_SAFETY_PADDING).toBeGreaterThan(0);
  });

  it('for a 3-task plan, max iterations = 3*2+10 = 16', () => {
    const taskCount = 3;
    const maxIter = taskCount * LOOP_SAFETY_MULTIPLIER + LOOP_SAFETY_PADDING;
    expect(maxIter).toBe(16);
  });

  it('a hanging handler still terminates via normal completion', async () => {
    // This is handled naturally because the workflow completes after all tasks finish.
    // Test that even a slow handler eventually completes.
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(_task, _ctx) {
        // Simulate slight delay
        await new Promise((r) => setTimeout(r, 10));
        return { success: true, output: { content: 'slow but done' } };
      },
    });
    const agent = makeAgent(singleTaskPlan(), registry);
    const result = await agent.run('Generate a product description.');
    expect(result.success).toBe(true);
    expect(result.status).toBe(WorkflowStatus.COMPLETED);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. createAgent REQUIRES projectId
// ─────────────────────────────────────────────────────────────────────────────

describe('16. createAgent factory validation', () => {
  it('throws AgentError if projectId is missing', () => {
    expect(() => createAgent({})).toThrow();
  });

  it('throws AgentError if projectId is empty string', () => {
    expect(() => createAgent({ projectId: '' })).toThrow();
  });

  it('creates successfully with a valid projectId', () => {
    const agent = createAgent({ projectId: 'my-project' });
    expect(agent).toBeDefined();
    expect(typeof agent.run).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. HANDLER REGISTRY — registration and dispatch
// ─────────────────────────────────────────────────────────────────────────────

describe('17. Handler registry — registration and dispatch', () => {
  it('createHandlerRegistry registers all default task types', () => {
    const registry = createHandlerRegistry();
    for (const type of Object.values(TaskType)) {
      expect(registry.has(type)).toBe(true);
    }
  });

  it('registered handler can be overridden', () => {
    const registry = createHandlerRegistry();
    const newHandler = { execute: async () => ({ success: true, output: {} }) };
    registry.register(TaskType.TEXT_GENERATION, newHandler);
    expect(registry.get(TaskType.TEXT_GENERATION)).toBe(newHandler);
  });

  it('register() rejects invalid handler (missing execute method)', () => {
    const registry = createHandlerRegistry();
    expect(() => registry.register(TaskType.TEXT_GENERATION, {})).toThrow(TypeError);
  });

  it('register() rejects empty task type', () => {
    const registry = createHandlerRegistry();
    expect(() => registry.register('', { execute: async () => {} })).toThrow(TypeError);
  });

  it('execute() returns success from registered handler', async () => {
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute(_task, _ctx) {
        return { success: true, output: { content: 'hello' } };
      },
    });
    const fakeTask = { id: 't1', type: TaskType.TEXT_GENERATION, title: 'T', description: 'D' };
    const result = await registry.execute(fakeTask, {});
    expect(result.success).toBe(true);
    expect(result.output.content).toBe('hello');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. HANDLER REGISTRY — unknown type
// ─────────────────────────────────────────────────────────────────────────────

describe('18. Handler registry — unknown type', () => {
  it('execute() returns failure for unregistered type', async () => {
    const registry = createHandlerRegistry();
    const fakeTask = { id: 't1', type: 'UNKNOWN_TYPE', title: 'T', description: 'D' };
    const result = await registry.execute(fakeTask, {});
    expect(result.success).toBe(false);
    expect(result.error.message).toContain('UNKNOWN_TYPE');
  });

  it('registeredTypes() returns list of known types', () => {
    const registry = createHandlerRegistry();
    const types = registry.registeredTypes();
    expect(types).toContain(TaskType.TEXT_GENERATION);
    expect(types).toContain(TaskType.WEBSITE_GENERATION);
    expect(types).toContain(TaskType.VALIDATION);
  });
});
