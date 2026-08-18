import { ArrowRight, CheckCircle2, Dumbbell, HeartPulse, MessageCircle, Sparkles, Utensils } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { XP_MILESTONES } from "@/components/XPProgress";
import { useProfileStore } from "@/lib/profile-store";
import { evaluateNextBestAction, type ChatB2KAction } from "@/lib/chatb2k-engine";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/_shell/today")({ component: TodayPage });

type MemberState = {
  canonical_name: string;
  tier: "Foundation" | "LuxeGold" | "Sovereign_Elite";
  day_count: number;
  xp_total: number;
  current_phase: string;
  location: string;
  primary_objective: string;
  equipment_access: string;
};

function TodayPage() {
  const { current } = useProfileStore();
  const [serverState, setServerState] = useState<MemberState | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!supabase) return;

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("resofit_member_states")
        .select("canonical_name,tier,day_count,xp_total,current_phase,location,primary_objective,equipment_access")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        setServerState(data as MemberState);
        return;
      }

      if (error) {
        console.warn("[ChatB2K] Member state read failed", error);
        return;
      }

      const intake = current?.intake;
      const payload = {
        user_id: user.id,
        canonical_name: intake?.fullName || user.user_metadata?.full_name || user.email || "ResoFit Member",
        primary_objective: intake?.goal || "Personalized wellness progression",
        location: intake?.location === "gym" ? "Gym" : intake?.location === "hybrid" ? "Hybrid" : "Home",
        equipment_access: intake?.equipment?.length ? "available" : "minimal",
        budget_tier: "Core",
      };

      const { data: created, error: insertError } = await supabase
        .from("resofit_member_states")
        .insert(payload)
        .select("canonical_name,tier,day_count,xp_total,current_phase,location,primary_objective,equipment_access")
        .single();

      if (!cancelled && !insertError && created) setServerState(created as MemberState);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [current]);

  if (!current && !serverState) {
    return (
      <section className="space-y-4">
        <div className="glass-card-gold rounded-3xl p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">ChatB2K™ Personal Companion</p>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight">Welcome. Let’s make today simple.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Your companion learns what matters to you, then turns it into one clear next step across movement, food, recovery and progress.</p>
          <Link to="/onboarding" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl gold-bg py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-background">Personalize My Journey <ArrowRight size={15} /></Link>
        </div>
      </section>
    );
  }

  const name = serverState?.canonical_name || current?.intake?.fullName?.split(" ")[0] || "there";
  const goal = serverState?.primary_objective || current?.intake?.goal || "recomp";
  const dayCount = serverState?.day_count ?? 1;
  const xpTotal = serverState?.xp_total ?? 0;
  const tier = serverState?.tier ?? "Foundation";

  const nba = useMemo<ChatB2KAction>(() => evaluateNextBestAction({
    dayCount,
    currentPhase: serverState?.current_phase ?? "onboarding",
    primaryObjective: goal,
    equipmentAccess: serverState?.equipment_access ?? (current?.intake?.equipment?.length ? "available" : "minimal"),
    budgetTier: "Core",
  }), [current?.intake?.equipment, dayCount, goal, serverState?.current_phase, serverState?.equipment_access]);

  async function completeAction() {
    if (!supabase) {
      setActionMessage("Supabase is not configured for this deployment.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setActionMessage("Sign in to sync XP to your ResoFit journey.");
        return;
      }

      const actionId = nba.id === "nba-daily-move" ? `${nba.id}-${dayCount}` : nba.id;
      const { data, error } = await supabase.rpc("award_member_xp", {
        p_user_id: user.id,
        p_action_id: actionId,
        p_action_type: nba.type,
        p_xp_amount: nba.xpReward,
      });

      if (error) throw error;
      if (!data?.success) throw new Error("The XP award was not accepted by the server.");

      setServerState((prev) => prev ? {
        ...prev,
        xp_total: data.new_xp,
        day_count: data.day_count,
        tier: data.tier,
        current_phase: data.day_count >= 7 ? "day_7_milestone" : prev.current_phase,
      } : prev);
      setActionMessage(data.duplicate ? "Already synced ✓" : `Synced ✓ +${nba.xpReward} XP`);
    } catch (error) {
      console.error("[ChatB2K] XP RPC failed", error);
      setActionMessage("Could not sync this action. Your XP was not changed locally.");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Today · ChatB2K™</p>
            <h1 className="mt-1 font-display text-2xl font-semibold">Good to see you, {name}.</h1>
            <p className="mt-1 text-xs text-muted-foreground">Your journey is shaped around your goal, real-life constraints and verified member state.</p>
          </div>
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gold">{tier}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-zinc-300">Day {dayCount}</span>
          <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-zinc-300">{xpTotal.toLocaleString()} XP</span>
          <span className="rounded-md border border-gold/20 bg-gold/5 px-2.5 py-1 text-gold">{goal}</span>
        </div>
      </div>

      <div className="glass-card-gold rounded-3xl p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-gold"><Sparkles size={13} /> Next Best Action</div>
        <h2 className="mt-2 font-display text-xl font-semibold">{nba.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{nba.subtitle}</p>
        <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{nba.durationOrPortion} · {nba.type}</p>

        {nba.productMatch && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-black/60 p-3">
            <div>
              <p className="text-[10px] uppercase text-zinc-400">Recommended Product</p>
              <p className="mt-0.5 text-xs font-bold text-white">{nba.productMatch.name}</p>
            </div>
            <span className="font-mono text-xs font-bold text-gold">{nba.productMatch.price}</span>
          </div>
        )}

        <button type="button" disabled={actionBusy} onClick={() => void completeAction()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl gold-bg py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-background disabled:cursor-not-allowed disabled:opacity-60">
          {actionBusy ? "Syncing…" : nba.ctaText} <span className="rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px]">+{nba.xpReward} XP</span>
        </button>
        {actionMessage && <p className="mt-2 text-center text-[10px] font-mono text-gold">{actionMessage}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ActionCard icon={<Dumbbell size={17} />} title="Move" text="Training & mobility" href="/training" />
        <ActionCard icon={<Utensils size={17} />} title="Eat" text="Meal guidance" href="/macros" />
        <ActionCard icon={<HeartPulse size={17} />} title="Progress" text="Milestones + XP" href="/checkin" />
        <ActionCard icon={<MessageCircle size={17} />} title="Ask ChatB2K" text="Get your next step" href="/onboarding" />
      </div>

      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.25em] text-gold">Your journey</p><h2 className="mt-1 font-display text-lg font-semibold">Current state → next state</h2></div><Link to="/checkin" className="text-xs text-gold">Open →</Link></div>
        <div className="mt-4 grid gap-2 text-xs">
          <div className="rounded-2xl border border-border bg-background/30 p-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Current state</p><p className="mt-1 font-medium">Day {dayCount} · {goal}</p></div>
          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-3"><p className="text-[9px] uppercase tracking-widest text-gold">Next best state</p><p className="mt-1 font-medium">{dayCount >= 7 ? "Scale your personalized progression" : "Complete your 7-day consistency cycle"}</p></div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.25em] text-gold">Milestone engine</p><h2 className="mt-1 font-display text-lg font-semibold">Earn XP by doing, not browsing.</h2></div><span className="font-mono text-[10px] text-muted-foreground">{XP_MILESTONES.length} milestones</span></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Your action is recorded in the canonical telemetry trail when the server accepts the XP award.</p>
      </div>
    </section>
  );
}

function ActionCard({ icon, title, text, href }: { icon: ReactNode; title: string; text: string; href: string }) {
  return <Link to={href} className="glass-card rounded-2xl p-4 transition-transform active:scale-[0.98]"><div className="text-gold">{icon}</div><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{text}</p></Link>;
}
