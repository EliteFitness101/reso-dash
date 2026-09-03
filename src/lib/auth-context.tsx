import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";

export const APP_ROLES = ["admin", "moderator", "player", "user", "distributor", "hub", "ambassador", "referrer"] as const;
export type AuthRole = (typeof APP_ROLES)[number];

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  email: string;
  roles: AuthRole[];
  role: AuthRole | "client";
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminMode: boolean;
  twoFactorVerified: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  toggleAdmin: () => void;
}

const Ctx = createContext<AuthState | null>(null);
const privilegedRoles = new Set<AuthRole>(["admin", "moderator", "distributor", "hub", "ambassador", "referrer"]);

function primaryRole(roles: AuthRole[]): AuthRole | "client" {
  const priority: AuthRole[] = ["admin", "moderator", "distributor", "hub", "ambassador", "referrer", "player", "user"];
  return priority.find((candidate) => roles.includes(candidate)) ?? "client";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const refreshAuthorization = async (nextSession: Session | null) => {
    setSession(nextSession);
    setAdminMode(false);
    if (!nextSession?.user || !supabase) {
      setRoles([]);
      setTwoFactorVerified(false);
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", nextSession.user.id);
    const assigned = (data ?? [])
      .map((row) => row.role as AuthRole)
      .filter((value): value is AuthRole => APP_ROLES.includes(value));
    setRoles(assigned);

    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setTwoFactorVerified(aal.currentLevel === "aal2");
    } catch {
      setTwoFactorVerified(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      await refreshAuthorization(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      void refreshAuthorization(next);
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
    await refreshAuthorization(null);
  };

  const role = primaryRole(roles);
  const isAdmin = roles.includes("admin");
  const isSuperAdmin = Boolean(userEmailIsCEO(session?.user));

  const toggleAdmin = () => {
    if (!isAdmin || !twoFactorVerified) return;
    setAdminMode((active) => !active);
  };

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        email: session?.user.email ?? "",
        roles,
        role,
        isAdmin,
        isSuperAdmin,
        adminMode,
        twoFactorVerified,
        signInWithMagicLink,
        signOut,
        toggleAdmin,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

function userEmailIsCEO(user: User | null | undefined) {
  return (user?.email ?? "").trim().toLowerCase() === "ceo@resofit.fit";
}

export function useAuth() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function isPrivilegedRole(role: AuthRole) {
  return privilegedRoles.has(role);
}
