import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/payment/callback")({ component: PaymentCallbackPage });

type OrderView = { status?: "pending" | "paid" | "failed" | "cancelled" | "refunded" | "expired"; reference?: string; amount?: number; currency?: string; paid_at?: string | null; fulfillment_status?: string; next_steps?: string | null; product_sku?: string | null; product_name?: string | null; funnel_origin?: string | null; };
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function PaymentCallbackPage() {
  const search = Route.useSearch() as { reference?: string };
  const reference = search.reference?.trim() || "";
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference || !SUPABASE_URL || !SUPABASE_KEY) return;
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;
    const poll = async () => {
      try {
        const url = new URL(`${SUPABASE_URL}/functions/v1/verify-order`);
        url.searchParams.set("reference", reference);
        const response = await fetch(url.toString(), { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
        if (!response.ok) throw new Error(`verify_${response.status}`);
        const payload = (await response.json()) as OrderView;
        if (cancelled) return;
        setOrder(payload); setError(null);
        if (payload.status === "paid") {
          window.sessionStorage.setItem("resofit_verified_experience", JSON.stringify({ payment_reference: payload.reference, product_sku: payload.product_sku, product_name: payload.product_name, funnel_origin: payload.funnel_origin, paid_at: payload.paid_at }));
          return;
        }
        if (["failed", "cancelled", "refunded", "expired"].includes(payload.status ?? "")) return;
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "verification_failed"); }
      if (!cancelled && attempts++ < 8) timer = window.setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [reference]);

  const status = order?.status ?? "pending";
  const paid = status === "paid";
  const failed = ["failed", "cancelled", "refunded", "expired"].includes(status);
  const productName = order?.product_name?.trim();

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground"><div className="mx-auto flex min-h-[78vh] max-w-md items-center justify-center"><section className="glass-card-gold w-full rounded-3xl p-6 shadow-2xl"><div className="text-center">
      {paid ? <CheckCircle2 className="mx-auto h-14 w-14 text-gold" aria-hidden="true" /> : failed ? <XCircle className="mx-auto h-14 w-14 text-destructive" aria-hidden="true" /> : <Clock3 className="mx-auto h-14 w-14 text-gold" aria-hidden="true" />}
      <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{paid ? "Payment verified · ResoFit" : failed ? "Payment status" : "Verifying payment"}</p>
      <h1 className="mt-2 font-display text-2xl font-semibold leading-tight">{paid ? productName ? `Welcome to ${productName}.` : "Welcome to your personalized journey." : failed ? "We could not confirm this payment." : "We are confirming your payment."}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{paid ? "Your verified production purchase is ready for the secure member handoff." : failed ? "No fulfillment action is being assumed until the production payment state is confirmed." : "Paystack confirmation and order processing can take a few moments."}</p>
    </div>
    {reference && <div className="mt-5 rounded-2xl border border-border bg-background/30 px-4 py-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Payment reference</p><p className="mt-1 break-all font-mono text-xs">{reference}</p></div>}
    {paid && <div className="mt-5 space-y-3"><div className="rounded-2xl border border-gold/20 bg-gold/5 p-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold">Verified experience</p><p className="mt-2 text-sm text-muted-foreground">{productName ? `Your onboarding will use the verified ${productName} purchase context.` : "Your onboarding will use the verified purchase context."}</p></div><Link to="/onboarding" className="flex w-full items-center justify-center rounded-xl gold-bg py-4 font-display text-sm font-bold uppercase tracking-[0.18em] text-background">Continue to onboarding</Link><Link to="/" className="flex w-full items-center justify-center rounded-xl border border-border py-3 text-xs font-medium text-muted-foreground">Open My Member Dashboard</Link></div>}
    {!paid && !failed && <div className="mt-5 rounded-2xl border border-border bg-background/30 p-4 text-xs text-muted-foreground">{error ? "Verification is retrying automatically." : "Checking the verified production order state…"}</div>}
    <div className="mt-5 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground"><ShieldCheck size={12} className="text-gold" /><span>Secure payment · ResoFit</span></div>
    </section></div></main>
  );
}
