# Generative AI for Everyone

<div align="center">

**An autonomous, agentic AI platform that transforms a high-level goal into generated text, code, and websites — with real-time orchestration, memory, validation, and self-healing.**

![Tech Stack](https://img.shields.io/badge/Node.js-18%2B-green) ![React](https://img.shields.io/badge/React-18-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green) ![Groq](https://img.shields.io/badge/AI-Groq%20LLM-orange) ![Tests](https://img.shields.io/badge/Tests-417%20passing-brightgreen)

</div>

---

## What Is This?

**Generative AI for Everyone** is a full-stack platform where a user writes a single natural-language goal and an autonomous AI agent does the rest:

1. **Understands** your goal
2. **Plans** a multi-step task workflow
3. **Generates** text, code, and website assets using LLMs
4. **Executes** and validates each output
5. **Self-heals** if anything fails — retries, repairs, and re-validates
6. **Persists** the result to your project dashboard

All of this happens automatically, with a live status UI showing every task in the pipeline.

---

## Features

### User-facing
- 🔐 **Authentication** — Register / Login with JWT
- 📁 **Project Management** — Create, select, and manage AI projects
- 🤖 **AI Workspace** — Submit a goal, watch the agent work, view outputs
- 📊 **Workflow Visualization** — See each task: PENDING → RUNNING → COMPLETED / FAILED
- 🔍 **Task Detail Panel** — Per-task output viewer (text, code, website, validation)
- ⚡ **Auto-Healing Badges** — Visual indicator when a task was automatically repaired
- 📜 **History Log** — Full run history per project
- 🎭 **Demo Mode** — Runs entirely offline with goal-aware mock outputs (no backend needed)

### Technical
- 🧠 **Agentic Orchestration** — Goal → Planner → Workflow Engine → Memory → AI → Execution → Validation → Healing
- 🔗 **Context Memory** — Completed task outputs feed as context into subsequent AI calls
- 🛡️ **Safe Execution** — AI-generated code is validated but never executed on the server
- 🏗️ **Modular Architecture** — Each pipeline stage is independently testable
- ✅ **417 Tests** — Comprehensive test coverage across all backend modules

---

## Architecture

```
USER GOAL (free text)
        │
        ▼
┌───────────────────────┐
│   FRONTEND (React)    │  Auth → Dashboard → Workspace → History
└───────────┬───────────┘
            │  POST /api/agent/run/:projectId
            ▼
┌───────────────────────┐
│  BACKEND API (Express)│  JWT auth, project ownership, DB logging
└───────────┬───────────┘
            │
            ▼
┌───────────────────────────────────────────────────────┐
│                    AGENT (agent.js)                    │
│                                                        │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │   PLANNER    │───►│       WORKFLOW ENGINE        │  │
│  │  (Groq LLM)  │    │  Dependency-aware task queue │  │
│  └──────────────┘    └──────────────┬───────────────┘  │
│                                     │ per task          │
│  ┌──────────────┐    ┌──────────────▼───────────────┐  │
│  │   MEMORY     │◄───│     AI GENERATION            │  │
│  │  (context)   │    │  text / code / website        │  │
│  └──────────────┘    └──────────────┬───────────────┘  │
│                                     │                   │
│                      ┌──────────────▼───────────────┐  │
│                      │   EXECUTION ENGINE            │  │
│                      │   textRunner / codeRunner /   │  │
│                      │   websiteRunner               │  │
│                      └──────────────┬───────────────┘  │
│                                     │                   │
│                      ┌──────────────▼───────────────┐  │
│                      │   VALIDATION ENGINE           │  │
│                      │   Structural + quality checks │  │
│                      └──────────────┬───────────────┘  │
│                                     │ on failure        │
│                      ┌──────────────▼───────────────┐  │
│                      │   AUTO-HEALER                 │  │
│                      │   AI repair → retry → re-val  │  │
│                      └──────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────┐
│   DATABASE (MongoDB)   │  Project status, outputs, history records
└───────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS, Framer Motion |
| Design System | Art Deco — obsidian `#0A0A0A`, champagne `#F2F0E4`, gold `#D4AF37` |
| Backend | Node.js 18 (ESM), Express.js 5 |
| Database | MongoDB Atlas (Mongoose ODM) |
| AI Provider | Groq (llama-3.3-70b-versatile) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Testing | Jest + ESM transform (417 tests) |
| Build | Vite (frontend), native Node.js (backend) |

---

## Project Structure

```
├── backend/                 Express.js API + full agent pipeline
│   ├── src/
│   │   ├── modules/agent/   Agent, Planner, WorkflowEngine, Memory, Execution, Validation, Healing
│   │   ├── modules/ai/      AI adapter + Person 3's generators (DO NOT MODIFY)
│   │   ├── controllers/     auth, project, agent
│   │   ├── routes/          authRoutes, projectRoutes, agentRoutes
│   │   ├── models/          User, Project, History
│   │   └── index.js         Server entry point (port 5000)
│   └── tests/               417 Jest tests across 13 suites
│
├── frontend/                React + Vite SPA
│   ├── src/
│   │   ├── pages/           Landing, Login, Register, Dashboard, Workspace, History
│   │   ├── services/        authService, agentService, projectService, mockData
│   │   ├── hooks/           useWorkflow, useProject
│   │   ├── constants/       workflow.js (TaskStatus, WorkflowStatus, TaskType)
│   │   └── components/      layout/, ui/, workspace/, landing/
│   └── vite.config.js       Path alias: @/ → src/
│
├── docs/                    Architecture documentation
├── README.md                This file
├── REQ.md                   Quick setup reference
├── REQUIREMENTS.md          Detailed requirements (15 sections)
└── .gitignore               Covers .env for all sub-folders
```

---

## Setup

See **[REQUIREMENTS.md](./REQUIREMENTS.md)** for the full setup guide.

### Quick Start (Demo Mode — no backend needed)

```bash
cd frontend
npm install
# Ensure frontend/.env has VITE_USE_MOCK=true (default)
npm run dev
# Open http://localhost:5173
```

### Full Stack (Real Mode)

```bash
# Backend
cd backend && npm install
# Set MONGO_URI and JWT_SECRET in backend/.env
npm start

# Frontend (new terminal)
cd frontend && npm install
# Set VITE_USE_MOCK=false in frontend/.env
npm run dev
```

---

## AI Capabilities

### Real mode (with GROQ_API_KEY)
- **Text Generation** — LLM produces copy, articles, reports, marketing content
- **Code Generation** — LLM produces JavaScript/Python/etc. with syntax validation
- **Website Generation** — Template-based HTML/CSS/JS with content from AI text
- **Planner** — LLM decomposes your goal into an ordered task dependency graph

### Demo mode (without API key)
- The agent uses deterministic mock handlers that produce realistic example content
- The mock content is **goal-aware** — it reads your prompt and tailors the output accordingly
- All pipeline stages (Plan → Execute → Validate → Heal) still run correctly

---

## Agentic Workflow

Each user goal flows through the complete pipeline automatically:

| Stage | What Happens |
|---|---|
| **Planner** | LLM (or MockProvider) decomposes goal into 3–5 tasks with types and dependencies |
| **Workflow Engine** | Schedules tasks in dependency order using a topological queue |
| **Memory** | Each completed task's output is stored and fed as context to subsequent tasks |
| **AI Generation** | Task is sent to the appropriate AI handler (text / code / website) |
| **Execution** | Runner processes the AI output (syntax check, file generation, etc.) |
| **Validation** | Structural and quality checks evaluate the output |
| **Auto-Healing** | On failure: AI repairs the output and retries (up to 2 times) |
| **Result** | Final outputs saved to DB; frontend displays task-by-task results |

---

## Auto-Healing

The auto-healer activates when any task fails validation or execution:

```
TASK FAILS
    ↓
AUTO-HEALER analyses error
    ↓
AI repairs the output
    ↓
RETRY execution + validation
    ↓
SUCCESS → output._healed = true
    or
MAX RETRIES (2) → permanent FAILED
```

Frontend shows a ⚡ **AUTO-HEALED** badge on any task that was repaired.
Workflow terminates cleanly when max retries are exceeded — no infinite loops.

---

## Testing

```bash
cd backend
npm test

# Output: 417 tests passing — 13 suites — ~12s
```

Key test areas:
- Agent orchestration (planning, execution, failure, healing)
- Workflow engine (dependency resolution, status machine)
- Execution runners (text, code, website)
- Validation engine (pass/fail detection, scoring)
- Memory (context accumulation, project isolation)
- Planner (decomposition, retry, validation)

---

## Security

- ✅ All project/agent routes require JWT authentication
- ✅ Project ownership re-verified on every agent run
- ✅ AI-generated code is never `eval()`'d or executed on the server
- ✅ GROQ API key is server-side only — never exposed to the browser
- ✅ `.env` files are gitignored (root `.gitignore` covers all sub-folders)
- ✅ `.env.example` files contain only placeholders
- ✅ CORS restricted to known origins

---

## Known Limitations

| Limitation | Notes |
|---|---|
| **Website Generation** | Uses template-based generation (mock build). Real HTML is correct but not compiled/deployed. |
| **No real code execution** | Code generation produces valid code but it is never run on the server (by design — security). |
| **Synchronous agent** | The `POST /api/agent/run` call blocks until complete. With real Groq + 4 tasks, expect 10–60s. |
| **No WebSocket** | Frontend has no live streaming from the backend. In real mode, UI shows a loading state while waiting. |
| **Mock mode history** | History is empty in demo mode (no database writes). |
| **Single AI provider** | Currently Groq only. Adding other providers requires updating `plannerProvider.js` and `aiAdapter.js`. |

---

## Team

| Person | Responsibility |
|---|---|
| Person 2 | Backend foundation: Express setup, MongoDB models, auth, project CRUD |
| Person 3 | AI Generation module: `backend/src/modules/ai/` — text, code, vision generators |
| Person 1 (lead) | Agent, Planner, WorkflowEngine, Memory, Execution, Validation, AutoHealing, Frontend integration |

> ⚠️ `backend/src/modules/ai/` is Person 3's code. Do not modify it.
