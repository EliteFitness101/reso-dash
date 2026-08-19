import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";

export type AuthRole = "client" | "admin";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  email: string;
  role: AuthRole;
  twoFactorVerified: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    if (!supabase) return { error: "Authentication is not configured." };
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) return { error: "Enter a valid email address." };
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: window.location.origin + "/today" },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  };

  const role: AuthRole = "client";

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        email: session?.user.email ?? "",
        role,
        twoFactorVerified: Boolean(session),
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
