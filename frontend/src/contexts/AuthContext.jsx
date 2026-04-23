import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { authMe, setAccessTokenGetter } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'stocksense_access_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    setAccessTokenGetter(() => token);
    return () => setAccessTokenGetter(() => null);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authMe()
      .then((res) => {
        if (!cancelled) {
          setUser(res.data.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const persistSession = useCallback((accessToken, userRow) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setUser(userRow);
    setToken(accessToken);
    setLoading(false);
  }, []);

  const signInWithCredentials = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      const d = res.data.data;
      persistSession(d.access_token, d.user);
    },
    [persistSession],
  );

  const signUpWithCredentials = useCallback(
    async (email, password, name) => {
      const res = await api.post('/auth/register', { email, password, name: name || '' });
      const d = res.data.data;
      persistSession(d.access_token, d.user);
    },
    [persistSession],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!token && !!user,
      signInWithCredentials,
      signUpWithCredentials,
      signOut,
    }),
    [user, loading, token, signInWithCredentials, signUpWithCredentials, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
