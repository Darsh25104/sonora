import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth.service.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'sonora_token';

/**
 * Holds the logged-in user and the JWT.
 *
 *  - token lives in localStorage so a refresh keeps you logged in
 *  - on mount, if a token exists we call GET /auth/me to validate it
 *  - `likedIds` is a Set of liked song ids → O(1) heart lookups in cards
 *  - the axios layer broadcasts "auth:expired" on 401 → we clear the session
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const saveSession = useCallback((session) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
  }, []);

  // Restore the session on page load.
  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return undefined;
    }

    let alive = true;
    (async () => {
      try {
        const me = await authService.getMe();
        if (alive) setUser(me);
      } catch {
        if (alive) clearSession(); // token expired or revoked
      } finally {
        if (alive) setInitializing(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, clearSession]);

  // 401 responses from any API call end the session.
  useEffect(() => {
    const onExpired = () => clearSession();
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [clearSession]);

  const login = useCallback(
    async (email, password) => {
      const session = await authService.login(email, password);
      saveSession(session);
      return session.user;
    },
    [saveSession]
  );

  const register = useCallback(
    async (payload) => {
      const session = await authService.register(payload);
      saveSession(session);
      return session.user;
    },
    [saveSession]
  );

  const updateProfile = useCallback(async (patch) => {
    const updated = await authService.updateMe(patch);
    setUser(updated);
    return updated;
  }, []);

  /** Called by LikeButton with the fresh array returned by the API. */
  const setLikedSongs = useCallback((songIds) => {
    setUser((prev) => (prev ? { ...prev, likedSongs: songIds } : prev));
  }, []);

  const likedIds = useMemo(
    () => new Set((user?.likedSongs || []).map(String)),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      likedIds,
      login,
      register,
      logout: clearSession,
      updateProfile,
      setLikedSongs,
    }),
    [user, token, initializing, likedIds, login, register, clearSession, updateProfile, setLikedSongs]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
