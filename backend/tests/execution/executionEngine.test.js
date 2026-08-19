/**
 * @file executionEngine.test.js
 * Phase 6 — Execution Engine + Runner unit tests
 *
 * Tests cover:
 *  1.  TEXT_GENERATION success
 *  2.  TEXT_GENERATION missing content field
 *  3.  TEXT_GENERATION empty content
 *  4.  CODE_GENERATION success (mock sandbox)
 *  5.  CODE_GENERATION syntax error (Person 3 valid=false)
 *  6.  CODE_GENERATION missing code field
 *  7.  CODE_GENERATION FORCE_FAIL sandbox simulation
 *  8.  WEBSITE_GENERATION success
 *  9.  WEBSITE_GENERATION missing files array
 * 10.  WEBSITE_GENERATION missing index.html
 * 11.  WEBSITE_GENERATION FORCE_FAIL build simulation
 * 12.  VALIDATION passthrough (no execution)
 * 13.  OTHER passthrough (no execution)
 * 14.  requiresExecution returns correct booleans
 * 15.  Execution engine result shape is always consistent
 * 16.  No unsafe host execution (mock sandbox used)
 * 17.  Custom sandbox injection works
 * 18.  Null output handled gracefully
 * 19.  Missing required file triggers MISSING_FILE error
 * 20.  ExecutionResult errors are serializable plain objects
 */

import { describe, it, expect } from '@jest/globals';
import { createExecutionEngine } from '../../src/modules/agent/execution/executionEngine.js';
import { createTextRunner }    from '../../src/modules/agent/execution/runners/textRunner.js';
import { createCodeRunner, MockSandbox }        from '../../src/modules/agent/execution/runners/codeRunner.js';
import { createWebsiteRunner, MockBuildSandbox } from '../../src/modules/agent/execution/runners/websiteRunner.js';
import { TaskType } from '../../src/modules/agent/workflow/index.js';
import { ExecutionErrorType } from '../../src/modules/agent/execution/errors/executionErrors.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function makeTask(type, overrides = {}) {
  return { id: 'task-1', type, title: 'Test task', description: 'Test', metadata: {}, ...overrides };
}

const textTask    = () => makeTask(TaskType.TEXT_GENERATION);
const codeTask    = () => makeTask(TaskType.CODE_GENERATION);
const websiteTask = () => makeTask(TaskType.WEBSITE_GENERATION);
const validTask   = () => makeTask(TaskType.VALIDATION);
const otherTask   = () => makeTask(TaskType.OTHER);

const goodText    = { content: 'EcoCampus is an eco-friendly company.', model: 'gpt-4', latencyMs: 200 };
const goodCode    = { code: 'const x = 1;', language: 'javascript', valid: true, validationError: null };
const goodWebsite = { files: ['index.html', 'styles.css'], content: '<html><body>Site</body></html>', pageCount: 1 };

// ─────────────────────────────────────────────────────────────────────────────
// 1. TEXT_GENERATION success
// ─────────────────────────────────────────────────────────────────────────────

