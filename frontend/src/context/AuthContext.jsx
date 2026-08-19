import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '@/services/authService';

/**
 * AuthContext — global authentication state.
 *
 * Provides: user, isAuthenticated, loading, login, register, logout
 *
 * Usage:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true on initial session check
  const [error, setError]     = useState(null);

  // ── On mount: restore session ─────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      if (authService.isAuthenticated()) {
        try {
          const me = await authService.getMe();
          setUser(me);
        } catch {
          // Token may be invalid/expired — clear it
          await authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const result = await authService.register(name, email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — hook to access authentication context.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export default AuthContext;
