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
 * @param {object} [executionContext]
 * @returns {ValidationResult}
 */
function validateWebsite(executionResult, task = null, executionContext = null) {
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

  // Check 10: Dynamic semantic relevance & requirement validation
  if (!isMock) {
    const originalGoal = executionContext?.goal
      || task?.metadata?.goal
      || task?.description
      || task?.title
      || '';

    const reqs = extractWebsiteRequirements(originalGoal);

    // 10A: Verify named brand / project entities if explicitly requested
    if (reqs.entities.length > 0) {
      const htmlLower = html.toLowerCase();
      const presentEntities = reqs.entities.filter(e => htmlLower.includes(e));
      if (presentEntities.length === 0) {
        checks.push(fail(
          'semanticRelevance',
          `Website is missing the requested subject/entity. Expected: [${reqs.entities.join(', ')}].`
        ));
        return makeResult(checks);
      }
    }

    // 10B: Conceptual section validation
    if (reqs.sections.length > 0) {
      const missingSections = reqs.sections.filter(s => !s.test(html));
      // Require at least 60% of requested sections to be represented
      const allowedMissing = Math.floor(reqs.sections.length * 0.4);
      if (missingSections.length > allowedMissing) {
        const missingNames = missingSections.map(s => s.name).join(', ');
        checks.push(fail(
          'semanticRelevance',
          `Website is missing key requested sections: [${missingNames}]. Please ensure all requested sections are implemented.`
        ));
        return makeResult(checks);
      }
    }
  }
  checks.push(pass('semanticRelevance'));

  return makeResult(checks);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC REQUIREMENT EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

const FORBIDDEN_PLACEHOLDER_WORDS = new Set([
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
  'placeholder', 'placeholders', 'sample', 'dummy', 'template', 'templates',
  'your-name', 'yourname', 'yourcompany', 'insert', 'coming', 'soon', 'tbd',
  'todo', 'example', 'boilerplate', 'snippet', 'generic',
]);

const GENERAL_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'can',
  'could', 'not', 'if', 'then', 'that', 'this', 'these', 'those', 'it', 'its', 'their',
  'which', 'who', 'when', 'where', 'how', 'what', 'why', 'create', 'build', 'generate',
  'write', 'make', 'design', 'develop', 'implement', 'using', 'include', 'includes', 'add',
  'adds', 'complete', 'full', 'production', 'ready', 'based', 'new', 'good', 'great',
  'website', 'webpage', 'page', 'site', 'html', 'css', 'js', 'javascript', 'code',
  'task', 'description', 'plan', 'section', 'sections', 'final', 'first', 'second',
  'third', 'last', 'next', 'all', 'each', 'some', 'any', 'more', 'most', 'other',
  'step', 'stage', 'phase', 'part', 'item', 'items', 'list', 'data', 'file', 'files',
  'user', 'users', 'output', 'input', 'result', 'return', 'process', 'system', 'service',
  'app', 'application', 'component', 'components', 'module', 'function', 'class', 'type',
  'object', 'element', 'elements', 'layout', 'styling', 'styles', 'styled', 'theme',
  'themed', 'clean', 'modern', 'minimal', 'responsive', 'beautiful', 'aesthetic',
  'avoid', 'without', 'ensure', 'ensuring', 'prevent', 'must', 'should', 'dont', 'doesnt',
  'never', 'only', 'both', 'either', 'neither', 'also', 'such', 'into', 'over', 'under',
  'about', 'between', 'through', 'during', 'before', 'after', 'above', 'below',
  'college', 'student', 'students', 'software', 'engineering', 'fest', 'event', 'events',
  'personal', 'professional', 'simple', 'homepage', 'landing', 'test', 'demo', 'mock',
]);

/**
 * Extract semantic requirements from user goal.
 * @param {string} goal
 */
