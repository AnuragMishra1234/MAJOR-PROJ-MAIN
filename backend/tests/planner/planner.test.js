/**
 * @file planner.test.js
 * Comprehensive tests for Phase 3 — AI Planner.
 *
 * All tests use MockProvider — NO real API calls are made.
 * The mock is injected via createPlanner({ provider: mock }).
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createPlanner,
  loadPlanIntoEngine,
  MockProvider,
  ProviderError,
  PlannerErrorCode,
  MAX_PLANNER_RETRIES,
  normalisePlan,
  validatePlan,
  buildSystemPrompt,
  buildPlanningMessages,
  buildCorrectionMessages,
} from '../../src/modules/agent/planner/index.js';
import { WorkflowEngine, TaskType, TaskStatus, WorkflowStatus } from '../../src/modules/agent/workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Make a valid single-task plan JSON string for the mock to return */
function singleTaskPlan(goal = 'Generate a product description.') {
  return JSON.stringify({
    goal,
    tasks: [
      {
        id: 'task-1',
        type: TaskType.TEXT_GENERATION,
        title: 'Generate product description',
        description: 'Write a compelling product description for the given product.',
        dependencies: [],
      },
    ],
  });
}

/** Make a valid multi-task plan for eco-startup website */
function ecoStartupPlan() {
  return JSON.stringify({
    goal: 'Create a website for an eco-friendly startup.',
    tasks: [
      {
        id: 'task-1',
        type: TaskType.TEXT_GENERATION,
        title: 'Generate startup content',
        description: 'Generate business copy, tagline and about section for the eco-friendly startup.',
        dependencies: [],
      },
      {
        id: 'task-2',
        type: TaskType.WEBSITE_GENERATION,
        title: 'Generate startup website',
        description: 'Create a complete landing page using the generated startup content.',
        dependencies: ['task-1'],
      },
      {
        id: 'task-3',
        type: TaskType.VALIDATION,
        title: 'Validate generated website',
        description: 'Review and validate the generated website for quality and correctness.',
        dependencies: ['task-2'],
      },
    ],
  });
}

/** Make a mock + planner for test isolation */
function makePlannerWithMock() {
  const mock = new MockProvider();
  const planner = createPlanner({ provider: mock, maxRetries: MAX_PLANNER_RETRIES });
  return { mock, planner };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SIMPLE SINGLE-TASK GOAL (TEST_GOAL_2 from spec)
// ─────────────────────────────────────────────────────────────────────────────

describe('1. Simple single-task goal', () => {
  it('returns success with a single TEXT_GENERATION task', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: singleTaskPlan() });

    const result = await planner.plan('Generate a product description.');

    expect(result.success).toBe(true);
    expect(result.plan.tasks).toHaveLength(1);
    expect(result.plan.tasks[0].type).toBe(TaskType.TEXT_GENERATION);
    expect(result.plan.tasks[0].id).toBe('task-1');
  });

  it('plan goal matches the user goal', async () => {
    const { mock, planner } = makePlannerWithMock();
    const goal = 'Generate a product description.';
    mock.setResponse({ content: singleTaskPlan(goal) });

    const result = await planner.plan(goal);
    expect(result.plan.goal).toBe(goal);
  });

  it('task has all required fields', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: singleTaskPlan() });

    const result = await planner.plan('Generate a product description.');
    const task = result.plan.tasks[0];

    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('type');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('description');
    expect(task).toHaveProperty('dependencies');
    expect(Array.isArray(task.dependencies)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. MULTI-TASK GOAL WITH DEPENDENCIES
// ─────────────────────────────────────────────────────────────────────────────

describe('2. Multi-task goal with dependencies', () => {
  it('returns all tasks with correct dependency chain', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: ecoStartupPlan() });

    const result = await planner.plan('Create a website for an eco-friendly startup.');

    expect(result.success).toBe(true);
    expect(result.plan.tasks).toHaveLength(3);

    const t1 = result.plan.tasks[0];
    const t2 = result.plan.tasks[1];
    const t3 = result.plan.tasks[2];

    expect(t1.dependencies).toEqual([]);
    expect(t2.dependencies).toContain('task-1');
    expect(t3.dependencies).toContain('task-2');
  });

  it('dependency chain: TEXT_GENERATION → WEBSITE_GENERATION → VALIDATION', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: ecoStartupPlan() });

    const result = await planner.plan('Create a website for an eco-friendly startup.');
    const types = result.plan.tasks.map((t) => t.type);

    expect(types).toContain(TaskType.TEXT_GENERATION);
    expect(types).toContain(TaskType.WEBSITE_GENERATION);
    expect(types).toContain(TaskType.VALIDATION);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. WEBSITE GENERATION GOAL (TEST_GOAL_1 from spec)
