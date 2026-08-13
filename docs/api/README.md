# API Documentation

> **Status:** Placeholder — to be filled in during development.

## Purpose

This folder documents all REST API endpoints exposed by the backend, including:

- Route definitions and HTTP methods
- Request/response schemas
- Authentication requirements
- Error codes and handling conventions

## Planned Contents

- `auth.md` — Authentication & authorization endpoints (JWT)
- `users.md` — User management endpoints
- `projects.md` — Project CRUD endpoints
- `ai.md` — AI generation endpoints
- `execution.md` — Code execution & validation endpoints
- `agent.md` — Agent/workflow orchestration endpoints
- `errors.md` — Standard error response format

## Conventions

- Base URL: `/api/v1`
- All protected routes require `Authorization: Bearer <token>` header
- All responses follow `{ success, data, message, error }` envelope format
