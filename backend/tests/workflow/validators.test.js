/**
 * @file validators.test.js
 * Tests for the dependency graph and readiness validators.
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateTask,
  validateWorkflow,
  validateDependencies,
  isTaskReady,
  canRetryTask,
  createTask,
  TaskStatus,
  TaskType,
  WorkflowStatus,
  ErrorCode,
} from '../../src/modules/agent/workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// validateTask
// ─────────────────────────────────────────────────────────────────────────────

describe('validateTask', () => {
  it('returns valid:true for a well-formed task object', () => {
    const task = createTask({ type: TaskType.TEXT_GENERATION, title: 'T' });
    const result = validateTask(task);
    expect(result.valid).toBe(true);
    expect(result.task).toBeDefined();
  });

  it('returns valid:false with errors for a missing title', () => {
    const result = validateTask({ type: TaskType.TEXT_GENERATION });
    expect(result.valid).toBe(false);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns valid:false with path information in errors', () => {
    const result = validateTask({ type: TaskType.TEXT_GENERATION, title: '' });
    expect(result.valid).toBe(false);
    const titleError = result.errors.find((e) => e.path.includes('title'));
    expect(titleError).toBeDefined();
  });

  it('returns valid:false for invalid status', () => {
    const result = validateTask({
      id: 'x',
      type: TaskType.OTHER,
      title: 'T',
      status: 'FAKE_STATUS',
      dependencies: [],
      retryCount: 0,
      maxRetries: 3,
      input: null,
      output: null,
      error: null,
      metadata: {},
    });
    expect(result.valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateWorkflow
// ─────────────────────────────────────────────────────────────────────────────

describe('validateWorkflow', () => {
  it('returns valid:true for a well-formed workflow object', () => {
    const result = validateWorkflow({
      id: 'wf-1',
      projectId: 'p1',
      goal: 'Generate something',
      status: WorkflowStatus.PENDING,
      tasks: [],
      currentTaskId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    });
    expect(result.valid).toBe(true);
  });

  it('returns valid:false when projectId is missing', () => {
    const result = validateWorkflow({
      id: 'wf-1',
      goal: 'G',
      status: WorkflowStatus.PENDING,
      tasks: [],
      currentTaskId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns valid:false for invalid workflow status', () => {
    const result = validateWorkflow({
      id: 'wf-1',
      projectId: 'p1',
      goal: 'G',
      status: 'HALTED',
      tasks: [],
      currentTaskId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    });
    expect(result.valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateDependencies — duplicate IDs
// ─────────────────────────────────────────────────────────────────────────────

describe('validateDependencies — duplicate task IDs', () => {
  it('detects a duplicate task ID', () => {
    const tasks = [
      { id: 'task-1', dependencies: [] },
      { id: 'task-1', dependencies: [] }, // duplicate
    ];
    const result = validateDependencies(tasks);
    expect(result.valid).toBe(false);
    const dup = result.errors.find((e) => e.message.includes('Duplicate'));
    expect(dup).toBeDefined();
    expect(dup.taskId).toBe('task-1');
  });

  it('passes for a list with all unique IDs', () => {
    const tasks = [
      { id: 'task-1', dependencies: [] },
      { id: 'task-2', dependencies: ['task-1'] },
    ];
    const result = validateDependencies(tasks);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateDependencies — reference to non-existent task
// ─────────────────────────────────────────────────────────────────────────────

describe('validateDependencies — non-existent dependency references', () => {
  it('detects a reference to a non-existent task ID', () => {
    const tasks = [
      { id: 'task-1', dependencies: [] },
      { id: 'task-2', dependencies: ['task-GHOST'] }, // 'task-GHOST' doesn't exist
    ];
    const result = validateDependencies(tasks);
    expect(result.valid).toBe(false);
    const missing = result.errors.find((e) => e.message.includes('task-GHOST'));
    expect(missing).toBeDefined();
  });

  it('validates a correct three-task linear chain', () => {
    const tasks = [
      { id: 'task-1', dependencies: [] },
      { id: 'task-2', dependencies: ['task-1'] },
      { id: 'task-3', dependencies: ['task-2'] },
    ];
    const result = validateDependencies(tasks);
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateDependencies — circular dependencies
// ─────────────────────────────────────────────────────────────────────────────

describe('validateDependencies — circular dependencies', () => {
  it('detects a direct cycle (A → B → A)', () => {
    const tasks = [
      { id: 'A', dependencies: ['B'] },
      { id: 'B', dependencies: ['A'] },
    ];
    const result = validateDependencies(tasks);
    expect(result.valid).toBe(false);
    const circErr = result.errors.find((e) => e.code === ErrorCode.CIRCULAR_DEPENDENCY);
    expect(circErr).toBeDefined();
  });

  it('detects a transitive cycle (A → B → C → A)', () => {
    const tasks = [
      { id: 'A', dependencies: ['C'] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['B'] },
    ];
    const result = validateDependencies(tasks);
    expect(result.valid).toBe(false);
    const circErr = result.errors.find((e) => e.code === ErrorCode.CIRCULAR_DEPENDENCY);
    expect(circErr).toBeDefined();
  });

  it('passes for a valid DAG (diamond shape)', () => {
    // A → B, A → C, B → D, C → D  (no cycle)
    const tasks = [
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: ['A'] },
      { id: 'C', dependencies: ['A'] },
      { id: 'D', dependencies: ['B', 'C'] },
    ];
    const result = validateDependencies(tasks);
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isTaskReady
// ─────────────────────────────────────────────────────────────────────────────

describe('isTaskReady', () => {
  it('returns ready:true when task has no dependencies', () => {
    const task = createTask({ type: TaskType.TEXT_GENERATION, title: 'T1' });
    const result = isTaskReady(task, [task]);
    expect(result.ready).toBe(true);
  });

  it('returns ready:false when a dependency is PENDING', () => {
    const dep = createTask({ type: TaskType.TEXT_GENERATION, title: 'Dep' });
    const task = createTask({
      type: TaskType.WEBSITE_GENERATION,
      title: 'Website',
      dependencies: [dep.id],
    });
    const result = isTaskReady(task, [dep, task]);
    expect(result.ready).toBe(false);
    expect(result.reason).toContain(dep.id);
  });

  it('returns ready:false when a dependency is RUNNING', () => {
    const dep = createTask({
      type: TaskType.TEXT_GENERATION,
      title: 'Dep',
      status: TaskStatus.RUNNING,
    });
    const task = createTask({
      type: TaskType.WEBSITE_GENERATION,
      title: 'Website',
      dependencies: [dep.id],
    });
    const result = isTaskReady(task, [dep, task]);
    expect(result.ready).toBe(false);
  });

  it('returns ready:true when all dependencies are COMPLETED', () => {
    const dep = createTask({
      type: TaskType.TEXT_GENERATION,
      title: 'Dep',
      status: TaskStatus.COMPLETED,
    });
    const task = createTask({
      type: TaskType.WEBSITE_GENERATION,
      title: 'Website',
      dependencies: [dep.id],
    });
    const result = isTaskReady(task, [dep, task]);
    expect(result.ready).toBe(true);
  });

  it('returns ready:false when task itself is already RUNNING', () => {
    const task = createTask({
      type: TaskType.OTHER,
      title: 'Already running',
      status: TaskStatus.RUNNING,
    });
    const result = isTaskReady(task, [task]);
    expect(result.ready).toBe(false);
  });

  it('returns ready:false when task itself is COMPLETED', () => {
    const task = createTask({
      type: TaskType.OTHER,
      title: 'Done',
      status: TaskStatus.COMPLETED,
    });
    const result = isTaskReady(task, [task]);
    expect(result.ready).toBe(false);
  });

  it('returns ready:false when a dependency is not found in allTasks', () => {
    const task = createTask({
      type: TaskType.OTHER,
      title: 'T',
      dependencies: ['non-existent-id'],
    });
    const result = isTaskReady(task, [task]);
    expect(result.ready).toBe(false);
    expect(result.reason).toContain('non-existent-id');
  });

  it('works correctly for the spec example (3 tasks in a chain)', () => {
    // Task1: deps:[] → Task2: deps:[Task1] → Task3: deps:[Task2]
    const task1 = createTask({
      type: TaskType.TEXT_GENERATION,
      title: 'Generate content',
      status: TaskStatus.COMPLETED,
    });
    const task2 = createTask({
      type: TaskType.WEBSITE_GENERATION,
      title: 'Generate website',
      dependencies: [task1.id],
    });
    const task3 = createTask({
      type: TaskType.VALIDATION,
      title: 'Validate website',
      dependencies: [task2.id],
    });

    const allTasks = [task1, task2, task3];

    expect(isTaskReady(task2, allTasks).ready).toBe(true);   // task1 is COMPLETED
    expect(isTaskReady(task3, allTasks).ready).toBe(false);  // task2 is PENDING
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canRetryTask
// ─────────────────────────────────────────────────────────────────────────────

describe('canRetryTask', () => {
  it('returns canRetry:true when retryCount < maxRetries', () => {
    const task = createTask({ type: TaskType.OTHER, title: 'T', retryCount: 1, maxRetries: 3 });
    expect(canRetryTask(task).canRetry).toBe(true);
  });

  it('returns canRetry:false when retryCount equals maxRetries', () => {
    const task = createTask({ type: TaskType.OTHER, title: 'T', retryCount: 3, maxRetries: 3 });
    const result = canRetryTask(task);
    expect(result.canRetry).toBe(false);
    expect(result.reason).toContain('exhausted');
  });

  it('returns canRetry:true for a fresh task (0/3)', () => {
    const task = createTask({ type: TaskType.OTHER, title: 'T' });
    expect(canRetryTask(task).canRetry).toBe(true);
  });
});
