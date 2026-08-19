/**
 * @file projectMemory.test.js
 * Phase 5 — ProjectMemory unit tests
 *
 * Tests cover:
 *  1.  Factory validation
 *  2.  addTaskOutput / getTaskOutput round-trip
 *  3.  getAllOutputs accumulation
 *  4.  setContext / getContext / hasContext
 *  5.  getAllContext
 *  6.  getRelevantContext — TEXT_GENERATION
 *  7.  getRelevantContext — CODE_GENERATION
 *  8.  getRelevantContext — WEBSITE_GENERATION
 *  9.  getRelevantContext — VALIDATION (all outputs)
 * 10.  getRelevantContext — OTHER/unknown
 * 11.  getContextString — non-empty
 * 12.  getContextString — empty outputs
 * 13.  Missing context handled gracefully
 * 14.  Project isolation — two separate memory instances
 * 15.  addTaskError / getTaskError
 * 16.  getSnapshot structure
 * 17.  clear() resets outputs, context, errors
 * 18.  Multiple task outputs accumulate correctly
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createProjectMemory } from '../../src/modules/agent/memory/projectMemory.js';
import { TaskType } from '../../src/modules/agent/workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function makeMemory(overrides = {}) {
  return createProjectMemory({
    projectId:  'proj-A',
    workflowId: 'wf-001',
    goal:       'Create an eco-friendly startup website.',
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Factory validation
// ─────────────────────────────────────────────────────────────────────────────

describe('1. createProjectMemory — factory validation', () => {
  it('creates a memory instance with correct metadata', () => {
    const mem = makeMemory();
    expect(mem.projectId).toBe('proj-A');
    expect(mem.workflowId).toBe('wf-001');
    expect(mem.goal).toBe('Create an eco-friendly startup website.');
  });

  it('throws if projectId is missing', () => {
    expect(() => createProjectMemory({ workflowId: 'w', goal: 'g' })).toThrow(TypeError);
  });

  it('throws if workflowId is missing', () => {
    expect(() => createProjectMemory({ projectId: 'p', goal: 'g' })).toThrow(TypeError);
  });

  it('throws if goal is missing', () => {
    expect(() => createProjectMemory({ projectId: 'p', workflowId: 'w' })).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. addTaskOutput / getTaskOutput
// ─────────────────────────────────────────────────────────────────────────────

describe('2. addTaskOutput / getTaskOutput round-trip', () => {
  it('stores and retrieves task output by taskId', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'EcoCampus is eco-friendly.' });
    const out = mem.getTaskOutput('task-1');
    expect(out).toEqual({ content: 'EcoCampus is eco-friendly.' });
  });

  it('returns null for unknown taskId', () => {
    const mem = makeMemory();
    expect(mem.getTaskOutput('task-99')).toBeNull();
  });

  it('overwrites previous output for same taskId', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'first' });
    mem.addTaskOutput('task-1', { content: 'second' });
    expect(mem.getTaskOutput('task-1').content).toBe('second');
  });

  it('throws for invalid taskId', () => {
    const mem = makeMemory();
    expect(() => mem.addTaskOutput('', { content: 'x' })).toThrow(TypeError);
    expect(() => mem.addTaskOutput(null, { content: 'x' })).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. getAllOutputs accumulation
// ─────────────────────────────────────────────────────────────────────────────

describe('3. getAllOutputs accumulation', () => {
  it('starts empty', () => {
    const mem = makeMemory();
    expect(Object.keys(mem.getAllOutputs())).toHaveLength(0);
  });

  it('accumulates multiple task outputs', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'Text' });
    mem.addTaskOutput('task-2', { files: ['index.html'] });
    const all = mem.getAllOutputs();
    expect(all['task-1']).toBeDefined();
    expect(all['task-2']).toBeDefined();
  });

  it('returns a plain object (not a Map)', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'x' });
    expect(typeof mem.getAllOutputs()).toBe('object');
    expect(mem.getAllOutputs() instanceof Map).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. setContext / getContext / hasContext
// ─────────────────────────────────────────────────────────────────────────────

describe('4. setContext / getContext / hasContext', () => {
  it('stores and retrieves a named context entry', () => {
    const mem = makeMemory();
    mem.setContext('startupName', 'EcoCampus');
    expect(mem.getContext('startupName')).toBe('EcoCampus');
  });

  it('returns undefined for unknown key', () => {
    const mem = makeMemory();
    expect(mem.getContext('unknownKey')).toBeUndefined();
  });

  it('hasContext returns true after setContext', () => {
    const mem = makeMemory();
    mem.setContext('targetAudience', 'Students');
    expect(mem.hasContext('targetAudience')).toBe(true);
  });

  it('hasContext returns false for missing key', () => {
    const mem = makeMemory();
    expect(mem.hasContext('nope')).toBe(false);
  });

  it('throws for empty key', () => {
    const mem = makeMemory();
    expect(() => mem.setContext('', 'value')).toThrow(TypeError);
  });

  it('updates existing context key', () => {
    const mem = makeMemory();
    mem.setContext('startupName', 'First');
    mem.setContext('startupName', 'EcoCampus');
    expect(mem.getContext('startupName')).toBe('EcoCampus');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. getAllContext
// ─────────────────────────────────────────────────────────────────────────────

describe('5. getAllContext', () => {
  it('returns all named context as a plain object', () => {
    const mem = makeMemory();
    mem.setContext('startupName', 'EcoCampus');
    mem.setContext('targetAudience', 'Students');
    const ctx = mem.getAllContext();
    expect(ctx.startupName).toBe('EcoCampus');
    expect(ctx.targetAudience).toBe('Students');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. getRelevantContext — TEXT_GENERATION
// ─────────────────────────────────────────────────────────────────────────────

describe('6. getRelevantContext — TEXT_GENERATION', () => {
  it('includes goal and namedContext', () => {
    const mem = makeMemory();
    mem.setContext('startupName', 'EcoCampus');
    const ctx = mem.getRelevantContext({ type: TaskType.TEXT_GENERATION, id: 't1' });
    expect(ctx.goal).toBe('Create an eco-friendly startup website.');
    expect(ctx.namedContext.startupName).toBe('EcoCampus');
  });

  it('includes priorTexts from previous text outputs', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'EcoCampus is eco-friendly.' });
    const ctx = mem.getRelevantContext({ type: TaskType.TEXT_GENERATION, id: 't2' });
    expect(ctx.priorTexts).toBeDefined();
    expect(ctx.priorTexts[0].content).toBe('EcoCampus is eco-friendly.');
  });

  it('does NOT include all outputs (only text content)', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { code: 'const x = 1;' });       // code, not text
    mem.addTaskOutput('task-2', { content: 'Some content.' });    // text
    const ctx = mem.getRelevantContext({ type: TaskType.TEXT_GENERATION, id: 't3' });
    // priorTexts only includes outputs with .content field
    const ids = ctx.priorTexts.map((p) => p.taskId);
    expect(ids).toContain('task-2');
    expect(ids).not.toContain('task-1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. getRelevantContext — CODE_GENERATION
// ─────────────────────────────────────────────────────────────────────────────

describe('7. getRelevantContext — CODE_GENERATION', () => {
  it('includes priorCode from code outputs', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { code: 'const x = 1;', language: 'javascript' });
    const ctx = mem.getRelevantContext({ type: TaskType.CODE_GENERATION, id: 't2' });
    expect(ctx.priorCode).toBeDefined();
    expect(ctx.priorCode[0].code).toBe('const x = 1;');
    expect(ctx.priorCode[0].language).toBe('javascript');
  });

  it('does not include text outputs in priorCode', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'Only text here' });
    const ctx = mem.getRelevantContext({ type: TaskType.CODE_GENERATION, id: 't2' });
    expect(ctx.priorCode).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. getRelevantContext — WEBSITE_GENERATION
// ─────────────────────────────────────────────────────────────────────────────

describe('8. getRelevantContext — WEBSITE_GENERATION', () => {
  it('includes goal and named context', () => {
    const mem = makeMemory();
    mem.setContext('startupName', 'EcoCampus');
    mem.setContext('tagline', 'Green future for all');
    const ctx = mem.getRelevantContext({ type: TaskType.WEBSITE_GENERATION, id: 't2' });
    expect(ctx.goal).toBeDefined();
    expect(ctx.namedContext.startupName).toBe('EcoCampus');
    expect(ctx.namedContext.tagline).toBe('Green future for all');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. getRelevantContext — VALIDATION (all outputs)
// ─────────────────────────────────────────────────────────────────────────────

describe('9. getRelevantContext — VALIDATION', () => {
  it('includes all task outputs', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'Text output' });
    mem.addTaskOutput('task-2', { files: ['index.html'] });
    const ctx = mem.getRelevantContext({ type: TaskType.VALIDATION, id: 't3' });
    expect(ctx.allOutputs).toBeDefined();
    expect(ctx.allOutputs['task-1']).toBeDefined();
    expect(ctx.allOutputs['task-2']).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. getRelevantContext — OTHER/unknown
// ─────────────────────────────────────────────────────────────────────────────

describe('10. getRelevantContext — OTHER/unknown type', () => {
  it('returns goal and namedContext only', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'big blob' });
    const ctx = mem.getRelevantContext({ type: TaskType.OTHER, id: 't2' });
    expect(ctx.goal).toBeDefined();
    expect(ctx.namedContext).toBeDefined();
    // Should NOT include allOutputs or priorTexts
    expect(ctx.allOutputs).toBeUndefined();
    expect(ctx.priorTexts).toBeUndefined();
  });

  it('handles null/undefined task type gracefully', () => {
    const mem = makeMemory();
    const ctx = mem.getRelevantContext({ id: 't1' });
    expect(ctx.goal).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. getContextString — non-empty
// ─────────────────────────────────────────────────────────────────────────────

describe('11. getContextString — non-empty', () => {
  it('returns a non-empty string with prior content', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'EcoCampus is an eco-friendly company.' });
    const str = mem.getContextString({ type: TaskType.TEXT_GENERATION, id: 't2' });
    expect(typeof str).toBe('string');
    expect(str.length).toBeGreaterThan(0);
    expect(str).toContain('EcoCampus');
  });

  it('includes named context keys in context string', () => {
    const mem = makeMemory();
    mem.setContext('startupName', 'EcoCampus');
    const str = mem.getContextString({ type: TaskType.TEXT_GENERATION, id: 't1' });
    expect(str).toContain('startupName');
    expect(str).toContain('EcoCampus');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. getContextString — empty outputs
// ─────────────────────────────────────────────────────────────────────────────

describe('12. getContextString — empty state', () => {
  it('returns a short string (goal only) when no outputs exist', () => {
    const mem = makeMemory();
    const str = mem.getContextString({ type: TaskType.TEXT_GENERATION, id: 't1' });
    expect(typeof str).toBe('string');
    // Should still include goal
    expect(str).toContain('Create an eco-friendly');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Missing context handled gracefully
// ─────────────────────────────────────────────────────────────────────────────

describe('13. Missing context handled gracefully', () => {
  it('getTaskOutput returns null (not undefined/error) for missing task', () => {
    const mem = makeMemory();
    expect(mem.getTaskOutput('missing-task')).toBeNull();
  });

  it('getContext returns undefined (not error) for missing key', () => {
    const mem = makeMemory();
    expect(mem.getContext('nonExistent')).toBeUndefined();
  });

  it('getRelevantContext works on fresh memory (no outputs)', () => {
    const mem = makeMemory();
    expect(() => mem.getRelevantContext({ type: TaskType.VALIDATION })).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. Project isolation — two separate memory instances
// ─────────────────────────────────────────────────────────────────────────────

describe('14. Project isolation', () => {
  it('Project A output does NOT appear in Project B', () => {
    const memA = createProjectMemory({ projectId: 'proj-A', workflowId: 'wf-1', goal: 'Goal A' });
    const memB = createProjectMemory({ projectId: 'proj-B', workflowId: 'wf-2', goal: 'Goal B' });

    memA.addTaskOutput('task-1', { content: 'Secret content from project A' });
    memA.setContext('startupName', 'EcoCampus');

    // Project B should have no knowledge of A's outputs
    expect(memB.getTaskOutput('task-1')).toBeNull();
    expect(memB.getContext('startupName')).toBeUndefined();
    expect(Object.keys(memB.getAllOutputs())).toHaveLength(0);
  });

  it('Clearing Project A does not affect Project B', () => {
    const memA = createProjectMemory({ projectId: 'proj-A', workflowId: 'wf-1', goal: 'A' });
    const memB = createProjectMemory({ projectId: 'proj-B', workflowId: 'wf-2', goal: 'B' });

    memA.addTaskOutput('task-1', { content: 'A content' });
    memB.addTaskOutput('task-1', { content: 'B content' });

    memA.clear();

    expect(memA.getTaskOutput('task-1')).toBeNull();
    expect(memB.getTaskOutput('task-1').content).toBe('B content');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. addTaskError / getTaskError
// ─────────────────────────────────────────────────────────────────────────────

describe('15. addTaskError / getTaskError', () => {
  it('stores and retrieves a task error', () => {
    const mem = makeMemory();
    const err = { code: 'EXEC_ERROR', message: 'AI failed' };
    mem.addTaskError('task-1', err);
    expect(mem.getTaskError('task-1')).toEqual(err);
  });

  it('returns null for unknown taskId', () => {
    const mem = makeMemory();
    expect(mem.getTaskError('task-x')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. getSnapshot structure
// ─────────────────────────────────────────────────────────────────────────────

describe('16. getSnapshot structure', () => {
  it('snapshot has all expected fields', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'hi' });
    mem.setContext('startupName', 'EcoCampus');
    const snap = mem.getSnapshot();
    expect(snap.projectId).toBe('proj-A');
    expect(snap.workflowId).toBe('wf-001');
    expect(snap.goal).toBeDefined();
    expect(snap.taskOutputs).toBeDefined();
    expect(snap.projectContext).toBeDefined();
    expect(snap.errors).toBeDefined();
    expect(snap.createdAt).toBeDefined();
    expect(snap.snapshotAt).toBeDefined();
  });

  it('snapshot is a plain object (not a class instance)', () => {
    const mem = makeMemory();
    const snap = mem.getSnapshot();
    expect(typeof snap).toBe('object');
    expect(snap.constructor).toBe(Object);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. clear() resets all state
// ─────────────────────────────────────────────────────────────────────────────

describe('17. clear() resets state', () => {
  it('clears task outputs', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'x' });
    mem.clear();
    expect(Object.keys(mem.getAllOutputs())).toHaveLength(0);
  });

  it('clears named context', () => {
    const mem = makeMemory();
    mem.setContext('startupName', 'EcoCampus');
    mem.clear();
    expect(mem.getContext('startupName')).toBeUndefined();
  });

  it('clears errors', () => {
    const mem = makeMemory();
    mem.addTaskError('task-1', { code: 'ERR', message: 'fail' });
    mem.clear();
    expect(mem.getTaskError('task-1')).toBeNull();
  });

  it('keeps metadata (projectId, workflowId, goal) after clear', () => {
    const mem = makeMemory();
    mem.clear();
    expect(mem.projectId).toBe('proj-A');
    expect(mem.goal).toBe('Create an eco-friendly startup website.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. Multiple task outputs accumulate correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('18. Multiple task outputs accumulate correctly', () => {
  it('all three task outputs are present after three adds', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'Startup name: EcoCampus' });
    mem.addTaskOutput('task-2', { files: ['index.html', 'styles.css'] });
    mem.addTaskOutput('task-3', { valid: true, score: 0.97 });

    expect(Object.keys(mem.getAllOutputs())).toHaveLength(3);
    expect(mem.getTaskOutput('task-1').content).toContain('EcoCampus');
    expect(mem.getTaskOutput('task-2').files).toContain('index.html');
    expect(mem.getTaskOutput('task-3').valid).toBe(true);
  });

  it('VALIDATION context includes all three outputs', () => {
    const mem = makeMemory();
    mem.addTaskOutput('task-1', { content: 'Content' });
    mem.addTaskOutput('task-2', { files: ['index.html'] });
    mem.addTaskOutput('task-3', { valid: true });

    const ctx = mem.getRelevantContext({ type: TaskType.VALIDATION });
    expect(Object.keys(ctx.allOutputs)).toHaveLength(3);
  });
});
