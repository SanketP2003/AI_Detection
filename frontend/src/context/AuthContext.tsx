import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/client';

export interface AuthUser {
  username: string | null;
  isAdmin: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(
      currentUser.authenticated
        ? {
            username: currentUser.username,
            isAdmin: currentUser.isAdmin,
          }
        : null,
    );
    setIsLoading(false);
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    await apiLogin({ email, password });
    await refreshUser();
  };

  const register = async (username: string, email: string, password: string) => {
    await apiRegister({ username, email, password });
    await apiLogin({ email, password });
    await refreshUser();
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: Boolean(user?.isAdmin),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
