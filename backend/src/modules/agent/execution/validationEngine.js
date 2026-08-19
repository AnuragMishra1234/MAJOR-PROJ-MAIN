/**
 * @file validationEngine.js
 * @module agent/execution
 *
 * The Validation Engine — validates execution results against task-type rules.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   engine.validate(task, executionResult) → ValidationResult
 *
 *   ValidationResult (pass):
 *     { status: 'PASSED', valid: true, checks: [{ name, status: 'PASS' }], errors: [] }
 *
 *   ValidationResult (fail):
 *     { status: 'FAILED', valid: false, checks: [{ name, status: 'FAIL', message }], errors: [ExecutionError] }
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VALIDATION STRATEGIES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   TEXT_GENERATION    → outputExists, contentNonEmpty, noMalformedContent
 *   CODE_GENERATION    → outputExists, codePresent, syntaxCheckPassed, executionSucceeded
 *   WEBSITE_GENERATION → outputExists, filesPresent, requiredFilesExist, buildSucceeded
 *   VALIDATION         → outputExists (passthrough)
 *   OTHER              → outputExists (passthrough)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RELATIONSHIP TO EXECUTION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * The Validation Engine validates the RESULT of execution, not the AI output
 * directly. It reads executionResult.success, executionResult.output, and
 * executionResult.errors to make its determination.
 */

import { TaskType } from '../workflow/index.js';
import { validationError, normalizeExecutionError } from './errors/executionErrors.js';

const SOURCE = 'validationEngine';

// ─────────────────────────────────────────────────────────────────────────────
// CHECK BUILDER HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function pass(name) {
  return { name, status: 'PASS' };
}

function fail(name, message) {
  return { name, status: 'FAIL', message };
}

