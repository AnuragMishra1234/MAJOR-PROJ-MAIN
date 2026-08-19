/**
 * @file api.js
 * @module config
 *
 * Central API configuration for GENERATIVE AI FOR EVERYONE frontend.
 *
 * MOCK MODE:
 *   When VITE_USE_MOCK=true all services return mock data.
 *   Set VITE_USE_MOCK=false (in .env) to connect to the real backend.
 *
 * AUTH:
 *   Token is read from localStorage on each request.
 *   Use setAuthToken() / clearAuthToken() from authService to manage it.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// ─── Token storage helpers ────────────────────────────────────────────────────

const TOKEN_KEY = 'genai_auth_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

/**
 * Authenticated JSON fetch wrapper.
 *
 * - Automatically attaches `Authorization: Bearer <token>` if a token is stored.
 * - Normalizes errors to { message, status, body }.
 *
 * @param {string}      path    — API path, e.g. '/api/projects'
 * @param {RequestInit} options — Standard fetch options
 * @returns {Promise<any>}       Parsed JSON body
 */
export async function apiFetch(path, options = {}) {
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.message || `API error ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return res.json();
}
