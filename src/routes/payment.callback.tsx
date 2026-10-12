import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/payment/callback")({ component: PaymentCallbackPage });

type OrderView = {
  status?: "pending" | "paid" | "failed" | "cancelled" | "refunded" | "reversed" | "expired";
  reference?: string;
  amount?: number;
  currency?: string;
  paid_at?: string | null;
  fulfillment_status?: string;
  next_steps?: string | null;
  product_sku?: string | null;
  product_name?: string | null;
  funnel_origin?: string | null;
  experience?: { product_sku?: string | null; product_name?: string | null; funnel_origin?: string | null } | null;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Keep this aligned with the app-wide Supabase client configuration.
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function PaymentCallbackPage() {
  const search = Route.useSearch() as { reference?: string; trxref?: string };
  const reference = (search.reference || search.trxref || "").trim();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!reference) {
      setError("missing_reference");
      setTimedOut(true);
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setError("supabase_not_configured");
      setTimedOut(true);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;

    const poll = async () => {
      try {
        const url = new URL(`${SUPABASE_URL}/functions/v1/verify-order`);
        url.searchParams.set("reference", reference);
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 12000);
        let response: Response;
        try {
          response = await fetch(url.toString(), {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
            cache: "no-store",
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeout);
        }

        if (!response.ok && response.status !== 503) throw new Error(`verify_${response.status}`);
        const payload = (await response.json()) as OrderView;
        if (cancelled) return;

        setOrder(payload);
        setError(null);

        if (payload.status === "paid") {
          const productSku = payload.product_sku ?? payload.experience?.product_sku ?? null;
          const productName = payload.product_name ?? payload.experience?.product_name ?? null;
          const funnelOrigin = payload.funnel_origin ?? payload.experience?.funnel_origin ?? null;
          window.sessionStorage.setItem(
            "resofit_verified_experience",
            JSON.stringify({ payment_reference: payload.reference, product_sku: productSku, product_name: productName, funnel_origin: funnelOrigin, paid_at: payload.paid_at }),
          );
          return;
        }

        if (["failed", "cancelled", "refunded", "expired"].includes(payload.status ?? "")) return;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "verification_failed");
      }

      if (!cancelled && attempts++ < 19) {
        timer = window.setTimeout(poll, 2000);
      } else if (!cancelled) {
        setTimedOut(true);
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [reference]);

  const status = order?.status ?? "pending";
  const paid = status === "paid";
  const cancelled = status === "cancelled";
  const expired = status === "expired";
  const reversed = status === "reversed";
  const refunded = status === "refunded";
  const failed = status === "failed";
  const terminal = failed || cancelled || expired || reversed || refunded;
  const productName = (order?.product_name ?? order?.experience?.product_name)?.trim();

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[78vh] max-w-md items-center justify-center">
        <section className="glass-card-gold w-full rounded-3xl p-6 shadow-2xl">
          <div className="text-center">
            {paid ? <CheckCircle2 className="mx-auto h-14 w-14 text-gold" aria-hidden="true" /> : terminal ? <XCircle className="mx-auto h-14 w-14 text-destructive" aria-hidden="true" /> : <Clock3 className="mx-auto h-14 w-14 text-gold" aria-hidden="true" />}
            <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{paid ? "Payment verified · ResoFit" : cancelled ? "Checkout cancelled · no payment confirmed" : failed ? "Payment failed" : expired ? "Checkout expired" : reversed ? "Payment reversed" : refunded ? "Payment refunded" : timedOut ? "Payment confirmation delayed" : "Verifying payment"}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold leading-tight">
              {paid ? productName ? `Welcome to ${productName}.` : "Welcome to your personalized journey." : cancelled ? "You cancelled checkout." : failed ? "Paystack confirmed that this payment failed." : expired ? "This checkout expired without payment confirmation." : reversed ? "This payment was reversed." : refunded ? "This payment was refunded." : timedOut ? "Your payment is still being reconciled." : "We are confirming your payment."}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {paid ? order?.next_steps || "Your verified production purchase is ready for the secure member handoff." : cancelled ? "No successful payment was confirmed, so this attempt is not counted as a purchase. You can return to the shop and choose another payment method." : failed ? "No fulfillment is triggered for a provider-confirmed failed payment." : expired ? "The confirmation window expired without proof of payment. This is not recorded as a provider-declined payment. Contact support if you believe you were charged." : reversed ? "Paystack reports a reversal; this is not counted as a successful purchase. Contact support if funds have not returned." : refunded ? "This payment was refunded and is not counted as current collected revenue." : timedOut ? "Do not pay again. Keep this reference; the production verification can be checked again safely." : "Paystack confirmation and order processing can take a few moments."}
            </p>
          </div>

          {reference && <div className="mt-5 rounded-2xl border border-border bg-background/30 px-4 py-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Payment reference</p><p className="mt-1 break-all font-mono text-xs">{reference}</p></div>}

          {cancelled && <a href="https://www.resofit.fit/shop" className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl gold-bg px-4 py-3 text-xs font-bold uppercase tracking-widest text-background">Return to shop and choose another method</a>}

          {paid && <div className="mt-5 space-y-3"><div className="rounded-2xl border border-gold/20 bg-gold/5 p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold">Verified experience</p><p className="mt-2 text-sm text-muted-foreground">{productName ? `Your onboarding will use the verified ${productName} purchase context.` : "Your onboarding will use the verified purchase context."}</p></div><Link to="/onboarding" className="flex w-full items-center justify-center rounded-xl gold-bg py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-background">Continue to onboarding</Link><Link to="/" className="flex w-full items-center justify-center rounded-xl border border-border py-3 text-xs font-medium text-muted-foreground">Open My Member Dashboard</Link></div>}

          {!paid && !terminal && !timedOut && <div className="mt-5 rounded-2xl border border-border bg-background/30 p-4 text-xs text-muted-foreground">{error ? "Verification is retrying automatically." : "Checking the verified production order state…"}</div>}
          {timedOut && !terminal && <div className="mt-5 space-y-3"><Link to="/payment/callback" search={{ reference }} className="flex w-full items-center justify-center rounded-xl gold-bg py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-background">Check payment status again</Link><Link to="/" className="flex w-full items-center justify-center rounded-xl border border-border py-3 text-xs font-medium text-muted-foreground">Return to ResoFit</Link></div>}

          <div className="mt-5 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground"><ShieldCheck size={12} className="text-gold" /><span>Secure payment · ResoFit</span></div>
        </section>
      </div>
    </main>
  );
}
