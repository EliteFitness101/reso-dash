import { userProfile } from "@/lib/user-context";
import { AdminToggle } from "./AdminToggle";

export function AppHeader() {
  const progress = (userProfile.currentWeek / userProfile.programWeeks) * 100;

  return (
    <header className="relative z-10 mx-auto w-full max-w-md px-4 pt-6">
      <div className="glass-card rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-muted-foreground">
              ResoFit · Personalized Wellness OS
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <h1 className="font-display text-[25px] font-semibold leading-none tracking-tight">
                ResoFlex <span className="gold-text">OS</span>
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                04W
              </span>
            </div>
          </div>

          <div
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-background/50"
            aria-label={`Program week ${userProfile.currentWeek} of ${userProfile.programWeeks}`}
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="url(#resoflex-header-gold)"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={`${(progress / 100) * 125.66} 125.66`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="resoflex-header-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E6C45A" />
                  <stop offset="100%" stopColor="#B8941F" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-display text-[11px] font-bold tabular gold-text">
              W{userProfile.currentWeek}/{userProfile.programWeeks}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
          <div className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_10px_var(--gold)]" />
            <span className="truncate font-semibold text-foreground">{userProfile.name}</span>
            <span className="text-border">·</span>
            <span className="truncate">{userProfile.role}</span>
          </div>
          <AdminToggle />
        </div>
      </div>
    </header>
  );
}
