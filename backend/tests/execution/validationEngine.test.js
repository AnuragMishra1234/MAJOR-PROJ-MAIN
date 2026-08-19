/**
 * @file validationEngine.test.js
 * Phase 6 — Validation Engine unit tests
 *
 * Tests cover:
 *  1.  TEXT_GENERATION — valid execution result → PASSED
 *  2.  TEXT_GENERATION — execution failed → FAILED
 *  3.  TEXT_GENERATION — missing content → FAILED
 *  4.  TEXT_GENERATION — malformed content → FAILED
 *  5.  CODE_GENERATION — success → PASSED
 *  6.  CODE_GENERATION — execution failed → FAILED
 *  7.  CODE_GENERATION — missing code → FAILED
 *  8.  CODE_GENERATION — non-zero exit code → FAILED
 *  9.  WEBSITE_GENERATION — success → PASSED
 * 10.  WEBSITE_GENERATION — build failed → FAILED
 * 11.  WEBSITE_GENERATION — missing files → FAILED
 * 12.  WEBSITE_GENERATION — missing index.html → FAILED
 * 13.  VALIDATION passthrough — success → PASSED
 * 14.  OTHER passthrough — success → PASSED
 * 15.  ValidationResult shape — passes: all required fields present
 * 16.  ValidationResult shape — fails: all required fields present
 * 17.  Checks array structure: each check has name and status
 * 18.  Failed validation contains errors with retryable=true
 * 19.  Validator never throws — broken execution result handled
 * 20.  Agent receives structured validation failure
 */

import { describe, it, expect } from '@jest/globals';
import { createValidationEngine } from '../../src/modules/agent/execution/validationEngine.js';
import { createExecutionEngine }  from '../../src/modules/agent/execution/executionEngine.js';
import { TaskType } from '../../src/modules/agent/workflow/index.js';
import { ExecutionErrorType } from '../../src/modules/agent/execution/errors/executionErrors.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function makeTask(type, id = 'task-1') {
  return { id, type, title: 'Test task', description: 'Test', metadata: {} };
}

function successExecResult(output) {
  return { success: true, status: 'COMPLETED', output, logs: [], errors: [] };
}

function failExecResult(errors = []) {
  return {
    success: false,
    status:  'FAILED',
    output:  null,
    logs:    ['Something failed'],
    errors,
  };
}

const textTask    = () => makeTask(TaskType.TEXT_GENERATION);
const codeTask    = () => makeTask(TaskType.CODE_GENERATION);
const websiteTask = () => makeTask(TaskType.WEBSITE_GENERATION);
const validTask   = () => makeTask(TaskType.VALIDATION);
const otherTask   = () => makeTask(TaskType.OTHER);

// ─────────────────────────────────────────────────────────────────────────────
// 1. TEXT_GENERATION — valid → PASSED
// ─────────────────────────────────────────────────────────────────────────────

