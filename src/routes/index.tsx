import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Shield, Sparkles, Swords, Timer, UserRound } from "lucide-react";

export const Route = createFileRoute("/")({ component: MartialLanding });

function MartialLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(212,175,55,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,.07)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <div>
            <p className="font-display text-sm font-bold tracking-[0.28em] text-primary">MARTIAL-X™</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">A ResoFit experience</p>
          </div>
          <Link to="/checkout" className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">Start now</Link>
        </nav>

        <section className="grid min-h-[78vh] items-center gap-10 py-14 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-primary backdrop-blur-xl">
              <Sparkles size={12} /> Combat fitness · movement · discipline
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[.98] tracking-tight sm:text-7xl">
              Train. Move. <span className="gold-text">Defend.</span> Evolve.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              A Nigeria-first martial fitness experience connecting combat conditioning, mobility and personalized coaching to the wider ResoFit ecosystem.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/checkout" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl gold-bg px-6 font-display text-sm font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-lg shadow-primary/10">
                Start the 7-Day Challenge <ArrowRight size={18} />
              </Link>
              <Link to="/onboarding" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-border bg-white/[0.03] px-6 text-sm font-semibold backdrop-blur-xl">
                Take my assessment
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Shield size={14} className="text-primary" /> Beginner-friendly</span>
              <span className="inline-flex items-center gap-1.5"><Timer size={14} className="text-primary" /> Home or gym</span>
              <span className="inline-flex items-center gap-1.5"><UserRound size={14} className="text-primary" /> Age-aware tracks</span>
            </div>
          </div>

          <aside className="glass-card-gold rounded-[2rem] p-5 shadow-2xl shadow-primary/10 backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-white/[0.07] bg-black/30 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary">7-Day Combat Conditioning</span>
                <Swords size={20} className="text-primary" />
              </div>
              <h2 className="mt-5 font-display text-3xl font-semibold">Your first week starts today.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Short sessions, progressive conditioning, mobility and daily accountability. CoachB2K becomes your next layer as the platform expands.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Daily 20–30 minute sessions", "Home and gym modifications", "Mobility + recovery finishers", "Daily completion check-ins", "Personalized next-step recommendations"].map((item) => (
                  <li key={item} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-primary" /> {item}</li>
                ))}
              </ul>
              <div className="mt-7 flex items-end justify-between border-t border-white/[0.07] pt-5">
                <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Launch offer</p><p className="mt-1 font-display text-3xl font-bold gold-text">₦1,000</p></div>
                <Link to="/checkout" className="rounded-xl gold-bg px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground">Get access</Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 border-t border-border py-12 sm:grid-cols-3">
          <Feature title="Train" text="Boxing, kickboxing, martial arts, conditioning and mobility pathways." />
          <Feature title="Personalize" text="Progressive programs designed around your goal, level, schedule and equipment." />
          <Feature title="Grow with ResoFit" text="Move from the starter challenge into CoachB2K, Academy, ResoFlex and membership." />
        </section>
      </div>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return <article className="glass-card rounded-2xl p-5"><p className="font-display text-lg font-semibold text-primary">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>;
}
