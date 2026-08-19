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
    const user = { id: `user-${Date.now()}`, name, email };
    const token = `mock-token-${Date.now()}`;
    setStoredToken(token);
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    return { token, user };
  },

  async login(email, _password) {
    await delay(500);
    // Mock: accept any credentials
    const user = { id: 'mock-user-1', name: 'Demo User', email };
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
    // Store token on success
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
    return data.data; // { id, name, email, createdAt }
  },

  isAuthenticated() {
    return !!getStoredToken();
  },
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

const authService = USE_MOCK ? mock : real;
export default authService;
