/**
 * @file agentService.js
 * @module services
 *
 * Agent Service — orchestrates the full AI pipeline for a project goal.
 * Supports both one-shot (synchronous) and streaming (SSE) modes.
 */

import mongoose from "mongoose";
import Project from "../models/Project.js";
import History from "../models/History.js";
import { createAgent, createHandlerRegistry, wireAIHandlers } from "../modules/agent/index.js";

// ─── LOGGER ──────────────────────────────────────────────────────────────────
function log(msg, data = null) {
  if (data) console.log("[AGENT_SERVICE]", msg, data);
  else console.log("[AGENT_SERVICE]", msg);
}

// ─── BUILD PRODUCTION AGENT ──────────────────────────────────────────────────

/**
 * Create an Agent with real AI handlers overlaid on the base registry.
 * Falls back to mock handlers when GROQ_API_KEY is not set.
 *
 * @param {string} projectId
 * @param {Function|null} [onEvent] - Optional SSE event callback(type, data)
 */
function buildProductionAgent(projectId, onEvent = null) {
  const baseRegistry = createHandlerRegistry();
  const hasGroqKey   = !!process.env.GROQ_API_KEY;

  if (hasGroqKey) {
    wireAIHandlers(baseRegistry);
    log("Agent using REAL AI handlers (GROQ)");
  } else {
    log("WARNING: GROQ_API_KEY not set — agent running with MOCK handlers");
  }

  return createAgent({
    projectId,
    handlers: baseRegistry,
    onEvent,   // <-- SSE callback wired in
  });
}

// ─── HISTORY HELPER ──────────────────────────────────────────────────────────
async function appendHistory({ userId, projectId, action, prompt, output, status, metadata }) {
  try {
    await History.create({
      userId, projectId, action, prompt,
      output: output ?? "",
      status,
      metadata: metadata ?? {},
    });
  } catch (err) {
    log("History append failed (non-fatal):", err.message);
  }
}

// ─── MAIN SERVICE ────────────────────────────────────────────────────────────

/**
 * Run the full agent pipeline for a project.
 *
 * @param {{ projectId: string, userId: string, onEvent?: Function }} opts
 * @returns {Promise<{ success, workflowId?, outputs?, memorySnapshot?, error?, projectStatus }>}
 */
export async function runAgentForProject({ projectId, userId, onEvent = null }) {
  // 1. Load and authorize project
  let project;
  try {
    project = await Project.findById(projectId);
  } catch (err) {
    return { success: false, error: { code: "DB_ERROR", message: "Failed to load project: " + err.message }, projectStatus: "failed" };
  }

  if (!project) {
    return { success: false, error: { code: "NOT_FOUND", message: "Project not found." }, projectStatus: "failed" };
  }

  if (project.userId.toString() !== userId.toString()) {
    return { success: false, error: { code: "FORBIDDEN", message: "Not authorized to run agent for this project." }, projectStatus: "failed" };
  }

  const goal = project.prompt;
  if (!goal || typeof goal !== "string" || !goal.trim()) {
    return { success: false, error: { code: "INVALID_GOAL", message: "Project prompt is empty — cannot run agent." }, projectStatus: "failed" };
  }

  // 2. Mark project as running
  try {
    await Project.findByIdAndUpdate(projectId, { status: "running" });
    log("Project status -> running:", projectId);
  } catch (err) {
    log("Failed to update project status (non-fatal):", err.message);
  }

  await appendHistory({
    userId, projectId: project._id, action: "prompt_submitted",
    prompt: goal, status: "pending", metadata: { startedAt: new Date() },
  });

  // 3. Build and run the agent
  log("Starting agent for project:", projectId);
  let agentResult;
  try {
    const agent = buildProductionAgent(projectId.toString(), onEvent);
    agentResult = await agent.run(goal);
  } catch (err) {
    log("Agent threw unexpectedly:", err.message);
    agentResult = {
      success: false, workflowId: null,
      error: { code: "AGENT_ERROR", message: err.message },
      outputs: {},
    };
  }

  // 4. Persist result to DB
  const finalStatus   = agentResult.success ? "completed" : "failed";
  const outputSummary = agentResult.success
    ? JSON.stringify(agentResult.outputs).substring(0, 5000)
    : null;

  try {
    await Project.findByIdAndUpdate(projectId, {
      status: finalStatus,
      generatedOutput: outputSummary,
      metadata: {
        workflowId:     agentResult.workflowId,
        completedAt:    agentResult.success ? new Date() : undefined,
        failedAt:       agentResult.success ? undefined  : new Date(),
        agentOutputs:   agentResult.outputs,
        memorySnapshot: agentResult.memorySnapshot ?? null,
      },
    });
    log("Project status ->", finalStatus, "for:", projectId);
  } catch (err) {
    log("Failed to persist final project status (non-fatal):", err.message);
  }

  // 5. Append completion history
  if (agentResult.success) {
    await appendHistory({
      userId, projectId: project._id, action: "generation_completed",
      prompt: goal, output: outputSummary, status: "success",
      metadata: { workflowId: agentResult.workflowId, taskCount: Object.keys(agentResult.outputs).length },
    });
  } else {
    await appendHistory({
      userId, projectId: project._id, action: "error_detected",
      prompt: goal, status: "failed",
      metadata: { workflowId: agentResult.workflowId, error: agentResult.error },
    });
  }

  // 6. Return structured result
  return {
    success:        agentResult.success,
    workflowId:     agentResult.workflowId,
    outputs:        agentResult.outputs,
    memorySnapshot: agentResult.memorySnapshot ?? null,
    error:          agentResult.error ?? null,
    projectStatus:  finalStatus,
  };
}

/**
 * Get agent run history for a project (ownership enforced).
 */
export async function getAgentHistory({ projectId, userId }) {
  try {
    const project = await Project.findById(projectId);
    if (!project) return { success: false, error: { code: "NOT_FOUND", message: "Project not found." } };
    if (project.userId.toString() !== userId.toString()) {
      return { success: false, error: { code: "FORBIDDEN", message: "Not authorized." } };
    }
    const history = await History.find({ projectId }).sort({ createdAt: -1 }).limit(50);
    return { success: true, history };
  } catch (err) {
    return { success: false, error: { code: "DB_ERROR", message: err.message } };
  }
}
