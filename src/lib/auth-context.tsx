import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthRole = "client" | "admin";

interface AuthState {
  role: AuthRole;
  twoFactorVerified: boolean;
  email: string;
  setRole: (r: AuthRole) => void;
  toggleAdmin: () => void;
  setTwoFactor: (v: boolean) => void;
}

const Ctx = createContext<AuthState | null>(null);
const KEY = "resoflex.auth.v1";

interface Persist {
  role: AuthRole;
  twoFactorVerified: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<AuthRole>("client");
  const [twoFactorVerified, setTwoFactorVerified] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof localStorage !== "undefined" && localStorage.getItem(KEY);
      if (raw) {
        const p: Persist = JSON.parse(raw);
        setRoleState(p.role);
        setTwoFactorVerified(p.twoFactorVerified);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ role, twoFactorVerified }));
    } catch {}
  }, [role, twoFactorVerified]);

  const value: AuthState = {
    role,
    twoFactorVerified,
    email: role === "admin" ? "coach.buchi@resofit.fit" : "operator@resoflex.os",
    setRole: setRoleState,
    toggleAdmin: () => setRoleState((r) => (r === "admin" ? "client" : "admin")),
    setTwoFactor: setTwoFactorVerified,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
