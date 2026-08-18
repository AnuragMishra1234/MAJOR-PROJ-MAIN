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
 * Sub-module re-exports (for convenience — consumers can also import directly)
 *   createPlanner         — from agent/planner
 *   loadPlanIntoEngine    — from agent/planner
 *   WorkflowEngine        — from agent/workflow
 */

// ─── Agent ────────────────────────────────────────────────────────────────────
export {
  createAgent,
  AgentError,
  AgentErrorCode,
  LOOP_SAFETY_MULTIPLIER,
  LOOP_SAFETY_PADDING,
} from './agent.js';

// ─── Task handlers ────────────────────────────────────────────────────────────
export {
  createHandlerRegistry,
  HandlerError,
} from './taskHandlers.js';

// ─── Planner (re-exported for consumer convenience) ───────────────────────────
export {
  createPlanner,
  loadPlanIntoEngine,
  PlannerError,
  PlannerErrorCode,
  MockProvider,
  createProvider,
} from './planner/index.js';

// ─── Workflow (re-exported for consumer convenience) ──────────────────────────
export {
  WorkflowEngine,
  TaskType,
  TaskStatus,
  WorkflowStatus,
  createSuccessResult,
  createFailureResult,
  ErrorCode,
} from './workflow/index.js';
