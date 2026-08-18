import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/payment/callback")({
  component: PaymentCallbackPage,
});

function PaymentCallbackPage() {
  const search = Route.useSearch() as { reference?: string };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <section className="glass-card-gold w-full rounded-3xl p-6 text-center shadow-2xl">
          {ready ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-gold" aria-hidden="true" />
          ) : (
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-gold" aria-hidden="true" />
          )}

          <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            ResoFit Payment
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">
            {ready ? "Payment received" : "Confirming your payment"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {ready
              ? "Your payment is being reconciled by the secure ResoFit payment system. Continue to onboarding while your access is finalized."
              : "Please keep this page open while Paystack and the ResoFit payment system confirm your transaction."}
          </p>

          {search.reference && (
            <div className="mt-5 rounded-2xl border border-border bg-background/50 px-4 py-3 text-left">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Reference</p>
              <p className="mt-1 break-all font-mono text-xs">{search.reference}</p>
            </div>
          )}

          <Link
            to="/onboarding"
            search={{ ref: search.reference ?? "" } as never}
            className="mt-6 flex w-full items-center justify-center rounded-xl gold-bg py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-background transition-transform active:scale-[0.98]"
          >
            Continue to onboarding
          </Link>

          <div className="mt-4 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground">
            <ShieldCheck size={12} className="text-gold" />
            <span>Webhook-confirmed access · ResoFit</span>
          </div>
        </section>
      </div>
    </main>
  );
}
