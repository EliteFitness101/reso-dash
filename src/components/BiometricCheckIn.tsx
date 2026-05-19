import { useEffect, useState } from "react";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

type Entry = { date: string; weight: number; waist: number; arm: number; energy: number };
const KEY = "resoflex_checkins";

export function BiometricCheckIn() {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [arm, setArm] = useState("");
  const [energy, setEnergy] = useState(7);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  const last = entries[0];
  const delta = (a: number, b?: number) =>
    b === undefined ? null : +(a - b).toFixed(1);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Entry = {
      date: new Date().toISOString(),
      weight: parseFloat(weight),
      waist: parseFloat(waist),
      arm: parseFloat(arm),
      energy,
    };
    const list = [next, ...entries].slice(0, 12);
    setEntries(list);
    localStorage.setItem(KEY, JSON.stringify(list));
    setSubmitted(true);
    setWeight(""); setWaist(""); setArm("");
    setTimeout(() => setSubmitted(false), 2400);
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Sunday Protocol
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold leading-tight">
          Biometric Check-In
        </h2>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Captured weekly. Trend data calibrates phase scaling.
        </p>
      </div>

      <form onSubmit={submit} className="glass-card space-y-4 rounded-2xl p-4">
        <Field
          label="Bodyweight"
          unit="kg"
          value={weight}
          onChange={setWeight}
          placeholder="62.4"
          delta={delta(parseFloat(weight || "0"), last?.weight)}
        />
        <Field
          label="Waist Circumference"
          unit="cm"
          value={waist}
          onChange={setWaist}
          placeholder="72.0"
          delta={delta(parseFloat(waist || "0"), last?.waist)}
          invert
        />
        <Field
          label="Mid-Bicep Arm"
          unit="cm"
          value={arm}
          onChange={setArm}
          placeholder="28.5"
          delta={delta(parseFloat(arm || "0"), last?.arm)}
        />

        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Energy Rating
            </label>
            <span className="font-display text-lg font-bold tabular gold-text">
              {energy}<span className="text-xs text-muted-foreground">/10</span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
            className="mt-2 h-2 w-full appearance-none rounded-full bg-secondary accent-[color:var(--gold)]"
            style={{
              background: `linear-gradient(to right, oklch(0.76 0.13 86) 0%, oklch(0.62 0.12 80) ${energy * 10}%, oklch(0.22 0 0) ${energy * 10}%)`,
            }}
          />
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Depleted</span>
            <span>Peak</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!weight || !waist || !arm}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gold-bg py-4 font-display text-sm font-bold uppercase tracking-[0.2em] active:scale-[0.98] transition-transform disabled:opacity-40"
        >
          {submitted ? "Logged ✓" : "Commit Check-In"}
          {!submitted && <ArrowRight size={16} strokeWidth={2.5} />}
        </button>
      </form>

      {last && (
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Last entry · {new Date(last.date).toLocaleDateString()}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <Stat label="WT" value={last.weight} unit="kg" />
            <Stat label="WST" value={last.waist} unit="cm" />
            <Stat label="ARM" value={last.arm} unit="cm" />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, unit, value, onChange, placeholder, delta, invert,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void;
  placeholder: string; delta: number | null; invert?: boolean;
}) {
  const show = delta !== null && !Number.isNaN(delta) && delta !== 0 && value !== "";
  const good = invert ? (delta ?? 0) < 0 : (delta ?? 0) > 0;
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 focus-within:border-gold/60">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[52px] flex-1 bg-transparent font-display text-lg font-semibold tabular outline-none placeholder:text-muted-foreground/40"
        />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{unit}</span>
        {show && (
          <span className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold tabular ${good ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground"}`}>
            {(delta ?? 0) > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {delta! > 0 ? "+" : ""}{delta}
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/30 py-3">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold tabular">
        {value}
        <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
