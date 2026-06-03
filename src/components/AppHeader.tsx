import { userProfile } from "@/lib/user-context";
import { AdminToggle } from "./AdminToggle";

export function AppHeader() {
  const progress = (userProfile.currentWeek / userProfile.programWeeks) * 100;
  return (
    <header className="relative z-10 mx-auto w-full max-w-md px-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            ResoFlex
          </p>
          <h1 className="font-display text-2xl font-semibold leading-none tracking-tight">
            <span className="gold-text">OS</span>
            <span className="text-foreground/40"> / 04</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Operator</p>
            <p className="font-display text-sm font-semibold">{userProfile.name}</p>
          </div>
          <div className="relative grid h-11 w-11 place-items-center rounded-full border border-border bg-card">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="19" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
              <circle
                cx="22" cy="22" r="19"
                stroke="url(#g)" strokeWidth="2" fill="none"
                strokeDasharray={`${(progress / 100) * 119.4} 119.4`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E6C45A" />
                  <stop offset="100%" stopColor="#B8941F" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-display text-xs font-bold gold-text tabular">W{userProfile.currentWeek}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1 w-1 shrink-0 rounded-full bg-gold animate-pulse" />
          <span className="truncate uppercase tracking-wider">{userProfile.role}</span>
          <span className="text-border">·</span>
          <span className="truncate uppercase tracking-wider">{userProfile.goal}</span>
        </div>
        <AdminToggle />
      </div>
    </header>
  );
}
