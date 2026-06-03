import { ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { CommerceTable } from "./CommerceTable";
import { MediaDropZone } from "./MediaDropZone";
import { AvatarPreviews } from "./AvatarPreviews";

export function AdminPanel() {
  const { role, twoFactorVerified, setRole, setTwoFactor } = useAuth();
  if (role !== "admin") return null;

  if (!twoFactorVerified) {
    return (
      <section className="glass-card-gold mb-6 rounded-2xl p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">2FA Required</p>
        <h3 className="font-display mt-1 text-base font-semibold">Sovereign Layer Locked</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Auth0 session lacks verified second factor. Simulate verification to proceed.
        </p>
        <button
          onClick={() => setTwoFactor(true)}
          className="mt-3 rounded-md gold-bg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
        >
          Verify 2FA
        </button>
      </section>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <header className="glass-card-gold rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-gold">
              <ShieldCheck size={14} />
              <p className="text-[10px] uppercase tracking-[0.3em]">Sovereign OS · Admin Layer</p>
            </div>
            <h2 className="font-display mt-1 truncate text-lg font-semibold">
              Operations <span className="gold-text">Console</span>
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Auth0 · Role admin · 2FA verified
            </p>
          </div>
          <button
            onClick={() => setRole("client")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground hover:text-gold"
            aria-label="Exit admin"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      <CommerceTable />
      <MediaDropZone />
      <AvatarPreviews />
    </div>
  );
}
