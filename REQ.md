# GENERATIVE AI FOR EVERYONE — Setup & Requirements

## Project Overview

A full-stack Generative AI platform where a user provides a high-level goal and
an autonomous agent (Agent → Planner → Workflow Engine → AI Generation →
Execution → Validation → Auto-Healing) produces text, code, and website output.

---

## Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | **18.x** (LTS) | Required for ESM (`"type": "module"`) and `await` at top-level in backend |
| npm | 9.x+ | Comes with Node 18 |
| MongoDB Atlas | Free-tier cluster | M0 or higher. IP must be whitelisted. |
| Git | Any recent | For cloning |

> [!IMPORTANT]
> Node 18+ is required. The backend uses top-level `await` (ESM). Node 16 will crash on startup.

---

## Repository Structure

```
MAJOR-PRJECT-MAIN/
├── backend/                  ← Express.js API server (port 5000)
│   ├── src/
│   │   ├── config/           db.js — MongoDB connection
│   │   ├── controllers/      authController, projectController, agentController
│   │   ├── middleware/       authMiddleware, errorMiddleware
│   │   ├── models/           User.js, Project.js, History.js
│   │   ├── modules/
│   │   │   ├── agent/        agent.js, planner.js, index.js
│   │   │   │   └── healing/  autoHealer.js
│   │   │   ├── ai/           allTasks.js, textGenerator.js (Person 3 — DO NOT MODIFY)
│   │   │   ├── memory/       projectMemory.js
│   │   │   └── workflow/     workflow.js, executionEngine.js, validationEngine.js
│   │   ├── routes/           authRoutes, projectRoutes, agentRoutes
│   │   └── services/         agentService.js
│   ├── tests/                Jest unit + integration tests (417 tests)
│   ├── .env                  ← LOCAL ONLY — never commit
│   ├── .env.example          ← Template — safe to commit
│   └── package.json
│
├── frontend/                 ← React + Vite app (port 5173 dev / built to dist/)
│   ├── src/
│   │   ├── config/           api.js — API_URL, USE_MOCK, apiFetch
│   │   ├── constants/        workflow.js — TaskStatus, WorkflowStatus, TaskType
│   │   ├── context/          AuthContext.jsx
│   │   ├── hooks/            useWorkflow.js, useProject.js
│   │   ├── pages/            LandingPage, LoginPage, RegisterPage,
│   │   │                     DashboardPage, WorkspacePage, HistoryPage
│   │   ├── services/         agentService.js, projectService.js, authService.js
│   │   └── components/       layout/, ui/, workspace/
│   ├── .env                  ← LOCAL ONLY — never commit
│   ├── .env.example          ← Template — safe to commit
│   └── package.json
│
├── REQ.md                    ← This file
└── .gitignore                ← Covers .env for all sub-folders
```

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd MAJOR-PRJECT-MAIN

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

---

## 2. Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and create a free M0 cluster.
2. Create a database user with read/write access.
3. Whitelist your IP (or set `0.0.0.0/0` for development).
4. Get the connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/`

The application uses a database named `genai-for-everyone` (auto-created on first connection).

Collections created automatically:
- `users` — registered accounts
- `projects` — user projects
- `histories` — agent run audit trail

---

## 3. Backend Environment Variables

Copy `.env.example` to `.env` and fill in real values:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB Atlas — required for ALL database features
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<AppName>

# JWT — change to a long random secret in production
JWT_SECRET=your_long_random_jwt_secret_here_change_in_production
JWT_EXPIRE=7d

# Groq AI — required for real AI generation
# Get key at: https://console.groq.com/
# Without this key, the agent uses deterministic mock handlers (no real AI)
GROQ_API_KEY=gsk_...your_key...
GROQ_URL=https://api.groq.com/openai/v1/chat/completions
TEXT_MODEL=llama-3.3-70b-versatile
CODE_MODEL=llama-3.3-70b-versatile
VISION_MODEL=llama-3.3-70b-versatile
```

> [!CAUTION]
> Never commit `backend/.env`. It contains your real database password and API keys.
> The root `.gitignore` already excludes `.env` files.

---

## 4. Frontend Environment Variables

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
# URL of the backend API (default: http://localhost:5000)
VITE_API_URL=http://localhost:5000

