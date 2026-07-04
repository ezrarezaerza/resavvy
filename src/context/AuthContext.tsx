import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    const initAuth = async () => {
      const storedToken = localStorage.getItem('resavvy_token');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth?action=me', {
            headers: { Authorization: `Bearer ${storedToken}` },
            signal: abortController.signal
          });
          if (res.ok) {
            const data = await res.json();
            setToken(storedToken);
            setUser(data);
          } else {
            localStorage.removeItem('resavvy_token');
          }
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.error('Failed to authenticate token with backend', e);
            localStorage.removeItem('resavvy_token');
          }
        }
      }
      setIsLoading(false);
    };
    initAuth();
    return () => abortController.abort();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('resavvy_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('resavvy_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth?action=update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName: updatedData.name, bio: updatedData.bio, avatarUrl: updatedData.avatarUrl })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setUser(data);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const deleteAccount = async () => {
    if (!token) return;
    try {
       const res = await fetch('/api/auth?action=delete-account', {
         method: 'DELETE',
         headers: { Authorization: `Bearer ${token}` }
       });
       if (!res.ok) throw new Error('Failed to delete account');
       logout();
    } catch (e) {
       console.error(e);
       throw e;
    }
  };

  const contextValue = React.useMemo(() => ({
    user,
    token,
    isLoading,
    login,
    logout,
    updateProfile,
    deleteAccount,
    showLoginModal,
    setShowLoginModal
  }), [user, token, isLoading, showLoginModal]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
