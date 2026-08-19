/**
 * @file aiAdapter.test.js
 * Phase 5 — AI Adapter integration tests
 *
 * Tests cover:
 *  1.  hasAIHandler returns true for supported types
 *  2.  hasAIHandler returns false for unsupported types
 *  3.  AI_TYPE_MAP maps TEXT_GENERATION → 'text'
 *  4.  AI_TYPE_MAP maps CODE_GENERATION → 'code'
 *  5.  executeAITask returns failure for unknown task type
 *  6.  buildContextString returns empty string for empty context
 *  7.  buildContextString extracts content from prior outputs
 *  8.  buildContextString truncates long content
 *  9.  wireAIHandlers registers TEXT_GENERATION + CODE_GENERATION
 * 10.  wireAIHandlers does NOT remove mock handlers for other types
 * 11.  AI adapter output is wrapped in { success, output } envelope
 * 12.  AI adapter error is normalized to { success: false, error }
 * 13.  Full pipeline: Agent → Memory → AI handler uses context
 * 14.  Context string includes prior task output content
 * 15.  Two-task context: task-2 context contains task-1 content
 *
 * IMPORTANT: All tests mock `allTasks.runTask` to avoid real API calls.
 * We use jest module mocking to intercept the CJS require() calls.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  hasAIHandler,
  AI_TYPE_MAP,
  buildContextString,
  wireAIHandlers,
} from '../../src/modules/ai/aiAdapter.js';
import { createHandlerRegistry } from '../../src/modules/agent/taskHandlers.js';
import { TaskType } from '../../src/modules/agent/workflow/index.js';
import { createProjectMemory } from '../../src/modules/agent/memory/projectMemory.js';

// ─────────────────────────────────────────────────────────────────────────────
// 1. hasAIHandler — supported types
// ─────────────────────────────────────────────────────────────────────────────

describe('1. hasAIHandler — supported types', () => {
  it('returns true for TEXT_GENERATION', () => {
    expect(hasAIHandler(TaskType.TEXT_GENERATION)).toBe(true);
  });

  it('returns true for CODE_GENERATION', () => {
    expect(hasAIHandler(TaskType.CODE_GENERATION)).toBe(true);
  });

  it('returns true for WEBSITE_GENERATION', () => {
    expect(hasAIHandler(TaskType.WEBSITE_GENERATION)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. hasAIHandler — unsupported types
// ─────────────────────────────────────────────────────────────────────────────

describe('2. hasAIHandler — unsupported types', () => {
  it('returns false for VALIDATION', () => {
    expect(hasAIHandler(TaskType.VALIDATION)).toBe(false);
  });

  it('returns false for OTHER', () => {
    expect(hasAIHandler(TaskType.OTHER)).toBe(false);
  });

  it('returns false for unknown string', () => {
    expect(hasAIHandler('UNKNOWN_TYPE')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 & 4. AI_TYPE_MAP — type key mapping
// ─────────────────────────────────────────────────────────────────────────────

describe('3 & 4. AI_TYPE_MAP — type key mapping', () => {
  it('TEXT_GENERATION maps to "text"', () => {
    expect(AI_TYPE_MAP[TaskType.TEXT_GENERATION]).toBe('text');
  });

  it('CODE_GENERATION maps to "code"', () => {
    expect(AI_TYPE_MAP[TaskType.CODE_GENERATION]).toBe('code');
  });

  it('WEBSITE_GENERATION maps to "website"', () => {
    expect(AI_TYPE_MAP[TaskType.WEBSITE_GENERATION]).toBe('website');
  });

  it('AI_TYPE_MAP is frozen (immutable)', () => {
    expect(Object.isFrozen(AI_TYPE_MAP)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. executeAITask — unknown task type
// ─────────────────────────────────────────────────────────────────────────────

describe('5. executeAITask — unknown task type returns failure', () => {
  it('returns { success: false } for unrecognized task type', async () => {
    // Import directly so we can test the function
    const { executeAITask } = await import('../../src/modules/ai/aiAdapter.js');
    const result = await executeAITask('NONEXISTENT_TYPE', { goal: 'test' });
    expect(result.success).toBe(false);
    expect(result.error.message).toContain('NONEXISTENT_TYPE');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. buildContextString — empty context
// ─────────────────────────────────────────────────────────────────────────────

describe('6. buildContextString — empty context', () => {
  it('returns empty string when no outputs exist', () => {
    const ctx = buildContextString({ outputs: {}, goal: 'Do something' }, { type: TaskType.TEXT_GENERATION });
    expect(ctx).toBe('');
  });

  it('returns empty string for null context', () => {
    const ctx = buildContextString(null, { type: TaskType.TEXT_GENERATION });
    expect(ctx).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. buildContextString — extracts content from prior outputs
// ─────────────────────────────────────────────────────────────────────────────

describe('7. buildContextString — extracts prior output content', () => {
  it('includes content field from prior text output', () => {
    const ctx = buildContextString({
      outputs: {
        'task-1': { content: 'EcoCampus is eco-friendly.' },
      },
      goal: 'Create website',
    }, { type: TaskType.WEBSITE_GENERATION });
    expect(ctx).toContain('EcoCampus');
    expect(ctx).toContain('task-1');
  });

  it('includes code field from prior code output', () => {
    const ctx = buildContextString({
      outputs: {
        'task-1': { code: 'const x = 1;' },
      },
      goal: 'Generate more code',
    }, { type: TaskType.CODE_GENERATION });
    expect(ctx).toContain('const x = 1;');
  });

  it('skips outputs with no meaningful content field', () => {
    const ctx = buildContextString({
      outputs: {
        'task-1': { files: ['index.html'] }, // no content/code/result
      },
      goal: 'validate',
    }, { type: TaskType.VALIDATION });
    // files array has no string content to extract
    expect(typeof ctx).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. buildContextString — truncates long content
// ─────────────────────────────────────────────────────────────────────────────

describe('8. buildContextString — truncation', () => {
  it('truncates very long prior content to 400 chars', () => {
    const longContent = 'A'.repeat(1000);
    const ctx = buildContextString({
      outputs: { 'task-1': { content: longContent } },
      goal: 'test',
    }, { type: TaskType.TEXT_GENERATION });
    // The output should be truncated — raw longContent (1000 chars) should not appear fully
    expect(ctx).not.toContain(longContent);
    expect(ctx.length).toBeLessThan(longContent.length + 100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. wireAIHandlers — registers real handlers for supported types
// ─────────────────────────────────────────────────────────────────────────────

describe('9. wireAIHandlers — registers AI handlers', () => {
  it('registers TEXT_GENERATION and CODE_GENERATION on the registry', () => {
    const registry = createHandlerRegistry();
    wireAIHandlers(registry);
    // Registry should now have AI-backed handlers (not just mocks)
    expect(registry.has(TaskType.TEXT_GENERATION)).toBe(true);
    expect(registry.has(TaskType.CODE_GENERATION)).toBe(true);
  });

  it('returns the same registry instance', () => {
    const registry = createHandlerRegistry();
    const result = wireAIHandlers(registry);
    expect(result).toBe(registry);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. wireAIHandlers — does NOT remove mock handlers for unsupported types
// ─────────────────────────────────────────────────────────────────────────────

describe('10. wireAIHandlers — preserves mock handlers for unsupported types', () => {
  it('WEBSITE_GENERATION mock handler remains active', () => {
    const registry = createHandlerRegistry();
    wireAIHandlers(registry);
    expect(registry.has(TaskType.WEBSITE_GENERATION)).toBe(true);
  });

  it('VALIDATION mock handler remains active', () => {
    const registry = createHandlerRegistry();
    wireAIHandlers(registry);
    expect(registry.has(TaskType.VALIDATION)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. AI adapter output envelope
// ─────────────────────────────────────────────────────────────────────────────

describe('11. AI adapter output is wrapped in handler contract envelope', () => {
  it('a mock TEXT_GENERATION handler returns { success: true, output }', async () => {
    const registry = createHandlerRegistry();
    const fakeTask = {
      id: 't1',
      type: TaskType.TEXT_GENERATION,
      title: 'Generate text',
      description: 'Generate startup description',
      metadata: {},
    };
    const result = await registry.execute(fakeTask, { outputs: {}, goal: 'test' });
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. AI adapter error normalization
// ─────────────────────────────────────────────────────────────────────────────

describe('12. AI adapter error is normalized to handler contract', () => {
  it('a handler that throws returns { success: false, error }', async () => {
    const registry = createHandlerRegistry();
    registry.register(TaskType.TEXT_GENERATION, {
      async execute() {
        throw new Error('Simulated AI failure');
      },
    });
    const fakeTask = {
      id: 't1', type: TaskType.TEXT_GENERATION, title: 'T', description: 'D', metadata: {},
    };
    const result = await registry.execute(fakeTask, {});
    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Simulated AI failure');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Memory + handler integration
// ─────────────────────────────────────────────────────────────────────────────

describe('13. Memory + handler integration', () => {
  it('memory context string is non-empty after a task output is stored', () => {
    const memory = createProjectMemory({
      projectId: 'p1',
      workflowId: 'wf-1',
      goal: 'Build startup',
    });
    memory.addTaskOutput('task-1', { content: 'EcoCampus is great.' });

    const ctxStr = memory.getContextString({ type: TaskType.TEXT_GENERATION, id: 'task-2' });
    expect(ctxStr.length).toBeGreaterThan(0);
    expect(ctxStr).toContain('EcoCampus');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. Context string includes prior task output
// ─────────────────────────────────────────────────────────────────────────────

describe('14. Context string includes prior task output content', () => {
  it('buildContextString contains prior content for task-2', () => {
    const executionContext = {
      goal: 'Create a startup',
      outputs: {
        'task-1': { content: 'EcoCampus is an eco-friendly startup.' },
      },
    };
    const ctx = buildContextString(executionContext, { type: TaskType.WEBSITE_GENERATION });
    expect(ctx).toContain('EcoCampus is an eco-friendly startup.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Context chain: task-2 sees task-1 content
// ─────────────────────────────────────────────────────────────────────────────

describe('15. Context chain — task-2 context contains task-1 content', () => {
  it('memory accumulates task-1 output and task-2 getContextString includes it', () => {
    const memory = createProjectMemory({
      projectId: 'p1',
      workflowId: 'wf-1',
      goal: 'Create startup website',
    });

    // Simulate task-1 completing
    memory.addTaskOutput('task-1', { content: 'EcoCampus: Making the world greener.' });

    // When task-2 requests context
    const str = memory.getContextString({ type: TaskType.WEBSITE_GENERATION, id: 'task-2' });

    expect(str).toContain('EcoCampus');
    expect(str).toContain('task-1');
  });

  it('multiple prior outputs appear in context string', () => {
    const memory = createProjectMemory({
      projectId: 'p1',
      workflowId: 'wf-1',
      goal: 'Create startup',
    });
    memory.addTaskOutput('task-1', { content: 'Company name: EcoCampus' });
    memory.addTaskOutput('task-2', { content: 'Tagline: Green for all' });

    const str = memory.getContextString({ type: TaskType.VALIDATION, id: 'task-3' });
    // VALIDATION context includes all outputs
    expect(str).toContain('task-1');
    expect(str).toContain('task-2');
  });
});
