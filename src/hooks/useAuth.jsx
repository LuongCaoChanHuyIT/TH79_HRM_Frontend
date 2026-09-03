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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadBootstrapSession()
      .then(result => {
        if (!active) return;
        setUser(result?.authenticated ? result.user : null);
      })
      .catch(() => {
        if (active) setUser(null);
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
    setUser(result.user);
    // Future bootstrap checks should reflect the newly authenticated user.
    bootstrapSessionPromise = Promise.resolve({ authenticated: true, user: result.user });
    return result;
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
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
