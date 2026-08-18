/**
 * @file task.test.js
 * Tests for the Task contract (createTask, canTransitionTask, WorkflowValidationError)
 */

import { describe, it, expect } from '@jest/globals';
import {
  createTask,
  canTransitionTask,
  WorkflowValidationError,
  TaskStatus,
  TaskType,
  extendTaskTypes,
} from '../../src/modules/agent/workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// VALID TASK CREATION
// ─────────────────────────────────────────────────────────────────────────────

describe('createTask — valid creation', () => {
  it('creates a task with only required fields (type and title)', () => {
    const task = createTask({
      type: TaskType.TEXT_GENERATION,
      title: 'Generate content',
    });

    expect(task.type).toBe(TaskType.TEXT_GENERATION);
    expect(task.title).toBe('Generate content');
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('string');
    expect(task.id.length).toBeGreaterThan(0);
  });

  it('applies correct defaults', () => {
    const task = createTask({
      type: TaskType.CODE_GENERATION,
      title: 'Generate website code',
    });

    expect(task.status).toBe(TaskStatus.PENDING);
    expect(task.dependencies).toEqual([]);
    expect(task.retryCount).toBe(0);
    expect(task.maxRetries).toBe(3);
    expect(task.input).toBeNull();
    expect(task.output).toBeNull();
    expect(task.error).toBeNull();
    expect(task.metadata).toEqual({});
  });

  it('creates a task with all fields provided', () => {
    const task = createTask({
      id: 'my-fixed-id',
      type: TaskType.VALIDATION,
      title: 'Validate generated website',
      description: 'Checks that the HTML is well-formed',
      status: TaskStatus.READY,
      dependencies: ['dep-task-id'],
      input: { data: { prompt: 'hello' } },
      retryCount: 1,
      maxRetries: 5,
      metadata: { priority: 'high' },
    });

    expect(task.id).toBe('my-fixed-id');
    expect(task.status).toBe(TaskStatus.READY);
    expect(task.dependencies).toEqual(['dep-task-id']);
    expect(task.retryCount).toBe(1);
    expect(task.maxRetries).toBe(5);
    expect(task.metadata).toEqual({ priority: 'high' });
  });

  it('returns a frozen (immutable) object', () => {
    const task = createTask({
      type: TaskType.OTHER,
      title: 'Some task',
    });

    expect(() => {
      task.status = TaskStatus.RUNNING;
    }).toThrow();
  });

  it('auto-generates a UUID when no id is provided', () => {
    const task1 = createTask({ type: TaskType.OTHER, title: 'Task 1' });
    const task2 = createTask({ type: TaskType.OTHER, title: 'Task 2' });
    expect(task1.id).not.toBe(task2.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INVALID STATUS
// ─────────────────────────────────────────────────────────────────────────────

describe('createTask — invalid status', () => {
  it('throws WorkflowValidationError for an unrecognised status', () => {
    expect(() =>
      createTask({
        type: TaskType.TEXT_GENERATION,
        title: 'Task',
        status: 'FLYING',
      }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws WorkflowValidationError for numeric status', () => {
    expect(() =>
      createTask({
        type: TaskType.TEXT_GENERATION,
        title: 'Task',
        status: 42,
      }),
    ).toThrow(WorkflowValidationError);
  });

  it('error has a descriptive message and issues array', () => {
    try {
      createTask({ type: TaskType.TEXT_GENERATION, title: 'Task', status: 'INVALID' });
      expect(true).toBe(false); // should not reach here
    } catch (err) {
      expect(err).toBeInstanceOf(WorkflowValidationError);
      expect(err.name).toBe('WorkflowValidationError');
      expect(Array.isArray(err.issues)).toBe(true);
      expect(err.issues.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INVALID TASK TYPE
// ─────────────────────────────────────────────────────────────────────────────

describe('createTask — invalid type', () => {
  it('throws for an empty string type', () => {
    expect(() =>
      createTask({ type: '', title: 'Task' }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws when type is missing', () => {
    expect(() =>
      createTask({ title: 'Task' }),
    ).toThrow(WorkflowValidationError);
  });

  it('accepts an extended type added via extendTaskTypes', () => {
    // Person 3 or Person 4 can add a new type at runtime.
    extendTaskTypes({ PPT_GENERATION: 'PPT_GENERATION' });

    // The schema accepts any non-empty string so the new type just works.
    const task = createTask({ type: 'PPT_GENERATION', title: 'Make slides' });
    expect(task.type).toBe('PPT_GENERATION');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TASK DEPENDENCIES
// ─────────────────────────────────────────────────────────────────────────────

describe('createTask — dependencies', () => {
  it('stores declared dependency IDs correctly', () => {
    const task = createTask({
      type: TaskType.WEBSITE_GENERATION,
      title: 'Generate website',
      dependencies: ['task-1'],
    });

    expect(task.dependencies).toEqual(['task-1']);
    expect(task.dependencies.length).toBe(1);
  });

  it('supports multiple dependencies', () => {
    const task = createTask({
      type: TaskType.VALIDATION,
      title: 'Validate',
      dependencies: ['task-1', 'task-2', 'task-3'],
    });
    expect(task.dependencies).toEqual(['task-1', 'task-2', 'task-3']);
  });

  it('defaults to empty dependencies array', () => {
    const task = createTask({ type: TaskType.OTHER, title: 'No deps' });
    expect(task.dependencies).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RETRY COUNT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe('createTask — retry count validation', () => {
  it('accepts retryCount equal to maxRetries (boundary)', () => {
    const task = createTask({
      type: TaskType.OTHER,
      title: 'At limit',
      retryCount: 3,
      maxRetries: 3,
    });
    expect(task.retryCount).toBe(3);
    expect(task.maxRetries).toBe(3);
  });

  it('throws when retryCount exceeds maxRetries', () => {
    expect(() =>
      createTask({
        type: TaskType.OTHER,
        title: 'Over limit',
        retryCount: 5,
        maxRetries: 3,
      }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws for negative retryCount', () => {
    expect(() =>
      createTask({
        type: TaskType.OTHER,
        title: 'Negative',
        retryCount: -1,
      }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws for negative maxRetries', () => {
    expect(() =>
      createTask({
        type: TaskType.OTHER,
        title: 'Negative max',
        maxRetries: -1,
      }),
    ).toThrow(WorkflowValidationError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MISSING REQUIRED FIELDS
// ─────────────────────────────────────────────────────────────────────────────

describe('createTask — missing required fields', () => {
  it('throws when title is missing', () => {
    expect(() =>
      createTask({ type: TaskType.TEXT_GENERATION }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws when title is an empty string', () => {
    expect(() =>
      createTask({ type: TaskType.TEXT_GENERATION, title: '' }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws when title is only whitespace', () => {
    expect(() =>
      createTask({ type: TaskType.TEXT_GENERATION, title: '   ' }),
    ).toThrow(WorkflowValidationError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRANSITION GUARD
// ─────────────────────────────────────────────────────────────────────────────

describe('canTransitionTask', () => {
  it('allows PENDING → READY', () => {
    const task = createTask({ type: TaskType.OTHER, title: 'T' });
    const result = canTransitionTask(task, TaskStatus.READY);
    expect(result.allowed).toBe(true);
  });

  it('allows READY → RUNNING', () => {
    const task = createTask({ type: TaskType.OTHER, title: 'T', status: TaskStatus.READY });
    const result = canTransitionTask(task, TaskStatus.RUNNING);
    expect(result.allowed).toBe(true);
  });

  it('disallows COMPLETED → RUNNING', () => {
    const task = createTask({ type: TaskType.OTHER, title: 'T', status: TaskStatus.COMPLETED });
    const result = canTransitionTask(task, TaskStatus.RUNNING);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Cannot transition');
  });

  it('disallows FAILED → RUNNING', () => {
    const task = createTask({ type: TaskType.OTHER, title: 'T', status: TaskStatus.FAILED });
    const result = canTransitionTask(task, TaskStatus.RUNNING);
    expect(result.allowed).toBe(false);
  });
});
