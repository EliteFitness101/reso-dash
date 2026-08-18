// Canonical ResoFit Paystack client adapter.
// Payment authority remains in the canonical Supabase Edge Functions.

export const PAYSTACK_PUBLIC_KEY = "pk_live_canonical_server_side";
export const PAYSTACK_INIT_URL =
  "https://vbqjvmnhdtdhmeeudqnn.supabase.co/functions/v1/paystack-init";
export const CALLBACK_URL = "https://dashboard.resofit.fit/payment/callback";

export interface PaystackTx {
  reference: string;
  rsid: string;
  amount: number;
  currency: "NGN";
  email: string;
  product: string;
  productId: string;
  status: "success" | "pending" | "failed";
  paidAt: string;
  channel: "card" | "bank" | "ussd";
  authorization_url?: string;
}

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

export async function initTransaction(input: {
  email: string;
  amount: number;
  product: string;
  productId: string;
  name?: string;
  phone?: string;
}): Promise<PaystackTx> {
  const response = await fetch(PAYSTACK_INIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      product: input.product,
      productId: input.productId,
      name: input.name,
      phone: input.phone,
      rsid: getOrCreateRSID(input.email),
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.status || !body?.data?.authorization_url) {
    throw new Error(body?.error ?? body?.message ?? `Paystack initialization failed (${response.status})`);
  }

  const reference = body.data.reference;
  return {
    reference,
    rsid: body.data.rsid ?? getOrCreateRSID(input.email),
    amount: input.amount,
    currency: "NGN",
    email: input.email,
    product: input.product,
    productId: input.productId,
    status: "pending",
    paidAt: new Date().toISOString(),
    channel: "card",
    authorization_url: body.data.authorization_url,
  };
}

export function buildCallbackUrl(tx: Pick<PaystackTx, "reference">): string {
  const u = new URL(CALLBACK_URL);
  u.searchParams.set("reference", tx.reference);
  return u.toString();
}

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}
