import { createFileRoute } from "@tanstack/react-router";
import { Check, ExternalLink, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { useProfileStore } from "@/lib/profile-store";
import { upsellCatalog } from "@/lib/plan-generator";
import { buildCallbackUrl, CALLBACK_URL, formatNaira, initTransaction } from "@/lib/paystack-sim";

const UPSELL_UNLOCK_DAYS = 7;

export const Route = createFileRoute("/_shell/upsells")({ component: UpsellsPage });

function daysSince(date: string) {
  const started = new Date(date).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 86_400_000));
}

function UpsellsPage() {
  const { current, addUpsell } = useProfileStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastRedirect, setLastRedirect] = useState<string | null>(null);

  const purchase = async (productId: string, name: string, amount: number) => {
    if (!current?.intake || daysSince(current.createdAt) < UPSELL_UNLOCK_DAYS) return;
    setLoadingId(productId);
    try {
      const tx = await initTransaction({
        email: current.intake.email || `${current.rsid}@resoflex.os`,
        amount,
        product: name,
        productId,
      });
      addUpsell(productId);
      const url = buildCallbackUrl(tx);
      setLastRedirect(url);
      setTimeout(() => window.location.assign(url), 900);
    } finally {
      setLoadingId(null);
    }
  };

  if (!current) {
    return <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">Complete onboarding to unlock your journey.</div>;
  }

  const elapsed = daysSince(current.createdAt);
  const unlocked = elapsed >= UPSELL_UNLOCK_DAYS;
  const daysLeft = Math.max(0, UPSELL_UNLOCK_DAYS - elapsed);

  return (
    <div className="space-y-4">
      <header className="glass-card rounded-3xl p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Your next chapter</p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">You’re not being sold to today.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your first seven days are for feeling understood, building momentum and proving what works for your real life. Deeper programmes and upgrades appear after the first cycle.
        </p>
        {!unlocked && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gold/20 bg-gold/5 p-3 text-xs text-gold">
            <LockKeyhole size={15} />
            Upgrade discovery unlocks in {daysLeft} day{daysLeft === 1 ? "" : "s"}.
          </div>
        )}
      </header>

      {unlocked && (
        <div className="glass-card-gold rounded-3xl p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Day 7+ · Personalized upgrades</p>
          <h2 className="mt-1 font-display text-lg font-semibold">Now let’s compound your results.</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Recommendations are presented from your journey, goals and completed milestones — not as a generic catalogue.</p>
        </div>
      )}

      <div className="space-y-3">
        {upsellCatalog.map((u) => {
          const owned = current.upsells.includes(u.id);
          const loading = loadingId === u.id;
          return (
            <article key={u.id} className={`glass-card rounded-2xl p-4 ${!unlocked ? "opacity-75" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gold">{u.badge}</span>
                    {!unlocked && <span className="rounded bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Locked</span>}
                    {owned && <span className="rounded bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-foreground">Owned</span>}
                  </div>
                  <h2 className="mt-2 font-display text-base font-semibold leading-tight">{u.name}</h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{u.tagline}</p>
                </div>
                <span className="font-display text-base font-bold tabular gold-text shrink-0">{formatNaira(u.amount)}</span>
              </div>
              <ul className="mt-3 grid gap-1.5">
                {u.perks.map((p) => <li key={p} className="flex items-center gap-2 text-[11px] text-muted-foreground"><Check size={12} className="text-gold" />{p}</li>)}
              </ul>
              <button onClick={() => purchase(u.id, u.name, u.amount)} disabled={!unlocked || loading || owned} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${owned || !unlocked ? "border border-border bg-card/50 text-muted-foreground" : "gold-bg"} disabled:opacity-60`}>
                {owned ? <><Check size={14} /> Activated</> : !unlocked ? <><LockKeyhole size={14} /> Available after Day 7</> : loading ? "Authorizing…" : <><Sparkles size={14} /> Continue journey</>}
              </button>
            </article>
          );
        })}
      </div>

      {unlocked && <div className="glass-card-gold rounded-2xl p-3.5"><p className="text-[10px] uppercase tracking-widest text-gold">Payment continuation</p><p className="mt-1 break-all text-[11px] text-muted-foreground">Confirmed purchases return through {CALLBACK_URL} with the payment reference for fulfilment and journey activation.</p>{lastRedirect && <a href={lastRedirect} className="mt-2 inline-flex items-center gap-1 text-[11px] gold-text underline-offset-2 hover:underline"><ExternalLink size={12} /> Opening payment callback…</a>}</div>}
    </div>
  );
}
