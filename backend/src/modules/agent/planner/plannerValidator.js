/**
 * @file plannerValidator.js
 * @module agent/planner
 *
 * Validates and normalises the raw LLM output before it is used as a plan.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 * • NEVER trust raw LLM output. Always validate before use.
 * • normalisePlan() runs FIRST to fix common LLM quirks (markdown fences,
 *   null dependencies, etc.).
 * • validatePlan() runs SECOND and returns structured errors so the caller
 *   can either retry or surface them to the user.
 * • Cycle detection is delegated to Phase 1's validateDependencies() so
 *   there is no duplicated cycle-detection logic.
 *
 * VALIDATION CHECKLIST (in order):
 *   1.  goal is a non-empty string
 *   2.  tasks is a non-empty array (at least 1 task)
 *   3.  Total task count ≤ MAX_TASKS (8)
 *   4.  Every task has a non-empty string id
 *   5.  Every task has a valid type (must be a registered TaskType value)
 *   6.  Every task has a non-empty string title
 *   7.  Every task has a non-empty string description
 *   8.  Task IDs are unique (no duplicates)
 *   9.  All dependency IDs reference an existing task in this plan
 *   10. No task depends on itself
 *   11. No circular dependencies (via Phase 1 validateDependencies())
 */

import { TaskType } from '../workflow/index.js';
import { validateDependencies } from '../workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const MIN_TASKS = 1;
export const MAX_TASKS = 8;

// ─────────────────────────────────────────────────────────────────────────────
// NORMALISE (fix common LLM output quirks before validation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to normalise raw LLM output into a plan-shaped object.
 *
 * Handles:
 * • Strings (tries JSON.parse)
 * • Markdown code fences (` ```json ... ``` ` or ` ``` ... ``` `)
 * • `dependencies: null` → `dependencies: []`
 * • Trimmed string fields
 * • Missing `tasks` array (wraps single task object if needed)
 *
 * @param {string | object} raw - Raw LLM response (string or already-parsed object).
 * @returns {{ ok: true, plan: object } | { ok: false, error: string }}
 */
export function normalisePlan(raw) {
  let parsed;

  // ── 1. Parse if string ────────────────────────────────────────────────────
  if (typeof raw === 'string') {
    // Strip reasoning tags: <think>...</think>
    let stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Strip markdown code fences: ```json ... ``` or ``` ... ```
    stripped = stripped
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    // Extract first JSON object if surrounded by other text
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      stripped = jsonMatch[0];
    }

    try {
      parsed = JSON.parse(stripped);
    } catch (_) {
      return { ok: false, error: 'LLM response is not valid JSON and could not be parsed.' };
    }
  } else if (raw !== null && typeof raw === 'object') {
    parsed = raw;
  } else {
    return { ok: false, error: 'LLM response is empty or has an unexpected type.' };
  }

  // ── 2. Normalise fields ───────────────────────────────────────────────────

  // goal: trim whitespace
  if (typeof parsed.goal === 'string') {
    parsed.goal = parsed.goal.trim();
  }

  // tasks: ensure it is an array
  if (!Array.isArray(parsed.tasks)) {
    // Some models wrap in a different key or return a single task object
    if (parsed.task && typeof parsed.task === 'object') {
      parsed.tasks = [parsed.task];
      delete parsed.task;
    } else {
      parsed.tasks = [];
    }
  }

  // Normalise each task
  parsed.tasks = parsed.tasks.map((task, idx) => {
    if (typeof task !== 'object' || task === null) return task;

    // Auto-assign id if missing
    if (!task.id || typeof task.id !== 'string' || !task.id.trim()) {
      task.id = `task-${idx + 1}`;
    } else {
      task.id = task.id.trim();
    }

    // Trim string fields
    if (typeof task.type === 'string') task.type = task.type.trim().toUpperCase();
    if (typeof task.title === 'string') task.title = task.title.trim();
    if (typeof task.description === 'string') task.description = task.description.trim();

    // dependencies: null or missing → []
    if (!Array.isArray(task.dependencies)) {
      task.dependencies = [];
    } else {
      task.dependencies = task.dependencies
        .filter((d) => typeof d === 'string' && d.trim().length > 0)
        .map((d) => d.trim());
    }

    return task;
  });

  return { ok: true, plan: parsed };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a normalised plan object.
 *
 * @param {object} plan - An object produced by normalisePlan().
 * @returns {{ valid: true, plan: object } | { valid: false, errors: string[] }}
 */
export function validatePlan(plan) {
  const errors = [];

  // ── 1. goal ───────────────────────────────────────────────────────────────
  if (typeof plan.goal !== 'string' || plan.goal.trim().length === 0) {
    errors.push('Plan is missing a valid "goal" field (must be a non-empty string).');
  }

  // ── 2 & 3. tasks array ───────────────────────────────────────────────────
  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    errors.push(`Plan must contain at least ${MIN_TASKS} task.`);
    return { valid: false, errors };   // cannot validate individual tasks
  }

  if (plan.tasks.length > MAX_TASKS) {
    errors.push(`Plan contains ${plan.tasks.length} tasks — maximum allowed is ${MAX_TASKS}.`);
  }

  // ── 4–7. Per-task field validation ───────────────────────────────────────
  const validTypes = new Set(Object.values(TaskType));

  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[i];
    const label = task?.id ? `Task "${task.id}"` : `Task at index ${i}`;

    if (typeof task !== 'object' || task === null) {
      errors.push(`${label}: must be an object, got ${typeof task}.`);
      continue;
    }

    // 4. id
    if (typeof task.id !== 'string' || task.id.trim().length === 0) {
      errors.push(`${label}: missing or empty "id" field.`);
    }

    // 5. type
    if (typeof task.type !== 'string' || task.type.trim().length === 0) {
      errors.push(`${label}: missing or empty "type" field.`);
    } else if (!validTypes.has(task.type)) {
      errors.push(
        `${label}: invalid type "${task.type}". Supported types: ${[...validTypes].join(', ')}.`,
      );
    }

    // 6. title
    if (typeof task.title !== 'string' || task.title.trim().length === 0) {
      errors.push(`${label}: missing or empty "title" field.`);
    }

    // 7. description
    if (typeof task.description !== 'string' || task.description.trim().length === 0) {
      errors.push(`${label}: missing or empty "description" field.`);
    }
  }

  // Early return if basic field errors exist — dependency checks would be misleading
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ── 8. Unique IDs ─────────────────────────────────────────────────────────
  const ids = plan.tasks.map((t) => t.id);
  const idSet = new Set();
  for (const id of ids) {
    if (idSet.has(id)) {
      errors.push(`Duplicate task ID: "${id}". Task IDs must be unique.`);
    }
    idSet.add(id);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ── 9. Dependencies reference valid IDs ───────────────────────────────────
  for (const task of plan.tasks) {
    for (const depId of task.dependencies ?? []) {
      if (!idSet.has(depId)) {
        errors.push(
          `Task "${task.id}" depends on unknown task ID "${depId}". ` +
          `Valid IDs are: ${[...idSet].join(', ')}.`,
        );
      }
    }
  }

  // ── 10. Self-dependency ───────────────────────────────────────────────────
  for (const task of plan.tasks) {
    if ((task.dependencies ?? []).includes(task.id)) {
      errors.push(`Task "${task.id}" depends on itself — self-dependencies are not allowed.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ── 11. Circular dependency (delegated to Phase 1) ────────────────────────
  const depResult = validateDependencies(plan.tasks);
  if (!depResult.valid) {
    for (const e of depResult.errors) {
      errors.push(e.message);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, plan };
}
