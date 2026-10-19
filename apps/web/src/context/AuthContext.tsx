import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse, StoredAccount } from '@rea/shared-types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  accounts: StoredAccount[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, name: string, password: string) => Promise<AuthResponse>;
  switchAccount: (userId: string) => Promise<void>;
  removeAccount: (userId: string) => void;
  updateProfile: (updates: { name?: string; color?: string }) => Promise<User>;
  logout: () => void;
  logoutAll: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('sailboard_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('sailboard_token');
  });

  const [accounts, setAccounts] = useState<StoredAccount[]>(() => {
    try {
      const saved = localStorage.getItem('sailboard_accounts');
      if (saved) return JSON.parse(saved);
      // Migration: If active token and user exist, seed accounts
      const userStr = localStorage.getItem('sailboard_user');
      const tokenStr = localStorage.getItem('sailboard_token');
      if (userStr && tokenStr) {
        const u = JSON.parse(userStr);
        const initial = [{ user: u, token: tokenStr, lastActive: Date.now() }];
        localStorage.setItem('sailboard_accounts', JSON.stringify(initial));
        return initial;
      }
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persistAccounts = useCallback((list: StoredAccount[]) => {
    setAccounts(list);
    try {
      localStorage.setItem('sailboard_accounts', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not persist accounts to localStorage', e);
    }
  }, []);

  const upsertAccount = useCallback((newUser: User, newToken: string) => {
    setAccounts((prev) => {
      const idx = prev.findIndex(
        (a) => a.user.id === newUser.id || a.user.email.toLowerCase() === newUser.email.toLowerCase()
      );
      let updated: StoredAccount[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { user: newUser, token: newToken, lastActive: Date.now() };
      } else {
        updated = [{ user: newUser, token: newToken, lastActive: Date.now() }, ...prev];
      }
      try {
        localStorage.setItem('sailboard_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('sailboard_token');
      if (storedToken) {
        api.setToken(storedToken);
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('sailboard_user', JSON.stringify(profile));
          upsertAccount(profile, storedToken);
        } catch {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          api.setToken(null);
          localStorage.removeItem('sailboard_token');
          localStorage.removeItem('sailboard_user');
        }
      } else {
        setUser(null);
        setToken(null);
        api.setToken(null);
      }
      setIsLoading(false);
    }
    verifyAuth();
  }, [upsertAccount]);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('sailboard_token', res.token);
    localStorage.setItem('sailboard_user', JSON.stringify(res.user));
    api.setToken(res.token);
    upsertAccount(res.user, res.token);
    return res;
  };

  const register = async (email: string, name: string, password: string): Promise<AuthResponse> => {
    const res = await api.register(email, name, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('sailboard_token', res.token);
    localStorage.setItem('sailboard_user', JSON.stringify(res.user));
    api.setToken(res.token);
    upsertAccount(res.user, res.token);
    return res;
  };

  const switchAccount = async (userId: string): Promise<void> => {
    const target = accounts.find((a) => a.user.id === userId);
    if (!target) {
      throw new Error('Account not found on this device');
    }

    api.setToken(target.token);
    try {
      const verifiedUser = await api.getMe();
      setToken(target.token);
      setUser(verifiedUser);
      localStorage.setItem('sailboard_token', target.token);
      localStorage.setItem('sailboard_user', JSON.stringify(verifiedUser));

      // Update last active
      setAccounts((prev) => {
        const updated = prev.map((a) =>
          a.user.id === userId ? { ...a, user: verifiedUser, lastActive: Date.now() } : a
        );
        try {
          localStorage.setItem('sailboard_accounts', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch {
      removeAccount(userId);
      throw new Error('Session for this account expired. Please sign in again.');
    }
  };

  const removeAccount = (userId: string) => {
    const updated = accounts.filter((a) => a.user.id !== userId);
    persistAccounts(updated);

    if (user?.id === userId) {
      if (updated.length > 0) {
        const nextAcc = [...updated].sort((a, b) => b.lastActive - a.lastActive)[0];
        switchAccount(nextAcc.user.id).catch(() => logout());
      } else {
        logout();
      }
    }
  };

  const updateProfile = async (updates: { name?: string; color?: string }): Promise<User> => {
    const updatedUser = await api.updateProfile(updates);
    setUser(updatedUser);
    localStorage.setItem('sailboard_user', JSON.stringify(updatedUser));

    setAccounts((prev) => {
      const updated = prev.map((a) =>
        a.user.id === updatedUser.id ? { ...a, user: updatedUser } : a
      );
      try {
        localStorage.setItem('sailboard_accounts', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    return updatedUser;
  };

  const logout = () => {
    const currentId = user?.id;
    setUser(null);
    setToken(null);
    api.setToken(null);
    localStorage.removeItem('sailboard_token');
    localStorage.removeItem('sailboard_user');

    if (currentId) {
      const remaining = accounts.filter((a) => a.user.id !== currentId);
      persistAccounts(remaining);
    }
  };

  const logoutAll = () => {
    setUser(null);
    setToken(null);
    api.setToken(null);
    localStorage.removeItem('sailboard_token');
    localStorage.removeItem('sailboard_user');
    localStorage.removeItem('sailboard_accounts');
    setAccounts([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        accounts,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        switchAccount,
        removeAccount,
        updateProfile,
        logout,
        logoutAll,
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
