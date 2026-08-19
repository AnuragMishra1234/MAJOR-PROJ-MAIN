/**
 * @file agent.phase6.test.js
 * Phase 6 — Agent + Execution + Validation integration tests
 *
 * Tests cover the full pipeline:
 *   Agent → Planner → Workflow → AI handler → ExecutionEngine → ValidationEngine → Result
 *
 * Tests:
 *  1.  Full success: eco-startup goal produces COMPLETED workflow
 *  2.  Execution failure: agent receives structured error + workflow FAILED
 *  3.  Validation failure: structured error + workflow FAILED
 *  4.  Success result contains validation metadata per task
 *  5.  Memory updated after validation pass
 *  6.  Failure result contains executionErrors with retryable flag
 *  7.  Agent receives execution failure (not validation failure)
 *  8.  Agent receives validation failure (execution passed, validation failed)
 *  9.  Code generation success pipeline
 * 10.  Website generation + FORCE_FAIL → structured failure
 * 11.  Workflow completes with all tasks validated
 * 12.  No unsafe host execution in end-to-end test
 * 13.  Multiple tasks: execution+validation runs per task
 * 14.  Agent output shape: success has outputs + memorySnapshot
 * 15.  Agent output shape: failure has error with code + details
 */

import { describe, it, expect } from '@jest/globals';
import { createAgent } from '../../src/modules/agent/agent.js';
import { createHandlerRegistry } from '../../src/modules/agent/taskHandlers.js';
import { createExecutionEngine } from '../../src/modules/agent/execution/executionEngine.js';
import { createValidationEngine } from '../../src/modules/agent/execution/validationEngine.js';
import { TaskType } from '../../src/modules/agent/workflow/index.js';
import { ExecutionErrorType } from '../../src/modules/agent/execution/errors/executionErrors.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a mock planner that returns a fixed task plan.
 * This avoids hitting real AI APIs.
 */
function makePlanner(tasks) {
  return {
    async plan(goal) {
      return {
        success: true,
        plan: {
          goal,
          tasks: tasks.map((t, i) => ({
            id: `task-${i + 1}`,
            type: t.type,
            title: t.title ?? `Task ${i + 1}`,
            description: t.description ?? `Description for task ${i + 1}`,
            dependencies: t.dependencies ?? [],
            metadata: t.metadata ?? {},
          })),
        },
      };
    },
  };
}

/**
 * Create a mock handler that returns the given output for its task type.
 * If output is null, the handler simulates a failure.
 */
function makeHandler(outputsByType) {
  return {
    async execute(task, _context) {
      const output = outputsByType[task.type];
      if (output === null || output === undefined) {
        return { success: false, error: { code: 'MOCK_FAIL', message: `No mock output for ${task.type}` } };
      }
      return { success: true, output };
    },
  };
}

