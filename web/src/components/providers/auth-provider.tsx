"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { login as apiLogin, register as apiRegister, getCurrentUser } from "@/lib/api";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      // Verify token by getting current user
      getCurrentUser().then((result) => {
        if (result.data) {
          setUser(result.data);
        } else {
          // Token invalid, clear it
          localStorage.removeItem("auth_token");
          setToken(null);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin({ email, password });
    if (result.error) {
      return { error: result.error };
    }
    if (result.data) {
      setUser(result.data.user);
      setToken(result.data.token);
      localStorage.setItem("auth_token", result.data.token);
    }
    return {};
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const result = await apiRegister({ email, username, password });
    if (result.error) {
      return { error: result.error };
    }
    if (result.data) {
      setUser(result.data.user);
      setToken(result.data.token);
      localStorage.setItem("auth_token", result.data.token);
    }
    return {};
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
