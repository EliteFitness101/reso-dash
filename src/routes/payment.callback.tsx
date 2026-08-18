import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/payment/callback")({
  component: PaymentCallbackPage,
});

function PaymentCallbackPage() {
  const search = Route.useSearch() as { reference?: string };
  const [showDetails, setShowDetails] = useState(false);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[78vh] max-w-md items-center justify-center">
        <section className="glass-card-gold w-full rounded-3xl p-6 shadow-2xl">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-gold" aria-hidden="true" />
            <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Welcome to ResoFit
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold leading-tight">
              Your journey starts now.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Payment confirmed. You have taken the first step toward a healthier, stronger and
              more sustainable lifestyle. We will help make your plan practical for your real life.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-background/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold">What happens next</p>
            <div className="mt-3 space-y-3 text-sm">
              <Step n="01" text="Tell us what matters most to you." />
              <Step n="02" text="We tailor your food, movement and lifestyle plan." />
              <Step n="03" text="Start with one clear action today." />
            </div>
          </div>

          {search.reference && (
            <div className="mt-4 rounded-2xl border border-border bg-background/30 px-4 py-3">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Payment reference</p>
              <p className="mt-1 break-all font-mono text-xs">{search.reference}</p>
            </div>
          )}

          <Link
            to="/onboarding"
            search={{ ref: search.reference ?? "" } as never}
            className="mt-6 flex w-full items-center justify-center rounded-xl gold-bg py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-background transition-transform active:scale-[0.98]"
          >
            Personalize My Journey
          </Link>

          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            className="mt-3 w-full rounded-xl border border-border py-3 text-xs font-medium text-muted-foreground"
          >
            {showDetails ? "Hide details" : "What will you personalize?"}
          </button>

          {showDetails && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span className="rounded-xl bg-background/40 p-3">Your goal</span>
              <span className="rounded-xl bg-background/40 p-3">Your food style</span>
              <span className="rounded-xl bg-background/40 p-3">Your activity level</span>
              <span className="rounded-xl bg-background/40 p-3">Your available time</span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground">
            <ShieldCheck size={12} className="text-gold" />
            <span>Secure payment · ResoFit</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] text-gold">{n}</span>
      <span>{text}</span>
    </div>
  );
}
