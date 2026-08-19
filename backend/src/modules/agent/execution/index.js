/**
 * @file index.js
 * @module agent/execution
 *
 * Public barrel export for the Phase 6 Execution + Validation module.
 *
 *   import { createExecutionEngine, createValidationEngine } from '../execution/index.js';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EXPORTED SYMBOLS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Execution Engine
 *   createExecutionEngine({ textRunner?, codeRunner?, websiteRunner? })
 *
 * Validation Engine
 *   createValidationEngine()
 *
 * Runners
 *   createTextRunner()
 *   createCodeRunner({ sandbox? })
 *   createWebsiteRunner({ sandbox?, requiredFiles? })
 *
 * Mock Sandboxes (for tests)
 *   MockSandbox        — code execution mock
 *   MockBuildSandbox   — website build mock
 *
 * Errors
 *   ExecutionError, ExecutionErrorType
 *   invalidOutputError, missingFileError, buildError
 *   syntaxError, runtimeError, validationError, timeoutError
 *   normalizeExecutionError
 */

// ─── Engines ─────────────────────────────────────────────────────────────────
export { createExecutionEngine } from './executionEngine.js';
export { createValidationEngine } from './validationEngine.js';

// ─── Runners ─────────────────────────────────────────────────────────────────
export { createTextRunner }    from './runners/textRunner.js';
export { createCodeRunner, MockSandbox }        from './runners/codeRunner.js';
export { createWebsiteRunner, MockBuildSandbox } from './runners/websiteRunner.js';

// ─── Errors ──────────────────────────────────────────────────────────────────
export {
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
} from './errors/executionErrors.js';
