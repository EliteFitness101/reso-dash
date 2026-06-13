import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useProfileStore, type Intake } from "@/lib/profile-store";
import { generatePlan } from "@/lib/plan-generator";

export const Route = createFileRoute("/_shell/onboarding")({
  component: OnboardingPage,
});

const steps = ["Biometrics", "Goal", "Dietary", "Equipment"] as const;

function OnboardingPage() {
  const nav = useNavigate();
  const { current, setIntake } = useProfileStore();
  const [step, setStep] = useState(0);
  const [intake, setIntakeLocal] = useState<Intake>({
    fullName: "",
    email: "",
    phone: "",
    age: 26,
    sex: "female",
    heightCm: 168,
    weightKg: 68,
    bodyFatPct: 24,
    goal: "recomp",
    experience: "intermediate",
    daysPerWeek: 4,
    restrictions: ["onions"],
    cuisine: "West-African",
    mealsPerDay: 3,
    location: "hybrid",
    equipment: ["dumbbells", "bench"],
  });

  if (!current) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
        No active subscription. Complete checkout first.
        <button
          onClick={() => nav({ to: "/checkout" })}
          className="mt-4 inline-flex items-center gap-2 rounded-xl gold-bg px-4 py-2 text-xs font-bold uppercase tracking-widest"
        >
          Go to checkout <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  const set = <K extends keyof Intake>(k: K, v: Intake[K]) =>
    setIntakeLocal((s) => ({ ...s, [k]: v }));

  const advance = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    setIntake(intake);
    nav({ to: "/upsells" });
  };

  const plan = step === steps.length - 1 ? generatePlan(intake) : null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Intake · {current.rsid}
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold">
            Step {step + 1} / {steps.length} · <span className="gold-text">{steps[step]}</span>
          </h1>
        </div>
      </header>

      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "gold-bg" : "bg-border"}`}
          />
        ))}
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3">
        {step === 0 && (
          <>
            <Row label="Age" value={intake.age} onChange={(v) => set("age", Number(v))} type="number" />
            <Select
              label="Sex"
              value={intake.sex}
              onChange={(v) => set("sex", v as Intake["sex"])}
              options={[{ v: "female", l: "Female" }, { v: "male", l: "Male" }]}
            />
            <Row label="Height (cm)" value={intake.heightCm} onChange={(v) => set("heightCm", Number(v))} type="number" />
            <Row label="Weight (kg)" value={intake.weightKg} onChange={(v) => set("weightKg", Number(v))} type="number" />
            <Row label="Body fat %" value={intake.bodyFatPct} onChange={(v) => set("bodyFatPct", Number(v))} type="number" />
          </>
        )}
        {step === 1 && (
          <>
            <Select
              label="Primary goal"
              value={intake.goal}
              onChange={(v) => set("goal", v as Intake["goal"])}
              options={[
                { v: "cut", l: "Cut · drop fat" },
                { v: "recomp", l: "Recomp · simultaneous" },
                { v: "bulk", l: "Bulk · gain muscle" },
              ]}
            />
            <Select
              label="Training experience"
              value={intake.experience}
              onChange={(v) => set("experience", v as Intake["experience"])}
              options={[
                { v: "novice", l: "Novice (<1 yr)" },
                { v: "intermediate", l: "Intermediate (1–3 yr)" },
                { v: "advanced", l: "Advanced (3+ yr)" },
              ]}
            />
            <Row label="Days / week available" value={intake.daysPerWeek} onChange={(v) => set("daysPerWeek", Number(v))} type="number" />
          </>
        )}
        {step === 2 && (
          <>
            <Chips
              label="Restrictions (zero-tolerance)"
              options={["onions", "dairy", "gluten", "pork", "shellfish", "spicy"]}
              value={intake.restrictions}
              onChange={(v) => set("restrictions", v)}
            />
            <Row label="Cuisine bias" value={intake.cuisine} onChange={(v) => set("cuisine", String(v))} />
            <Row label="Meals per day" value={intake.mealsPerDay} onChange={(v) => set("mealsPerDay", Number(v))} type="number" />
          </>
        )}
        {step === 3 && (
          <>
            <Select
              label="Primary training location"
              value={intake.location}
              onChange={(v) => set("location", v as Intake["location"])}
              options={[
                { v: "gym", l: "Gym" },
                { v: "home", l: "Home only" },
                { v: "hybrid", l: "Hybrid (gym + home)" },
              ]}
            />
            <Chips
              label="Available equipment"
              options={["dumbbells", "bench", "barbell", "bands", "pull-up bar", "kettlebell"]}
              value={intake.equipment}
              onChange={(v) => set("equipment", v)}
            />
            {plan && (
              <div className="mt-2 rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs">
                <p className="font-display text-sm font-bold gold-text">Plan preview</p>
                <p className="mt-1 tabular">
                  {plan.targetKcal} kcal · P{plan.proteinG} / C{plan.carbsG} / F{plan.fatG}
                </p>
                <p className="mt-0.5 text-muted-foreground">{plan.trainingSplit}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 rounded-xl border border-border bg-card/50 py-3.5 text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            Back
          </button>
        )}
        <button
          onClick={advance}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl gold-bg py-3.5 font-display text-xs font-bold uppercase tracking-[0.2em] active:scale-[0.98] transition-transform"
        >
          {step < steps.length - 1 ? "Continue" : "Generate plan"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function Row({
  label, value, onChange, type = "text",
}: { label: string; value: string | number; onChange: (v: string | number) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background/40 px-3 py-3 text-sm tabular outline-none focus:border-gold/60"
      />
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1 grid gap-1.5">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
              value === o.v ? "border-gold bg-gold/10" : "border-border bg-background/40"
            }`}
          >
            <span>{o.l}</span>
            {value === o.v && <Check size={14} className="text-gold" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chips({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
                on ? "border-gold bg-gold/15 text-gold" : "border-border bg-background/40 text-muted-foreground"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
