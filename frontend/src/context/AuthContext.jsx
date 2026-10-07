import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // `initialising` covers the very first render only. The JWT lives in an
  // HttpOnly cookie, so React cannot know who is signed in until it asks the
  // backend. Without this flag the guard would treat "not asked yet" as "not
  // logged in" and redirect a perfectly valid session to /login on every refresh.
  const [initialising, setInitialising] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/customers/me');
      // backend returns safe customer directly (no wrapper) via getProfile
      // fallback: if wrapped in { customer } use that
      const u = data.customer ?? data;
      if (u && u._id) setUser(u);
      else if (u && u.email) setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  // Hydrate the session on mount. Without this, `user` stays null until the
  // user logs in again in this tab, and every hard refresh / deep link to a
  // protected route would bounce to /login despite a valid cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchMe();
      if (!cancelled) setInitialising(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await api.post('/customers/logout');
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setLoading, initialising, fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
