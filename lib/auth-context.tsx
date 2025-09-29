"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Admin {
  id: string;
  username: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        setToken(token);
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch (error) {
      localStorage.removeItem('admin_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isLoading }}>
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