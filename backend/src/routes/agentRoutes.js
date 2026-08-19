/**
 * @file agentRoutes.js
 * @module routes
 *
 * Agent routes — mounted at /api/agent
 *
 *   POST /api/agent/run/:projectId         — One-shot synchronous run
 *   GET  /api/agent/run-stream/:projectId  — SSE streaming run (real-time events)
 *   GET  /api/agent/history/:projectId     — Get run history
 */

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { runAgent, runAgentStream, agentHistory } from "../controllers/agentController.js";

const router = express.Router();

// All agent routes require authentication
router.use(protect);

// POST /api/agent/run/:projectId — synchronous (blocking) run
router.post("/run/:projectId", runAgent);

// GET /api/agent/run-stream/:projectId — SSE streaming run
router.get("/run-stream/:projectId", runAgentStream);

// GET /api/agent/history/:projectId — run history
router.get("/history/:projectId", agentHistory);

export default router;
