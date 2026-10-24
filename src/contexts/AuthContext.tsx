"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  api,
  ApiError,
  clearCsrf,
  SESSION_EXPIRED,
  type Account,
} from "@/lib/nexadvisor-api";
import type { User } from "@/types";
interface Auth {
  user: User | null;
  session: null;
  loading: boolean;
  sessionError: boolean;
  isAuthenticated: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: "client" | "expert",
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
const Context = createContext<Auth | undefined>(undefined);
const userView = (a: Account): User => ({
  ...a,
  role: a.role.toLowerCase() as User["role"],
});
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  const queries = useQueryClient();
  const [sessionError, setSessionError] = useState(false);
  useEffect(() => {
    const expire = () => {
      queries.clear();
      setUser(null);
      setSessionError(false);
    };
    window.addEventListener(SESSION_EXPIRED, expire);
    return () => window.removeEventListener(SESSION_EXPIRED, expire);
  }, [queries]);
  useEffect(() => {
    let mounted = true;
    api<Account>("/auth/me")
      .then((a) => {
        if (mounted) setUser(userView(a));
      })
      .catch((error) => {
        if (mounted && !(error instanceof ApiError && error.status === 401))
          setSessionError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  async function signIn(email: string, password: string) {
    const a = await api<Account>("/auth/login", "POST", { email, password });
    clearCsrf();
    queries.clear();
    setUser(userView(a));
    setSessionError(false);
  }
  async function signUp(
    email: string,
    password: string,
    name: string,
    role: "client" | "expert",
  ) {
    await api("/auth/register", "POST", {
      email,
      password,
      name,
      role,
      policyVersion: "2026-10-17",
    });
    await signIn(email, password);
  }
  async function signOut() {
    await api("/auth/logout", "POST");
    clearCsrf();
    queries.clear();
    window.location.assign("/");
  }
  async function updateProfile(data: Partial<User>) {
    const a = await api<Account>("/me/profile", "PUT", {
      name: data.name ?? user?.name,
      bio: data.bio ?? user?.bio ?? "",
      location: data.location ?? user?.location ?? "",
    });
    setUser(userView(a));
  }
  async function resetPassword(email: string) {
    await api("/auth/forgot-password", "POST", { email });
  }
  return (
    <Context.Provider
      value={{
        user,
        session: null,
        loading,
        sessionError,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider is required");
  return context;
}
