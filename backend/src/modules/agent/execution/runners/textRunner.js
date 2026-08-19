/**
 * @file textRunner.js
 * @module agent/execution/runners
 *
 * Runner for TEXT_GENERATION tasks.
 *
 * Text outputs don't require code execution — they require structural
 * and content validation only. This runner checks that the AI module
 * returned usable text before the ValidationEngine does its full check.
 *
 * OUTPUT CONTRACT (from Person 3's textGenerator.generate()):
 *   { content: string, model: string, latencyMs: number }
 */

import {
  ExecutionErrorType,
  invalidOutputError,
  normalizeExecutionError,
} from '../errors/executionErrors.js';

const SOURCE = 'textRunner';

// ─────────────────────────────────────────────────────────────────────────────
// TEXT RUNNER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run structural checks on a TEXT_GENERATION output.
 *
 * No external execution is performed — text generation produces prose,
 * not executable artifacts.
 *
 * @param {object} task   - Task snapshot from WorkflowEngine.
 * @param {object} output - Raw output from the AI handler.
 * @returns {Promise<ExecutionResult>}
 */
async function run(task, output) {
  const logs = [];

  logs.push(`[textRunner] Running for task "${task.id}" (${task.type})`);

  // ── Check 1: output exists ──────────────────────────────────────────────
  if (!output || typeof output !== 'object') {
    const err = invalidOutputError(task.type, 'Output is null or not an object.', SOURCE);
    logs.push(`[textRunner] FAIL: ${err.message}`);
    return createFailureResult([err], logs);
  }

  // ── Check 2: content field present ─────────────────────────────────────
  if (typeof output.content !== 'string') {
    const err = invalidOutputError(task.type, 'Missing or non-string "content" field.', SOURCE);
    logs.push(`[textRunner] FAIL: ${err.message}`);
    return createFailureResult([err], logs);
  }

  // ── Check 3: content is non-empty ──────────────────────────────────────
  if (output.content.trim().length === 0) {
    const err = invalidOutputError(task.type, '"content" field is an empty string.', SOURCE);
    logs.push(`[textRunner] FAIL: ${err.message}`);
    return createFailureResult([err], logs);
  }

  logs.push(`[textRunner] PASS: content present (${output.content.length} chars)`);

  return createSuccessResult(
    {
      content:    output.content,
      wordCount:  output.wordCount ?? output.content.split(/\s+/).filter(Boolean).length,
      model:      output.model ?? null,
      latencyMs:  output.latencyMs ?? null,
    },
    logs,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function createSuccessResult(output, logs) {
  return { success: true,  status: 'COMPLETED', output, logs, errors: [] };
}

function createFailureResult(errors, logs) {
  return {
    success: false,
    status:  'FAILED',
    output:  null,
    logs,
    errors:  errors.map((e) => (e?.toJSON ? e.toJSON() : normalizeExecutionError(e, SOURCE))),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a TextRunner instance.
 * @returns {{ run: function }}
 */
export function createTextRunner() {
  return { run };
}
