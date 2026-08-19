# Architecture Documentation

## Overview

This document describes the internal architecture of the "Generative AI for Everyone" backend.

---

## Agent Module (`backend/src/modules/agent/`)

The Agent is the core orchestrator. It accepts a user goal and coordinates every pipeline stage.

### Entry point: `agent.js`

```js
const agent = createAgent({ projectId, handlers });
const result = await agent.run(goal);
// result: { success, workflowId, projectStatus, outputs, memorySnapshot }
```

**Internal flow:**

```
agent.run(goal)
  ├─ planner.createPlan(goal)          → Task[] (type, title, description, dependencies)
  ├─ workflowEngine.loadPlan(tasks)    → Workflow with task queue
  └─ loop until workflow complete:
       task = workflowEngine.nextReady()
       output = handlers.execute(task, context)
       result = executionEngine.run(task, output)
       valid  = validationEngine.validate(task, result)
       if valid:
           memory.update(task, result)
           workflowEngine.markComplete(task)
       else:
           healed = autoHealer.heal(task, result, error)
           if healed: retry above
           else: workflowEngine.markFailed(task) → stop
```

---

## Planner (`planner/`)

Converts a free-text goal into an ordered task plan.

| File | Purpose |
|---|---|
| `planner.js` | Orchestrates planning with retry (up to 3 attempts) |
| `plannerPrompt.js` | System + user prompt templates |
| `plannerProvider.js` | Groq API adapter + MockProvider (for tests/demo) |
| `plannerValidator.js` | Validates the plan structure (types, dependencies, cycles) |

**Output plan format:**

```json
[
  { "id": "task-1", "type": "TEXT_GENERATION", "title": "...", "description": "...", "dependencies": [] },
  { "id": "task-2", "type": "CODE_GENERATION", "title": "...", "description": "...", "dependencies": ["task-1"] }
]
```

---

## Workflow Engine (`workflow/`)

A dependency-aware task scheduler.

| File | Purpose |
|---|---|
| `workflowEngine.js` | Main engine — task lifecycle management |
| `taskQueue.js` | Topological task queue (respects dependencies) |
| `task.js` | Task model with status state machine |
| `constants.js` | `TaskStatus`, `WorkflowStatus`, `TaskType` enums |
| `validators.js` | Input/output schema validators |
| `taskResult.js` | `createSuccessResult` / `createFailureResult` factories |

**Task status transitions:**

```
PENDING → READY → RUNNING → COMPLETED
                  RUNNING → FAILED
                  RUNNING → RETRYING → RUNNING (via auto-healer)
```

---

## Memory (`memory/projectMemory.js`)

Accumulates task outputs as a context string for subsequent AI calls.

- Each completed task's key output (content / code summary) is stored
- `memory.getContextString()` returns a formatted block passed to AI prompts
- Context is per-workflow (not persisted to DB between sessions in v1)
- No cross-project leakage — each agent run has its own memory instance

---

## AI Adapter (`ai/aiAdapter.js`)

Bridges the Agent with Person 3's AI generators.

- `wireAIHandlers(registry)` — overlays real AI handlers onto the handler registry
- `executeAITask(task, context)` — calls the appropriate generator
- `hasAIHandler(type)` — returns true for `TEXT_GENERATION` and `CODE_GENERATION`
- Falls back to mock handlers for `WEBSITE_GENERATION` and `VALIDATION`

**Supported task types and AI handlers:**

| TaskType | Handler | Model |
|---|---|---|
| `TEXT_GENERATION` | `textGenerator.js` | `llama-3.3-70b-versatile` |
| `CODE_GENERATION` | `codeGenerator.js` | `llama-3.3-70b-versatile` |
| `WEBSITE_GENERATION` | Mock (template-based) | — |
| `VALIDATION` | Built-in validation engine | — |

> ⚠️ `backend/src/modules/ai/` is Person 3's code. Do not modify it.

---

## Execution Engine (`execution/`)

Processes AI output through type-specific runners.

| Runner | Input | What it checks |
|---|---|---|
| `textRunner.js` | `{ content: string }` | Non-empty string, minimum length |
| `codeRunner.js` | `{ code: string, language: string }` | Syntax (Acorn parser), no dangerous patterns |
| `websiteRunner.js` | `{ content: string, files?: string[] }` | HTML structure, required tags, FORCE_FAIL detection |

**Security note:** Code is never executed — only statically analysed.

---

## Validation Engine (`execution/validationEngine.js`)

Runs structured checks on execution results.

Returns:

```json
{
  "valid": true,
  "checks": [
    { "name": "executionSucceeded", "status": "PASS" },
    { "name": "outputExists",       "status": "PASS" }
  ],
  "score": 0.95
}
```

---

## Auto-Healer (`healing/autoHealer.js`)

Triggered when a task fails validation or execution.

1. Analyses the failure error
2. Calls the AI with a repair prompt ("fix this output: [error]")
3. Re-runs execution + validation on the repaired output
4. Sets `output._healed = true` on success
5. Retries up to `MAX_RETRIES = 2`
6. After max retries: returns permanent failure (no infinite loop)

---

## Agent Service (`services/agentService.js` — backend)

Wraps the agent with:
- Project ownership verification
- Project status updates (`running` → `completed` / `failed`)
- DB history record creation (`History.create(...)`)
- Final output persistence (`project.generatedOutput`)

---

## API Layer

| Route | Controller | Auth | Description |
|---|---|---|---|
| `POST /api/auth/register` | `authController` | No | Register user |
| `POST /api/auth/login` | `authController` | No | Login, receive JWT |
| `GET /api/auth/me` | `authController` | JWT | Get current user |
| `GET /api/projects` | `projectController` | JWT | List user projects |
| `POST /api/projects` | `projectController` | JWT | Create project |
| `GET /api/projects/:id` | `projectController` | JWT | Get project |
| `PUT /api/projects/:id` | `projectController` | JWT | Update project |
| `DELETE /api/projects/:id` | `projectController` | JWT | Delete project |
| `POST /api/agent/run/:id` | `agentController` | JWT | Run full pipeline |
| `GET /api/agent/history/:id` | `agentController` | JWT | Get run history |
| `GET /api/health` | inline | No | Health check |

---

## Database Models

### User

```
{ name, email, password (hashed), createdAt }
```

### Project

```
{ userId, title, prompt, status, generatedOutput, metadata: { workflowId, agentOutputs }, createdAt, updatedAt }
```

### History

```
{ projectId, userId, action, status, prompt, output, metadata: { workflowId, taskCount }, createdAt }
```

---

## Testing Strategy

All backend modules have unit tests in `backend/tests/`.

- **Agent tests** — Full pipeline scenarios with MockProvider and mock handlers
- **Planner tests** — Plan decomposition, retry on failure, validation
- **Workflow tests** — Dependency graph, task queue, status transitions
- **Execution tests** — Each runner, error types, FORCE_FAIL scenarios
- **Validation tests** — PASS/FAIL for each output type
- **Memory tests** — Context accumulation, isolation
- **AI adapter tests** — Handler registration, context building

No real API calls are made in any test — all LLM interactions are mocked via `MockProvider` and `jest.mock()`.
