import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ExternalLink, Sparkles } from "lucide-react";
import { useProfileStore } from "@/lib/profile-store";
import { upsellCatalog } from "@/lib/plan-generator";
import { initTransaction, formatNaira, buildCallbackUrl, CALLBACK_URL } from "@/lib/paystack-sim";

export const Route = createFileRoute("/_shell/upsells")({
  component: UpsellsPage,
});

function UpsellsPage() {
  const { current, addUpsell } = useProfileStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [lastRedirect, setLastRedirect] = useState<string | null>(null);

  const purchase = async (productId: string, name: string, amount: number) => {
    if (!current?.intake) return;
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
      // Mirror real Paystack: redirect to external success/callback URL.
      setTimeout(() => {
        window.location.assign(url);
      }, 900);
    } finally {
      setLoadingId(null);
    }
  };

  if (!current) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Complete onboarding to unlock upsells.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Post-Intake Offers · {current.rsid}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">
          Compound the <span className="gold-text">results</span>
        </h1>
      </header>

      <div className="space-y-3">
        {upsellCatalog.map((u) => {
          const owned = current.upsells.includes(u.id);
          const loading = loadingId === u.id;
          return (
            <article key={u.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gold">
                      {u.badge}
                    </span>
                    {owned && (
                      <span className="rounded bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-foreground">
                        Owned
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-base font-semibold leading-tight">
                    {u.name}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{u.tagline}</p>
                </div>
                <span className="font-display text-base font-bold tabular gold-text shrink-0">
                  {formatNaira(u.amount)}
                </span>
              </div>
              <ul className="mt-3 grid gap-1.5">
                {u.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Check size={12} className="text-gold" />
                    {p}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => purchase(u.id, u.name, u.amount)}
                disabled={loading || owned}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
                  owned
                    ? "border border-border bg-card/50 text-muted-foreground"
                    : "gold-bg"
                } disabled:opacity-60`}
              >
                {owned ? (
                  <>
                    <Check size={14} /> Activated
                  </>
                ) : loading ? (
                  "Authorizing…"
                ) : (
                  <>
                    <Sparkles size={14} /> Add {formatNaira(u.amount)}
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>

      <div className="glass-card-gold rounded-2xl p-3.5">
        <p className="text-[10px] uppercase tracking-widest text-gold">Success callback</p>
        <p className="mt-1 break-all text-[11px] text-muted-foreground">
          On confirmed payment, Paystack redirects to{" "}
          <span className="text-foreground">{CALLBACK_URL}</span> with{" "}
          <span className="text-foreground">reference</span>,{" "}
          <span className="text-foreground">rsid</span>, amount, and status.
        </p>
        {lastRedirect && (
          <a
            href={lastRedirect}
            className="mt-2 inline-flex items-center gap-1 text-[11px] gold-text underline-offset-2 hover:underline"
          >
            <ExternalLink size={12} /> Opening callback…
          </a>
        )}
      </div>
    </div>
  );
}
