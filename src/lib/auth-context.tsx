import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  const authorizationRun = useRef(0);
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [workspaceRole, setWorkspaceRole] = useState<string | null>(null);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const refreshAuthorization = async (nextSession: Session | null) => {
    const run = ++authorizationRun.current;
    setLoading(true);
    setSession(nextSession);
    setAdminMode(false);

    if (!nextSession?.user || !supabase) {
      setRoles([]);
      setWorkspaceRole(null);
      setTwoFactorVerified(false);
      setLoading(false);
      return;
    }

    try {
      const [{ data: assignedRows, error: rolesError }, { data: workspaceRoleData, error: workspaceRoleError }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", nextSession.user.id),
        supabase.rpc("get_my_workspace_role"),
      ]);
      if (run !== authorizationRun.current) return;
      const assigned = (assignedRows ?? []).map((row) => row.role as AuthRole).filter((value): value is AuthRole => APP_ROLES.includes(value));
      setRoles(rolesError ? [] : assigned);
      setWorkspaceRole(!workspaceRoleError && typeof workspaceRoleData === "string" ? workspaceRoleData : null);
      try {
        const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (run !== authorizationRun.current) return;
        setTwoFactorVerified(!aalError && aal.currentLevel === "aal2");
      } catch {
        if (run === authorizationRun.current) setTwoFactorVerified(false);
      }
    } catch {
      if (run === authorizationRun.current) {
        setRoles([]);
        setWorkspaceRole(null);
        setTwoFactorVerified(false);
      }
    } finally {
      if (run === authorizationRun.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (mounted) void refreshAuthorization(next);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) void refreshAuthorization(data.session);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      authorizationRun.current += 1;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = async (email: string) => {
    if (!supabase) return { error: "Authentication is not configured." };
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) return { error: "Enter a valid email address." };
    const path = window.location.pathname;
    const returnPath = path === "/" || path === "/login" || path === "/signup" ? "/today" : path;
    const returnUrl = new URL(returnPath, "https://dashboard.resofit.fit");
    returnUrl.search = window.location.search;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: returnUrl.toString() },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    await refreshAuthorization(null);
  };

  const role = primaryRole(roles);
  const isAdmin = roles.includes("admin");
  const isSuperAdmin = workspaceRole === "super_admin";

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


export function useAuth() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function isPrivilegedRole(role: AuthRole) {
  return privilegedRoles.has(role);
}
