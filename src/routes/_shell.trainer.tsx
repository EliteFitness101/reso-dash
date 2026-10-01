import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Dumbbell, Loader2, ShieldAlert, ShoppingBasket, Sparkles, Utensils } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/_shell/trainer")({ component: TrainerPage });

type Intake = {
  fullName?: string;
  email?: string;
  age: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  goal: "cut" | "recomp" | "bulk";
  experience: "novice" | "intermediate" | "advanced";
  daysPerWeek: number;
  restrictions: string[];
  cuisine: string;
  mealsPerDay: number;
  location: "gym" | "home" | "hybrid";
  equipment: string[];
};

type PlanDay = {
  day: number;
  meals: { breakfast: string; lunch: string; dinner: string; snack: string };
  workout: { name: string; exercises: string[] };
  lifestyleHack: string;
  consistencyTarget: string;
};

type PlanResponse = {
  ok?: boolean;
  error?: string;
  code?: string;
  commerce_action_url?: string | null;
  entitlement?: { status: string; access: string; source_product: string; end_at?: string | null; grace_end_at?: string | null };
  plan?: {
    summary: { bmr: number; tdee: number; targetKcal: number; proteinG: number; carbsG: number; fatG: number; goal: string; daysPerWeek: number; mealsPerDay: number; cuisine: string };
    days: PlanDay[];
    shoppingList: string[];
    mealPrep: string[];
    lifestyleHacks: string[];
  };
  accessories?: Array<{ sku: string; handle: string; title: string; variant_price: number; image_src?: string | null }>;
};

const defaults: Intake = {
  age: 30,
  sex: "female",
  heightCm: 168,
  weightKg: 68,
  goal: "recomp",
  experience: "intermediate",
  daysPerWeek: 4,
  restrictions: [],
  cuisine: "Nigerian/West-African",
  mealsPerDay: 3,
  location: "hybrid",
  equipment: ["dumbbells", "bands"],
};

function TrainerPage() {
  const { current } = useProfileStore();
  const [intake, setIntake] = useState<Intake>(() => ({ ...defaults, ...(current?.intake ?? {}) }));
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const name = current?.intake?.fullName || current?.rsid || "ResoFit member";
  const goalLabel = useMemo(() => ({ cut: "Fat loss", recomp: "Recomposition", bulk: "Muscle gain" }[intake.goal]), [intake.goal]);

  const update = <K extends keyof Intake>(key: K, value: Intake[K]) =>
    setIntake((prev) => ({ ...prev, [key]: value }));

  async function generate() {
    if (!supabase) {
      setMessage("Secure ResoFit connection is unavailable.");
      return;
    }
    setBusy(true);
    setMessage("");
    setResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sign in again to generate your plan.");

      const response = await fetch("https://vbqjvmnhdtdhmeeudqnn.supabase.co/functions/v1/resofit-personal-plan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ intake }),
      });
      const payload = await response.json().catch(() => ({})) as PlanResponse;
      if (!response.ok) {
        if (payload.code === "PAST_DUE") {
          setResult(payload);
          setMessage("Your plan is preserved, but new plan generation is restricted until payment is resolved.");
          return;
        }
        throw new Error(payload.error || "Unable to generate your plan.");
      }
      setResult(payload);
      setMessage("Plan generated and saved to your ResoFit account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate your plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="glass-card-gold rounded-3xl p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">ResoFit Personalized Trainer</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">Your meals, movement and consistency system.</h1>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Canva generator logic consolidated into the canonical ResoFit production experience. No second commerce or catalog is created here.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-gold">{name}</span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">{goalLabel}</span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">{intake.daysPerWeek} training days</span>
        </div>
      </header>

      <div className="glass-card rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2"><Sparkles size={16} className="text-gold" /><h2 className="font-display text-lg font-semibold">Personalization inputs</h2></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age" value={intake.age} type="number" onChange={(v) => update("age", Number(v))} />
          <Field label="Weight kg" value={intake.weightKg} type="number" onChange={(v) => update("weightKg", Number(v))} />
          <Field label="Height cm" value={intake.heightCm} type="number" onChange={(v) => update("heightCm", Number(v))} />
          <Field label="Meals/day" value={intake.mealsPerDay} type="number" onChange={(v) => update("mealsPerDay", Number(v))} />
        </div>
        <Select label="Goal" value={intake.goal} options={[["cut","Fat loss"],["recomp","Recomposition"],["bulk","Muscle gain"]]} onChange={(v) => update("goal", v as Intake["goal"])} />
        <Select label="Training location" value={intake.location} options={[["gym","Gym"],["home","Home"],["hybrid","Hybrid"]]} onChange={(v) => update("location", v as Intake["location"])} />
        <Select label="Training days" value={String(intake.daysPerWeek)} options={["2","3","4","5","6"].map((v) => [v, `${v} days/week`])} onChange={(v) => update("daysPerWeek", Number(v))} />
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Dietary exclusions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["dairy","gluten","pork","shellfish"].map((item) => {
              const active = intake.restrictions.includes(item);
              return <button key={item} type="button" onClick={() => update("restrictions", active ? intake.restrictions.filter((x) => x !== item) : [...intake.restrictions, item])} className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-wider ${active ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"}`}>{item}</button>;
            })}
          </div>
        </div>
        <button type="button" disabled={busy} onClick={() => void generate()} className="flex w-full items-center justify-center gap-2 rounded-xl gold-bg py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-background disabled:opacity-60">
          {busy ? <><Loader2 size={15} className="animate-spin" /> Building plan…</> : <>Generate / refresh my plan <ArrowRight size={15} /></>}
        </button>
        {message && <p className="text-center text-[10px] leading-4 text-muted-foreground">{message}</p>}
      </div>

      {result?.code === "PAST_DUE" && <div className="glass-card rounded-3xl border border-amber-400/30 p-5"><ShieldAlert className="text-amber-300" size={20} /><h2 className="mt-3 font-display text-lg font-semibold">Plan access is restricted</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Your account and plan history remain intact. Resolve the outstanding commerce state to restore active plan generation.</p>{result.commerce_action_url && <a href={result.commerce_action_url} className="mt-4 inline-flex rounded-xl border border-amber-400/30 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-amber-300">Resolve payment</a>}</div>}

      {result?.plan && <PlanView plan={result.plan} accessories={result.accessories ?? []} />}
    </section>
  );
}

