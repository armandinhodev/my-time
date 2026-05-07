import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const stored = localStorage.getItem('user');
      const refreshToken = localStorage.getItem('mytime_refresh_token');
      console.log('AuthContext init - stored user:', stored ? 'yes' : 'no');
      console.log('AuthContext init - refresh token:', refreshToken ? 'yes' : 'no');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          api.setAccessToken(null);
          console.log('AuthContext init - calling api.refresh()...');
          const data = await api.refresh();
          console.log('AuthContext init - refresh success:', data.user.email);
          if (isMounted.current) {
            setUser(data.user);
          }
        } catch (error) {
          console.error('AuthContext init - refresh failed:', error);
          if (isMounted.current) {
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
      if (isMounted.current) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const data = await api.register(email, password, name);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
