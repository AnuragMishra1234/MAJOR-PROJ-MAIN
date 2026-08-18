/**
 * @file plannerPrompt.js
 * @module agent/planner
 *
 * Builds the LLM prompt for converting a user goal into a structured task plan.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 * • The system prompt is the ONLY place where task planning instructions live.
 *   No planning logic is scattered across the codebase.
 * • Structured JSON output is enforced both in the prompt and via the
 *   provider's `response_format: { type: 'json_object' }` setting.
 * • The prompt explicitly lists supported task types so the model cannot
 *   invent unsupported capabilities.
 * • Correction prompts are used on retry — they include the specific
 *   validation errors so the model can fix the plan rather than guessing.
 * • Keeping prompts in their own file makes them easy to tune without
 *   touching business logic.
 */

import { TaskType } from '../workflow/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The system prompt sent to the LLM for all planning requests.
 * Instructs the model on its role, constraints, and required output format.
 *
 * @returns {string} System prompt string.
 */
export function buildSystemPrompt() {
  const supportedTypes = Object.values(TaskType).join(', ');

  return `You are a workflow planner for a generative AI platform called "Generative AI for Everyone".

Your role is to receive a high-level user goal and decompose it into a small set of concrete, executable tasks.

## Your responsibilities
- Understand what the user wants to accomplish.
- Break the goal into 1 to 6 meaningful executable tasks.
- Assign the correct task type to each task.
- Write clear, specific task descriptions.
- Determine which tasks depend on the output of other tasks.
- Allow independent tasks to run in parallel (do NOT chain them unnecessarily).

## Supported task types
You MUST only use the following task types:
${supportedTypes}

Descriptions:
- TEXT_GENERATION   — Generate written content: business descriptions, marketing copy, summaries, reports.
- WEBSITE_GENERATION — Generate a complete website or landing page.
- CODE_GENERATION   — Generate code, scripts, or technical implementations.
- VALIDATION        — Validate, review, or quality-check the output of a previous task.
- OTHER             — Use ONLY if no other type fits. Describe what it does in the description.

## Dependency rules
- If Task B needs the OUTPUT of Task A to run, then B must list A's ID in its dependencies.
- If two tasks are independent (neither needs the other's output), they should have no dependency on each other.
- Never create a circular dependency (A → B → A is invalid).
- Never make a task depend on itself.

## Task quality rules
- Avoid one giant task ("do everything") — split meaningful work into separate tasks.
- Avoid creating more than 6 tasks unless the goal truly requires it.
- Every task must have a clear, meaningful description (at least one sentence).
- Task titles must be short (3–8 words).

## Output format
You MUST return ONLY valid JSON matching this EXACT schema. No markdown, no code fences, no explanation:

{
  "goal": "<the original user goal, verbatim>",
  "tasks": [
    {
      "id": "task-1",
      "type": "<one of the supported task types>",
      "title": "<short task title>",
      "description": "<detailed description of what this task produces>",
      "dependencies": []
    }
  ]
}

Task IDs must follow the pattern: "task-1", "task-2", "task-3", etc.
Dependencies must reference the IDs of other tasks in this same plan.
Do NOT include any field other than: id, type, title, description, dependencies.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the user message for an initial planning request.
 *
 * @param {string} goal - The user's natural language goal.
 * @returns {string} User message string.
 */
export function buildUserMessage(goal) {
  return `USER GOAL: ${goal.trim()}

Decompose this goal into executable tasks following the JSON schema exactly.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORRECTION MESSAGE (used on retry)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a correction user message for a retry attempt.
 * Includes the previous invalid response and specific validation errors
 * so the model can fix the exact problems.
 *
 * @param {string} goal         - Original user goal.
 * @param {string} prevResponse - The previous (invalid) LLM response.
 * @param {string[]} errors     - Validation error messages.
 * @returns {string} Correction message string.
 */
export function buildCorrectionMessage(goal, prevResponse, errors) {
  const errorList = errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n');

  return `The previous task plan you generated was invalid.

USER GOAL: ${goal.trim()}

YOUR PREVIOUS RESPONSE:
${prevResponse}

VALIDATION ERRORS:
${errorList}

Please generate a corrected task plan that fixes ALL of the above errors.
Return ONLY valid JSON matching the required schema. No markdown, no explanation.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE BUILDER (assembles the full messages array)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the full messages array for an initial planning request.
 *
 * @param {string} goal
 * @returns {Array<{ role: string, content: string }>}
 */
export function buildPlanningMessages(goal) {
  return [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserMessage(goal) },
  ];
}

/**
 * Build the full messages array for a retry / correction request.
 *
 * @param {string} goal
 * @param {string} prevResponse
 * @param {string[]} errors
 * @returns {Array<{ role: string, content: string }>}
 */
export function buildCorrectionMessages(goal, prevResponse, errors) {
  return [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserMessage(goal) },
    { role: 'assistant', content: prevResponse },
    { role: 'user', content: buildCorrectionMessage(goal, prevResponse, errors) },
  ];
}
