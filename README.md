# Generative AI for Everyone

## Project Description

**Generative AI for Everyone** is a unified, full-stack platform that empowers users to harness the power of generative AI — including text generation, code/website generation, and visual understanding — through a clean, accessible workspace. The platform orchestrates intelligent agents, multi-step workflows, and automated execution pipelines, backed by a robust backend with authentication, persistent storage, and self-healing capabilities, so that anyone — regardless of technical background — can generate, run, and validate AI-powered outputs with ease.

---

## High-Level Architecture

```
User
  ↓
Frontend / AI Workspace
  ↓
Backend / API / Auth / Database
  ↓
Agent / Planner
  ↓
Workflow Engine
  ↓
AI Generation Engine
  ↓
Execution / Validation
  ↓
Auto-Healing
  ↓
Database / Storage
  ↓
Results → Frontend
```

---

## Team Module Ownership

| Person | Role | Owned Modules |
|--------|------|---------------|
| **Person 1** | Frontend + Agent / Orchestration | `frontend/`, `backend/src/modules/agent/` (planner, workflow, memory, healing), task management, project context, final integration |
| **Person 2** | Backend + Database + Authentication | `backend/src/routes/`, `backend/src/controllers/`, `backend/src/models/`, `backend/src/middleware/`, `backend/src/services/`, `backend/config/` — Node.js, Express, REST APIs, JWT auth, MongoDB |
| **Person 3** | AI Generation Engine | `backend/src/modules/ai/` (text, code, vision, providers, prompts, utils) — prompt processing, AI providers, output normalization |
| **Person 4** | Execution + Validation + PPT | `backend/src/modules/execution/` (runners, validators, errors, ppt) — code execution, build/check, error detection, structured reporting |

**Shared:** `docs/`, `README.md`, `.gitignore`, `.env.example`

---

## Repository Structure

```
major-project-main/
├── frontend/          # React/Next.js frontend (Person 1)
├── backend/           # Node.js/Express backend + all modules (Persons 1–4)
├── docs/              # Architecture, API, workflow & project documentation
├── .gitignore
├── .env.example
└── README.md
```

> See `docs/architecture/README.md` for the detailed architecture diagram.
> See `docs/api/README.md` for API documentation guidelines.
