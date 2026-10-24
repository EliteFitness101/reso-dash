import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { Intake } from "@/lib/profile-store";
import { generatePlan } from "@/lib/plan-generator";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/_shell/onboarding")({ component: OnboardingPage });
const steps = ["Biometrics", "Goal", "Dietary", "Equipment"] as const;
type VerifiedExperience = { product_sku?: string | null; product_name?: string | null; product_handle?: string | null; product_type?: string | null; funnel_origin?: string | null; entitlement_id?: string | null; entitlement_status?: string | null; entitlement_access?: string | null };
type ServerPlanResult = { ok: boolean; plan_id?: string; plan?: any; experience?: any; error?: string; code?: string; commerce_action_url?: string };

function OnboardingPage() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [experience, setExperience] = useState<VerifiedExperience | null>(null);
  const [step, setStep] = useState(0);
  const [intake, setIntakeLocal] = useState<Intake>({ fullName: "", email: "", phone: "", age: 26, sex: "female", heightCm: 168, weightKg: 68, bodyFatPct: 24, goal: "recomp", experience: "intermediate", daysPerWeek: 4, restrictions: ["onions"], cuisine: "West-African", mealsPerDay: 3, location: "hybrid", equipment: ["dumbbells", "bench"] });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInSending, setSignInSending] = useState(false);
  const [signInMessage, setSignInMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [planError, setPlanError] = useState("");
  const [serverPlan, setServerPlan] = useState<ServerPlanResult | null>(null);

  useEffect(() => {
    let active = true;
    const client = supabase;
    if (!session || !client) { setExperience(null); setClaimLoading(false); return () => { active = false; }; }
    setClaimLoading(true); setClaimError("");
    void client.functions.invoke("claim-dashboard-entitlement").then(async ({ data, error }) => {
      if (!active) return;
      if (error) { setExperience(null); setClaimError(error.message); return; }
      const verified = data?.plan_entitled ? (data?.plan_experience ?? data?.experience) as VerifiedExperience | null : null;
      if (verified?.product_sku && verified?.entitlement_id) {
        setExperience(verified); setClaimError("");
        try { window.sessionStorage.setItem("resofit_verified_experience", JSON.stringify(verified)); } catch { /* Verified data is also held in React state. */ }
        const { data: existingPlan, error: planLookupError } = await client.functions.invoke("resofit-personal-plan", { body: { action: "get", product_sku: verified.product_sku } });
        if (!active) return;
        if (!planLookupError && existingPlan?.ok && existingPlan?.plan_id && existingPlan?.plan) {
          setServerPlan(existingPlan as ServerPlanResult);
          if (existingPlan.intake) setIntakeLocal((value) => ({ ...value, ...existingPlan.intake }));
          setStep(steps.length - 1);
        }
      } else {
        setExperience(null);
        setClaimError(data?.entitled ? "Your purchase grants dashboard access, but it has no active personalized-plan entitlement." : "No successful ResoFit purchase is linked to this email yet. Use the same email used at checkout.");
      }
    }).catch((error: unknown) => { if (active) { setExperience(null); setClaimError(error instanceof Error ? error.message : "Purchase verification failed."); } })
      .finally(() => { if (active) setClaimLoading(false); });
    return () => { active = false; };
  }, [session?.access_token]);

  useEffect(() => { const userEmail = session?.user.email; if (userEmail) setIntakeLocal((value) => ({ ...value, email: value.email || userEmail })); }, [session?.user.email]);

  const set = <K extends keyof Intake,>(k: K, v: Intake[K]) => setIntakeLocal((s) => ({ ...s, [k]: v }));
  const sendSignInLink = async () => {
    if (!supabase) { setSignInMessage("Authentication is not configured in this deployment."); return; }
    const email = (signInEmail || intake.email).trim().toLowerCase();
    if (!email.includes("@")) { setSignInMessage("Enter the email used for your ResoFit purchase."); return; }
    setSignInSending(true); setSignInMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: "https://dashboard.resofit.fit/onboarding" } });
    setSignInSending(false);
    setSignInMessage(error ? error.message : "Secure sign-in link sent. Open it on this device, then return to onboarding.");
  };
  const advance = async () => {
    if (step < steps.length - 1) { setStep(step + 1); return; }
    setPlanError("");
    if (!supabase || !session) { setPlanError("Sign in with the email used for checkout before generating a saved plan."); return; }
    if (!experience?.product_sku || !experience.entitlement_id) { setPlanError(claimError || "No verified product entitlement is available for plan generation."); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("resofit-personal-plan", { body: { product_sku: experience.product_sku, intake: { age: intake.age, sex: intake.sex, heightCm: intake.heightCm, weightKg: intake.weightKg, goal: intake.goal, experience: intake.experience, daysPerWeek: intake.daysPerWeek, restrictions: intake.restrictions, cuisine: intake.cuisine, mealsPerDay: intake.mealsPerDay, location: intake.location, equipment: intake.equipment } } });
      if (error) throw error;
      const result = data as ServerPlanResult | null;
      if (!result?.ok || !result.plan_id || !result.plan) throw new Error(result?.error || "The server did not confirm that your personalized plan was saved.");
      setServerPlan(result);
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : "Plan generation failed. Your entitlement and saved plan were not confirmed.");
    } finally { setGenerating(false); }
  };
  const plan = step === steps.length - 1 ? generatePlan(intake) : null;

  if (!session) return <div className="glass-card rounded-2xl p-6 space-y-3"><p className="text-[10px] uppercase tracking-[0.3em] text-gold">Secure plan access</p><h1 className="font-display text-xl font-semibold">Sign in to verify your purchase</h1><p className="text-sm text-muted-foreground">Use the same email used at ResoFit checkout. We verify payment and entitlement on the server before generating or saving a personalized plan.</p><input type="email" value={signInEmail || intake.email} onChange={(e) => setSignInEmail(e.target.value)} placeholder="Email used at checkout" className="w-full rounded-xl border border-border bg-background/40 px-3 py-3 text-sm outline-none focus:border-gold/60" /><button onClick={sendSignInLink} disabled={signInSending} className="w-full rounded-xl gold-bg py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50">{signInSending ? "Sending link…" : "Send secure sign-in link"}</button>{signInMessage && <p role="status" className="text-xs text-muted-foreground">{signInMessage}</p>}<button onClick={() => nav({ to: "/checkout" })} className="text-xs text-gold underline">Return to secure checkout</button></div>;
  if (claimLoading) return <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">Verifying your purchase and plan entitlement…</div>;
  if (!experience?.product_sku || !experience.entitlement_id) return <div className="glass-card rounded-2xl p-6 space-y-3"><p className="text-[10px] uppercase tracking-[0.3em] text-gold">Purchase verification</p><h1 className="font-display text-xl font-semibold">No active personalized-plan entitlement</h1><p role="alert" className="text-sm text-muted-foreground">{claimError || "We could not verify a plan entitlement for this account."}</p><button onClick={() => nav({ to: "/checkout" })} className="inline-flex items-center gap-2 rounded-xl gold-bg px-4 py-2 text-xs font-bold uppercase tracking-widest">Go to secure checkout <ArrowRight size={14} /></button></div>;
  return <div className="space-y-4">
    <header><p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Personalized onboarding</p><h1 className="mt-1 font-display text-xl font-semibold">{experience?.product_name ? `Build your ${experience.product_name} journey` : "Build your personalized journey"}</h1><p className="mt-1 text-xs text-muted-foreground">Verified product entitlement · {experience?.product_sku ?? "checking access"}</p></header>
    <div className="flex gap-1.5">{steps.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "gold-bg" : "bg-border"}`} />)}</div>
    <div className="glass-card rounded-2xl p-4 space-y-3">
      {step === 0 && <><Row label="Age" value={intake.age} onChange={(v) => set("age", Number(v))} type="number" /><Select label="Sex" value={intake.sex} onChange={(v) => set("sex", v as Intake["sex"])} options={[{ v: "female", l: "Female" }, { v: "male", l: "Male" }]} /><Row label="Height (cm)" value={intake.heightCm} onChange={(v) => set("heightCm", Number(v))} type="number" /><Row label="Weight (kg)" value={intake.weightKg} onChange={(v) => set("weightKg", Number(v))} type="number" /><Row label="Body fat %" value={intake.bodyFatPct} onChange={(v) => set("bodyFatPct", Number(v))} type="number" /></>}
      {step === 1 && <><Select label="Primary goal" value={intake.goal} onChange={(v) => set("goal", v as Intake["goal"])} options={[{ v: "cut", l: "Cut · drop fat" }, { v: "recomp", l: "Recomp · simultaneous" }, { v: "bulk", l: "Bulk · gain muscle" }]} /><Select label="Training experience" value={intake.experience} onChange={(v) => set("experience", v as Intake["experience"])} options={[{ v: "novice", l: "Novice (<1 yr)" }, { v: "intermediate", l: "Intermediate (1–3 yr)" }, { v: "advanced", l: "Advanced (3+ yr)" }]} /><Row label="Days / week available" value={intake.daysPerWeek} onChange={(v) => set("daysPerWeek", Number(v))} type="number" /></>}
      {step === 2 && <><Chips label="Restrictions (zero-tolerance)" options={["onions", "dairy", "gluten", "pork", "shellfish", "spicy"]} value={intake.restrictions} onChange={(v) => set("restrictions", v)} /><Row label="Cuisine bias" value={intake.cuisine} onChange={(v) => set("cuisine", String(v))} /><Row label="Meals per day" value={intake.mealsPerDay} onChange={(v) => set("mealsPerDay", Number(v))} type="number" /></>}
      {step === 3 && <><Select label="Primary training location" value={intake.location} onChange={(v) => set("location", v as Intake["location"])} options={[{ v: "gym", l: "Gym" }, { v: "home", l: "Home only" }, { v: "hybrid", l: "Hybrid (gym + home)" }]} /><Chips label="Available equipment" options={["dumbbells", "bench", "barbell", "bands", "pull-up bar", "kettlebell"]} value={intake.equipment} onChange={(v) => set("equipment", v)} />{plan && <div className="mt-2 rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs"><p className="font-display text-sm font-bold gold-text">Plan preview</p><p className="mt-1 tabular">{plan.targetKcal} kcal · P{plan.proteinG} / C{plan.carbsG} / F{plan.fatG}</p><p className="mt-0.5 text-muted-foreground">{plan.trainingSplit}</p><p className="mt-2 text-[10px] text-muted-foreground">Preview only. The saved plan is generated server-side after entitlement verification.</p></div>}</>}
    </div>
    {planError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{planError}</p>}
    {serverPlan?.plan && <section className="glass-card rounded-2xl p-4 space-y-3"><div><p className="text-[10px] uppercase tracking-[0.3em] text-gold">Saved to your ResoFit account</p><h2 className="mt-1 font-display text-lg font-semibold">{serverPlan.experience?.teaser?.headline ?? experience?.product_name ?? "Your personalized plan"}</h2><p className="mt-1 text-xs text-muted-foreground">Server-confirmed plan ID · {serverPlan.plan_id}</p></div>{serverPlan.plan.summary && <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-border p-3"><p className="text-muted-foreground">Daily target</p><p className="mt-1 font-semibold">{serverPlan.plan.summary.targetKcal} kcal</p></div><div className="rounded-xl border border-border p-3"><p className="text-muted-foreground">Protein</p><p className="mt-1 font-semibold">{serverPlan.plan.summary.proteinG} g</p></div></div>}{serverPlan.plan.days?.slice(0, 7).map((day: any) => <article key={day.day} className="rounded-xl border border-border p-3"><h3 className="font-display text-sm font-semibold">Day {day.day}</h3>{day.meals && Object.entries(day.meals).map(([meal, description]) => <p key={meal} className="mt-1 text-xs"><span className="font-semibold capitalize">{meal}:</span> {String(description)}</p>)}<p className="mt-2 text-xs text-muted-foreground">Workout: {typeof day.workout === "string" ? day.workout : day.workout?.name ?? day.workout?.focus ?? "Personalized session"}</p><p className="mt-1 text-xs text-muted-foreground">{day.lifestyleHack}</p></article>)}{serverPlan.plan.shoppingList?.length > 0 && <div><h3 className="font-display text-sm font-semibold">Shopping list</h3><ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">{serverPlan.plan.shoppingList.map((item: string) => <li key={item}>{item}</li>)}</ul></div>}</section>}
    <div className="flex gap-2">{step > 0 && <button onClick={() => setStep(step - 1)} disabled={generating} className="flex-1 rounded-xl border border-border bg-card/50 py-3.5 text-xs font-bold uppercase tracking-widest text-muted-foreground disabled:opacity-50">Back</button>}<button onClick={advance} disabled={generating || claimLoading || !experience?.entitlement_id} className="flex flex-[2] items-center justify-center gap-2 rounded-xl gold-bg py-3.5 font-display text-xs font-bold uppercase tracking-[0.2em] active:scale-[0.98] transition-transform disabled:opacity-50">{generating ? "Saving plan…" : serverPlan ? "Regenerate saved plan" : step < steps.length - 1 ? "Continue" : "Generate plan"}<ArrowRight size={14} /></button></div>
  </div>;
}
function Row({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string | number) => void; type?: string }) { return <div><label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background/40 px-3 py-3 text-sm tabular outline-none focus:border-gold/60" /></div>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) { return <div><label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label><div className="mt-1 grid gap-1.5">{options.map((o) => <button key={o.v} onClick={() => onChange(o.v)} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-colors ${value === o.v ? "border-gold bg-gold/10" : "border-border bg-background/40"}`}><span>{o.l}</span>{value === o.v && <Check size={14} className="text-gold" />}</button>)}</div></div>; }
function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) { return <div><label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label><div className="mt-2 flex flex-wrap gap-1.5">{options.map((o) => { const on = value.includes(o); return <button key={o} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${on ? "border-gold bg-gold/15 text-gold" : "border-border bg-background/40 text-muted-foreground"}`}>{o}</button>; })}</div></div>; }
