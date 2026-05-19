import { useState } from "react";
import { Flame, Timer } from "lucide-react";
import { weekSchedule, gymExercises, homeCircuit } from "@/lib/user-context";

export function TrainingMatrix() {
  const [active, setActive] = useState(0);
  const day = weekSchedule[active];

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          {weekSchedule.map((d, i) => {
            const sel = i === active;
            const dot =
              d.type === "gym" ? "bg-gold" : d.type === "home" ? "bg-foreground" : "bg-muted-foreground/40";
            return (
              <button
                key={d.short}
                onClick={() => setActive(i)}
                className={`relative flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border transition-all ${
                  sel
                    ? "border-gold bg-gold/10"
                    : "border-border bg-card/50 active:bg-card"
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {d.short}
                </span>
                <span className={`mt-1 font-display text-base font-bold ${sel ? "gold-text" : ""}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${dot}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {day.day}
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold leading-none">
              {day.label}
            </h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
              day.type === "gym"
                ? "border-gold/40 bg-gold/10 text-gold"
                : day.type === "home"
                  ? "border-border bg-secondary text-foreground"
                  : "border-border text-muted-foreground"
            }`}
          >
            {day.type === "gym" ? "Gym" : day.type === "home" ? "Home" : "Rest"}
          </span>
        </div>

        {day.type === "gym" && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded bg-gold/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                Progressive Overload
              </span>
              <span className="text-[11px] text-muted-foreground">5 lifts · 50 min</span>
            </div>
            <ul className="mt-3 divide-y divide-border/60">
              {gymExercises.map((e) => (
                <li key={e.name} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="text-[11px] text-muted-foreground">{e.note}</p>
                  </div>
                  <span className="font-display text-sm font-bold tabular gold-text">
                    {e.scheme}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {day.type === "home" && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                Density Circuit
              </span>
              <span className="rounded border border-gold/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                Tempo 3-1-1
              </span>
            </div>
            <ul className="mt-3 divide-y divide-border/60">
              {homeCircuit.map((e) => (
                <li key={e.name} className="flex items-center justify-between py-3">
                  <p className="text-sm font-medium">{e.name}</p>
                  <span className="font-display text-sm font-bold tabular text-foreground">
                    {e.scheme}
                  </span>
                </li>
              ))}
            </ul>
            <BurnoutFinisher />
          </>
        )}

        {day.type === "rest" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <Timer size={18} />
            <span>
              Recovery protocol — hydrate, walk 20 min, mobilize hips & shoulders.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function BurnoutFinisher() {
  const [running, setRunning] = useState(false);
  return (
    <button
      onClick={() => setRunning((r) => !r)}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gold-bg py-4 font-display text-sm font-bold uppercase tracking-[0.2em] active:scale-[0.98] transition-transform"
    >
      <Flame size={18} strokeWidth={2.5} />
      {running ? "Burnout · 60s active" : "Max-Rep Burnout Finisher"}
    </button>
  );
}
