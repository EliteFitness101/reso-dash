import { Share2, Trophy, Upload } from "lucide-react";
import { useEffect, useState } from "react";

const XP_KEY = "resofit_xp_v2";
const COMPLETED_KEY = "resofit_xp_milestones_v2";

export const XP_MILESTONES = [
  { id: "welcome", label: "Welcome & payment confirmed", xp: 100 },
  { id: "profile", label: "Complete your wellness profile", xp: 150 },
  { id: "first-plan", label: "Start your first meal & workout plan", xp: 150 },
  { id: "accountability", label: "Complete a daily accountability check", xp: 100 },
  { id: "checkin", label: "Complete your first progress check-in", xp: 150 },
  { id: "week", label: "Complete your first 7-day journey", xp: 250 },
  { id: "social-progress", label: "Share your progress report", xp: 500 },
] as const;

const TIER_2_XP = 900;

function readState() {
  try {
    return {
      xp: Number(localStorage.getItem(XP_KEY) ?? "0"),
      completed: new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? "[]") as string[]),
    };
  } catch {
    return { xp: 0, completed: new Set<string>() };
  }
}

export function awardXP(milestoneId: string) {
  const milestone = XP_MILESTONES.find((item) => item.id === milestoneId);
  if (!milestone || typeof window === "undefined") return;
  const state = readState();
  if (state.completed.has(milestoneId)) return;
  state.completed.add(milestoneId);
  state.xp += milestone.xp;
  localStorage.setItem(XP_KEY, String(state.xp));
  localStorage.setItem(COMPLETED_KEY, JSON.stringify([...state.completed]));
  window.dispatchEvent(new CustomEvent("resofit:xp", { detail: { xp: state.xp, milestoneId } }));
}

export function XPProgress() {
  const [state, setState] = useState(readState);
  const [shared, setShared] = useState(state.completed.has("social-progress"));
  const tier2 = state.xp >= TIER_2_XP;
  const progress = Math.min(100, Math.round((state.xp / TIER_2_XP) * 100));

  useEffect(() => {
    const refresh = () => setState(readState());
    window.addEventListener("resofit:xp", refresh);
    return () => window.removeEventListener("resofit:xp", refresh);
  }, []);

  const shareProgress = async () => {
    const text = "My ResoFit progress is moving forward. I am building healthier habits one milestone at a time. @resoflex #ResoFit #ResoFlex";
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My ResoFit Progress", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      }
      awardXP("social-progress");
      setShared(true);
      setState(readState());
    } catch {
      // User cancelled sharing; do not award XP.
    }
  };

  return (
    <section className="glass-card-gold rounded-3xl p-5" aria-label="ResoFit XP progress">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">ResoFit Progress XP</p>
          <h2 className="mt-1 font-display text-xl font-semibold">{tier2 ? "Tier 2 · Ascended" : "Tier 1 · Building"}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{state.xp} XP · {tier2 ? "Tier 2 unlocked" : `${TIER_2_XP - state.xp} XP to Tier 2`}</p>
        </div>
        <Trophy className="h-7 w-7 text-gold" aria-hidden="true" />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/70" aria-label={`${progress}% toward Tier 2`}>
        <div className="h-full rounded-full gold-bg transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 space-y-2">
        {XP_MILESTONES.map((milestone) => {
          const done = state.completed.has(milestone.id);
          return (
            <div key={milestone.id} className="flex items-center justify-between rounded-2xl border border-border bg-background/30 px-3 py-2.5 text-xs">
              <span className={done ? "text-foreground" : "text-muted-foreground"}>{done ? "✓ " : "○ "}{milestone.label}</span>
              <span className="font-mono text-gold">+{milestone.xp}</span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={shareProgress}
        disabled={shared}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gold-bg py-3 text-xs font-bold uppercase tracking-[0.16em] text-background disabled:cursor-default disabled:opacity-60"
      >
        {shared ? <Share2 size={15} /> : <Upload size={15} />}
        {shared ? "Progress Shared · +500 XP" : "Share My Progress · +500 XP"}
      </button>
      <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
        Share to TikTok, Instagram, Facebook, YouTube or any social app from your device. Your share copy includes @resoflex and ResoFit tags.
      </p>
    </section>
  );
}
