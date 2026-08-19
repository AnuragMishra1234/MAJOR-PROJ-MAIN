/**
 * @file websiteRunner.js
 * @module agent/execution/runners
 *
 * Runner for WEBSITE_GENERATION tasks.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SECURITY
 * ═══════════════════════════════════════════════════════════════════════════
 * Website build execution uses the same pluggable sandbox interface as
 * codeRunner. No arbitrary shell commands are executed on the host.
 * Phase 6 uses a MockBuildSandbox.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * AI OUTPUT CONTRACT (mock — Person 3 hasn't built WEBSITE_GENERATION yet):
 *   { files: string[], content: string, pageCount: number }
 *
 * When Person 3 builds real website generation, this runner will consume
 * whatever they return without modification to runner logic — only the
 * required-files list may need updating.
 */

import {
  invalidOutputError,
  missingFileError,
  buildError,
  normalizeExecutionError,
} from '../errors/executionErrors.js';

const SOURCE = 'websiteRunner';

/** Files that must be present in a valid website output. */
const REQUIRED_FILES = ['index.html'];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK BUILD SANDBOX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates a website build process without executing anything on the host.
 *
 * Behaviour:
 *   • If any file name contains "FORCE_FAIL" → simulates a build error.
 *   • Otherwise → simulates successful build.
 *
 * SECURITY: No child_process, no shell, no eval. Pure JS simulation.
 */
export const MockBuildSandbox = {
  /**
   * @param {string[]} files
   * @param {string}   content
   * @param {object}   [_options]
   * @returns {Promise<{ success: boolean, buildLog: string, errors: string[] }>}
   */
  async build(files, content, _options = {}) {
    await new Promise((r) => setTimeout(r, 0));

    const hasForceFailFile = files.some((f) => f.includes('FORCE_FAIL'));
    const hasForceFailContent = typeof content === 'string' && content.includes('FORCE_FAIL');

    if (hasForceFailFile || hasForceFailContent) {
      return {
        success:  false,
        buildLog: 'Build failed: simulated build error.',
        errors:   ['Simulated build error: FORCE_FAIL detected.'],
      };
    }

    return {
      success:  true,
      buildLog: `[MockBuildSandbox] Build OK. Files processed: ${files.join(', ')}.`,
      errors:   [],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WEBSITE RUNNER
// ─────────────────────────────────────────────────────────────────────────────

class WebsiteRunner {
  #sandbox;
  #requiredFiles;

  /**
   * @param {object}   sandbox       - Build sandbox (default: MockBuildSandbox).
   * @param {string[]} requiredFiles - Files that must be in the output.
   */
  constructor(sandbox = MockBuildSandbox, requiredFiles = REQUIRED_FILES) {
    this.#sandbox       = sandbox;
    this.#requiredFiles = requiredFiles;
  }

  /**
   * Run website build validation and mock build.
   *
   * @param {object} task   - Task snapshot.
   * @param {object} output - AI handler output: { files, content, pageCount }.
   * @returns {Promise<ExecutionResult>}
   */
  async run(task, output) {
    const logs = [];
    logs.push(`[websiteRunner] Running for task "${task.id}" (${task.type})`);

    // ── Check 1: output exists ────────────────────────────────────────────
    if (!output || typeof output !== 'object') {
      const err = invalidOutputError(task.type, 'Output is null or not an object.', SOURCE);
      logs.push(`[websiteRunner] FAIL: ${err.message}`);
      return this.#fail([err], logs);
    }

    // ── Check 2: files array present ──────────────────────────────────────
    if (!Array.isArray(output.files) || output.files.length === 0) {
      const err = invalidOutputError(task.type, 'Missing or empty "files" array.', SOURCE);
      logs.push(`[websiteRunner] FAIL: ${err.message}`);
      return this.#fail([err], logs);
    }

    // ── Check 3: required files present ───────────────────────────────────
    for (const required of this.#requiredFiles) {
      if (!output.files.includes(required)) {
        const err = missingFileError(required, SOURCE);
        logs.push(`[websiteRunner] FAIL: ${err.message}`);
        return this.#fail([err], logs);
      }
    }

    logs.push(`[websiteRunner] Required files check: PASS (${output.files.join(', ')})`);

    // ── Check 4: content present ───────────────────────────────────────────
    if (!output.content || typeof output.content !== 'string') {
      const err = invalidOutputError(task.type, 'Missing or empty "content" field.', SOURCE);
      logs.push(`[websiteRunner] FAIL: ${err.message}`);
      return this.#fail([err], logs);
    }

    // ── Check 5: Mock build sandbox ────────────────────────────────────────
    let buildResult;
    try {
      buildResult = await this.#sandbox.build(output.files, output.content, { taskId: task.id });
    } catch (err) {
      const execErr = buildError(
        `Build sandbox threw: ${err.message}`,
        { originalError: err.message },
        SOURCE,
      );
      logs.push(`[websiteRunner] FAIL: ${execErr.message}`);
      return this.#fail([execErr], logs);
    }

    logs.push(buildResult.buildLog);

    if (!buildResult.success) {
      const err = buildError(
        `Website build failed: ${buildResult.errors.join('; ')}`,
        { buildErrors: buildResult.errors },
        SOURCE,
      );
      logs.push(`[websiteRunner] FAIL: ${err.message}`);
      return this.#fail([err], logs);
    }

    logs.push(`[websiteRunner] PASS: build successful`);

    return this.#success(
      {
        files:       output.files,
        fileDetails: output.fileDetails || [{ path: 'index.html', content: output.content }],
        content:     output.content,
        pageCount:   output.pageCount ?? 1,
        model:       output.model,
        latencyMs:   output.latencyMs,
        hasPlaceholder: output.hasPlaceholder,
        placeholderMatch: output.placeholderMatch,
        buildLog:    buildResult.buildLog,
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
 * Create a WebsiteRunner.
 *
 * @param {object} [options]
 * @param {object}   [options.sandbox]       - Custom build sandbox.
 * @param {string[]} [options.requiredFiles] - Required file list override.
 * @returns {{ run: function }}
 */
export function createWebsiteRunner(options = {}) {
  return new WebsiteRunner(
    options.sandbox       ?? MockBuildSandbox,
    options.requiredFiles ?? REQUIRED_FILES,
  );
}
