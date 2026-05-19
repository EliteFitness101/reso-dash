import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { userProfile } from "@/lib/user-context";

type Phase = "w12" | "w34";

const meals = (cut: boolean) => [
  {
    slot: "Breakfast",
    time: "06:30",
    title: "Eggs + Whole Wheat Toast / Plantain",
    items: [
      { name: "3 Whole Eggs (boiled or pan-fried)", macro: "P 21g" },
      { name: cut ? "1 slice Whole Wheat / ½ small Plantain" : "2 slices Whole Wheat / 1 small Plantain", macro: cut ? "C 18g" : "C 24g", cut },
      { name: "Black coffee or green tea", macro: "0 kcal" },
    ],
    kcal: cut ? 360 : 420,
  },
  {
    slot: "Lunch",
    time: "13:00",
    title: "Onion-Free Spiced Beans + Grilled Chicken / Fish",
    items: [
      { name: "1 cup brown beans, spiced (no onion)", macro: "P 18g · C 32g" },
      { name: "150g grilled chicken breast or fish", macro: "P 35g" },
      { name: "Steamed greens + cucumber", macro: "C 6g" },
    ],
    kcal: 540,
  },
  {
    slot: "Dinner",
    time: "19:30",
    title: "Low-Oil Egusi (minimal swallow) or Onion-Free Pepper Soup",
    items: [
      { name: "Low-oil Egusi soup with ugu & spinach", macro: "F 14g" },
      { name: cut ? "60g eba / fufu (scaled)" : "80g eba / fufu", macro: cut ? "C 38g" : "C 50g", cut },
      { name: "Or rich pepper soup w/ catfish (no onion)", macro: "P 32g" },
    ],
    kcal: cut ? 480 : 560,
  },
];

export function MacroEngine() {
  const [phase, setPhase] = useState<Phase>("w12");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const cut = phase === "w34";
  const data = meals(cut);
  const total = data.reduce((s, m) => s + m.kcal, 0);
  const hasOnionRestriction = userProfile.dietaryRestrictions.includes("onions");

  const toggle = (id: string) =>
    setChecked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="space-y-4">
      {hasOnionRestriction && (
        <div className="glass-card-gold flex items-start gap-3 rounded-2xl p-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-gold" />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-gold">
              Strict Alert
            </p>
            <p className="mt-0.5 text-sm text-foreground/90 leading-snug">
              Zero Onions allowed in food preparation.
            </p>
          </div>
        </div>
      )}

      <div className="glass-card flex items-center justify-between rounded-2xl p-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Caloric Phase
          </p>
          <p className="font-display text-lg font-semibold tabular">
            {total} <span className="text-xs text-muted-foreground">kcal · today</span>
          </p>
        </div>
        <div className="flex rounded-xl border border-border bg-background/40 p-1">
          {(["w12", "w34"] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-display font-semibold uppercase tracking-widest transition-colors ${
                phase === p ? "gold-bg" : "text-muted-foreground"
              }`}
            >
              {p === "w12" ? "Wk 1–2" : "Wk 3–4"}
            </button>
          ))}
        </div>
      </div>

      {cut && (
        <p className="-mt-2 px-1 text-[11px] text-muted-foreground">
          <span className="text-gold">●</span> Carb portions scaled <span className="text-foreground font-semibold">−25%</span> on home-training days.
        </p>
      )}

      <div className="space-y-3">
        {data.map((m) => (
          <article key={m.slot} className="glass-card rounded-2xl p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {m.slot} · {m.time}
                </p>
                <h3 className="mt-1 font-display text-base font-semibold leading-tight">
                  {m.title}
                </h3>
              </div>
              <span className="font-display text-sm font-bold tabular gold-text">
                {m.kcal}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {m.items.map((it, i) => {
                const id = `${m.slot}-${i}`;
                const on = checked.has(id);
                return (
                  <li key={id}>
                    <button
                      onClick={() => toggle(id)}
                      className="flex w-full items-center gap-3 rounded-lg py-1 text-left active:bg-white/[0.02]"
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition-all ${
                          on ? "gold-bg border-transparent" : "border-border bg-background/40"
                        }`}
                      >
                        {on && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className={`flex-1 text-sm ${on ? "text-muted-foreground line-through" : ""}`}>
                        {it.name}
                        {"cut" in it && it.cut && (
                          <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                            −25%
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] tabular text-muted-foreground">{it.macro}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
