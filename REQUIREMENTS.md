# REQUIREMENTS.md
# GENERATIVE AI FOR EVERYONE — Complete Requirements & Setup Guide

> **This document covers every requirement to set up, run, test, and understand
> the complete "Generative AI for Everyone" platform.**

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Database Setup](#3-database-setup-mongodb-atlas)
4. [AI Provider Setup](#4-ai-provider-setup-groq)
5. [Backend Setup](#5-backend-setup)
6. [Frontend Setup](#6-frontend-setup)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Running the Project](#8-running-the-project)
9. [Testing](#9-testing)
10. [Building for Production](#10-building-for-production)
11. [API Reference](#11-api-reference)
12. [Common Errors](#12-common-errors)
13. [Security Rules](#13-security-rules)
14. [Architecture Overview](#14-architecture-overview)
15. [Mock Mode vs Real Mode](#15-mock-mode-vs-real-mode)

---

## 1. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | **≥ 18.x LTS** | Required. Backend uses top-level `await` (ESM). Node 16 will crash. |
| **npm** | ≥ 9.x | Bundled with Node 18 |
| **MongoDB Atlas** | Free M0 cluster | Cloud-hosted. Local MongoDB also works. |
| **Groq API key** | Any tier | Optional — without it, the agent uses mock AI handlers |
| **Git** | Any | For cloning |
| **Modern browser** | Chrome / Firefox / Edge | For the frontend |

### Check your Node version

```bash
node --version   # must show v18.x.x or higher
npm --version    # must show 9.x or higher
```

If your Node version is below 18, install from [nodejs.org](https://nodejs.org/en/download).

---

## 2. Project Structure

```
MAJOR-PRJECT-MAIN/
│
├── backend/                          ← Express.js API server
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 ← MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js     ← Register / Login / Me
│   │   │   ├── projectController.js  ← Project CRUD
│   │   │   └── agentController.js    ← Agent run / history
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     ← JWT verification
│   │   │   └── errorMiddleware.js    ← 404 + global error handler
│   │   ├── models/
│   │   │   ├── User.js               ← User schema
│   │   │   ├── Project.js            ← Project schema
│   │   │   └── History.js            ← Agent run history schema
│   │   ├── modules/
│   │   │   ├── agent/
│   │   │   │   ├── agent.js          ← Orchestrator (goal→plan→execute→validate→heal)
│   │   │   │   ├── taskHandlers.js   ← Handler registry (mock + real AI)
│   │   │   │   ├── index.js          ← Public barrel export
│   │   │   │   ├── healing/
│   │   │   │   │   └── autoHealer.js ← Auto-healing engine
│   │   │   │   ├── memory/
│   │   │   │   │   └── projectMemory.js ← Project context accumulation
│   │   │   │   ├── planner/
│   │   │   │   │   ├── planner.js       ← Goal → task plan (via AI/mock)
│   │   │   │   │   ├── plannerPrompt.js ← System + user prompts for planner
│   │   │   │   │   ├── plannerProvider.js ← Groq / MockProvider
│   │   │   │   │   └── plannerValidator.js ← Plan validation
│   │   │   │   ├── execution/
│   │   │   │   │   ├── executionEngine.js ← Routes tasks to runners
│   │   │   │   │   ├── validationEngine.js ← Validates runner output
│   │   │   │   │   └── runners/
│   │   │   │   │       ├── textRunner.js    ← TEXT_GENERATION
│   │   │   │   │       ├── codeRunner.js    ← CODE_GENERATION (sandboxed)
│   │   │   │   │       └── websiteRunner.js ← WEBSITE_GENERATION (mock build)
│   │   │   │   └── workflow/
│   │   │   │       ├── workflowEngine.js    ← Task scheduling + dependency graph
│   │   │   │       ├── taskQueue.js         ← Dependency-aware task queue
│   │   │   │       ├── task.js              ← Task model
│   │   │   │       └── constants.js         ← TaskStatus, WorkflowStatus, TaskType
│   │   │   └── ai/
│   │   │       ├── aiAdapter.js             ← Bridges agent ↔ AI module
│   │   │       ├── utils/allTasks.js        ← Person 3's AI entry point (DO NOT MODIFY)
│   │   │       ├── text/textGenerator.js    ← Person 3's text generation
│   │   │       └── code/codeGenerator.js   ← Person 3's code generation
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   └── agentRoutes.js
│   │   ├── services/
│   │   │   └── agentService.js             ← Orchestrates agent run + DB persistence
│   │   ├── utils/
│   │   │   ├── generateToken.js            ← JWT creation
│   │   │   └── response.js                 ← sendSuccess / sendError helpers
│   │   └── index.js                        ← Express app entry point
│   ├── tests/                              ← Jest test suites (417 tests)
│   ├── .env                                ← LOCAL ONLY — gitignored
│   ├── .env.example                        ← Safe to commit (placeholders only)
│   └── package.json
│
├── frontend/                               ← React + Vite SPA
│   ├── src/
│   │   ├── App.jsx                         ← Root router + page switcher
│   │   ├── main.jsx                        ← React DOM entry
│   │   ├── config/api.js                   ← API_URL, USE_MOCK, apiFetch
│   │   ├── constants/workflow.js           ← TaskStatus, WorkflowStatus, TaskType
│   │   ├── context/AuthContext.jsx         ← Auth state (user, login, logout)
│   │   ├── hooks/
│   │   │   ├── useWorkflow.js              ← Workflow lifecycle management
│   │   │   └── useProject.js               ← Project CRUD hook
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx             ← Marketing / hero page
│   │   │   ├── LoginPage.jsx               ← Login form
│   │   │   ├── RegisterPage.jsx            ← Registration form
│   │   │   ├── DashboardPage.jsx           ← Project grid + creation
│   │   │   ├── WorkspacePage.jsx           ← AI Workspace (main product UI)
│   │   │   └── HistoryPage.jsx             ← Agent run history per project
│   │   ├── services/
│   │   │   ├── authService.js              ← Auth (mock + real)
│   │   │   ├── agentService.js             ← Agent run + history (mock + real)
│   │   │   ├── projectService.js           ← Project CRUD (mock + real)
│   │   │   └── mockData.js                 ← Mock data for demo mode
│   │   └── components/
│   │       ├── layout/                     ← Navbar, Footer, PageContainer
│   │       ├── ui/                         ← DecoButton, DecoCard, DecoInput, etc.
│   │       ├── workspace/                  ← TaskDetailsPanel, OutputViewer, etc.
│   │       └── landing/                    ← Hero, sections, previews
│   ├── .env                                ← LOCAL ONLY — gitignored
│   ├── .env.example                        ← Safe to commit
│   ├── vite.config.js                      ← Vite + path aliases (@/ → src/)
│   ├── tailwind.config.js                  ← Art Deco theme
│   └── package.json
│
├── docs/                                   ← Architecture documentation
├── REQ.md                                  ← This file (requirements)
├── README.md                               ← Project overview
└── .gitignore                              ← Covers .env for all sub-folders
```

---

## 3. Database Setup (MongoDB Atlas)

### Step 1: Create a cluster

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0** cluster
3. Choose any cloud provider and region closest to you

### Step 2: Create a database user

1. Go to **Database Access** → Add New Database User
2. Authentication method: **Password**
3. Role: **Read and Write to Any Database**
4. Note the username and password

### Step 3: Whitelist your IP

1. Go to **Network Access** → Add IP Address
2. For development: click **Allow Access From Anywhere** (`0.0.0.0/0`)
3. For production: whitelist your server's specific IP

### Step 4: Get the connection string

1. Go to **Database** → **Connect** → **Drivers**
2. Driver: Node.js
3. Copy the connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/`

The app uses database name `genai-for-everyone` (created automatically on first connect).

### Collections (auto-created)

| Collection | Purpose |
|---|---|
| `users` | Registered user accounts |
| `projects` | User AI projects |
| `histories` | Agent run audit trail |

---

## 4. AI Provider Setup (Groq)

Groq provides fast inference for open-source LLMs.

### Get a free API key

1. Sign up at [https://console.groq.com](https://console.groq.com)
2. Go to **API Keys** → **Create API Key**
3. Copy the key (starts with `gsk_`)

### Without a key (demo mode)

The agent runs with **mock AI handlers** — deterministic, fast, returns example content.
All pipeline stages (plan → execute → validate → heal) still work correctly.

---

## 5. Backend Setup

```bash
# From project root
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your real values (see Section 7)
# Minimum required: MONGO_URI, JWT_SECRET
```

### Verify setup

```bash
npm start
# Expected output:
# ==========================================
# 🚀 GenAI Backend running on port 5000
# 🌐 Health: http://localhost:5000/api/health
# ==========================================
# [DB] ✅  MongoDB connected: <your-cluster>
```

---

## 6. Frontend Setup

```bash
# From project root
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env (see Section 7)
# For real mode: set VITE_USE_MOCK=false
```

---

## 7. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | HTTP server port |
| `NODE_ENV` | No | `development` | Environment (`development` / `production`) |
| `CLIENT_URL` | No | `http://localhost:3000` | Allowed CORS origin |
| `MONGO_URI` | **YES** | — | Full MongoDB Atlas connection string |
| `JWT_SECRET` | **YES** | — | Secret for signing JWTs. Use 32+ random characters in production. |
| `JWT_EXPIRE` | No | `7d` | JWT expiry (e.g. `7d`, `24h`, `1h`) |
| `GROQ_API_KEY` | No | — | Groq API key. Without this, mock AI handlers are used. |
| `GROQ_URL` | No | `https://api.groq.com/openai/v1/chat/completions` | Groq endpoint |
| `TEXT_MODEL` | No | `llama-3.3-70b-versatile` | Model for text generation |
| `CODE_MODEL` | No | `llama-3.3-70b-versatile` | Model for code generation |
| `VISION_MODEL` | No | `llama-3.3-70b-versatile` | Model for vision tasks |

**Minimum working `backend/.env`:**

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.abc123.mongodb.net/?appName=Cluster0
JWT_SECRET=your-very-long-random-secret-here-at-least-32-chars
JWT_EXPIRE=7d
GROQ_API_KEY=gsk_yourkeyhere
```

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:5000` | Backend API base URL |
| `VITE_USE_MOCK` | No | `true` | `false` = real backend; `true` = demo/offline mode |

**For real mode:**

```env
VITE_API_URL=http://localhost:5000
VITE_USE_MOCK=false
```

**For demo mode (no backend needed):**

```env
VITE_USE_MOCK=true
```

> [!CAUTION]
> Never commit real values in `.env`. Both `.env` files are gitignored by the root `.gitignore`.
> Only `.env.example` files are safe to commit — they contain placeholders only.

---

## 8. Running the Project

### Development (both servers)

**Terminal 1 — Backend:**

```bash
cd backend
npm start
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Quick demo (no backend needed)

```bash
cd frontend
# Ensure frontend/.env has: VITE_USE_MOCK=true
npm run dev
```

All UI features work with realistic mock data — no database or API key required.

---

## 9. Testing

### Backend Tests

```bash
cd backend
npm test
```

**Expected result: 417 tests passing across 13 suites**

| Suite | Tests | What it covers |
|---|---|---|
| `agent.test.js` | ~60 | Agent orchestration, planning, execution, failure handling |
| `agent.phase6.test.js` | ~27 | Execution failures, validation failures, healing |
| `aiAdapter.test.js` | ~15 | AI adapter, context passing, model bridging |
| `planner.test.js` | ~30 | Goal decomposition, retry logic, validation |
| `workflow.test.js` | ~25 | Workflow engine, dependency resolution |
| `taskQueue.test.js` | ~20 | Task ordering, dependency graph |
| `executionEngine.test.js` | ~30 | Text/code/website runners |
| `validationEngine.test.js` | ~35 | Output validation, PASS/FAIL detection |
| `projectMemory.test.js` | ~25 | Context accumulation, isolation |
| `taskResult.test.js` | ~20 | Result shape validation |
| `validators.test.js` | ~20 | Schema validators |
| `task.test.js` | ~20 | Task model |
| `workflow.test.js` | ~15 | Workflow status machine |

### Frontend Build (validation)

```bash
cd frontend
npm run build
# Expected: ✓ built in ~18s, no errors
```

### No frontend unit tests are currently configured

The frontend uses manual testing through the browser + mock mode.

---

## 10. Building for Production

### Backend

The backend is a Node.js ESM application — no compilation step required.

```bash
cd backend
NODE_ENV=production node src/index.js
```

For production deployments, use a process manager like PM2:

```bash
npm install -g pm2
pm2 start backend/src/index.js --name genai-backend
```

### Frontend

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

Serve the `dist/` folder with any static file server (Nginx, Vercel, Netlify, etc.).

Set the `VITE_API_URL` environment variable to your production backend URL before building:

```bash
VITE_API_URL=https://your-backend-domain.com npm run build
```

---

## 11. API Reference

### Authentication

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ success, data: { token, user } }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ success, data: { token, user } }` |
| GET | `/api/auth/me` | — | `{ success, data: user }` |

All protected endpoints require header: `Authorization: Bearer <token>`

### Projects

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/api/projects` | — | `{ success, count, data: Project[] }` |
| POST | `/api/projects` | `{ title, prompt }` | `{ success, data: Project }` |
| GET | `/api/projects/:id` | — | `{ success, data: Project }` |
| PUT | `/api/projects/:id` | `{ title?, prompt?, status? }` | `{ success, data: Project }` |
| DELETE | `/api/projects/:id` | — | `{ success, message }` |

**Project shape:**

```json
{
  "_id": "...",
  "userId": "...",
  "title": "EcoCampus Launch",
  "prompt": "Create a website for an eco-friendly startup",
  "status": "pending | running | completed | failed",
  "generatedOutput": "...",
  "metadata": { "workflowId": "...", "agentOutputs": {} },
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Agent

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/agent/run/:projectId` | — | `{ success, data: AgentResult }` |
| GET | `/api/agent/history/:projectId` | — | `{ success, count, data: History[] }` |

> **Important:** `POST /api/agent/run/:projectId` is **synchronous**. It blocks until the
> entire pipeline completes. Typical duration: 1s (mock) to 60s (real Groq AI).

**AgentResult shape:**

```json
{
  "workflowId": "wf-uuid",
  "projectStatus": "completed | failed",
  "taskCount": 4,
  "outputs": {
    "task-uuid": { "content": "...", "model": "llama-3.3-70b-versatile", "latencyMs": 1420 }
  },
  "memorySnapshot": null
}
```

**History record shape:**

```json
{
  "_id": "...",
  "action": "workflow_started | generation_completed | error_detected",
  "status": "pending | success | failed",
  "prompt": "...",
  "output": "...",
  "metadata": { "workflowId": "...", "taskCount": 4 },
  "createdAt": "..."
}
```

### Health

```
GET /api/health
→ { success: true, status: "ok", database: "connected | disconnected", timestamp: "..." }
```

---

## 12. Common Errors

| Error | Cause | Fix |
|---|---|---|
| `querySrv ECONNREFUSED _mongodb._tcp...` | DNS resolution blocked (VPN, firewall, corporate network) | Try on a different network; disable VPN; use mobile hotspot |
| `MongoServerError: Authentication failed` | Wrong password in MONGO_URI | Double-check username/password in `backend/.env` |
| `401 Unauthorized` on all requests | JWT expired or missing | Re-login to get a fresh token |
| `500` on agent run with DB error | MongoDB not connected | Fix connection first — check `GET /api/health` |
| Frontend shows "DEMO" badge | `VITE_USE_MOCK=true` | Set to `false` in `frontend/.env` and restart Vite |
| Frontend shows "LIVE" but API fails | Wrong `VITE_API_URL` | Check that backend is running on port 5000 |
| `Cannot find module '@/constants/workflow'` | Stale import from old `@/services/mockData` | Replace import with `@/constants/workflow` |
| `SyntaxError: Cannot use import statement` | Node < 18 or missing `"type": "module"` | Upgrade to Node 18+ |
| Backend crashes immediately on startup | `await connectDB()` at top-level requires ESM | Ensure Node 18+ and `"type": "module"` in `backend/package.json` |
| `CORS: origin not allowed` | Frontend port not in `allowedOrigins` | Add your frontend URL to `allowedOrigins` in `backend/src/index.js` |
| Agent runs with mock handlers despite having GROQ key | `GROQ_API_KEY` env var not loaded | Restart backend after editing `.env` |

---

## 13. Security Rules

### What is protected

- All `/api/projects/*` and `/api/agent/*` routes require a valid JWT
- JWT is verified on every request via `authMiddleware.protect`
- Project ownership is re-verified on every agent run (not just at creation)
- Groq API key is server-side only — never exposed to the frontend or browser

### What must NOT be done

- Never commit `backend/.env` or `frontend/.env` to git
- Never hardcode credentials, tokens, or API keys in source files
- Never execute AI-generated code on the host — the execution layer uses sandboxed runners
- Never expose raw MongoDB errors to API consumers (the error handler sanitizes them)

### CORS

Backend allows these origins by default (see `backend/src/index.js`):
- `http://localhost:3000`
- `http://localhost:5173` (Vite dev)

Add your production frontend URL to `allowedOrigins` before deploying.

### Generated code safety

Code generated by the AI is validated and syntax-checked but **never `eval()`'d or executed**
on the server. The `codeRunner.js` applies static validation only.

---

## 14. Architecture Overview

```
USER GOAL
    │
    ▼
FRONTEND (React + Vite)
    │  POST /api/agent/run/:projectId
    ▼
BACKEND API (Express.js)
    │
    ▼
AGENT SERVICE (agentService.js)
    │  → verify project ownership
    │  → update project status: running
    │
    ▼
AGENT (agent.js)
    │
    ├─► PLANNER (planner.js)
    │       Uses Groq LLM (or MockProvider) to decompose goal into task plan
    │       Returns: [ { type, title, description, dependencies } ]
    │
    ├─► WORKFLOW ENGINE (workflowEngine.js)
    │       Loads task plan into dependency-aware task queue
    │       Executes tasks in dependency order
    │
    ├─► PROJECT MEMORY (projectMemory.js)
    │       Accumulates outputs from completed tasks
    │       Provides context string to subsequent AI calls
    │
    ├─► AI GENERATION (aiAdapter.js → allTasks.js → textGenerator/codeGenerator)
    │       TEXT_GENERATION → Groq LLM text
    │       CODE_GENERATION → Groq LLM code
    │       WEBSITE_GENERATION → Mock build (template-based)
    │
    ├─► EXECUTION ENGINE (executionEngine.js + runners/)
    │       Validates and processes AI output
    │       textRunner: checks content field
    │       codeRunner: syntax validation (no execution on host)
    │       websiteRunner: mock build with file generation
    │
    ├─► VALIDATION ENGINE (validationEngine.js)
    │       Structural + semantic output checks
    │       Returns: { valid, checks, score }
    │
    └─► AUTO-HEALER (autoHealer.js)
            On failure: calls AI to repair output
            Retry up to MAX_RETRIES (2) times
            Sets output._healed = true on recovery
            On max retries exceeded: permanent FAILED state

    ▼
DATABASE (MongoDB Atlas)
    │  Project.status → completed | failed
    │  Project.generatedOutput → serialized outputs
    │  History records → audit trail
    ▼
FRONTEND
    Displays outputs, task details, healing badges, history
```

---

## 15. Mock Mode vs Real Mode

| Feature | `VITE_USE_MOCK=true` | `VITE_USE_MOCK=false` |
|---|---|---|
| Backend required | ❌ No | ✅ Yes |
| MongoDB required | ❌ No | ✅ Yes |
| Auth | Simulated (localStorage) | Real JWT |
| Projects | Hardcoded demo data | Real MongoDB |
| Agent run | Animated step-by-step mock | Real synchronous pipeline |
| AI generation | Preset example outputs | Groq LLM (or mock if no key) |
| History | Empty | Real MongoDB records |
| "DEMO" badge | Shows in navbar | Hidden |
| Use case | Offline demo / UI dev | Full integration / production |

---

*Last updated: Phase 10 — Final Production Readiness*
