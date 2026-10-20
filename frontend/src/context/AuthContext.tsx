import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { getCurrentUser, setClerkTokenGetter } from '../api/client';

export interface AuthUser {
  username: string | null;
  isAdmin: boolean;
  email?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  clerkId?: string | null;
  roles?: string[];
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
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useClerkAuth();

  const [backendUser, setBackendUser] = useState<{ username: string | null; isAdmin: boolean } | null>(null);

  // Wire Clerk token retriever into apiClient immediately and on token changes
  setClerkTokenGetter(async () => {
    try {
      return await getToken();
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setClerkTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [getToken]);

  const refreshUser = async () => {
    if (!isSignedIn) {
      setBackendUser(null);
      return;
    }
    try {
      const currentUser = await getCurrentUser();
      if (currentUser.authenticated) {
        setBackendUser({
          username: currentUser.username,
          isAdmin: currentUser.isAdmin,
        });
      }
    } catch {
      // Backend may be offline or syncing
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void refreshUser();
    } else if (isLoaded && !isSignedIn) {
      setBackendUser(null);
    }
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  const login = async () => {
    // Navigation to Clerk sign in is handled by Clerk components
  };

  const register = async () => {
    // Navigation to Clerk sign up is handled by Clerk components
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Error signing out:', e);
    }
    setBackendUser(null);
  };

  const user: AuthUser | null = isSignedIn && clerkUser
    ? {
        username:
          backendUser?.username ||
          clerkUser.username ||
          clerkUser.fullName ||
          clerkUser.firstName ||
          clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          clerkUser.id,
        isAdmin: backendUser?.isAdmin ?? (clerkUser.publicMetadata?.role === 'admin'),
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        fullName: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
        clerkId: clerkUser.id,
      }
    : null;

  const value: AuthContextType = {
    user,
    isLoading: !isLoaded,
    isAuthenticated: Boolean(isSignedIn),
    isAdmin: Boolean(user?.isAdmin),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