# Set to 'false' to use real backend (recommended)
# Set to 'true' for demo/offline mode (no backend needed)
VITE_USE_MOCK=false
```

> [!NOTE]
> `VITE_USE_MOCK=true` runs the app entirely in demo mode with mock data — useful for
> UI development without a running backend. Set to `false` for full stack testing.

---

## 5. Running the Backend

```bash
cd backend
npm start
# or for development with auto-restart:
npm run dev
```

Expected output:
```
==========================================
🚀 GenAI Backend running on port 5000
🌐 Health: http://localhost:5000/api/health
==========================================
[DB] ✅  MongoDB connected: cluster0.xxxxx.mongodb.net
```

> [!IMPORTANT]
> If you see `[DB] ❌ MongoDB connection failed`, the `MONGO_URI` in `backend/.env`
> is wrong or the Atlas IP whitelist doesn't include your machine's IP.

---

## 6. Running the Frontend

```bash
cd frontend
npm run dev
```

Opens at: **http://localhost:5173**

For production build:

```bash
npm run build      # outputs to frontend/dist/
npm run preview    # serve the production build locally
```

---

## 7. API Ports

| Service | Port | URL |
|---|---|---|
| Backend API | 5000 | http://localhost:5000 |
| Frontend (dev) | 5173 | http://localhost:5173 |
| Health check | 5000 | http://localhost:5000/api/health |

---

## 8. Running Tests

```bash
cd backend
npm test
```

Expected: **417 tests passing across 13 suites** covering:
- Agent (`agent.js`, AI adapter, auto-healing)
- Planner (task decomposition)
- Workflow Engine (task queue, dependency resolution)
- Execution Engine (TEXT, CODE, WEBSITE task runners)
- Validation Engine (output checks)
- Memory (project context persistence)

---

## 9. API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Server + database status |
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/projects` | JWT | List user's projects |
| POST | `/api/projects` | JWT | Create project `{ title, prompt }` |
| GET | `/api/projects/:id` | JWT | Get single project |
| PUT | `/api/projects/:id` | JWT | Update project |
| DELETE | `/api/projects/:id` | JWT | Delete project |
| POST | `/api/agent/run/:projectId` | JWT | Run full AI pipeline (synchronous) |
| GET | `/api/agent/history/:projectId` | JWT | Get run history for project |

Authentication: `Authorization: Bearer <token>` header.

> [!NOTE]
> `POST /api/agent/run/:projectId` is **synchronous**. It runs the full pipeline
> and returns when complete. Expect 5–60 seconds depending on AI provider.
> Without a GROQ key, it completes in under 1 second using mock handlers.

---

## 10. Common Errors

| Error | Cause | Fix |
|---|---|---|
| `querySrv ECONNREFUSED` | DNS can't reach Atlas | Check network; disable VPN; try mobile hotspot |
| `MongoServerError: Authentication failed` | Wrong password in MONGO_URI | Re-check `MONGO_URI` in `backend/.env` |
| `401 Unauthorized` | JWT missing or expired | Log in again to get a fresh token |
| `500 Internal Server Error` on agent run | DB not connected | Fix MongoDB connection first |
| `CORS: origin not allowed` | Frontend port not in allowedOrigins | Add your frontend URL to `allowedOrigins` in `backend/src/index.js` |
| Build fails: `Cannot find module '@/constants/workflow'` | Old import from `@/services/mockData` | Replace with `@/constants/workflow` |
| `VITE_USE_MOCK` is still `true` | Real backend not called | Set `VITE_USE_MOCK=false` in `frontend/.env` and restart Vite |

---

## 11. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: 5000) | Server port |
| `NODE_ENV` | No (default: development) | Environment mode |
| `MONGO_URI` | **YES** | Full MongoDB Atlas connection string |
| `JWT_SECRET` | **YES** | Secret for signing JWTs — use a long random string |
| `JWT_EXPIRE` | No (default: 7d) | JWT expiry duration |
| `GROQ_API_KEY` | No | Groq API key for real AI generation |
| `GROQ_URL` | No | Groq API endpoint |
| `TEXT_MODEL` | No | Model for text generation |
| `CODE_MODEL` | No | Model for code generation |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No (default: http://localhost:5000) | Backend API URL |
| `VITE_USE_MOCK` | No (default: true) | `false` = real backend, `true` = demo mode |

---

## 12. Security Checklist

- [x] `.env` files are gitignored (root `.gitignore` covers all sub-folders)
- [x] `.env.example` files contain only placeholders — safe to commit
- [x] JWT secret is configurable (do not use default in production)
- [x] MongoDB credentials are not hardcoded in source code
- [x] GROQ API key is server-side only — never exposed to frontend
- [x] CORS is restricted to known origins in `backend/src/index.js`
- [x] All protected routes require JWT verification via `authMiddleware.protect`
- [x] Project ownership is enforced on every agent/project operation
- [x] Generated code is never executed in the browser

---

## 13. Mock Mode vs Real Mode

| Feature | Mock Mode (`VITE_USE_MOCK=true`) | Real Mode (`VITE_USE_MOCK=false`) |
|---|---|---|
| Backend required | No | Yes |
| MongoDB required | No | Yes |
| Auth works | Simulated (localStorage) | Real JWT |
| Projects | Hardcoded demo data | Real MongoDB |
| Agent run | Animated mock progression | Real Agent + Groq AI (or mock handlers without GROQ key) |
| History | Empty | Real MongoDB records |
| Use case | UI demo, offline dev | Full integration / production |

---

## 14. Team Structure

| Person | Responsibility |
|---|---|
| Person 2 | Backend foundation (Express, MongoDB, auth, project CRUD) |
| Person 3 | AI Generation module (`backend/src/modules/ai/`) — DO NOT MODIFY |
| Me | Agent, Planner, Workflow Engine, Memory, Execution, Validation, Auto-Healing, Frontend integration |

> [!WARNING]
> Do NOT modify `backend/src/modules/ai/` — this is Person 3's code and is
> imported via an ESM→CJS bridge in `autoHealer.js`.
