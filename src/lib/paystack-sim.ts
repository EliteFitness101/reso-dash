// Frontend-only Paystack simulation. No real charges, no network.
// Mirrors the shape of Paystack init → redirect → verify → webhook callback
// so the wiring can be swapped to a real backend later without UI changes.

export const PAYSTACK_PUBLIC_KEY = "pk_test_resoflex_simulated_xxxxxxxxxxxxxx";
export const CALLBACK_URL = "https://joy-funnel-ai.lovable.app/status";

export interface PaystackTx {
  reference: string;
  rsid: string; // ResoFlex Subscriber ID
  amount: number; // in kobo
  currency: "NGN";
  email: string;
  product: string;
  productId: string;
  status: "success" | "pending" | "failed";
  paidAt: string;
  channel: "card" | "bank" | "ussd";
}

const TX_KEY = "resoflex.tx.log.v1";
const RSID_KEY = "resoflex.rsid.v1";

export function getOrCreateRSID(email: string): string {
  try {
    const existing = localStorage.getItem(RSID_KEY);
    if (existing) return existing;
    const seed = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "USER";
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const rsid = `RSID-${seed}-${rand}`;
    localStorage.setItem(RSID_KEY, rsid);
    return rsid;
  } catch {
    return `RSID-TMP-${Date.now().toString(36).toUpperCase()}`;
  }
}

export function newReference(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PSK_${ts}_${rnd}`;
}

export function recordTx(tx: PaystackTx) {
  try {
    const raw = localStorage.getItem(TX_KEY);
    const log: PaystackTx[] = raw ? JSON.parse(raw) : [];
    log.unshift(tx);
    localStorage.setItem(TX_KEY, JSON.stringify(log.slice(0, 50)));
  } catch {}
}

export function getTxLog(): PaystackTx[] {
  try {
    const raw = localStorage.getItem(TX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Simulated init → returns an authorization "URL" we'd normally redirect to.
// In simulation, we resolve in-place after a short delay (network feel).
export async function initTransaction(input: {
  email: string;
  amount: number; // kobo
  product: string;
  productId: string;
}): Promise<PaystackTx> {
  const reference = newReference();
  const rsid = getOrCreateRSID(input.email);
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 850));
  const tx: PaystackTx = {
    reference,
    rsid,
    amount: input.amount,
    currency: "NGN",
    email: input.email,
    product: input.product,
    productId: input.productId,
    status: "success",
    paidAt: new Date().toISOString(),
    channel: "card",
  };
  recordTx(tx);
  // Simulated webhook fan-out (would POST to /api/public/paystack-webhook)
  try {
    window.dispatchEvent(new CustomEvent("paystack:webhook", { detail: tx }));
  } catch {}
  return tx;
}

export function buildCallbackUrl(tx: PaystackTx): string {
  const u = new URL(CALLBACK_URL);
  u.searchParams.set("reference", tx.reference);
  u.searchParams.set("rsid", tx.rsid);
  u.searchParams.set("amount", String(tx.amount));
  u.searchParams.set("currency", tx.currency);
  u.searchParams.set("product", tx.productId);
  u.searchParams.set("status", tx.status);
  return u.toString();
}

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}