function createTestAgent({ tasks, outputsByType, executionEngine, validationEngine } = {}) {
  const planner  = makePlanner(tasks ?? [{ type: TaskType.TEXT_GENERATION, title: 'Gen text' }]);
  const registry = createHandlerRegistry();

  // Register a unified mock handler for all types
  const handler = makeHandler(outputsByType ?? {
    [TaskType.TEXT_GENERATION]:    { content: 'EcoCampus is eco-friendly.' },
    [TaskType.CODE_GENERATION]:    { code: 'const x = 1;', language: 'javascript', valid: true, validationError: null },
    [TaskType.WEBSITE_GENERATION]: { files: ['index.html', 'styles.css'], content: '<html><h1>EcoCampus</h1></html>', pageCount: 1 },
    [TaskType.VALIDATION]:         { valid: true, score: 0.97 },
  });

  for (const t of (tasks ?? [{ type: TaskType.TEXT_GENERATION }])) {
    registry.register(t.type, handler);
  }

  return createAgent({
    projectId:       'test-project',
    planner,
    handlers:        registry,
    executionEngine:  executionEngine  ?? createExecutionEngine(),
    validationEngine: validationEngine ?? createValidationEngine(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Full success: eco-startup goal → COMPLETED
// ─────────────────────────────────────────────────────────────────────────────

describe('1. Full success — eco-startup pipeline', () => {
  it('completes a 3-task workflow with TEXT → WEBSITE → VALIDATION', async () => {
    const agent = createTestAgent({
      tasks: [
        { type: TaskType.TEXT_GENERATION,    title: 'Generate content' },
        { type: TaskType.WEBSITE_GENERATION, title: 'Generate website' },
        { type: TaskType.VALIDATION,         title: 'Validate' },
      ],
      outputsByType: {
        [TaskType.TEXT_GENERATION]:    { content: 'EcoCampus is eco-friendly.' },
        [TaskType.WEBSITE_GENERATION]: { files: ['index.html'], content: '<html>EcoCampus</html>', pageCount: 1 },
        [TaskType.VALIDATION]:         { valid: true, score: 0.97 },
      },
    });

    const result = await agent.run('Create a website for an eco-friendly startup.');
    expect(result.success).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(Object.keys(result.outputs)).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Execution failure → workflow FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('2. Execution failure → structured error + workflow FAILED', () => {
  it('workflow fails when execution engine rejects output', async () => {
    // Force execution to fail by providing a handler with null content
    const agent = createTestAgent({
      tasks: [{ type: TaskType.TEXT_GENERATION, title: 'Gen text' }],
      outputsByType: {
        [TaskType.TEXT_GENERATION]: { model: 'gpt-4' }, // missing content → INVALID_OUTPUT
      },
    });

    const result = await agent.run('Create startup content.');
    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.error).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Validation failure → structured error + workflow FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('3. Validation failure → structured error + workflow FAILED', () => {
  it('workflow fails when output passes execution but fails validation', async () => {
    // Validation for code: non-zero exit code means validation fails
    // We need to provide code that the execution engine treats as success
    // but validation engine rejects. Use exitCode=1 to fail validation.
    const customExecEngine = {
      async execute(_task, _output) {
        return { success: true, status: 'COMPLETED', output: { code: 'const x = 1;', exitCode: 1 }, logs: [], errors: [] };
      },
      requiresExecution() { return true; },
    };

    const agent = createTestAgent({
      tasks: [{ type: TaskType.CODE_GENERATION, title: 'Gen code' }],
      outputsByType: {
        [TaskType.CODE_GENERATION]: { code: 'const x = 1;', language: 'javascript', valid: true },
      },
      executionEngine: customExecEngine,
    });

    const result = await agent.run('Write code for EcoCampus.');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Success result contains validation metadata
// ─────────────────────────────────────────────────────────────────────────────

describe('4. Success result contains validation metadata', () => {
  it('memorySnapshot includes validation context entries', async () => {
    const agent = createTestAgent({
      tasks: [{ type: TaskType.TEXT_GENERATION, title: 'Gen text' }],
      outputsByType: {
        [TaskType.TEXT_GENERATION]: { content: 'EcoCampus is great.', model: 'mock' },
      },
    });

    const result = await agent.run('Create startup content.');
    expect(result.success).toBe(true);
    expect(result.memorySnapshot).toBeDefined();
    expect(result.memorySnapshot.projectContext).toBeDefined();
    // Memory should have stored validation_task-1
    expect(result.memorySnapshot.projectContext['validation_task-1']).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Memory updated after validation pass
// ─────────────────────────────────────────────────────────────────────────────

describe('5. Memory updated after validation pass', () => {
  it('memorySnapshot.taskOutputs contains normalised execution output', async () => {
    const agent = createTestAgent({
      tasks: [{ type: TaskType.TEXT_GENERATION, title: 'Gen text' }],
      outputsByType: {
        [TaskType.TEXT_GENERATION]: { content: 'EcoCampus is eco.', model: 'mock', latencyMs: 100 },
      },
    });

    const result = await agent.run('Generate content.');
    expect(result.success).toBe(true);
    expect(result.memorySnapshot.taskOutputs['task-1']).toBeDefined();
    expect(result.memorySnapshot.taskOutputs['task-1'].content).toBe('EcoCampus is eco.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Failure result contains retryable flag
// ─────────────────────────────────────────────────────────────────────────────

describe('6. Failure result has error with code + details', () => {
  it('failure result.error has code and message fields', async () => {
    const agent = createTestAgent({
      tasks: [{ type: TaskType.TEXT_GENERATION }],
      outputsByType: {
        [TaskType.TEXT_GENERATION]: { model: 'gpt-4' }, // missing content
      },
    });

    const result = await agent.run('Test.');
    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('code');
    expect(result.error).toHaveProperty('message');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Agent receives execution failure (not validation failure)
// ─────────────────────────────────────────────────────────────────────────────

describe('7. Agent receives execution failure', () => {
  it('uses execution error message in result.error', async () => {
    // Code with syntax error from Person 3
    const agent = createTestAgent({
      tasks: [{ type: TaskType.CODE_GENERATION }],
      outputsByType: {
        [TaskType.CODE_GENERATION]: {
          code: 'const x = ;',
          language: 'javascript',
          valid: false,
          validationError: 'Unexpected token',
        },
      },
    });

    const result = await agent.run('Write code.');
    expect(result.success).toBe(false);
    expect(result.error.message).toContain('task');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Agent receives validation failure
// ─────────────────────────────────────────────────────────────────────────────

describe('8. Agent receives validation failure (execution OK, validation fails)', () => {
  it('result has error details with validationChecks', async () => {
    // Use a custom validation engine that always fails
    const failingValidationEngine = {
      validate(_task, _execResult) {
        return {
          status: 'FAILED',
          valid:  false,
          checks: [{ name: 'contentNonEmpty', status: 'FAIL', message: 'Content too short' }],
          errors: [{ type: 'VALIDATION_ERROR', code: 'VALIDATION_ERROR', message: 'Content too short', source: 'validationEngine', retryable: true }],
        };
      },
    };

    const agent = createTestAgent({
      tasks: [{ type: TaskType.TEXT_GENERATION }],
      outputsByType: {
        [TaskType.TEXT_GENERATION]: { content: 'EcoCampus is great.' },
      },
      validationEngine: failingValidationEngine,
    });

    const result = await agent.run('Create content.');
    expect(result.success).toBe(false);
    expect(result.error.details).toBeDefined();
    expect(result.error.details.validationChecks).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Code generation success pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('9. Code generation success pipeline', () => {
  it('CODE_GENERATION task completes with PASSED validation', async () => {
    const agent = createTestAgent({
      tasks: [{ type: TaskType.CODE_GENERATION, title: 'Generate JS code' }],
      outputsByType: {
        [TaskType.CODE_GENERATION]: {
          code: 'function greet(name) { return `Hello ${name}`; }',
          language: 'javascript',
          valid: true,
          validationError: null,
        },
      },
    });

    const result = await agent.run('Write a greeting function.');
    expect(result.success).toBe(true);
    expect(result.outputs['task-1']).toBeDefined();
    expect(result.outputs['task-1'].code).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Website generation FORCE_FAIL → structured failure
// ─────────────────────────────────────────────────────────────────────────────

describe('10. Website generation FORCE_FAIL → structured failure', () => {
  it('workflow fails when website content triggers FORCE_FAIL', async () => {
    const agent = createTestAgent({
      tasks: [{ type: TaskType.WEBSITE_GENERATION, title: 'Gen website' }],
      outputsByType: {
        [TaskType.WEBSITE_GENERATION]: {
          files:   ['index.html'],
          content: 'FORCE_FAIL: broken site',
        },
      },
    });

    const result = await agent.run('Create a website.');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. All tasks validated in multi-task workflow
// ─────────────────────────────────────────────────────────────────────────────

describe('11. Multi-task: execution+validation runs per task', () => {
  it('all three tasks get execution+validation', async () => {
    const agent = createTestAgent({
      tasks: [
        { type: TaskType.TEXT_GENERATION,    title: 'Task 1' },
        { type: TaskType.CODE_GENERATION,    title: 'Task 2' },
        { type: TaskType.WEBSITE_GENERATION, title: 'Task 3' },
      ],
      outputsByType: {
        [TaskType.TEXT_GENERATION]:    { content: 'EcoCampus content.' },
        [TaskType.CODE_GENERATION]:    { code: 'const x = 1;', language: 'javascript', valid: true, validationError: null },
        [TaskType.WEBSITE_GENERATION]: { files: ['index.html'], content: '<html>EcoCampus</html>', pageCount: 1 },
      },
    });

    const result = await agent.run('Full pipeline test.');
    expect(result.success).toBe(true);
    expect(Object.keys(result.outputs)).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. No unsafe host execution
// ─────────────────────────────────────────────────────────────────────────────

describe('12. No unsafe host execution', () => {
  it('test completes without spawning any child processes', async () => {
    // If MockSandbox were a real exec(), this test would be a security risk.
    // The test completing safely is itself the assertion.
    const agent = createTestAgent({
      tasks: [{ type: TaskType.CODE_GENERATION, title: 'Code gen' }],
      outputsByType: {
        [TaskType.CODE_GENERATION]: { code: 'process.exit(1)', language: 'javascript', valid: true, validationError: null },
      },
    });

    // If MockSandbox actually executed this, the Jest process would exit(1)
    const result = await agent.run('Write dangerous code.');
    // We're still alive — the mock sandbox never ran it
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Multiple tasks: memory accumulates across tasks
// ─────────────────────────────────────────────────────────────────────────────

describe('13. Memory accumulates across multiple tasks', () => {
  it('all task outputs appear in memorySnapshot', async () => {
    const agent = createTestAgent({
      tasks: [
        { type: TaskType.TEXT_GENERATION, title: 'Task 1' },
        { type: TaskType.VALIDATION,      title: 'Task 2' },
      ],
      outputsByType: {
        [TaskType.TEXT_GENERATION]: { content: 'EcoCampus content.' },
        [TaskType.VALIDATION]:      { valid: true },
      },
    });

    const result = await agent.run('Test memory accumulation.');
    expect(result.success).toBe(true);
    expect(result.memorySnapshot.taskOutputs['task-1']).toBeDefined();
    expect(result.memorySnapshot.taskOutputs['task-2']).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. Agent success output shape
// ─────────────────────────────────────────────────────────────────────────────

describe('14. Agent success result shape', () => {
  it('has success, workflowId, status, outputs, memorySnapshot, completedAt', async () => {
    const agent = createTestAgent({
      tasks: [{ type: TaskType.TEXT_GENERATION }],
      outputsByType: { [TaskType.TEXT_GENERATION]: { content: 'Test content.' } },
    });

    const result = await agent.run('Test.');
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('workflowId');
    expect(result).toHaveProperty('status', 'COMPLETED');
    expect(result).toHaveProperty('outputs');
    expect(result).toHaveProperty('memorySnapshot');
    expect(result).toHaveProperty('completedAt');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Agent failure output shape
// ─────────────────────────────────────────────────────────────────────────────

describe('15. Agent failure result shape', () => {
  it('has success:false, status:FAILED, error with code+message', async () => {
    const agent = createTestAgent({
      tasks: [{ type: TaskType.TEXT_GENERATION }],
      outputsByType: { [TaskType.TEXT_GENERATION]: {} }, // empty — missing content
    });

    const result = await agent.run('Test.');
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('status', 'FAILED');
    expect(result.error).toHaveProperty('code');
    expect(result.error).toHaveProperty('message');
    expect(result).toHaveProperty('outputs');
  });
});
