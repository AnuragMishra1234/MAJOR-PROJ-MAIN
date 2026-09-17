/**
 * @file authService.js
 * @module services
 *
 * Authentication service — register, login, logout, getMe.
 *
 * Mock mode: simulates auth with localStorage-backed fake session.
 * Real mode: calls /api/auth/* on the backend.
 */

import { USE_MOCK, apiFetch, setStoredToken, clearStoredToken, getStoredToken } from '@/config/api';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── MOCK IMPLEMENTATION ──────────────────────────────────────────────────────

const MOCK_USER_KEY = 'genai_mock_user';

const mock = {
  async register(name, email, _password) {
    await delay(600);
    const user = {
      id: `user-${Date.now()}`,
      name,
      email,
      bio: 'Generative AI Developer & Prompt Engineer',
      role: 'Full Stack AI Engineer',
      preferredModel: 'openai/gpt-oss-20b',
      avatarColor: '#D4AF37',
      createdAt: new Date().toISOString(),
    };
    const token = `mock-token-${Date.now()}`;
    setStoredToken(token);
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    return { token, user };
  },

  async login(email, _password) {
    await delay(500);
    const user = {
      id: 'mock-user-1',
      name: 'Demo User',
      email,
      bio: 'Generative AI Developer & Prompt Engineer',
      role: 'Full Stack AI Engineer',
      preferredModel: 'openai/gpt-oss-20b',
      avatarColor: '#D4AF37',
      createdAt: new Date().toISOString(),
    };
    const token = `mock-token-${Date.now()}`;
    setStoredToken(token);
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    return { token, user };
  },

  async logout() {
    await delay(100);
    clearStoredToken();
    localStorage.removeItem(MOCK_USER_KEY);
  },

  async getMe() {
    await delay(200);
    const stored = localStorage.getItem(MOCK_USER_KEY);
    if (!stored) throw new Error('Not authenticated');
    return JSON.parse(stored);
  },

  async updateProfile(profileData) {
    await delay(300);
    const stored = localStorage.getItem(MOCK_USER_KEY);
    const current = stored ? JSON.parse(stored) : { id: 'mock-user-1', email: 'demo@example.com' };
    const updated = { ...current, ...profileData, updatedAt: new Date().toISOString() };
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(updated));
    return updated;
  },

  async updatePassword(_currentPassword, _newPassword) {
    await delay(300);
    return { success: true };
  },

  async getStats() {
    await delay(250);
    return {
      totalProjects: 6,
      completedProjects: 5,
      runningProjects: 1,
      failedProjects: 0,
      totalGenerations: 24,
      successRate: 98,
      recentProjects: [
        { id: 'p1', title: 'Anurag Portfolio', status: 'completed', updatedAt: new Date().toISOString() },
        { id: 'p2', title: 'BeanLab Coffee', status: 'completed', updatedAt: new Date().toISOString() },
        { id: 'p3', title: 'Synapse AI Platform', status: 'completed', updatedAt: new Date().toISOString() },
      ],
    };
  },

  isAuthenticated() {
    return !!getStoredToken();
  },
};

// ─── REAL IMPLEMENTATION ──────────────────────────────────────────────────────

const real = {
  async register(name, email, password) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.data?.token) setStoredToken(data.data.token);
    return data.data; // { token, user }
  },

  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.data?.token) setStoredToken(data.data.token);
    return data.data; // { token, user }
  },

  async logout() {
    clearStoredToken();
  },

  async getMe() {
    const data = await apiFetch('/api/auth/me');
    return data.data; // { id, name, email, bio, role, preferredModel, avatarColor, createdAt }
  },

  async updateProfile(profileData) {
    const data = await apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return data.data;
  },

  async updatePassword(currentPassword, newPassword) {
    const data = await apiFetch('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return data;
  },

  async getStats() {
    const data = await apiFetch('/api/auth/stats');
    return data.data;
  },

  isAuthenticated() {
    return !!getStoredToken();
  },
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

const authService = USE_MOCK ? mock : real;
export default authService;
