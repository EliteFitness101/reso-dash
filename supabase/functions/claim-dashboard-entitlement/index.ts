import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const token = auth.slice(7);
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user?.id || !user.email) return json({ error: "Unauthorized" }, 401);

  const email = user.email.trim().toLowerCase();

  const { data: payments, error } = await admin
    .from("payments")
    .select("id,rsid,paystack_ref,status,customer_email,plan_type,product_sku,funnel_origin,paid_at,reconciled")
    .eq("customer_email", email)
    .eq("status", "success")
    .eq("reconciled", true)
    .order("paid_at", { ascending: false })
    .limit(20);

  if (error) return json({ error: "Unable to verify purchase" }, 500);

  const experiences: Record<string, unknown>[] = [];

  for (const payment of payments ?? []) {
    const { error: entitlementError } = await admin
      .from("resofit_dashboard_entitlements")
      .upsert(
        {
          user_id: user.id,
          rsid: payment.rsid,
          role: "member",
          payment_reference: payment.paystack_ref,
          verified_at: new Date().toISOString(),
          revoked_at: null,
        },
        { onConflict: "user_id,payment_reference" },
      );
    if (entitlementError) return json({ error: "Unable to provision dashboard access" }, 500);

    let product = null;
    if (payment.product_sku) {
      const { data } = await admin
        .from("products")
        .select("sku,title,handle,product_type,tags")
        .eq("sku", payment.product_sku)
        .maybeSingle();
      product = data;
    }

    experiences.push({
      payment_reference: payment.paystack_ref,
      rsid: payment.rsid,
      product_sku: payment.product_sku,
      product_name: product?.title ?? payment.plan_type ?? null,
      product_handle: product?.handle ?? null,
      product_type: product?.product_type ?? null,
      product_tags: product?.tags ?? [],
      funnel_origin: payment.funnel_origin ?? null,
      paid_at: payment.paid_at,
      entitlement_status: "ACTIVE",
      entitlement_access: "active",
    });
  }

  const { data: states, error: stateError } = await admin
    .from("resofit_entitlement_states")
    .select("id,entitlement_key,source_product,status,access,start_at,end_at,grace_end_at,source_payment_reference,commerce_action_url,updated_at")
    .eq("user_id", user.id)
    .in("status", ["TRIAL", "ACTIVE", "GRACE"])
    .eq("access", "active")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (stateError) return json({ error: "Unable to verify entitlement state" }, 500);

  for (const state of states ?? []) {
    const syntheticReference = `ENTITLEMENT-${state.id}`;
    const { error: provisionError } = await admin
      .from("resofit_dashboard_entitlements")
      .upsert(
        {
          user_id: user.id,
          rsid: null,
          role: "member",
          payment_reference: syntheticReference,
          verified_at: new Date().toISOString(),
          revoked_at: null,
        },
        { onConflict: "user_id,payment_reference" },
      );
    if (provisionError) return json({ error: "Unable to provision entitlement access" }, 500);

    const { data: product } = await admin
      .from("products")
      .select("sku,title,handle,product_type,tags")
      .eq("sku", state.source_product)
      .maybeSingle();

    experiences.push({
      payment_reference: state.source_payment_reference,
      rsid: null,
      product_sku: state.source_product,
      product_name: product?.title ?? state.entitlement_key,
      product_handle: product?.handle ?? null,
      product_type: product?.product_type ?? null,
      product_tags: product?.tags ?? [],
      funnel_origin: "entitlement",
      paid_at: state.start_at,
      entitlement_status: state.status,
      entitlement_access: state.access,
      entitlement_id: state.id,
      end_at: state.end_at,
      grace_end_at: state.grace_end_at,
      commerce_action_url: state.commerce_action_url,
    });
  }

  return json({
    ok: true,
    entitled: experiences.length > 0,
    count: experiences.length,
    experience: experiences[0] ?? null,
    experiences,
  });
});