// ─────────────────────────────────────────────────────────────────────────────

describe('3. Website generation goal', () => {
  it('plan includes a WEBSITE_GENERATION task', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: ecoStartupPlan() });

    const result = await planner.plan('Create a website for an eco-friendly startup.');
    const hasWebsite = result.plan.tasks.some((t) => t.type === TaskType.WEBSITE_GENERATION);
    expect(hasWebsite).toBe(true);
  });

  it('website task depends on content generation task', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: ecoStartupPlan() });

    const result = await planner.plan('Create a website for an eco-friendly startup.');
    const websiteTask = result.plan.tasks.find((t) => t.type === TaskType.WEBSITE_GENERATION);
    const contentTaskId = result.plan.tasks.find((t) => t.type === TaskType.TEXT_GENERATION)?.id;

    expect(websiteTask.dependencies).toContain(contentTaskId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TEXT GENERATION GOAL (TEST_GOAL_2 from spec)
// ─────────────────────────────────────────────────────────────────────────────

describe('4. Text generation goal', () => {
  it('does not add WEBSITE_GENERATION for a pure text goal', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: singleTaskPlan('Generate a product description.') });

    const result = await planner.plan('Generate a product description.');
    const hasWebsite = result.plan.tasks.some((t) => t.type === TaskType.WEBSITE_GENERATION);
    expect(hasWebsite).toBe(false);
  });

  it('produces a TEXT_GENERATION task', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: singleTaskPlan() });

    const result = await planner.plan('Generate a product description.');
    expect(result.plan.tasks[0].type).toBe(TaskType.TEXT_GENERATION);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. DEPENDENCY CHAIN GENERATION
// ─────────────────────────────────────────────────────────────────────────────

