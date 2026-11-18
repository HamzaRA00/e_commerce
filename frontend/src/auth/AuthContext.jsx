import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredAuth, setStoredAuth, ensureDeviceId } from './storage.js';
import { registerAuthHandlers } from '../api/client.js';
import { resetEcho } from '../realtime/echo.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(() => getStoredAuth());

  useEffect(() => {
    registerAuthHandlers({
      getAuth: () => getStoredAuth(),
      setAuth: (next) => {
        setStoredAuth(next);
        setAuthState(next);
      },
      clearAuth: () => {
        resetEcho();
        setStoredAuth(null);
        setAuthState(null);
      },
    });
  }, []);

  const value = useMemo(() => {
    const setAuth = (next) => {
      setStoredAuth(next);
      setAuthState(next);
    };
    const logoutLocal = () => {
      resetEcho();
      setStoredAuth(null);
      setAuthState(null);
    };
    const device = ensureDeviceId(auth);
    return {
      auth,
      device,
      userId: auth?.userId ?? null,
      isAuthenticated: !!auth?.accessToken,
      isUser: auth?.role === 'user',
      isVerified: auth?.role === 'user' ? auth?.verified !== false : true,
      setAuth,
      logoutLocal,
    };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