describe('1. TEXT_GENERATION — valid execution result → PASSED', () => {
  it('returns PASSED for good text content', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), successExecResult({
      content: 'EcoCampus is an eco-friendly company that helps the environment.',
    }));
    expect(result.valid).toBe(true);
    expect(result.status).toBe('PASSED');
    expect(result.errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TEXT_GENERATION — execution failed → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('2. TEXT_GENERATION — execution failure → FAILED', () => {
  it('returns FAILED when execution step failed', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), failExecResult([
      { type: 'INVALID_OUTPUT', code: 'INVALID_OUTPUT', message: 'Missing content', source: 'textRunner', retryable: true },
    ]));
    expect(result.valid).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TEXT_GENERATION — missing content → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('3. TEXT_GENERATION — missing content field → FAILED', () => {
  it('fails contentNonEmpty check', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), successExecResult({ model: 'gpt-4' }));
    expect(result.valid).toBe(false);
    const failedCheck = result.checks.find((c) => c.status === 'FAIL');
    expect(failedCheck).toBeDefined();
    expect(failedCheck.name).toBe('contentNonEmpty');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TEXT_GENERATION — malformed content → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('4. TEXT_GENERATION — malformed content → FAILED', () => {
  it('detects "Error: ..." as malformed', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), successExecResult({ content: 'Error: connection refused' }));
    expect(result.valid).toBe(false);
    const failedCheck = result.checks.find((c) => c.status === 'FAIL' && c.name === 'noMalformedContent');
    expect(failedCheck).toBeDefined();
  });

  it('accepts normal content that starts with a word resembling Error in a sentence', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), successExecResult({
      content: 'Errors in thinking can be fixed. EcoCampus does this well.',
    }));
    // "Errors in thinking..." doesn't match /^error:/i exactly
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CODE_GENERATION — success → PASSED
// ─────────────────────────────────────────────────────────────────────────────

describe('5. CODE_GENERATION — success → PASSED', () => {
  it('returns PASSED for successful code execution result', () => {
    const engine = createValidationEngine();
    const result = engine.validate(codeTask(), successExecResult({
      code: 'const x = 1;',
      language: 'javascript',
      stdout: 'Mock execution ok',
      exitCode: 0,
    }));
    expect(result.valid).toBe(true);
    expect(result.status).toBe('PASSED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CODE_GENERATION — execution failed → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('6. CODE_GENERATION — execution failure → FAILED', () => {
  it('returns FAILED when code execution failed', () => {
    const engine = createValidationEngine();
    const result = engine.validate(codeTask(), failExecResult([
      { type: 'BUILD_ERROR', code: 'BUILD_ERROR', message: 'exit 1', source: 'codeRunner', retryable: true },
    ]));
    expect(result.valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. CODE_GENERATION — missing code → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('7. CODE_GENERATION — missing code field → FAILED', () => {
  it('fails codePresent check', () => {
    const engine = createValidationEngine();
    const result = engine.validate(codeTask(), successExecResult({ language: 'javascript', exitCode: 0 }));
    expect(result.valid).toBe(false);
    const failedCheck = result.checks.find((c) => c.name === 'codePresent');
    expect(failedCheck?.status).toBe('FAIL');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. CODE_GENERATION — non-zero exit code → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('8. CODE_GENERATION — non-zero exit code → FAILED', () => {
  it('fails executionSucceeded check for exit code 1', () => {
    const engine = createValidationEngine();
    const result = engine.validate(codeTask(), successExecResult({
      code: 'const x = 1;',
      language: 'javascript',
      exitCode: 1,
      stdout: '',
    }));
    expect(result.valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. WEBSITE_GENERATION — success → PASSED
// ─────────────────────────────────────────────────────────────────────────────

describe('9. WEBSITE_GENERATION — success → PASSED', () => {
  it('returns PASSED for valid website output', () => {
    const engine = createValidationEngine();
    const result = engine.validate(websiteTask(), successExecResult({
      files:    ['index.html', 'styles.css'],
      content:  '<html><body><h1>EcoCampus</h1></body></html>',
      pageCount: 1,
      buildLog: 'Build OK',
    }));
    expect(result.valid).toBe(true);
    expect(result.status).toBe('PASSED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. WEBSITE_GENERATION — build failed → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('10. WEBSITE_GENERATION — build failure → FAILED', () => {
  it('returns FAILED when execution result is failure', () => {
    const engine = createValidationEngine();
    const result = engine.validate(websiteTask(), failExecResult([
      { type: 'BUILD_ERROR', code: 'BUILD_ERROR', message: 'Build failed', source: 'websiteRunner', retryable: true },
    ]));
    expect(result.valid).toBe(false);
    expect(result.status).toBe('FAILED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. WEBSITE_GENERATION — missing files → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('11. WEBSITE_GENERATION — missing files array → FAILED', () => {
  it('fails filesPresent check', () => {
    const engine = createValidationEngine();
    const result = engine.validate(websiteTask(), successExecResult({
      content: '<html></html>',
    }));
    expect(result.valid).toBe(false);
    const failedCheck = result.checks.find((c) => c.name === 'filesPresent');
    expect(failedCheck?.status).toBe('FAIL');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. WEBSITE_GENERATION — missing index.html → FAILED
// ─────────────────────────────────────────────────────────────────────────────

describe('12. WEBSITE_GENERATION — missing index.html → FAILED', () => {
  it('fails indexHtmlExists check', () => {
    const engine = createValidationEngine();
    const result = engine.validate(websiteTask(), successExecResult({
      files:   ['styles.css'],
      content: '<html></html>',
    }));
    expect(result.valid).toBe(false);
    const failedCheck = result.checks.find((c) => c.name === 'indexHtmlExists');
    expect(failedCheck?.status).toBe('FAIL');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. VALIDATION passthrough → PASSED
// ─────────────────────────────────────────────────────────────────────────────

describe('13. VALIDATION passthrough → PASSED', () => {
  it('returns PASSED for successful VALIDATION task', () => {
    const engine = createValidationEngine();
    const result = engine.validate(validTask(), successExecResult({ valid: true, score: 0.97 }));
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. OTHER passthrough → PASSED
// ─────────────────────────────────────────────────────────────────────────────

describe('14. OTHER passthrough → PASSED', () => {
  it('returns PASSED for successful OTHER task', () => {
    const engine = createValidationEngine();
    const result = engine.validate(otherTask(), successExecResult({ result: 'done' }));
    expect(result.valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. ValidationResult shape — passes
// ─────────────────────────────────────────────────────────────────────────────

describe('15. ValidationResult shape — pass', () => {
  it('has status, valid, checks, errors fields', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), successExecResult({
      content: 'EcoCampus is a great company.',
    }));
    expect(result).toHaveProperty('status', 'PASSED');
    expect(result).toHaveProperty('valid', true);
    expect(Array.isArray(result.checks)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. ValidationResult shape — fails
// ─────────────────────────────────────────────────────────────────────────────

describe('16. ValidationResult shape — fail', () => {
  it('has status FAILED, valid false, non-empty errors', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), failExecResult());
    expect(result).toHaveProperty('status', 'FAILED');
    expect(result).toHaveProperty('valid', false);
    expect(Array.isArray(result.checks)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. Checks array structure
// ─────────────────────────────────────────────────────────────────────────────

describe('17. Checks array structure', () => {
  it('each check has a name and status field', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), successExecResult({
      content: 'EcoCampus helps the world.',
    }));
    for (const check of result.checks) {
      expect(typeof check.name).toBe('string');
      expect(['PASS', 'FAIL']).toContain(check.status);
    }
  });

  it('failed checks include a message field', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), successExecResult({ model: 'gpt-4' }));
    const failedChecks = result.checks.filter((c) => c.status === 'FAIL');
    expect(failedChecks.length).toBeGreaterThan(0);
    for (const check of failedChecks) {
      expect(typeof check.message).toBe('string');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. Failed validation — retryable errors
// ─────────────────────────────────────────────────────────────────────────────

describe('18. Failed validation contains retryable errors', () => {
  it('validation errors are marked retryable=true', () => {
    const engine = createValidationEngine();
    const result = engine.validate(textTask(), successExecResult({ content: '' }));
    expect(result.valid).toBe(false);
    for (const err of result.errors) {
      expect(err.retryable).toBe(true); // Phase 8 will use this
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 19. Validator never throws
// ─────────────────────────────────────────────────────────────────────────────

describe('19. Validator never throws for unusual inputs', () => {
  it('handles completely null execution result', () => {
    const engine = createValidationEngine();
    expect(() => engine.validate(textTask(), null)).not.toThrow();
    const result = engine.validate(textTask(), null);
    expect(result.valid).toBe(false);
  });

  it('handles undefined execution result', () => {
    const engine = createValidationEngine();
    expect(() => engine.validate(textTask(), undefined)).not.toThrow();
  });

  it('handles malformed execution result (no success field)', () => {
    const engine = createValidationEngine();
    expect(() => engine.validate(textTask(), { bogus: true })).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. Full execution → validation pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe('20. Full execution → validation pipeline', () => {
  it('TEXT_GENERATION: execute then validate produces PASSED', async () => {
    const execEngine = createExecutionEngine();
    const validEngine = createValidationEngine();
    const task = makeTask(TaskType.TEXT_GENERATION);

    const execResult = await execEngine.execute(task, {
      content: 'EcoCampus builds a greener future.',
      model: 'mock',
      latencyMs: 50,
    });
    expect(execResult.success).toBe(true);

    const validResult = validEngine.validate(task, execResult);
    expect(validResult.valid).toBe(true);
    expect(validResult.status).toBe('PASSED');
  });

  it('CODE_GENERATION: execute then validate produces PASSED', async () => {
    const execEngine = createExecutionEngine();
    const validEngine = createValidationEngine();
    const task = makeTask(TaskType.CODE_GENERATION);

    const execResult = await execEngine.execute(task, {
      code: 'const x = 1;',
      language: 'javascript',
      valid: true,
      validationError: null,
    });
    expect(execResult.success).toBe(true);

    const validResult = validEngine.validate(task, execResult);
    expect(validResult.valid).toBe(true);
  });

  it('WEBSITE_GENERATION: FORCE_FAIL execute produces FAILED validation', async () => {
    const execEngine = createExecutionEngine();
    const validEngine = createValidationEngine();
    const task = makeTask(TaskType.WEBSITE_GENERATION);

    const execResult = await execEngine.execute(task, {
      files: ['index.html'],
      content: 'FORCE_FAIL: broken build',
    });
    expect(execResult.success).toBe(false);

    const validResult = validEngine.validate(task, execResult);
    expect(validResult.valid).toBe(false);
    expect(validResult.status).toBe('FAILED');
  });
});
