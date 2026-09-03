import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AdminToggle() {
  const { isAdmin, adminMode, twoFactorVerified, toggleAdmin } = useAuth();
  if (!isAdmin) return null;

  const active = adminMode;
  const disabled = !twoFactorVerified;

  return (
    <button
      onClick={toggleAdmin}
      disabled={disabled}
      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-gold/50 bg-gold/10 text-gold"
          : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
      }`}
      aria-pressed={active}
      aria-label={disabled ? "Admin access requires MFA" : active ? "Exit admin" : "Enter admin"}
      title={disabled ? "Complete Supabase MFA to enter the admin layer" : undefined}
    >
      <ShieldCheck size={12} strokeWidth={2.25} />
      {active ? "Admin" : "Admin"}
      <span
        className={`ml-1 inline-block h-3 w-5 rounded-full border ${
          active ? "border-gold bg-gold/40" : "border-border bg-background"
        } relative`}
      >
        <span
          className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full transition-all ${
            active ? "left-2.5 bg-gold" : "left-0.5 bg-muted-foreground"
          }`}
        />
      </span>
    </button>
  );
}
