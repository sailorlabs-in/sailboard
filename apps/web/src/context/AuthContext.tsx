import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '@rea/shared-types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, name: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sailboard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sailboard_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('sailboard_token');
      if (storedToken) {
        api.setToken(storedToken);
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('sailboard_user', JSON.stringify(profile));
        } catch {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          api.setToken(null);
          localStorage.removeItem('sailboard_token');
          localStorage.removeItem('sailboard_user');
        }
      } else {
        // No token present: User must see login page by default
        setUser(null);
        setToken(null);
        api.setToken(null);
      }
      setIsLoading(false);
    }
    verifyAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('sailboard_token', res.token);
    localStorage.setItem('sailboard_user', JSON.stringify(res.user));
    return res;
  };

  const register = async (email: string, name: string, password: string): Promise<AuthResponse> => {
    const res = await api.register(email, name, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('sailboard_token', res.token);
    localStorage.setItem('sailboard_user', JSON.stringify(res.user));
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    api.setToken(null);
    localStorage.removeItem('sailboard_token');
    localStorage.removeItem('sailboard_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