describe('5. Dependency chain generation', () => {
  it('validation task depends on website task (TEST_GOAL_3)', async () => {
    const { mock, planner } = makePlannerWithMock();
    const plan = JSON.stringify({
      goal: 'Create a landing page and validate the generated website.',
      tasks: [
        {
          id: 'task-1',
          type: TaskType.WEBSITE_GENERATION,
          title: 'Generate landing page',
          description: 'Generate a full landing page for the startup.',
          dependencies: [],
        },
        {
          id: 'task-2',
          type: TaskType.VALIDATION,
          title: 'Validate generated website',
          description: 'Check the website for quality, accessibility, and correctness.',
          dependencies: ['task-1'],
        },
      ],
    });
    mock.setResponse({ content: plan });

    const result = await planner.plan('Create a landing page and validate the generated website.');
    expect(result.success).toBe(true);

    const validationTask = result.plan.tasks.find((t) => t.type === TaskType.VALIDATION);
    expect(validationTask.dependencies).toContain('task-1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. INDEPENDENT TASKS (no unnecessary chaining)
// ─────────────────────────────────────────────────────────────────────────────

describe('6. Independent tasks (no unnecessary chaining)', () => {
  it('two independent tasks have no cross-dependencies', async () => {
    const { mock, planner } = makePlannerWithMock();
    const plan = JSON.stringify({
      goal: 'Generate a business description and write some code.',
      tasks: [
        {
          id: 'task-1',
          type: TaskType.TEXT_GENERATION,
          title: 'Generate business description',
          description: 'Write an engaging business description.',
          dependencies: [],
        },
        {
          id: 'task-2',
          type: TaskType.CODE_GENERATION,
          title: 'Generate utility code',
          description: 'Write utility scripts for the startup platform.',
          dependencies: [],
        },
      ],
    });
    mock.setResponse({ content: plan });

    const result = await planner.plan('Generate a business description and write some code.');
    expect(result.success).toBe(true);
    expect(result.plan.tasks[0].dependencies).toEqual([]);
    expect(result.plan.tasks[1].dependencies).toEqual([]);
  });

  it('independent tasks are both valid and loadable into engine', async () => {
    const { mock, planner } = makePlannerWithMock();
    const plan = JSON.stringify({
      goal: 'Two independent tasks.',
      tasks: [
        { id: 'task-1', type: TaskType.TEXT_GENERATION, title: 'Task A', description: 'Desc A', dependencies: [] },
        { id: 'task-2', type: TaskType.CODE_GENERATION, title: 'Task B', description: 'Desc B', dependencies: [] },
      ],
    });
    mock.setResponse({ content: plan });

    const result = await planner.plan('Two independent tasks.');
    const engine = WorkflowEngine.create({ projectId: 'proj-test', goal: result.plan.goal });
    const loaded = loadPlanIntoEngine(result.plan, engine);
    expect(loaded.success).toBe(true);
    // Both tasks should be READY immediately (no deps)
    expect(engine.getReadyTasks()).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. INVALID LLM JSON — normalisePlan fallback
// ─────────────────────────────────────────────────────────────────────────────

describe('7. Invalid LLM JSON — normalisePlan', () => {
  it('strips markdown code fences and parses JSON', () => {
    const raw = `\`\`\`json
${singleTaskPlan()}
\`\`\``;
    const result = normalisePlan(raw);
    expect(result.ok).toBe(true);
    expect(result.plan.tasks).toHaveLength(1);
  });

  it('strips backtick fences without "json" label', () => {
    const raw = `\`\`\`\n${singleTaskPlan()}\n\`\`\``;
    const result = normalisePlan(raw);
    expect(result.ok).toBe(true);
  });

  it('returns ok:false for completely unparseable string', () => {
    const result = normalisePlan('This is not JSON at all, sorry about that!');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('JSON');
  });

  it('accepts an already-parsed object', () => {
    const obj = JSON.parse(singleTaskPlan());
    const result = normalisePlan(obj);
    expect(result.ok).toBe(true);
  });

  it('coerces null dependencies to empty array', () => {
    const raw = JSON.stringify({
      goal: 'Test goal',
      tasks: [
        { id: 'task-1', type: TaskType.TEXT_GENERATION, title: 'T', description: 'D', dependencies: null },
      ],
    });
    const result = normalisePlan(raw);
    expect(result.ok).toBe(true);
    expect(result.plan.tasks[0].dependencies).toEqual([]);
  });

  it('auto-assigns task id when missing', () => {
    const raw = JSON.stringify({
      goal: 'Test goal',
      tasks: [
        { type: TaskType.TEXT_GENERATION, title: 'T', description: 'D', dependencies: [] },
      ],
    });
    const result = normalisePlan(raw);
    expect(result.ok).toBe(true);
    expect(result.plan.tasks[0].id).toBe('task-1');
  });

  it('normalises type to UPPERCASE', () => {
    const raw = JSON.stringify({
      goal: 'Test',
      tasks: [
        { id: 'task-1', type: 'text_generation', title: 'T', description: 'D', dependencies: [] },
      ],
    });
    const result = normalisePlan(raw);
    expect(result.ok).toBe(true);
    expect(result.plan.tasks[0].type).toBe('TEXT_GENERATION');
  });

  it('planner retries when LLM returns markdown fences on first attempt and succeeds', async () => {
    const { mock, planner } = makePlannerWithMock();
    // First response: unparseable
    mock.setResponse({ content: 'not json at all' });
    // Second response (retry 1): valid JSON in fences
    mock.setResponse({ content: `\`\`\`json\n${singleTaskPlan()}\n\`\`\`` });

    const result = await planner.plan('Generate a product description.');
    expect(result.success).toBe(true);
    expect(mock.callCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. INVALID TASK TYPE
// ─────────────────────────────────────────────────────────────────────────────

describe('8. Invalid task type in LLM response', () => {
  it('validatePlan rejects unknown task type', () => {
    const plan = {
      goal: 'Test',
      tasks: [
        { id: 'task-1', type: 'MAGIC_TASK', title: 'T', description: 'D', dependencies: [] },
      ],
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('MAGIC_TASK'))).toBe(true);
  });

  it('planner retries on invalid type and succeeds if correction is valid', async () => {
    const { mock, planner } = makePlannerWithMock();
    const badPlan = JSON.stringify({
      goal: 'Test',
      tasks: [{ id: 'task-1', type: 'INVALID_TYPE', title: 'T', description: 'D', dependencies: [] }],
    });
    mock.setResponse({ content: badPlan });
    mock.setResponse({ content: singleTaskPlan('Test') });

    const result = await planner.plan('Test goal');
    expect(result.success).toBe(true);
    expect(mock.callCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. MISSING DEPENDENCY REFERENCE
// ─────────────────────────────────────────────────────────────────────────────

describe('9. Missing dependency reference', () => {
  it('validatePlan rejects a plan where dependency ID does not exist', () => {
    const plan = {
      goal: 'Test',
      tasks: [
        {
          id: 'task-1',
          type: TaskType.WEBSITE_GENERATION,
          title: 'Build site',
          description: 'Generate site',
          dependencies: ['task-999'],  // task-999 does not exist
        },
      ],
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('task-999'))).toBe(true);
  });

  it('normalisePlan passes through, validatePlan catches it', () => {
    const raw = JSON.stringify({
      goal: 'Test',
      tasks: [
        { id: 'task-1', type: TaskType.WEBSITE_GENERATION, title: 'T', description: 'D', dependencies: ['nonexistent'] },
      ],
    });
    const normalised = normalisePlan(raw);
    expect(normalised.ok).toBe(true);

    const validated = validatePlan(normalised.plan);
    expect(validated.valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. DUPLICATE TASK IDs
// ─────────────────────────────────────────────────────────────────────────────

describe('10. Duplicate task IDs', () => {
  it('validatePlan rejects plans with duplicate task IDs', () => {
    const plan = {
      goal: 'Test',
      tasks: [
        { id: 'task-1', type: TaskType.TEXT_GENERATION, title: 'T1', description: 'D1', dependencies: [] },
        { id: 'task-1', type: TaskType.CODE_GENERATION, title: 'T2', description: 'D2', dependencies: [] },
      ],
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('duplicate'))).toBe(true);
  });

  it('planner returns failure on repeated duplicate IDs after all retries', async () => {
    const { mock, planner } = makePlannerWithMock();
    const badPlan = JSON.stringify({
      goal: 'Test',
      tasks: [
        { id: 'task-1', type: TaskType.TEXT_GENERATION, title: 'T1', description: 'D1', dependencies: [] },
        { id: 'task-1', type: TaskType.CODE_GENERATION, title: 'T2', description: 'D2', dependencies: [] },
      ],
    });
    // Queue bad responses for all attempts (1 initial + MAX_PLANNER_RETRIES retries)
    for (let i = 0; i <= MAX_PLANNER_RETRIES; i++) {
      mock.setResponse({ content: badPlan });
    }

    const result = await planner.plan('Test goal');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(PlannerErrorCode.MAX_RETRIES);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. CIRCULAR DEPENDENCY
// ─────────────────────────────────────────────────────────────────────────────

describe('11. Circular dependency', () => {
  it('validatePlan detects A → B → A cycle', () => {
    const plan = {
      goal: 'Test',
      tasks: [
        { id: 'task-a', type: TaskType.TEXT_GENERATION, title: 'A', description: 'DA', dependencies: ['task-b'] },
        { id: 'task-b', type: TaskType.CODE_GENERATION, title: 'B', description: 'DB', dependencies: ['task-a'] },
      ],
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('circular'))).toBe(true);
  });

  it('validatePlan detects 3-node cycle A → B → C → A', () => {
    const plan = {
      goal: 'Test cycle',
      tasks: [
        { id: 'a', type: TaskType.TEXT_GENERATION, title: 'A', description: 'DA', dependencies: ['c'] },
        { id: 'b', type: TaskType.CODE_GENERATION, title: 'B', description: 'DB', dependencies: ['a'] },
        { id: 'c', type: TaskType.VALIDATION, title: 'C', description: 'DC', dependencies: ['b'] },
      ],
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('circular'))).toBe(true);
  });

  it('validatePlan detects self-dependency', () => {
    const plan = {
      goal: 'Test',
      tasks: [
        { id: 'task-1', type: TaskType.OTHER, title: 'T', description: 'D', dependencies: ['task-1'] },
      ],
    };
    const result = validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('itself'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. EMPTY / INVALID GOAL
// ─────────────────────────────────────────────────────────────────────────────

describe('12. Empty or invalid goal', () => {
  it('returns INVALID_GOAL for empty string', async () => {
    const { planner } = makePlannerWithMock();
    const result = await planner.plan('');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(PlannerErrorCode.INVALID_GOAL);
  });

  it('returns INVALID_GOAL for whitespace-only string', async () => {
    const { planner } = makePlannerWithMock();
    const result = await planner.plan('   ');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(PlannerErrorCode.INVALID_GOAL);
  });

  it('returns INVALID_GOAL for non-string input', async () => {
    const { planner } = makePlannerWithMock();
    const result = await planner.plan(null);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(PlannerErrorCode.INVALID_GOAL);
  });

  it('returns INVALID_GOAL for very short goal', async () => {
    const { planner } = makePlannerWithMock();
    const result = await planner.plan('hi');   // too short
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(PlannerErrorCode.INVALID_GOAL);
  });

  it('does NOT call the LLM when goal is invalid (no API calls wasted)', async () => {
    const { mock, planner } = makePlannerWithMock();
    await planner.plan('');
    expect(mock.callCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. PLANNER RETRY LIMIT
// ─────────────────────────────────────────────────────────────────────────────

describe('13. Planner retry limit', () => {
  it(`exhausts exactly ${MAX_PLANNER_RETRIES + 1} attempts before failing`, async () => {
    const { mock, planner } = makePlannerWithMock();
    const totalAttempts = MAX_PLANNER_RETRIES + 1;
    for (let i = 0; i < totalAttempts; i++) {
      mock.setResponse({ content: 'not json' });
    }

    const result = await planner.plan('Create a website.');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(PlannerErrorCode.MAX_RETRIES);
    expect(mock.callCount).toBe(totalAttempts);
  });

  it('succeeds on the last retry attempt', async () => {
    const { mock, planner } = makePlannerWithMock();
    // First MAX_PLANNER_RETRIES calls fail, last one succeeds
    for (let i = 0; i < MAX_PLANNER_RETRIES; i++) {
      mock.setResponse({ content: 'invalid json' });
    }
    mock.setResponse({ content: singleTaskPlan('Create a website.') });

    const result = await planner.plan('Create a website.');
    expect(result.success).toBe(true);
    expect(mock.callCount).toBe(MAX_PLANNER_RETRIES + 1);
  });

  it('correction messages include previous errors', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: 'invalid json' });
    mock.setResponse({ content: singleTaskPlan() });

    await planner.plan('Generate a product description.');
    // The second call's messages should contain the correction context
    const correctionMessages = mock.lastMessages;
    const hasCorrection = correctionMessages.some(
      (m) => m.role === 'user' && m.content.includes('VALIDATION ERRORS'),
    );
    expect(hasCorrection).toBe(true);
  });

  it('provider error on first call triggers failure (not retry on auth errors)', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setError(new ProviderError('GROQ_API_KEY is not set', 'groq'));

    const result = await planner.plan('Create a website.');
    // Provider errors are returned as planning failures
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. VALID FINAL PLAN LOADS INTO WORKFLOW ENGINE
// ─────────────────────────────────────────────────────────────────────────────

describe('14. Valid final plan loads into WorkflowEngine', () => {
  it('loadPlanIntoEngine successfully loads all tasks', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: ecoStartupPlan() });

    const result = await planner.plan('Create a website for an eco-friendly startup.');
    expect(result.success).toBe(true);

    const engine = WorkflowEngine.create({ projectId: 'proj-eco', goal: result.plan.goal });
    const loaded = loadPlanIntoEngine(result.plan, engine);

    expect(loaded.success).toBe(true);
    expect(loaded.taskIds).toHaveLength(3);
    expect(engine.taskCount).toBe(3);
  });

  it('first task (no deps) is READY after loading', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: ecoStartupPlan() });

    const result = await planner.plan('Create a website for an eco-friendly startup.');
    const engine = WorkflowEngine.create({ projectId: 'proj-1', goal: result.plan.goal });
    loadPlanIntoEngine(result.plan, engine);

    const readyTasks = engine.getReadyTasks();
    expect(readyTasks).toHaveLength(1);
    expect(readyTasks[0].type).toBe(TaskType.TEXT_GENERATION);
  });

  it('dependent tasks start as PENDING until dep completes', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: ecoStartupPlan() });

    const result = await planner.plan('Create a website for an eco-friendly startup.');
    const engine = WorkflowEngine.create({ projectId: 'proj-2', goal: result.plan.goal });
    loadPlanIntoEngine(result.plan, engine);

    const websiteTask = engine.getAllTasks().find((t) => t.type === TaskType.WEBSITE_GENERATION);
    expect(websiteTask.status).toBe(TaskStatus.PENDING);
  });

  it('full plan-to-engine-to-completion cycle succeeds', async () => {
    const { mock, planner } = makePlannerWithMock();
    mock.setResponse({ content: ecoStartupPlan() });

    const result = await planner.plan('Create a website for an eco-friendly startup.');
    const engine = WorkflowEngine.create({ projectId: 'proj-3', goal: result.plan.goal });
    loadPlanIntoEngine(result.plan, engine);

    // Simulate mock execution of all tasks
    const { createSuccessResult } = await import('../../src/modules/agent/workflow/index.js');
    const mockResult = createSuccessResult({ data: 'mock output' });

    // Execute tasks in order
    for (let i = 0; i < 3; i++) {
      const nextTask = engine.getNextTask();
      engine.startTask(nextTask.id);
      engine.completeTask(nextTask.id, mockResult);
    }

    expect(engine.getWorkflowStatus()).toBe(WorkflowStatus.COMPLETED);
    expect(engine.isWorkflowComplete()).toBe(true);
  });

  it('loadPlanIntoEngine returns failure for plan with bad dep (engine guard)', () => {
    // This tests the engine's own guard being triggered
    const plan = {
      goal: 'Test',
      tasks: [
        { id: 'task-1', type: TaskType.TEXT_GENERATION, title: 'T', description: 'D', dependencies: [] },
      ],
    };
    const engine = WorkflowEngine.create({ projectId: 'p', goal: 'Test' });
    const loaded = loadPlanIntoEngine(plan, engine);
    expect(loaded.success).toBe(true);

    // Cannot load into the same engine twice — task-1 would be a duplicate
    const loaded2 = loadPlanIntoEngine(plan, engine);
    expect(loaded2.success).toBe(false);
    expect(loaded2.error.code).toBe(PlannerErrorCode.ENGINE_LOAD_FAILED);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

describe('15. Prompt builder', () => {
  it('system prompt mentions all TaskType values', () => {
    const prompt = buildSystemPrompt();
    for (const type of Object.values(TaskType)) {
      expect(prompt).toContain(type);
    }
  });

  it('buildPlanningMessages returns system + user messages', () => {
    const messages = buildPlanningMessages('Create a website.');
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('Create a website.');
  });

  it('buildCorrectionMessages includes previous response and errors', () => {
    const messages = buildCorrectionMessages('Goal', 'bad response', ['Error A', 'Error B']);
    const correctionMsg = messages.find((m) => m.role === 'user' && m.content.includes('VALIDATION ERRORS'));
    expect(correctionMsg).toBeDefined();
    expect(correctionMsg.content).toContain('Error A');
    expect(correctionMsg.content).toContain('Error B');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. MockProvider
// ─────────────────────────────────────────────────────────────────────────────

describe('16. MockProvider', () => {
  it('returns queued responses in order', async () => {
    const mock = new MockProvider();
    mock.setResponse({ content: 'first' });
    mock.setResponse({ content: 'second' });

    const r1 = await mock.complete([]);
    const r2 = await mock.complete([]);
    expect(r1.content).toBe('first');
    expect(r2.content).toBe('second');
  });

  it('throws queued error', async () => {
    const mock = new MockProvider();
    mock.setError(new ProviderError('API down', 'mock'));

    await expect(mock.complete([])).rejects.toThrow(ProviderError);
  });

  it('throws ProviderError when no responses are queued', async () => {
    const mock = new MockProvider();
    await expect(mock.complete([])).rejects.toThrow(ProviderError);
  });

  it('tracks callCount correctly', async () => {
    const mock = new MockProvider();
    mock.setResponse({ content: 'a' });
    mock.setResponse({ content: 'b' });
    await mock.complete([]);
    await mock.complete([]);
    expect(mock.callCount).toBe(2);
  });

  it('records lastMessages from most recent call', async () => {
    const mock = new MockProvider();
    mock.setResponse({ content: 'ok' });
    const msgs = [{ role: 'user', content: 'hello' }];
    await mock.complete(msgs);
    expect(mock.lastMessages).toEqual(msgs);
  });
});
