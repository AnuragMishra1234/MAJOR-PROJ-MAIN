/**
 * @file codeRunner.js
 * @module agent/execution/runners
 *
 * Runner for CODE_GENERATION tasks.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SECURITY — CRITICAL
 * ═══════════════════════════════════════════════════════════════════════════
 * Generated code is NEVER executed directly on the host.
 * This runner uses a pluggable SandboxProvider interface.
 *
 * Phase 6: uses a MockSandbox that simulates execution without running code.
 * Phase N: replace with a real isolated container/sandbox via:
 *   createCodeRunner({ sandbox: realSandboxProvider })
 *
 * The SandboxProvider interface:
 *   sandbox.execute(code, language, options)
 *     → Promise<{ success, stdout, stderr, exitCode, error? }>
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * AI OUTPUT CONTRACT (Person 3's codeGenerator.generate()):
 *   { code: string, language: string, valid: boolean,
 *     validationError: string|null, model: string, latencyMs: number }
 *
 * Person 3 already performs JS syntax validation — we preserve and surface
 * that result rather than re-running it.
 */

import {
  invalidOutputError,
  syntaxError,
  buildError,
  normalizeExecutionError,
} from '../errors/executionErrors.js';

const SOURCE = 'codeRunner';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK SANDBOX (Phase 6 default)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mock sandbox — simulates code execution without running anything on the host.
 *
 * Behaviour:
 *   • If code contains the string "FORCE_FAIL" → simulates a runtime error.
 *   • Otherwise → simulates successful execution.
 *
 * This lets tests drive both success and failure paths without unsafe exec().
 *
 * SECURITY: This mock never calls eval(), exec(), child_process, or vm.
 */
export const MockSandbox = {
  /**
   * @param {string} code
   * @param {string} language
   * @param {object} [_options]
   * @returns {Promise<{ success: boolean, stdout: string, stderr: string, exitCode: number, error?: string }>}
   */
  async execute(code, language, _options = {}) {
    // Simulate async execution delay
    await new Promise((r) => setTimeout(r, 0));

    // Test hook: allow tests to simulate failure
    if (typeof code === 'string' && code.includes('FORCE_FAIL')) {
      return {
        success:  false,
        stdout:   '',
        stderr:   'Simulated runtime error: forced failure.',
        exitCode: 1,
        error:    'Simulated runtime error: forced failure.',
      };
    }

    return {
      success:  true,
      stdout:   `[MockSandbox] Executed ${language} code successfully (${code.length} bytes).`,
      stderr:   '',
      exitCode: 0,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CODE RUNNER
// ─────────────────────────────────────────────────────────────────────────────

class CodeRunner {
  #sandbox;

  /**
   * @param {object} sandbox - A SandboxProvider implementing execute().
   */
  constructor(sandbox = MockSandbox) {
    this.#sandbox = sandbox;
  }

  /**
   * Run a CODE_GENERATION task output through the sandbox.
   *
   * @param {object} task   - Task snapshot.
   * @param {object} output - AI module output: { code, language, valid, validationError, ... }
   * @returns {Promise<ExecutionResult>}
   */
  async run(task, output) {
    const logs = [];
    logs.push(`[codeRunner] Running for task "${task.id}" (${task.type})`);

    // ── Check 1: output exists ────────────────────────────────────────────
    if (!output || typeof output !== 'object') {
      const err = invalidOutputError(task.type, 'Output is null or not an object.', SOURCE);
      logs.push(`[codeRunner] FAIL: ${err.message}`);
      return this.#fail([err], logs);
    }

    // ── Check 2: code field present and non-empty ─────────────────────────
    if (typeof output.code !== 'string' || output.code.trim().length === 0) {
      const err = invalidOutputError(task.type, 'Missing or empty "code" field.', SOURCE);
      logs.push(`[codeRunner] FAIL: ${err.message}`);
      return this.#fail([err], logs);
    }

    // ── Check 3: Person 3's syntax validation result ──────────────────────
    // Person 3's codeGenerator already validates JS syntax. Preserve that result.
    if (output.valid === false && output.validationError) {
      const err = syntaxError(
        `Syntax validation failed: ${output.validationError}`,
        { validationError: output.validationError, language: output.language },
        SOURCE,
      );
      logs.push(`[codeRunner] FAIL: ${err.message}`);
      return this.#fail([err], logs);
    }

    logs.push(`[codeRunner] Syntax check: PASS (language: ${output.language ?? 'unknown'})`);

    // ── Check 4: Sandbox execution ────────────────────────────────────────
    let sandboxResult;
    try {
      sandboxResult = await this.#sandbox.execute(
        output.code,
        output.language ?? 'javascript',
        { taskId: task.id },
      );
    } catch (err) {
      const execErr = buildError(
        `Sandbox execution threw: ${err.message}`,
        { originalError: err.message },
        SOURCE,
      );
      logs.push(`[codeRunner] FAIL: ${execErr.message}`);
      return this.#fail([execErr], logs);
    }

    if (sandboxResult.stdout) logs.push(sandboxResult.stdout);
    if (sandboxResult.stderr) logs.push(`[stderr] ${sandboxResult.stderr}`);

    if (!sandboxResult.success) {
      const err = buildError(
        `Code execution failed (exit ${sandboxResult.exitCode}): ${sandboxResult.error ?? sandboxResult.stderr}`,
        { exitCode: sandboxResult.exitCode, stderr: sandboxResult.stderr },
        SOURCE,
      );
      logs.push(`[codeRunner] FAIL: ${err.message}`);
      return this.#fail([err], logs);
    }

    logs.push(`[codeRunner] PASS: execution successful`);

    return this.#success(
      {
        code:      output.code,
        language:  output.language ?? 'javascript',
        stdout:    sandboxResult.stdout,
        exitCode:  sandboxResult.exitCode,
        model:     output.model ?? null,
        latencyMs: output.latencyMs ?? null,
      },
      logs,
    );
  }

  #success(output, logs) {
    return { success: true,  status: 'COMPLETED', output, logs, errors: [] };
  }

  #fail(errors, logs) {
    return {
      success: false,
      status:  'FAILED',
      output:  null,
      logs,
      errors:  errors.map((e) => (e?.toJSON ? e.toJSON() : normalizeExecutionError(e, SOURCE))),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a CodeRunner.
 *
 * @param {object} [options]
 * @param {object} [options.sandbox] - Custom SandboxProvider (defaults to MockSandbox).
 * @returns {{ run: function }}
 *
 * @example
 * // Tests / Phase 6:
 * const runner = createCodeRunner();
 *
 * // Phase N (real sandbox):
 * const runner = createCodeRunner({ sandbox: dockerSandbox });
 */
export function createCodeRunner(options = {}) {
  return new CodeRunner(options.sandbox ?? MockSandbox);
}