describe('1. TEXT_GENERATION — success', () => {
  it('returns success result with content and metadata', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(textTask(), goodText);
    expect(result.success).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(result.output.content).toBe(goodText.content);
    expect(result.errors).toHaveLength(0);
  });

  it('result has logs array', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(textTask(), goodText);
    expect(Array.isArray(result.logs)).toBe(true);
    expect(result.logs.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TEXT_GENERATION missing content
// ─────────────────────────────────────────────────────────────────────────────

describe('2. TEXT_GENERATION — missing content field', () => {
  it('returns failure with INVALID_OUTPUT error', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(textTask(), { model: 'gpt-4' }); // no content
    expect(result.success).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errors[0].type).toBe(ExecutionErrorType.INVALID_OUTPUT);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TEXT_GENERATION empty content
// ─────────────────────────────────────────────────────────────────────────────

describe('3. TEXT_GENERATION — empty content string', () => {
  it('returns INVALID_OUTPUT failure', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(textTask(), { content: '   ' });
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.INVALID_OUTPUT);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. CODE_GENERATION success
// ─────────────────────────────────────────────────────────────────────────────

describe('4. CODE_GENERATION — success (mock sandbox)', () => {
  it('returns success result with code and stdout', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(codeTask(), goodCode);
    expect(result.success).toBe(true);
    expect(result.output.code).toBe(goodCode.code);
    expect(result.output.exitCode).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CODE_GENERATION syntax error (Person 3 valid=false)
// ─────────────────────────────────────────────────────────────────────────────

describe('5. CODE_GENERATION — Person 3 syntax validation error', () => {
  it('returns SYNTAX_ERROR when valid=false', async () => {
    const engine = createExecutionEngine();
    const badCode = { code: 'const x = ;', language: 'javascript', valid: false, validationError: 'Unexpected token' };
    const result = await engine.execute(codeTask(), badCode);
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.SYNTAX_ERROR);
    expect(result.errors[0].retryable).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CODE_GENERATION missing code
// ─────────────────────────────────────────────────────────────────────────────

describe('6. CODE_GENERATION — missing code field', () => {
  it('returns INVALID_OUTPUT failure', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(codeTask(), { language: 'javascript', valid: true });
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.INVALID_OUTPUT);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. CODE_GENERATION FORCE_FAIL sandbox
// ─────────────────────────────────────────────────────────────────────────────

describe('7. CODE_GENERATION — FORCE_FAIL sandbox simulation', () => {
  it('returns BUILD_ERROR when sandbox simulates runtime failure', async () => {
    const engine = createExecutionEngine();
    const failCode = { code: 'FORCE_FAIL\nconsole.log("x")', language: 'javascript', valid: true, validationError: null };
    const result = await engine.execute(codeTask(), failCode);
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.BUILD_ERROR);
    expect(result.errors[0].retryable).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. WEBSITE_GENERATION success
// ─────────────────────────────────────────────────────────────────────────────

describe('8. WEBSITE_GENERATION — success', () => {
  it('returns success with files and build log', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(websiteTask(), goodWebsite);
    expect(result.success).toBe(true);
    expect(result.output.files).toContain('index.html');
    expect(result.output.buildLog).toBeDefined();
    expect(result.errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. WEBSITE_GENERATION missing files
// ─────────────────────────────────────────────────────────────────────────────

describe('9. WEBSITE_GENERATION — missing files array', () => {
  it('returns INVALID_OUTPUT failure', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(websiteTask(), { content: '<html></html>' });
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.INVALID_OUTPUT);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. WEBSITE_GENERATION missing index.html
// ─────────────────────────────────────────────────────────────────────────────

describe('10. WEBSITE_GENERATION — missing index.html', () => {
  it('returns MISSING_FILE failure', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(websiteTask(), {
      files: ['styles.css', 'app.js'],  // no index.html
      content: '<html></html>',
    });
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.MISSING_FILE);
    expect(result.errors[0].retryable).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. WEBSITE_GENERATION FORCE_FAIL build
// ─────────────────────────────────────────────────────────────────────────────

describe('11. WEBSITE_GENERATION — FORCE_FAIL build simulation', () => {
  it('returns BUILD_ERROR when build sandbox simulates failure', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(websiteTask(), {
      files: ['index.html'],
      content: 'FORCE_FAIL: build error content',
    });
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.BUILD_ERROR);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. VALIDATION passthrough
// ─────────────────────────────────────────────────────────────────────────────

describe('12. VALIDATION — passthrough (no runner)', () => {
  it('returns success with the raw output unchanged', async () => {
    const engine = createExecutionEngine();
    const output = { valid: true, score: 0.97 };
    const result = await engine.execute(validTask(), output);
    expect(result.success).toBe(true);
    expect(result.output.valid).toBe(true);
    expect(result.output.score).toBe(0.97);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. OTHER passthrough
// ─────────────────────────────────────────────────────────────────────────────

describe('13. OTHER — passthrough (no runner)', () => {
  it('returns success with raw output', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(otherTask(), { result: 'done' });
    expect(result.success).toBe(true);
    expect(result.output.result).toBe('done');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. requiresExecution
// ─────────────────────────────────────────────────────────────────────────────

describe('14. requiresExecution returns correct booleans', () => {
  const engine = createExecutionEngine();

  it('returns true for TEXT_GENERATION', () => {
    expect(engine.requiresExecution(TaskType.TEXT_GENERATION)).toBe(true);
  });
  it('returns true for CODE_GENERATION', () => {
    expect(engine.requiresExecution(TaskType.CODE_GENERATION)).toBe(true);
  });
  it('returns true for WEBSITE_GENERATION', () => {
    expect(engine.requiresExecution(TaskType.WEBSITE_GENERATION)).toBe(true);
  });
  it('returns false for VALIDATION', () => {
    expect(engine.requiresExecution(TaskType.VALIDATION)).toBe(false);
  });
  it('returns false for OTHER', () => {
    expect(engine.requiresExecution(TaskType.OTHER)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. Result shape consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('15. ExecutionResult shape is always consistent', () => {
  it('success result has all required fields', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(textTask(), goodText);
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('output');
    expect(result).toHaveProperty('logs');
    expect(result).toHaveProperty('errors');
  });

  it('failure result has all required fields', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(textTask(), null);
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('status', 'FAILED');
    expect(result).toHaveProperty('output', null);
    expect(result).toHaveProperty('logs');
    expect(result).toHaveProperty('errors');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. No unsafe host execution
// ─────────────────────────────────────────────────────────────────────────────

describe('16. No unsafe host execution (mock sandbox)', () => {
  it('code runner uses MockSandbox by default (no child_process)', async () => {
    // MockSandbox.execute is a pure function — never calls system exec
    const result = await MockSandbox.execute('const x = 1;', 'javascript');
    expect(result.success).toBe(true);
    expect(typeof result.stdout).toBe('string');
  });

  it('MockSandbox FORCE_FAIL does not crash the process', async () => {
    const result = await MockSandbox.execute('FORCE_FAIL code', 'javascript');
    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. Custom sandbox injection
// ─────────────────────────────────────────────────────────────────────────────

describe('17. Custom sandbox injection', () => {
  it('accepts a custom sandbox provider and uses it', async () => {
    let wasCalled = false;
    const customSandbox = {
      async execute(code, language) {
        wasCalled = true;
        return { success: true, stdout: `Custom: ${code.length}`, stderr: '', exitCode: 0 };
      },
    };

    const runner = createCodeRunner({ sandbox: customSandbox });
    const result = await runner.run(codeTask(), goodCode);
    expect(result.success).toBe(true);
    expect(wasCalled).toBe(true);
    expect(result.output.stdout).toContain('Custom:');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. Null output handled gracefully
// ─────────────────────────────────────────────────────────────────────────────

describe('18. Null output handled gracefully', () => {
  it('text runner returns failure for null output (not a crash)', async () => {
    const runner = createTextRunner();
    const result = await runner.run(textTask(), null);
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.INVALID_OUTPUT);
  });

  it('code runner returns failure for null output (not a crash)', async () => {
    const runner = createCodeRunner();
    const result = await runner.run(codeTask(), null);
    expect(result.success).toBe(false);
  });

  it('website runner returns failure for null output (not a crash)', async () => {
    const runner = createWebsiteRunner();
    const result = await runner.run(websiteTask(), null);
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 19. Missing required file triggers MISSING_FILE
// ─────────────────────────────────────────────────────────────────────────────

describe('19. Missing required file triggers MISSING_FILE error', () => {
  it('custom requiredFiles respected', async () => {
    const runner = createWebsiteRunner({ requiredFiles: ['index.html', 'manifest.json'] });
    const result = await runner.run(websiteTask(), {
      files: ['index.html', 'styles.css'],
      content: '<html></html>',
    });
    expect(result.success).toBe(false);
    expect(result.errors[0].type).toBe(ExecutionErrorType.MISSING_FILE);
    expect(result.errors[0].details.filename).toBe('manifest.json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. Errors are serializable plain objects
// ─────────────────────────────────────────────────────────────────────────────

describe('20. ExecutionResult errors are serializable plain objects', () => {
  it('each error can be JSON.stringify-ed without circular refs', async () => {
    const engine = createExecutionEngine();
    const result = await engine.execute(codeTask(), { code: 'FORCE_FAIL', language: 'javascript', valid: true });
    const serialized = JSON.stringify(result.errors);
    const parsed = JSON.parse(serialized);
    expect(parsed[0].type).toBe(ExecutionErrorType.BUILD_ERROR);
    expect(typeof parsed[0].retryable).toBe('boolean');
  });
});
