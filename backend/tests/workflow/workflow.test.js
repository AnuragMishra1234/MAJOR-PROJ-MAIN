/**
 * @file workflow.test.js
 * Tests for the Workflow contract (createWorkflow, canTransitionWorkflow)
 */

import { describe, it, expect } from '@jest/globals';
import {
  createWorkflow,
  canTransitionWorkflow,
  WorkflowValidationError,
  WorkflowStatus,
  TaskType,
  createTask,
} from '../../src/modules/agent/workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// VALID WORKFLOW CREATION
// ─────────────────────────────────────────────────────────────────────────────

describe('createWorkflow — valid creation', () => {
  it('creates a workflow with only required fields (projectId and goal)', () => {
    const wf = createWorkflow({
      projectId: 'proj-abc',
      goal: 'Generate a landing page for a coffee shop',
    });

    expect(wf.projectId).toBe('proj-abc');
    expect(wf.goal).toBe('Generate a landing page for a coffee shop');
    expect(wf.id).toBeDefined();
    expect(typeof wf.id).toBe('string');
  });

  it('applies correct defaults', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'Some goal' });

    expect(wf.status).toBe(WorkflowStatus.PENDING);
    expect(wf.tasks).toEqual([]);
    expect(wf.currentTaskId).toBeNull();
    expect(wf.metadata).toEqual({});
    expect(wf.createdAt).toBeInstanceOf(Date);
    expect(wf.updatedAt).toBeInstanceOf(Date);
  });

  it('creates a workflow with all fields provided', () => {
    const task = createTask({ type: TaskType.TEXT_GENERATION, title: 'T1' });
    const now = new Date('2025-01-01T00:00:00Z');

    const wf = createWorkflow({
      id: 'wf-fixed',
      projectId: 'proj-xyz',
      goal: 'Full website generation',
      status: WorkflowStatus.RUNNING,
      tasks: [task],
      currentTaskId: task.id,
      createdAt: now,
      updatedAt: now,
      metadata: { source: 'test' },
    });

    expect(wf.id).toBe('wf-fixed');
    expect(wf.status).toBe(WorkflowStatus.RUNNING);
    expect(wf.tasks).toHaveLength(1);
    expect(wf.currentTaskId).toBe(task.id);
    expect(wf.createdAt).toEqual(now);
    expect(wf.metadata).toEqual({ source: 'test' });
  });

  it('auto-generates unique IDs for two separate workflows', () => {
    const wf1 = createWorkflow({ projectId: 'p1', goal: 'Goal 1' });
    const wf2 = createWorkflow({ projectId: 'p2', goal: 'Goal 2' });
    expect(wf1.id).not.toBe(wf2.id);
  });

  it('returns a frozen (immutable) object', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'Goal' });
    expect(() => {
      wf.status = WorkflowStatus.RUNNING;
    }).toThrow();
  });

  it('accepts an empty tasks array', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'Goal', tasks: [] });
    expect(wf.tasks).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INVALID WORKFLOW STATUS
// ─────────────────────────────────────────────────────────────────────────────

describe('createWorkflow — invalid status', () => {
  it('throws WorkflowValidationError for an unrecognised status', () => {
    expect(() =>
      createWorkflow({ projectId: 'p1', goal: 'G', status: 'STOPPED' }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws for numeric status', () => {
    expect(() =>
      createWorkflow({ projectId: 'p1', goal: 'G', status: 0 }),
    ).toThrow(WorkflowValidationError);
  });

  it('error has issues array describing the problem', () => {
    try {
      createWorkflow({ projectId: 'p1', goal: 'G', status: 'INVALID' });
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(WorkflowValidationError);
      expect(err.issues.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MISSING REQUIRED FIELDS
// ─────────────────────────────────────────────────────────────────────────────

describe('createWorkflow — missing required fields', () => {
  it('throws when projectId is missing', () => {
    expect(() =>
      createWorkflow({ goal: 'Some goal' }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws when goal is missing', () => {
    expect(() =>
      createWorkflow({ projectId: 'p1' }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws when projectId is empty string', () => {
    expect(() =>
      createWorkflow({ projectId: '', goal: 'G' }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws when goal is empty string', () => {
    expect(() =>
      createWorkflow({ projectId: 'p1', goal: '' }),
    ).toThrow(WorkflowValidationError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRANSITION GUARD
// ─────────────────────────────────────────────────────────────────────────────

describe('canTransitionWorkflow', () => {
  it('allows PENDING → RUNNING', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'G' });
    const result = canTransitionWorkflow(wf, WorkflowStatus.RUNNING);
    expect(result.allowed).toBe(true);
  });

  it('allows RUNNING → COMPLETED', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'G', status: WorkflowStatus.RUNNING });
    const result = canTransitionWorkflow(wf, WorkflowStatus.COMPLETED);
    expect(result.allowed).toBe(true);
  });

  it('allows RUNNING → PAUSED', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'G', status: WorkflowStatus.RUNNING });
    const result = canTransitionWorkflow(wf, WorkflowStatus.PAUSED);
    expect(result.allowed).toBe(true);
  });

  it('allows PAUSED → RUNNING (resume)', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'G', status: WorkflowStatus.PAUSED });
    const result = canTransitionWorkflow(wf, WorkflowStatus.RUNNING);
    expect(result.allowed).toBe(true);
  });

  it('disallows COMPLETED → RUNNING', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'G', status: WorkflowStatus.COMPLETED });
    const result = canTransitionWorkflow(wf, WorkflowStatus.RUNNING);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Cannot transition');
  });

  it('disallows FAILED → RUNNING', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'G', status: WorkflowStatus.FAILED });
    const result = canTransitionWorkflow(wf, WorkflowStatus.RUNNING);
    expect(result.allowed).toBe(false);
  });

  it('disallows PENDING → COMPLETED (skipping RUNNING)', () => {
    const wf = createWorkflow({ projectId: 'p1', goal: 'G' }); // PENDING
    const result = canTransitionWorkflow(wf, WorkflowStatus.COMPLETED);
    expect(result.allowed).toBe(false);
  });
});
