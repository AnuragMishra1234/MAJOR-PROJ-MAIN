/**
 * @file agentController.js
 * @module controllers
 *
 * ROUTES:
 *   POST /api/agent/run/:projectId         — one-shot synchronous run
 *   GET  /api/agent/run-stream/:projectId  — SSE streaming run (real-time events)
 *   GET  /api/agent/history/:projectId     — Get run history
 */

import { runAgentForProject, getAgentHistory } from "../services/agentService.js";

/**
 * POST /api/agent/run/:projectId
 * One-shot synchronous run — blocks until complete.
 */
export const runAgent = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId        = req.user._id;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required." });
    }

    const result = await runAgentForProject({ projectId, userId });

    if (!result.success) {
      const statusMap = { NOT_FOUND: 404, FORBIDDEN: 403, INVALID_GOAL: 400, DB_ERROR: 500 };
      const httpStatus = statusMap[result.error?.code] ?? 500;
      return res.status(httpStatus).json({
        success: false,
        message: result.error?.message || "Agent run failed.",
        error:   result.error,
        projectStatus: result.projectStatus,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Agent completed successfully.",
      data: {
        workflowId:     result.workflowId,
        projectStatus:  result.projectStatus,
        taskCount:      Object.keys(result.outputs ?? {}).length,
        outputs:        result.outputs,
        memorySnapshot: result.memorySnapshot,
      },
    });
  } catch (err) {
    console.error("[AGENT_CTRL] runAgent error:", err.message);
    return res.status(500).json({ success: false, message: "Server error running agent." });
  }
};

/**
 * GET /api/agent/run-stream/:projectId
 * SSE streaming run — sends real-time events as the agent works.
 *
 * Event format (text/event-stream):
 *   event: <type>\n
 *   data: <JSON>\n\n
 *
 * Types: planning, task_start, task_complete, task_fail,
 *        heal_start, heal_success, heal_fail,
 *        workflow_complete, workflow_fail
 */
export const runAgentStream = async (req, res) => {
  const { projectId } = req.params;
  const userId        = req.user._id;

  if (!projectId) {
    return res.status(400).json({ success: false, message: "projectId is required." });
  }

  // ── Set SSE headers ──────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Helper: send one SSE event
  const sendEvent = (type, data) => {
    if (res.writableEnded) return;
    try {
      res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (_) { /* connection may have closed */ }
  };

  // Keep-alive ping every 15s to prevent proxy timeouts
  const keepAlive = setInterval(() => {
    if (res.writableEnded) return clearInterval(keepAlive);
    res.write(': ping\n\n');
  }, 15000);

  // Handle client disconnect
  req.on('close', () => clearInterval(keepAlive));

  try {
    // Send initial ack
    sendEvent('connected', { projectId, message: 'Stream started' });

    // Run agent — onEvent callback streams events to client as they happen
    const result = await runAgentForProject({
      projectId,
      userId,
      onEvent: sendEvent,
    });

    // Send final result event regardless
    if (result.success) {
      sendEvent('workflow_complete', {
        workflowId:    result.workflowId,
        projectStatus: result.projectStatus,
        taskCount:     Object.keys(result.outputs ?? {}).length,
        outputs:       result.outputs,
      });
    } else {
      sendEvent('workflow_fail', {
        error:         result.error,
        projectStatus: result.projectStatus,
      });
    }
  } catch (err) {
    console.error('[AGENT_CTRL] runAgentStream error:', err.message);
    sendEvent('workflow_fail', { error: { message: err.message } });
  } finally {
    clearInterval(keepAlive);
    if (!res.writableEnded) res.end();
  }
};

/**
 * GET /api/agent/history/:projectId
 */
export const agentHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId        = req.user._id;
    const result = await getAgentHistory({ projectId, userId });

    if (!result.success) {
      const statusMap = { NOT_FOUND: 404, FORBIDDEN: 403, DB_ERROR: 500 };
      const httpStatus = statusMap[result.error?.code] ?? 500;
      return res.status(httpStatus).json({ success: false, message: result.error?.message });
    }

    return res.status(200).json({
      success: true,
      count:   result.history.length,
      data:    result.history,
    });
  } catch (err) {
    console.error("[AGENT_CTRL] agentHistory error:", err.message);
    return res.status(500).json({ success: false, message: "Server error fetching history." });
  }
};
