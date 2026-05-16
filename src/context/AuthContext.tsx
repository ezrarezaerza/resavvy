import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clearUserSession } from '../utils/sessionManager';

export interface User {
  id: string;
  name: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('resavvy_token');
    if (storedToken) {
      try {
        // Decode payload from JWT
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        
        // rudimentary validation of expiry
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser({ id: decoded.id, name: decoded.name, username: decoded.username });
        } else {
          localStorage.removeItem('resavvy_token');
        }
      } catch (e) {
        console.error('Failed to parse token', e);
        localStorage.removeItem('resavvy_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('resavvy_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearUserSession();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
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
