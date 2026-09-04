import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

// React.StrictMode mounts effects twice in development. Reuse one bootstrap
// request so the app does not call the session endpoint twice.
let bootstrapSessionPromise = null;
function loadBootstrapSession() {
  if (!bootstrapSessionPromise) {
    bootstrapSessionPromise = api('/auth/session').catch(error => {
      bootstrapSessionPromise = null;
      throw error;
    });
  }
  return bootstrapSessionPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('th79_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadBootstrapSession()
      .then(result => {
        if (!active) return;
        if (result?.authenticated && result?.user) {
          setUser(result.user);
          localStorage.setItem('th79_user', JSON.stringify(result.user));
        } else if (result?.authenticated === false) {
          localStorage.removeItem('th79_token');
          localStorage.removeItem('th79_user');
          setUser(null);
        }
      })
      .catch(() => {
        if (!active) return;
        const storedToken = localStorage.getItem('th79_token');
        const storedUser = localStorage.getItem('th79_user');
        if (!storedToken || !storedUser) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (loginValue, password) => {
    const result = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginValue, password })
    });
    if (result?.token) {
      localStorage.setItem('th79_token', result.token);
    }
    if (result?.user) {
      localStorage.setItem('th79_user', JSON.stringify(result.user));
      setUser(result.user);
    }
    bootstrapSessionPromise = Promise.resolve({ authenticated: true, user: result.user });
    return result;
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('th79_token');
      localStorage.removeItem('th79_user');
      setUser(null);
      bootstrapSessionPromise = Promise.resolve({ authenticated: false, user: null });
    }
  };

  const has = permission => Boolean(
    user?.isSuperAdmin ||
    user?.permissions?.includes('*') ||
    user?.permissions?.includes(permission)
  );

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, has }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
