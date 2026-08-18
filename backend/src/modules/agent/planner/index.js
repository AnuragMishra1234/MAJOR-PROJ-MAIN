/**
 * @file index.js
 * @module agent/planner
 *
 * Public barrel export for the Planner module.
 *
 * This is the ONLY file other modules should import from:
 *
 *   import { createPlanner, loadPlanIntoEngine, ... }
 *     from '../agent/planner/index.js';
 *
 * EXPORTED SYMBOLS
 * ─────────────────────────────────────────────────────────────────
 * Planner  [Phase 3]
 *   createPlanner         — Factory: createPlanner({ providerType?, provider?, maxRetries? })
 *   loadPlanIntoEngine    — Bridge: load a validated plan into a WorkflowEngine
 *   PlannerError          — Structured planning error class
 *   PlannerErrorCode      — Machine-readable error code constants
 *   MAX_PLANNER_RETRIES   — Default retry limit constant
 *
 * Provider  [Phase 3]
 *   createProvider        — Factory: createProvider('groq' | 'openai' | 'mock')
 *   GroqProvider          — Groq Chat Completions adapter
 *   OpenAIProvider        — OpenAI Chat Completions adapter
 *   MockProvider          — In-memory mock provider (for tests)
 *   ProviderError         — Structured provider error class
 *
 * Prompt builder  [Phase 3]
 *   buildSystemPrompt     — The planner system prompt string
 *   buildPlanningMessages — Full messages array for initial planning
 *   buildCorrectionMessages — Full messages array for retry/correction
 *
 * Validator  [Phase 3]
 *   normalisePlan         — Fix common LLM output quirks before validation
 *   validatePlan          — Full 11-rule plan validation
 *   MIN_TASKS             — Minimum allowed tasks per plan (1)
 *   MAX_TASKS             — Maximum allowed tasks per plan (8)
 */

export {
  createPlanner,
  loadPlanIntoEngine,
  PlannerError,
  PlannerErrorCode,
  MAX_PLANNER_RETRIES,
} from './planner.js';

export {
  createProvider,
  GroqProvider,
  OpenAIProvider,
  MockProvider,
  ProviderError,
} from './plannerProvider.js';

export {
  buildSystemPrompt,
  buildUserMessage,
  buildCorrectionMessage,
  buildPlanningMessages,
  buildCorrectionMessages,
} from './plannerPrompt.js';

export {
  normalisePlan,
  validatePlan,
  MIN_TASKS,
  MAX_TASKS,
} from './plannerValidator.js';