export function extractWebsiteRequirements(goal = '') {
  if (!goal || typeof goal !== 'string') {
    return { entities: [], sections: [], isDarkTheme: false, isResponsive: false };
  }

  // 1. Detect negative constraint zones to avoid extracting negative words as required entities
  // E.g., "don't invent speaker names", "no placeholder text", "avoid lorem ipsum"
  const negativePhrases = [];
  const negMatches = goal.matchAll(/(?:don'?t|do not|never|avoid|without|no)\s+([^.,;]+)/gi);
  for (const nm of negMatches) {
    negativePhrases.push(nm[1].toLowerCase());
  }
  const isNegativeContext = (w) => negativePhrases.some(p => p.includes(w.toLowerCase()));

  // 2. Extract brand/named entities
  const entities = new Set();

  // Quoted terms: "TechNova", 'FlowMind'
  const quotedMatches = goal.matchAll(/["']([A-Za-z0-9_-]{2,30})["']/g);
  for (const qm of quotedMatches) {
    const w = qm[1].toLowerCase();
    if (!FORBIDDEN_PLACEHOLDER_WORDS.has(w) && !GENERAL_STOP_WORDS.has(w) && !isNegativeContext(w)) {
      entities.add(w);
    }
  }

  // Explicit name patterns: "named X", "called X", "for X"
  const namePatterns = [
    /(?:named|called)\s+([A-Z][A-Za-z0-9_-]+)/g,
    /(?:fest|app|startup|company|student|client|service)\s+(?:named|called)?\s*([A-Z][A-Za-z0-9_-]+)/g,
    /\bfor\s+([A-Z][A-Za-z0-9_-]+)/g,
  ];
  for (const np of namePatterns) {
    const matches = goal.matchAll(np);
    for (const m of matches) {
      const w = m[1].toLowerCase();
      if (!FORBIDDEN_PLACEHOLDER_WORDS.has(w) && !GENERAL_STOP_WORDS.has(w) && !isNegativeContext(w) && w.length > 2) {
        entities.add(w);
      }
    }
  }

  // PascalCase / CamelCase internal uppercase words (e.g. TechNova, BeanLab, FlowMind, EcoCampus)
  const internalCaps = goal.match(/\b[A-Z][a-z]+[A-Z][a-zA-Z0-9]*\b/g) || [];
  for (const ic of internalCaps) {
    const w = ic.toLowerCase();
    if (!FORBIDDEN_PLACEHOLDER_WORDS.has(w) && !GENERAL_STOP_WORDS.has(w) && !isNegativeContext(w)) {
      entities.add(w);
    }
  }

  // 3. Detect requested sections
  const SECTION_DEFINITIONS = [
    {
      name: 'hero',
      trigger: /\b(?:hero|banner|headline)\b/i,
      test: (html) => /\bhero\b|<header[\s>]|<h1[\s>]/i.test(html),
    },
    {
      name: 'highlights',
      trigger: /\b(?:highlights?|key events?|event highlights)\b/i,
      test: (html) => /\bhighlight|event/i.test(html),
    },
    {
      name: 'schedule',
      trigger: /\b(?:schedule|agenda|timeline|program)\b/i,
      test: (html) => /\bschedule|agenda|timeline|sessions?|\b\d{1,2}:\d{2}\b|\b(?:am|pm)\b/i.test(html),
    },
    {
      name: 'speakers',
      trigger: /\b(?:speakers?|presenters?|keynotes?)\b/i,
      test: (html) => /\bspeaker|presenter|keynote|talks?/i.test(html),
    },
    {
      name: 'registration',
      trigger: /\b(?:regist(?:er|ration)|sign\s*up|rsvp|tickets?)\b/i,
      test: (html) => /\bregist|sign\s*up|rsvp|tickets?|<form|type=["']submit["']/i.test(html),
    },
    {
      name: 'faq',
      trigger: /\b(?:faq|frequently\s*asked|q\s*&\s*a)\b/i,
      test: (html) => /\bfaq|frequently\s*asked|<details|accordion|\bq:|question/i.test(html),
    },
    {
      name: 'pricing',
      trigger: /\b(?:pricing|plans?|tiers?)\b/i,
      test: (html) => /\bpricing|plan|tier|\$|month|year/i.test(html),
    },
    {
      name: 'testimonials',
      trigger: /\b(?:testimonials?|reviews?|feedback)\b/i,
      test: (html) => /\btestimonial|review|feedback|what (?:our|people|users) say/i.test(html),
    },
    {
      name: 'features',
      trigger: /\b(?:features?|capabilities)\b/i,
      test: (html) => /\bfeature|capability|capabilities|why choose/i.test(html),
    },
    {
      name: 'about',
      trigger: /\b(?:about(?:\s+us)?|bio|background)\b/i,
      test: (html) => /\babout|who we are|our story|background/i.test(html),
    },
    {
      name: 'skills',
      trigger: /\b(?:skills?|technologies|tech\s*stack)\b/i,
      test: (html) => /\bskill|technolog|stack|languages/i.test(html),
    },
    {
      name: 'projects',
      trigger: /\b(?:projects?|portfolio|work)\b/i,
      test: (html) => /\bproject|portfolio|featured work|case stud/i.test(html),
    },
    {
      name: 'education',
      trigger: /\b(?:education|academic|degrees?)\b/i,
      test: (html) => /\beducation|university|college|bachelor|degree|academic/i.test(html),
    },
    {
      name: 'menu',
      trigger: /\b(?:menu|dishes|food|courses)\b/i,
      test: (html) => /\bmenu|dish|appetizer|entree|beverage|food/i.test(html),
    },
    {
      name: 'reservation',
      trigger: /\b(?:reserv(?:e|ation)|booking)\b/i,
      test: (html) => /\breserv|book a table|booking|<form/i.test(html),
    },
    {
      name: 'contact',
      trigger: /\b(?:contact|get\s*in\s*touch|reach\s*out)\b/i,
      test: (html) => /\bcontact|get in touch|reach out|mailto:|<form/i.test(html),
    },
    {
      name: 'footer',
      trigger: /\b(?:footer)\b/i,
      test: (html) => /<footer[\s>]|&copy;|all rights reserved/i.test(html),
    },
  ];

  const requestedSections = SECTION_DEFINITIONS.filter(sec => sec.trigger.test(goal));

  return {
    entities: [...entities],
    sections: requestedSections,
    isDarkTheme: /\b(?:dark|night|black|luxury dark)\b/i.test(goal),
    isResponsive: /\b(?:responsive|mobile-friendly)\b/i.test(goal),
  };
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
   * @param {object} [executionContext] - Optional full workflow execution context.
   * @returns {ValidationResult}
   */
  validate(task, executionResult, executionContext = null) {
    try {
      switch (task.type) {
        case TaskType.TEXT_GENERATION:
          return validateText(executionResult);

        case TaskType.CODE_GENERATION:
          return validateCode(executionResult);

        case TaskType.WEBSITE_GENERATION:
          return validateWebsite(executionResult, task, executionContext);

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