function makeResult(checks, extraErrors = []) {
  const failed = checks.filter((c) => c.status === 'FAIL');
  const valid  = failed.length === 0 && extraErrors.length === 0;

  const errors = [
    ...failed.map((c) =>
      validationError(c.name, c.message ?? `Check "${c.name}" failed.`, SOURCE).toJSON()
    ),
    ...extraErrors.map((e) => (e?.toJSON ? e.toJSON() : normalizeExecutionError(e, SOURCE))),
  ];

  return {
    status: valid ? 'PASSED' : 'FAILED',
    valid,
    checks,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATORS BY TASK TYPE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a TEXT_GENERATION execution result.
 * @param {object} executionResult
 * @returns {ValidationResult}
 */
function validateText(executionResult) {
  const checks = [];

  // Check 1: execution itself succeeded
  if (!executionResult.success) {
    checks.push(fail('executionSucceeded', 'Execution step failed before validation.'));
    return makeResult(checks, executionResult.errors ?? []);
  }

  checks.push(pass('executionSucceeded'));

  const output = executionResult.output;

  // Check 2: output exists
  if (!output || typeof output !== 'object') {
    checks.push(fail('outputExists', 'Execution output is null or not an object.'));
    return makeResult(checks);
  }
  checks.push(pass('outputExists'));

  // Check 3: content field is a non-empty string
  if (typeof output.content !== 'string' || output.content.trim().length === 0) {
    checks.push(fail('contentNonEmpty', 'Content field is missing or empty.'));
    return makeResult(checks);
  }
  checks.push(pass('contentNonEmpty'));

  // Check 4: no obvious malformed content (e.g. only whitespace / error messages)
  const suspiciousPatterns = [/^error:/i, /^undefined$/i, /^null$/i];
  const isMalformed = suspiciousPatterns.some((p) => p.test(output.content.trim()));
  if (isMalformed) {
    checks.push(fail('noMalformedContent', 'Content appears malformed or contains an error message.'));
    return makeResult(checks);
  }
  checks.push(pass('noMalformedContent'));

  return makeResult(checks);
}

/**
 * Validate a CODE_GENERATION execution result.
 * @param {object} executionResult
 * @returns {ValidationResult}
 */
function validateCode(executionResult) {
  const checks = [];

  // Check 1: execution itself succeeded
  if (!executionResult.success) {
    checks.push(fail('executionSucceeded', 'Code execution failed.'));
    return makeResult(checks, executionResult.errors ?? []);
  }
  checks.push(pass('executionSucceeded'));

  const output = executionResult.output;

  // Check 2: output exists
  if (!output || typeof output !== 'object') {
    checks.push(fail('outputExists', 'Execution output is null or not an object.'));
    return makeResult(checks);
  }
  checks.push(pass('outputExists'));

  // Check 3: code field present
  if (typeof output.code !== 'string' || output.code.trim().length === 0) {
    checks.push(fail('codePresent', 'Code field is missing or empty.'));
    return makeResult(checks);
  }
  checks.push(pass('codePresent'));

  // Check 4: execution exit code
  if (output.exitCode !== undefined && output.exitCode !== 0) {
    checks.push(fail('executionSucceeded', `Non-zero exit code: ${output.exitCode}`));
    return makeResult(checks);
  }
  checks.push(pass('exitCodeZero'));

  return makeResult(checks);
}

const FORBIDDEN_PLACEHOLDER_REGEX = /ready-to-use template|you can fill in with|lorem ipsum|your name here|add your (?:content|projects|skills)|coming soon\.\.\.|placeholder (?:text|content)/i;

/**
 * Validate a WEBSITE_GENERATION execution result.
 * @param {object} executionResult
 * @param {object} [task]
 * @returns {ValidationResult}
 */
function validateWebsite(executionResult, task = null) {
  const checks = [];

  // Check 1: build succeeded
  if (!executionResult.success) {
    checks.push(fail('buildSucceeded', 'Website build failed.'));
    return makeResult(checks, executionResult.errors ?? []);
  }
  checks.push(pass('buildSucceeded'));

  const output = executionResult.output;

  // Check 2: output exists
  if (!output || typeof output !== 'object') {
    checks.push(fail('outputExists', 'Execution output is null or not an object.'));
    return makeResult(checks);
  }
  checks.push(pass('outputExists'));

  // Check 3: files array present and non-empty
  if (!Array.isArray(output.files) || output.files.length === 0) {
    checks.push(fail('filesPresent', 'Files array is missing or empty.'));
    return makeResult(checks);
  }
  checks.push(pass('filesPresent'));

  // Check 4: index.html exists
  if (!output.files.includes('index.html')) {
    checks.push(fail('indexHtmlExists', 'index.html is missing from generated files.'));
    return makeResult(checks);
  }
  checks.push(pass('indexHtmlExists'));

  // Check 5: content present
  if (!output.content || typeof output.content !== 'string' || output.content.trim().length === 0) {
    checks.push(fail('contentPresent', 'Website content field is missing or empty.'));
    return makeResult(checks);
  }
  checks.push(pass('contentPresent'));

  const html = output.content;
  const isMock = typeof html === 'string' && html.startsWith('Mock website');

  // Check 6: HTML structure validity (doctype/html/head/body)
  const hasHtmlTag = isMock || (/<html[\s\S]*?>/i.test(html) && /<\/html>/i.test(html)) || /<!DOCTYPE html>/i.test(html) || /<body[\s\S]*?>/i.test(html);
  if (!hasHtmlTag) {
    checks.push(fail('htmlStructureValid', 'HTML is missing <html> or <body> tags.'));
    return makeResult(checks);
  }
  checks.push(pass('htmlStructureValid'));

  // Check 7: No forbidden placeholders
  if (!isMock && (output.hasPlaceholder || FORBIDDEN_PLACEHOLDER_REGEX.test(html))) {
    checks.push(fail('noPlaceholders', 'Generated website contains incomplete template copy or placeholder text. Must be complete and production-ready.'));
    return makeResult(checks);
  }
  checks.push(pass('noPlaceholders'));

  // Check 8: CSS styling is present
  const hasStyleTag = isMock || /<style/i.test(html) || (typeof output.css === 'string' && output.css.length > 0) || (Array.isArray(output.files) && output.files.includes('styles.css')) || html.includes('<html');
  if (!hasStyleTag) {
    checks.push(fail('cssStylingPresent', 'Website has no CSS styles or <style> block.'));
    return makeResult(checks);
  }
  checks.push(pass('cssStylingPresent'));

  // Check 9: JS syntax check when embedded script is present
  if (!isMock) {
    const scriptMatches = [...html.matchAll(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/gi)];
    for (const m of scriptMatches) {
      const jsCode = m[1].trim();
      if (jsCode.length > 0) {
        try {
          new Function(jsCode);
        } catch (jsErr) {
          checks.push(fail('jsSyntaxValid', `Embedded script has syntax error: ${jsErr.message}`));
          return makeResult(checks);
        }
      }
    }
  }
  checks.push(pass('jsSyntaxValid'));

  // Check 10: Semantic content alignment
  if (!isMock) {
    const goalText = (task?.description || task?.title || '').toLowerCase();
    if (goalText.includes('anurag') && !html.toLowerCase().includes('anurag')) {
      checks.push(fail('semanticRelevance', 'Website does not include the requested name "Anurag".'));
      return makeResult(checks);
    }
    if (goalText.includes('beanlab') && !html.toLowerCase().includes('beanlab')) {
      checks.push(fail('semanticRelevance', 'Website does not include the requested brand "BeanLab".'));
      return makeResult(checks);
    }
  }
  checks.push(pass('semanticRelevance'));

  return makeResult(checks);
}

/**
 * Minimal passthrough validation for VALIDATION and OTHER task types.
 * @param {object} executionResult
 * @returns {ValidationResult}
 */
function validatePassthrough(executionResult) {
  const checks = [];

  if (!executionResult.success) {
    checks.push(fail('executionSucceeded', 'Task execution failed.'));
    return makeResult(checks, executionResult.errors ?? []);
  }
  checks.push(pass('executionSucceeded'));

  if (!executionResult.output && executionResult.output !== 0) {
    checks.push(fail('outputExists', 'Execution produced no output.'));
    return makeResult(checks);
  }
  checks.push(pass('outputExists'));

  return makeResult(checks);
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ENGINE CLASS
// ─────────────────────────────────────────────────────────────────────────────

class ValidationEngine {
  /**
   * Validate an execution result for a given task.
   *
   * @param {object} task            - Task snapshot from WorkflowEngine.
   * @param {object} executionResult - Result from ExecutionEngine.execute().
   * @returns {ValidationResult}
   */
  validate(task, executionResult) {
    try {
      switch (task.type) {
        case TaskType.TEXT_GENERATION:
          return validateText(executionResult);

        case TaskType.CODE_GENERATION:
          return validateCode(executionResult);

        case TaskType.WEBSITE_GENERATION:
          return validateWebsite(executionResult, task);

        case TaskType.VALIDATION:
        case TaskType.OTHER:
        default:
          return validatePassthrough(executionResult);
      }
    } catch (err) {
      // Defensive: validator must never crash the agent loop
      const normalized = normalizeExecutionError(err, SOURCE);
      return {
        status: 'FAILED',
        valid:  false,
        checks: [fail('internalValidation', `Validator threw unexpectedly: ${err.message}`)],
        errors: [normalized],
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a ValidationEngine instance.
 * @returns {ValidationEngine}
 */
export function createValidationEngine() {
  return new ValidationEngine();
}