function PlanView({ plan, accessories }: { plan: NonNullable<PlanResponse["plan"]>; accessories: NonNullable<PlanResponse["accessories"]> }) {
  return <div className="space-y-4">
    <div className="glass-card-gold rounded-3xl p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold"><Sparkles size={13} /> Saved personalized plan</div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric label="Calories" value={plan.summary.targetKcal.toLocaleString()} />
        <Metric label="Protein" value={`${plan.summary.proteinG}g`} />
        <Metric label="Carbs" value={`${plan.summary.carbsG}g`} />
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">Fat target: {plan.summary.fatG}g · {plan.summary.daysPerWeek} training days · {plan.summary.mealsPerDay} meals/day</p>
    </div>

    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2"><Utensils size={15} className="text-gold" /><h2 className="font-display text-lg font-semibold">First 7 days</h2></div>
      <div className="mt-4 space-y-3">
        {plan.days.slice(0, 7).map((day) => <article key={day.day} className="rounded-2xl border border-border bg-background/30 p-4">
          <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-bold uppercase tracking-widest">Day {day.day}</h3><span className="text-[10px] text-gold">{day.workout.name}</span></div>
          <div className="mt-3 grid gap-1.5 text-[11px] text-muted-foreground">
            <p><b className="text-foreground">Breakfast:</b> {day.meals.breakfast}</p>
            <p><b className="text-foreground">Lunch:</b> {day.meals.lunch}</p>
            <p><b className="text-foreground">Dinner:</b> {day.meals.dinner}</p>
            <p><b className="text-foreground">Snack:</b> {day.meals.snack}</p>
          </div>
          <div className="mt-3 rounded-xl bg-zinc-900/70 p-3"><p className="text-[9px] uppercase tracking-widest text-gold">Workout</p><ul className="mt-1 space-y-1 text-[10px] text-zinc-300">{day.workout.exercises.map((x) => <li key={x}>• {x}</li>)}</ul></div>
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground"><b className="text-foreground">Consistency:</b> {day.lifestyleHack}</p>
        </article>)}
      </div>
    </div>

    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2"><ShoppingBasket size={15} className="text-gold" /><h2 className="font-display text-lg font-semibold">Shopping + meal prep</h2></div>
      <ul className="mt-3 space-y-2 text-[11px] text-muted-foreground">{plan.shoppingList.map((x) => <li key={x}>• {x}</li>)}</ul>
      <div className="mt-4 border-t border-border pt-4"><p className="text-[9px] uppercase tracking-widest text-gold">Prep system</p><ul className="mt-2 space-y-2 text-[11px] text-muted-foreground">{plan.mealPrep.map((x) => <li key={x}>• {x}</li>)}</ul></div>
    </div>

    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2"><Dumbbell size={15} className="text-gold" /><h2 className="font-display text-lg font-semibold">Consistency accessories</h2></div>
      {accessories.length ? <div className="mt-3 space-y-2">{accessories.map((a) => <a key={a.sku} href={`https://resofit.fit/product/${a.handle}`} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"><span className="text-[11px] font-semibold">{a.title}</span><span className="text-[10px] text-gold">₦{Number(a.variant_price || 0).toLocaleString()}</span></a>)}</div> : <p className="mt-3 text-[11px] text-muted-foreground">No accessory bundle is attached to this entitlement.</p>}
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-black/30 p-3"><p className="text-[8px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 font-mono text-sm font-bold text-gold">{value}</p></div>; }
function Field({ label, value, type, onChange }: { label: string; value: number; type: string; onChange: (v: string) => void }) { return <label className="block"><span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-gold/50" /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (v: string) => void }) { return <label className="block"><span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background/40 px-3 py-2.5 text-sm outline-none focus:border-gold/50">{options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>; }
