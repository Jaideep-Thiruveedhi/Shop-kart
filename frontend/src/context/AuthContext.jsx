import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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
    <AuthContext.Provider value={{ user, setUser, loading, setLoading, fetchMe, logout }}>
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
