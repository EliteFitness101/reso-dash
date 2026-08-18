import { ArrowRight, CheckCircle2, Dumbbell, HeartPulse, MessageCircle, Sparkles, Utensils } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { XP_MILESTONES, awardXP } from "@/components/XPProgress";
import { useProfileStore } from "@/lib/profile-store";

export const Route = createFileRoute("/_shell/today")({ component: TodayPage });

function TodayPage() {
  const { current } = useProfileStore();

  if (!current) {
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

  const name = current.intake?.fullName?.split(" ")[0] || "there";
  const goal = current.intake?.goal ?? "recomp";
  const experience = current.intake?.experience ?? "novice";
  const equipment = current.intake?.equipment?.length ? "your available equipment" : "your bodyweight";

  return (
    <section className="space-y-4">
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Today · ChatB2K™</p>
            <h1 className="mt-1 font-display text-2xl font-semibold">Good to see you, {name}.</h1>
            <p className="mt-1 text-xs text-muted-foreground">Your journey is being shaped around your goal, experience and real-life constraints.</p>
          </div>
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-gold">Tier 1</span>
        </div>
      </div>

      <div className="glass-card-gold rounded-3xl p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-gold"><Sparkles size={13} /> Next Best Action</div>
        <h2 className="mt-2 font-display text-xl font-semibold">Complete today’s {goal} action.</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">You’re a {experience} working toward {goal}. Start with a practical session using {equipment}. Consistency beats intensity today.</p>
        <button type="button" onClick={() => awardXP("first-plan")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl gold-bg py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-background">Mark Today’s Action Complete <CheckCircle2 size={15} /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ActionCard icon={<Dumbbell size={17} />} title="Move" text="Your training / mobility" href="/training" />
        <ActionCard icon={<Utensils size={17} />} title="Eat" text="Your meal guidance" href="/macros" />
        <ActionCard icon={<HeartPulse size={17} />} title="Progress" text="Milestones + XP" href="/checkin" />
        <ActionCard icon={<MessageCircle size={17} />} title="Ask ChatB2K" text="Get your next step" href="/onboarding" />
      </div>

      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.25em] text-gold">Your journey</p><h2 className="mt-1 font-display text-lg font-semibold">Current state → next state</h2></div><Link to="/checkin" className="text-xs text-gold">Open →</Link></div>
        <div className="mt-4 grid gap-2 text-xs">
          <div className="rounded-2xl border border-border bg-background/30 p-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Current state</p><p className="mt-1 font-medium">Building a repeatable wellness routine</p></div>
          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-3"><p className="text-[9px] uppercase tracking-widest text-gold">Next best state</p><p className="mt-1 font-medium">Complete your first 7-day consistency cycle</p></div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.25em] text-gold">Milestone engine</p><h2 className="mt-1 font-display text-lg font-semibold">Earn XP by doing, not browsing.</h2></div><span className="font-mono text-[10px] text-muted-foreground">{XP_MILESTONES.length} milestones</span></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Your biggest Tier 1 milestone is sharing a genuine progress report. The share flow includes @resoflex and the approved ResoFit tags.</p>
      </div>
    </section>
  );
}

function ActionCard({ icon, title, text, href }: { icon: ReactNode; title: string; text: string; href: string }) {
  return <Link to={href} className="glass-card rounded-2xl p-4 transition-transform active:scale-[0.98]"><div className="text-gold">{icon}</div><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{text}</p></Link>;
}
