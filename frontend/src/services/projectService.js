/**
 * @file projectService.js
 * @module services
 *
 * Project CRUD service.
 *
 * Mock mode: returns in-memory MOCK_PROJECTS data.
 * Real mode: calls the backend API at /api/projects/*.
 *
 * Real API response shape (from backend/src/controllers/projectController.js):
 *   GET  /api/projects         → { success, count, data: Project[] }
 *   GET  /api/projects/:id     → { success, data: Project }
 *   POST /api/projects         → { success, message, data: Project }
 *   PUT  /api/projects/:id     → { success, message, data: Project }
 *   DELETE /api/projects/:id   → { success, message }
 */

import { USE_MOCK, apiFetch } from '@/config/api';
import { MOCK_PROJECTS } from './mockData';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── MOCK IMPLEMENTATION ───────────────────────────────────────────────────────

let _mockProjects = [...MOCK_PROJECTS];

const mock = {
  async getProjects() {
    await delay(400);
    return [..._mockProjects];
  },

  async getProject(id) {
    await delay(200);
    const project = _mockProjects.find((p) => p.id === id);
    if (!project) throw new Error(`Project "${id}" not found.`);
    return { ...project };
  },

  async createProject(goal) {
    await delay(600);
    const project = {
      id: `proj-${Date.now()}`,
      title: goal.length > 40 ? goal.slice(0, 40) + '…' : goal,
      goal,
      prompt: goal,
      status: 'ACTIVE',
      taskCount: 4,
      completedTasks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    _mockProjects = [project, ..._mockProjects];
    return { ...project };
  },

  async deleteProject(id) {
    await delay(200);
    _mockProjects = _mockProjects.filter((p) => p.id !== id);
    return { success: true };
  },
};

// ─── REAL IMPLEMENTATION ───────────────────────────────────────────────────────

/**
 * Normalize a raw MongoDB project document to the shape the frontend expects.
 * Maps _id → id, prompt → goal, and adds UI-friendly defaults.
 */
const normalizeProject = (raw) => ({
  id: raw._id || raw.id,
  title: raw.title,
  goal: raw.prompt || raw.goal || '',
  status: raw.status?.toUpperCase() || 'PENDING',
  taskCount: raw.metadata?.taskCount ?? 0,
  completedTasks: raw.metadata?.completedTasks ?? 0,
  generatedOutput: raw.generatedOutput ?? null,
  tags: raw.tags ?? [],
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

const real = {
  async getProjects() {
    const data = await apiFetch('/api/projects');
    // Backend returns: { success, count, data: Project[] }
    const projects = Array.isArray(data.data) ? data.data : [];
    return projects.map(normalizeProject);
  },

  async getProject(id) {
    const data = await apiFetch(`/api/projects/${id}`);
    return normalizeProject(data.data);
  },

  async createProject(goal) {
    const data = await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        title: goal.length > 60 ? goal.slice(0, 60) + '…' : goal,
        prompt: goal,
      }),
    });
    return normalizeProject(data.data);
  },

  async deleteProject(id) {
    return apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
  },
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

const projectService = USE_MOCK ? mock : real;
export default projectService;
