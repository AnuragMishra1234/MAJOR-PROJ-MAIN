/**
 * @file workflow.js
 * @module constants
 *
 * Workflow and task status constants — shared across the entire frontend.
 * These mirror the backend WorkflowEngine constants exactly.
 *
 * Import from here, NOT from mockData.js.
 */

export const TaskStatus = {
  PENDING:   'PENDING',
  READY:     'READY',
  RUNNING:   'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED:    'FAILED',
  RETRYING:  'RETRYING',
  BLOCKED:   'BLOCKED',
};

export const WorkflowStatus = {
  PENDING:   'PENDING',
  RUNNING:   'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED:    'FAILED',
  PAUSED:    'PAUSED',
};

export const TaskType = {
  TEXT_GENERATION:    'TEXT_GENERATION',
  CODE_GENERATION:    'CODE_GENERATION',
  WEBSITE_GENERATION: 'WEBSITE_GENERATION',
  VALIDATION:         'VALIDATION',
  OTHER:              'OTHER',
};

/** Map task type to a short glyph for the UI */
export const TASK_TYPE_GLYPH = {
  TEXT_GENERATION:    'T',
  CODE_GENERATION:    '{}',
  WEBSITE_GENERATION: '\u25a4',
  VALIDATION:         '\u2713',
  OTHER:              '\u25c8',
};

/** Human-readable label for a task type */
export const TASK_TYPE_LABEL = {
  TEXT_GENERATION:    'Text Generation',
  CODE_GENERATION:    'Code Generation',
  WEBSITE_GENERATION: 'Website Generation',
  VALIDATION:         'Validation',
  OTHER:              'Other',
};