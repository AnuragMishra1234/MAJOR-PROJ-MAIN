/**
 * @file index.js
 * @module agent
 *
 * Public barrel export for the entire Agent module.
 *
 * This is the ONLY file other modules (routes, services) should import from:
 *
 *   import { createAgent, AgentErrorCode } from '../agent/index.js';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EXPORTED SYMBOLS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Agent  [Phase 4]
 *   createAgent           — Factory: createAgent({ projectId, planner?, handlers? })
 *   AgentError            — Structured agent error class
 *   AgentErrorCode        — Machine-readable error code constants
 *   LOOP_SAFETY_MULTIPLIER — Loop guard constant (taskCount * this + padding)
 *   LOOP_SAFETY_PADDING    — Loop guard constant (fixed padding)
 *
 * Task Handlers  [Phase 4]
 *   createHandlerRegistry — Factory: returns HandlerRegistry pre-loaded with mocks
 *   HandlerError          — Structured handler error class
 *
 * Memory  [Phase 5]
 *   createProjectMemory   — Factory: createProjectMemory({ projectId, workflowId, goal })
 *
 * AI Adapter  [Phase 5]
 *   wireAIHandlers        — Overlays real AI handlers onto a HandlerRegistry
 *   executeAITask         — Direct AI task execution (for testing)
 *   hasAIHandler          — Check if a TaskType has a real AI handler
 *   AI_TYPE_MAP           — TaskType → AI module type key mapping
 *
 * Execution + Validation  [Phase 6]
 *   createExecutionEngine  — Factory: createExecutionEngine({ textRunner?, codeRunner?, websiteRunner? })
 *   createValidationEngine — Factory: createValidationEngine()
 *   createTextRunner       — Text execution runner
 *   createCodeRunner       — Code sandbox runner (mock by default)
 *   createWebsiteRunner    — Website build runner (mock by default)
 *   MockSandbox            — Mock code sandbox (for tests)
 *   MockBuildSandbox       — Mock build sandbox (for tests)
 *   ExecutionError, ExecutionErrorType — Error model
 *
 * Sub-module re-exports (for convenience — consumers can also import directly)
 *   createPlanner         — from agent/planner
 *   loadPlanIntoEngine    — from agent/planner
 *   WorkflowEngine        — from agent/workflow
 */

// ─── Agent ───────────────────────────────────────────────────────────────────────────────
export {
  createAgent,
  AgentError,
  AgentErrorCode,
  LOOP_SAFETY_MULTIPLIER,
  LOOP_SAFETY_PADDING,
} from './agent.js';

// ─── Task handlers ──────────────────────────────────────────────────────────────────────────
export {
  createHandlerRegistry,
  HandlerError,
} from './taskHandlers.js';

// ─── Memory (Phase 5) ─────────────────────────────────────────────────────────────────────
export { createProjectMemory } from './memory/index.js';

// ─── AI Adapter (Phase 5) ─────────────────────────────────────────────────────────────────
export { wireAIHandlers, executeAITask, hasAIHandler, AI_TYPE_MAP, buildContextString } from '../ai/aiAdapter.js';

// ─── Execution + Validation (Phase 6) ────────────────────────────────────────────────────
export {
  createExecutionEngine,
  createValidationEngine,
  createTextRunner,
  createCodeRunner,
  createWebsiteRunner,
  MockSandbox,
  MockBuildSandbox,
  ExecutionError,
  ExecutionErrorType,
  invalidOutputError,
  missingFileError,
  buildError,
  syntaxError,
  runtimeError,
  validationError,
  timeoutError,
  normalizeExecutionError,
} from './execution/index.js';

// ─── Planner (re-exported for consumer convenience) ─────────────────────────────────────────────
export {
  createPlanner,
  loadPlanIntoEngine,
  PlannerError,
  PlannerErrorCode,
  MockProvider,
  createProvider,
} from './planner/index.js';

// ─── Workflow (re-exported for consumer convenience) ─────────────────────────────────────────────
export {
  WorkflowEngine,
  TaskType,
  TaskStatus,
  WorkflowStatus,
  createSuccessResult,
  createFailureResult,
  ErrorCode,
} from './workflow/index.js';
