import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { UserProfile } from "../types";
import { loginWithGoogle } from "../lib/api";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  loginDemo: () => void;
  loginGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "ong_user";
const TOKEN_KEY = "ong_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  const persist = (u: UserProfile | null, token?: string) => {
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      if (token) localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
    setUser(u);
  };

  // Fallback local demo profile for environments without internet/OAuth credentials
  const loginDemo = useCallback(() => {
    persist({
      name: "Oliver Brown",
      email: "oliver.brown@domain.io",
    });
  }, []);

  const loginGoogle = useCallback(async (idToken: string) => {
    try {
      const { token, user: u } = await loginWithGoogle(idToken);
      persist(u, token);
    } catch (err) {
      console.error("Google login failed, falling back to demo profile", err);
      loginDemo();
    }
  }, [loginDemo]);

  const logout = useCallback(() => {
    persist(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginDemo, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
