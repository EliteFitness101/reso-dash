import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { initTransaction, formatNaira, PAYSTACK_PUBLIC_KEY } from "@/lib/paystack-sim";
import { starterProduct } from "@/lib/plan-generator";
import { useProfileStore } from "@/lib/profile-store";

export const Route = createFileRoute("/_shell/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const nav = useNavigate();
  const { upsert } = useProfileStore();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState("4084 0840 8408 4081");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setError(null);
    if (!email.includes("@") || name.trim().length < 2) {
      setError("Enter your full name and a valid email.");
      return;
    }
    setLoading(true);
    try {
      const tx = await initTransaction({
        email,
        amount: starterProduct.amount,
        product: starterProduct.name,
        productId: starterProduct.id,
      });
      upsert({
        rsid: tx.rsid,
        reference: tx.reference,
        createdAt: tx.paidAt,
        amountPaid: tx.amount,
        product: tx.product,
        upsells: [],
      });
      nav({ to: "/onboarding", search: { ref: tx.reference } as never });
    } catch (e) {
      setError("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Secure Checkout · Paystack
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">
          Activate your <span className="gold-text">ResoFlex OS</span>
        </h1>
      </header>

      <article className="glass-card-gold rounded-2xl p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gold">Plan</p>
            <h2 className="mt-0.5 font-display text-base font-semibold">
              {starterProduct.name}
            </h2>
          </div>
          <span className="font-display text-xl font-bold tabular gold-text">
            {formatNaira(starterProduct.amount)}
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <li>· Macro engine</li>
          <li>· Training matrix</li>
          <li>· Biometric log</li>
          <li>· Auto-tuned plan</li>
        </ul>
      </article>

      <section className="glass-card rounded-2xl p-4 space-y-3">
        <Field label="Full name" value={name} onChange={setName} placeholder="Maria Okafor" />
        <Field label="Email" value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
        <Field label="Phone" value={phone} onChange={setPhone} placeholder="+234…" type="tel" />
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Card number
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-3">
            <CreditCard size={16} className="text-muted-foreground" />
            <input
              value={card}
              onChange={(e) => setCard(e.target.value)}
              className="flex-1 bg-transparent text-sm tabular outline-none placeholder:text-muted-foreground"
              inputMode="numeric"
            />
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              TEST
            </span>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          onClick={pay}
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gold-bg py-4 font-display text-sm font-bold uppercase tracking-[0.2em] active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <Lock size={16} strokeWidth={2.5} />
          {loading ? "Authorizing…" : `Pay ${formatNaira(starterProduct.amount)}`}
        </button>

        <div className="flex items-center justify-center gap-2 pt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          <ShieldCheck size={12} className="text-gold" />
          <span>Paystack · {PAYSTACK_PUBLIC_KEY.slice(0, 14)}…</span>
        </div>
      </section>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border bg-background/40 px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-gold/60"
      />
    </div>
  );
}
