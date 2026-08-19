/**
 * @file aiAdapter.js
 * @module ai
 *
 * ESM ↔ CJS bridge between the Agent (ESM) and Person 3's AI module (CommonJS).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHY THIS FILE EXISTS
 * ═══════════════════════════════════════════════════════════════════════════
 * • The project uses `"type": "module"` — all my agent files are ESM.
 * • Person 3's AI module uses `require()`/`module.exports` (CommonJS).
 * • Node.js does not allow `import` of CJS modules that use `require` in
 *   an ESM context without using `createRequire`.
 * • This adapter bridges that gap using `module.createRequire` so the
 *   Agent never needs to know about the CJS internals.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. Loads Person 3's CJS modules via createRequire.
 * 2. Maps Agent TaskType values → AI module type keys:
 *      TEXT_GENERATION  → 'text'
 *      CODE_GENERATION  → 'code'
 *      WEBSITE_GENERATION → (no handler — falls through to mock)
 *      VALIDATION       → (no handler — falls through to mock)
 *      OTHER            → (no handler — falls through to mock)
 * 3. Normalizes AI output into the Agent's handler contract:
 *      { success: true, output: { content, model, latencyMs, ... } }
 * 4. Catches AI errors (thrown Error objects) and normalizes to:
 *      { success: false, error: { code, message } }
 * 5. Extracts a context string from the Agent's executionContext before
 *    passing it to Person 3's module.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DO NOT MODIFY PERSON 3'S CODE
 * ═══════════════════════════════════════════════════════════════════════════
 * All adaptation happens here. Person 3's generation logic is untouched.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { TaskType, ErrorCode } from '../agent/workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// CJS LOADER
// ─────────────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const _require   = createRequire(import.meta.url);

// Load Person 3's CJS module. This is the ONLY place this import happens.
// If Person 3 converts to ESM in the future, this line changes and nothing
// else needs to change in the Agent.
let _allTasks = null;

function getAllTasks() {
  if (!_allTasks) {
    _allTasks = _require(join(__dirname, 'utils/allTasks.js'));
  }
  return _allTasks;
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK TYPE → AI TYPE MAPPING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps Agent TaskType constants to Person 3's AI module type keys.
 * Only types with a real AI implementation are listed.
 * Missing entries mean the mock handler stays active for that type.
 */
export const AI_TYPE_MAP = Object.freeze({
  [TaskType.TEXT_GENERATION]: 'text',
  [TaskType.CODE_GENERATION]: 'code',
  [TaskType.WEBSITE_GENERATION]: 'website',
  // VALIDATION         → not yet implemented by Person 3
  // OTHER              → not applicable
});

/**
 * Check if a TaskType has a real AI handler available.
 * @param {string} taskType
 * @returns {boolean}
 */
export function hasAIHandler(taskType) {
  return Object.prototype.hasOwnProperty.call(AI_TYPE_MAP, taskType);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a context string from the Agent's executionContext, suitable for
 * passing to Person 3's `generate(goal, context)` functions.
 *
 * Only passes relevant prior outputs as a formatted string.
 * Does NOT dump the entire context — keeps the AI prompt focused.
 *
 * @param {object} executionContext - The Agent's in-memory context.
 * @param {object} task             - Current task snapshot.
 * @returns {string} A concise context string for the AI module.
 */
export function buildContextString(executionContext, task) {
  const outputs = executionContext?.outputs ?? {};
  const goal    = executionContext?.goal ?? '';

  const priorParts = [];

  for (const [taskId, output] of Object.entries(outputs)) {
    if (!output) continue;
    // Pull meaningful fields; skip metadata/internal fields
    const content = output?.content ?? output?.code ?? output?.result ?? output?.text;
    if (content && typeof content === 'string') {
      priorParts.push(`[${taskId}] ${content.substring(0, 400)}`);
    }
  }

  if (priorParts.length === 0) return '';
  return `Prior task outputs:\n${priorParts.join('\n')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT NORMALIZER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize Person 3's AI output into the Agent handler contract.
 * Person 3 returns: { content, model, latencyMs } (text)
 *                   { code, language, valid, validationError, model, latencyMs } (code)
 *                   { success, text, confidence, model } (vision)
 *
 * Agent handler contract:
 *   { success: true, output: { ...aiOutput } }
 *
 * @param {object} aiResult - Raw result from Person 3's module.
 * @returns {{ success: true, output: object }}
 */
function normalizeSuccess(aiResult) {
  return {
    success: true,
    output: { ...aiResult },
  };
}

/**
 * Normalize a thrown Error into the Agent handler error contract.
 *
 * Agent handler error contract:
 *   { success: false, error: { code, message, details? } }
 *
 * @param {Error} err
 * @returns {{ success: false, error: object }}
 */
function normalizeError(err) {
  return {
    success: false,
    error: {
      code: ErrorCode.EXECUTION_ERROR,
      message: err.message ?? 'AI module execution failed.',
      details: {
        status: err.status,
        originalError: err.message,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI HANDLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a handler object for a specific AI task type.
 * The handler implements the Agent's handler contract:
 *   execute(task, context) → { success: true, output } | { success: false, error }
 *
 * @param {string} aiType - Person 3's AI module type key ('text', 'code', etc.)
 * @returns {{ execute: function }}
 */
function createAIHandler(aiType) {
  return {
    async execute(task, executionContext) {
      const contextStr = buildContextString(executionContext, task);

      // Build params for Person 3's runTask()
      const params = {
        goal: task.description || task.title,
        context: contextStr,
      };

      // CODE_GENERATION: pass language if present in task metadata
      if (aiType === 'code') {
        params.language = task.metadata?.language ?? 'javascript';
      }

      try {
        const allTasks = getAllTasks();
        const aiResult = await allTasks.runTask(aiType, params);
        return normalizeSuccess(aiResult);
      } catch (err) {
        return normalizeError(err);
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY — createAIHandlerRegistry()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a HandlerRegistry with real AI handlers wired in for all
 * task types that Person 3's module currently supports.
 *
 * Types without a real AI handler keep the existing mock handler
 * (WEBSITE_GENERATION, VALIDATION, OTHER).
 *
 * @param {import('../agent/taskHandlers.js').HandlerRegistry} baseRegistry
 *   The registry returned by createHandlerRegistry() (pre-loaded with mocks).
 *   AI handlers are registered on top — overriding mocks for supported types.
 * @returns {object} The same registry, with real AI handlers registered.
 */
export function wireAIHandlers(baseRegistry) {
  for (const [taskType, aiType] of Object.entries(AI_TYPE_MAP)) {
    baseRegistry.register(taskType, createAIHandler(aiType));
  }
  return baseRegistry;
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECT EXECUTE (for integration testing without the full Agent)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute an AI task directly (bypassing the Agent's handler registry).
 * Useful for integration tests and direct CLI usage.
 *
 * @param {string} taskType  - A TaskType value (e.g. TaskType.TEXT_GENERATION).
 * @param {object} params    - Raw params passed to runTask().
 * @returns {Promise<{ success: true, output } | { success: false, error }>}
 */
export async function executeAITask(taskType, params) {
  const aiType = AI_TYPE_MAP[taskType];
  if (!aiType) {
    return {
      success: false,
      error: {
        code: ErrorCode.INVALID_INPUT,
        message: `No AI handler for task type "${taskType}". Supported: ${Object.keys(AI_TYPE_MAP).join(', ')}.`,
      },
    };
  }

  try {
    const allTasks = getAllTasks();
    const aiResult = await allTasks.runTask(aiType, params);
    return normalizeSuccess(aiResult);
  } catch (err) {
    return normalizeError(err);
  }
}
