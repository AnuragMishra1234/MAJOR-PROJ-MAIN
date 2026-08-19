/**
 * @file autoHealer.js
 * @module agent/healing
 *
 * Auto-Healing module for Phase 9A.
 *
 * DESIGN:
 *   1. Receives a structured failure (execution or validation)
 *   2. Analyzes error category and retryable flag
 *   3. If repairable: calls Person 3's 'repair' task via allTasks.runTask()
 *      which calls textGenerator.repair() - regenerates with error context
 *   4. Returns a structured heal result
 *
 * SECURITY: Never executes generated code. Only regenerates content.
 *
 * HEAL RESULT:
 *   { healed: true,  repairedOutput, strategy, meta }
 *   { healed: false, reason, strategy }
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const _require   = createRequire(import.meta.url);

let _allTasks = null;
function getAllTasks() {
  if (!_allTasks) _allTasks = _require(join(__dirname, '../../ai/utils/allTasks.js'));
  return _allTasks;
}

// Transient error types where AI regeneration may help
const HEALABLE_ERROR_TYPES = new Set([
  'INVALID_OUTPUT', 'VALIDATION_ERROR', 'BUILD_ERROR',
  'SYNTAX_ERROR', 'RUNTIME_ERROR', 'EXECUTION_ERROR',
]);

const HEALABLE_TASK_TYPES = new Set([
  'TEXT_GENERATION', 'CODE_GENERATION', 'WEBSITE_GENERATION', 'OTHER',
]);

function canHeal(failureInfo, taskType) {
  if (!failureInfo) return { canHeal: false, reason: 'No failure info.' };
  if (failureInfo.retryable === false) {
    return { canHeal: false, reason: 'Error is explicitly non-retryable.' };
  }
  if (!HEALABLE_TASK_TYPES.has(taskType)) {
    return { canHeal: false, reason: 'Task type not supported for healing: ' + taskType };
  }
  const errType = failureInfo.type || failureInfo.code || '';
  if (!HEALABLE_ERROR_TYPES.has(errType) && failureInfo.retryable !== true) {
    return { canHeal: false, reason: 'Error type not in healable set: ' + errType };
  }
  if (!process.env.GROQ_API_KEY) {
    return { canHeal: false, reason: 'GROQ_API_KEY not configured.' };
  }
  return { canHeal: true, reason: 'Failure is retryable.' };
}

function extractPreviousOutputString(prev) {
  if (!prev || typeof prev !== 'object') return '';
  if (typeof prev.content === 'string') return prev.content.substring(0, 1000);
  if (typeof prev.code === 'string') return prev.code.substring(0, 1000);
  try { return JSON.stringify(prev).substring(0, 1000); } catch { return ''; }
}

function normalizeRepairOutput(result, taskType) {
  if (taskType === 'CODE_GENERATION') {
    return {
      code: result.code || result.content || '',
      language: result.language || 'javascript',
      content: result.content || result.code || '',
      model: result.model,
      latencyMs: result.latencyMs,
      _healed: true,
    };
  }
  if (taskType === 'WEBSITE_GENERATION') {
    return {
      files: result.files || ['index.html'],
      fileDetails: result.fileDetails || [{ path: 'index.html', content: result.content }],
      content: result.content || '',
      model: result.model,
      latencyMs: result.latencyMs,
      pageCount: result.pageCount ?? 1,
      hasPlaceholder: result.hasPlaceholder || false,
      _healed: true,
    };
  }
  return {
    content: result.content || '',
    model: result.model,
    latencyMs: result.latencyMs,
    _healed: true,
  };
}

class AutoHealer {
  /**
   * Attempt to heal a failed task.
   * @param {{ task, failureInfo, previousOutput, executionContext }} opts
   * @returns {Promise<{ healed: boolean, repairedOutput?, reason?, strategy, meta? }>}
   */
  async heal({ task, failureInfo, previousOutput, executionContext }) {
    const taskType = task?.type || 'UNKNOWN';
    const goal     = task?.description || task?.title || executionContext?.goal || '';

    const { canHeal: eligible, reason } = canHeal(failureInfo, taskType);
    if (!eligible) {
      console.log('[HEALER] Cannot heal ' + task?.id + ' - ' + reason);
      return { healed: false, reason, strategy: 'HEALING_UNSUPPORTED' };
    }

    const prevStr      = extractPreviousOutputString(previousOutput);
    const errorMessage = failureInfo?.message || 'Unknown error';
    const priorCtx     = (typeof executionContext?.memory?.getContextString === 'function')
      ? executionContext.memory.getContextString()
      : '';

    console.log('[HEALER] Repairing task ' + task?.id + ' (' + taskType + ') - error: ' + errorMessage);

    try {
      const allTasks     = getAllTasks();
      const repairResult = await allTasks.runTask('repair', {
        goal,
        previousOutput: prevStr || '(none)',
        errorMessage,
        context: priorCtx,
        taskType,
      });

      if (!repairResult || !repairResult.content) {
        return { healed: false, reason: 'Repair returned empty content.', strategy: 'HEALING_UNSUPPORTED' };
      }

      const repairedOutput = normalizeRepairOutput(repairResult, taskType);
      console.log('[HEALER] Repaired task ' + task?.id + ' via ' + repairResult.model);
      return {
        healed: true,
        repairedOutput,
        strategy: 'AI_REPAIR',
        meta: { model: repairResult.model, latencyMs: repairResult.latencyMs, errorHealed: errorMessage },
      };
    } catch (err) {
      console.log('[HEALER] Repair call failed for ' + task?.id + ': ' + err.message);
      return { healed: false, reason: 'Repair AI failed: ' + err.message, strategy: 'HEALING_UNSUPPORTED' };
    }
  }

  isHealable(failureInfo, taskType) {
    return canHeal(failureInfo, taskType).canHeal;
  }
}

export function createAutoHealer() { return new AutoHealer(); }
export { AutoHealer };