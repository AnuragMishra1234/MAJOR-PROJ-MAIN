/**
 * @file taskResult.test.js
 * Tests for the Task Result contract
 * (createSuccessResult, createFailureResult, createRetryableFailureResult)
 */

import { describe, it, expect } from '@jest/globals';
import {
  createSuccessResult,
  createFailureResult,
  createRetryableFailureResult,
  WorkflowValidationError,
  TaskResultStatus,
  ErrorCode,
} from '../../src/modules/agent/workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS RESULT
// ─────────────────────────────────────────────────────────────────────────────

describe('createSuccessResult', () => {
  it('creates a success result with correct status', () => {
    const result = createSuccessResult({ data: 'Generated text' });
    expect(result.status).toBe(TaskResultStatus.COMPLETED);
  });

  it('includes the output payload', () => {
    const result = createSuccessResult({ data: 'Hello', metadata: { lang: 'en' } });
    expect(result.output.data).toBe('Hello');
    expect(result.output.metadata).toEqual({ lang: 'en' });
  });

  it('accepts optional top-level metadata', () => {
    const result = createSuccessResult(
      { data: 'content' },
      { tokensUsed: 100, provider: 'groq' },
    );
    expect(result.metadata).toEqual({ tokensUsed: 100, provider: 'groq' });
  });

  it('works without top-level metadata', () => {
    const result = createSuccessResult({ data: 42 });
    expect(result.metadata).toBeUndefined();
  });

  it('returns a frozen object', () => {
    const result = createSuccessResult({ data: 'x' });
    expect(() => { result.status = 'FAILED'; }).toThrow();
  });

  it('throws WorkflowValidationError when output has no data field', () => {
    expect(() =>
      createSuccessResult({ wrong: 'key' }),
    ).toThrow(WorkflowValidationError);
  });

  it('throws WorkflowValidationError when output is null', () => {
    expect(() =>
      createSuccessResult(null),
    ).toThrow(WorkflowValidationError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FAILURE RESULT
// ─────────────────────────────────────────────────────────────────────────────

describe('createFailureResult', () => {
  it('creates a failure result with correct status', () => {
    const result = createFailureResult({
      code: ErrorCode.EXECUTION_ERROR,
      message: 'Execution timed out',
    });
    expect(result.status).toBe(TaskResultStatus.FAILED);
  });

  it('includes the error code and message', () => {
    const result = createFailureResult({
      code: ErrorCode.INVALID_INPUT,
      message: 'Missing required field: projectId',
    });
    expect(result.error.code).toBe(ErrorCode.INVALID_INPUT);
    expect(result.error.message).toBe('Missing required field: projectId');
  });

  it('includes optional error details', () => {
    const result = createFailureResult({
      code: ErrorCode.UNKNOWN,
      message: 'Something failed',
      details: { line: 42, file: 'app.js' },
    });
    expect(result.error.details).toEqual({ line: 42, file: 'app.js' });
  });

  it('accepts a native Error object', () => {
    const err = new Error('Native error message');
    err.code = ErrorCode.TIMEOUT;

    const result = createFailureResult(err);
    expect(result.status).toBe(TaskResultStatus.FAILED);
    expect(result.error.message).toBe('Native error message');
    expect(result.error.code).toBe(ErrorCode.TIMEOUT);
  });

  it('accepts optional top-level metadata', () => {
    const result = createFailureResult(
      { code: ErrorCode.UNKNOWN, message: 'Oops' },
      { attempt: 3 },
    );
    expect(result.metadata).toEqual({ attempt: 3 });
  });

  it('returns a frozen object', () => {
    const result = createFailureResult({ code: ErrorCode.UNKNOWN, message: 'x' });
    expect(() => { result.status = 'COMPLETED'; }).toThrow();
  });

  it('throws WorkflowValidationError when message is missing', () => {
    expect(() =>
      createFailureResult({ code: ErrorCode.UNKNOWN }),
    ).toThrow(WorkflowValidationError);
  });

  it('defaults code to UNKNOWN when code is missing from a plain error object', () => {
    // normaliseError() fills in ErrorCode.UNKNOWN for missing codes —
    // this is intentional so callers don't have to always specify a code.
    const result = createFailureResult({ message: 'Error without a code' });
    expect(result.status).toBe(TaskResultStatus.FAILED);
    expect(result.error.code).toBe(ErrorCode.UNKNOWN);
  });

  it('throws WorkflowValidationError when code is an empty string', () => {
    expect(() =>
      createFailureResult({ code: '', message: 'Has empty code' }),
    ).toThrow(WorkflowValidationError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RETRYABLE FAILURE RESULT
// ─────────────────────────────────────────────────────────────────────────────

describe('createRetryableFailureResult', () => {
  it('creates a retryable failure with correct status', () => {
    const result = createRetryableFailureResult({
      code: ErrorCode.TIMEOUT,
      message: 'AI provider timed out after 30s',
    });
    expect(result.status).toBe(TaskResultStatus.RETRYABLE_FAILURE);
  });

  it('includes the error code and message', () => {
    const result = createRetryableFailureResult({
      code: ErrorCode.TIMEOUT,
      message: 'Rate limit exceeded',
    });
    expect(result.error.code).toBe(ErrorCode.TIMEOUT);
    expect(result.error.message).toBe('Rate limit exceeded');
  });

  it('differs from a permanent failure by status', () => {
    const retryable = createRetryableFailureResult({
      code: ErrorCode.TIMEOUT,
      message: 'Timed out',
    });
    const permanent = createFailureResult({
      code: ErrorCode.EXECUTION_ERROR,
      message: 'Bad code',
    });

    expect(retryable.status).not.toBe(permanent.status);
    expect(retryable.status).toBe(TaskResultStatus.RETRYABLE_FAILURE);
    expect(permanent.status).toBe(TaskResultStatus.FAILED);
  });

  it('accepts a native Error object', () => {
    const err = new Error('Transient network failure');
    const result = createRetryableFailureResult(err);
    expect(result.status).toBe(TaskResultStatus.RETRYABLE_FAILURE);
    expect(result.error.message).toBe('Transient network failure');
  });

  it('returns a frozen object', () => {
    const result = createRetryableFailureResult({
      code: ErrorCode.TIMEOUT,
      message: 'Timed out',
    });
    expect(() => { result.status = 'FAILED'; }).toThrow();
  });

  it('throws WorkflowValidationError when message is missing', () => {
    expect(() =>
      createRetryableFailureResult({ code: ErrorCode.TIMEOUT }),
    ).toThrow(WorkflowValidationError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DISCRIMINATED UNION — consumer switch pattern
// ─────────────────────────────────────────────────────────────────────────────

describe('task result — consumer switch pattern', () => {
  it('correctly discriminates all three result statuses', () => {
    const results = [
      createSuccessResult({ data: 'ok' }),
      createFailureResult({ code: ErrorCode.UNKNOWN, message: 'fail' }),
      createRetryableFailureResult({ code: ErrorCode.TIMEOUT, message: 'retry' }),
    ];

    const statuses = results.map((r) => r.status);

    expect(statuses).toContain(TaskResultStatus.COMPLETED);
    expect(statuses).toContain(TaskResultStatus.FAILED);
    expect(statuses).toContain(TaskResultStatus.RETRYABLE_FAILURE);
  });
});
