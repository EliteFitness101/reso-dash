import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bot, CheckCircle2, CircleDollarSign, ClipboardList, RefreshCw, ShieldCheck, Target, Users, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/ceo-growtj")({ component: CEOGrowthPage });

type Counts = {
  leads: number; checkouts: number; paid: number; revenue: number;
  content: number; approvedContent: number; queued: number; published: number;
  applications: number; members: number; strategies: number; actions: number;
};

const NGN = (n: number) => new Intl.NumberFormat("en-NG", {
  style: "currency", currency: "NGN", maximumFractionDigits: 0,
}).format(n);

async function countRows(table: string, filters?: (q: any) => any) {
  if (!supabase) return 0;
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filters) q = filters(q);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function loadSnapshot(): Promise<Counts> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const [
    leads, checkouts, paid, content, approvedContent, queued, published,
    applications, members, strategies, actions
  ] = await Promise.all([
    countRows("resofit_events", q => q.in("event_type", ["lead", "lead_created", "assessment_submitted"])),
    countRows("conversion_events", q => q.in("event_type", ["checkout", "checkout_started", "initiate_checkout"])),
    countRows("payments", q => q.eq("status", "success")),
    countRows("content_asset_registry"),
    countRows("content_asset_registry", q => q.eq("qa_status", "approved")),
    countRows("content_queue"),
    countRows("content_queue", q => q.in("status", ["published", "posted"])),
    countRows("elite_host_applications"),
    countRows("member_states"),
    countRows("ceo_growth_strategy", q => q.eq("status", "active")),
    countRows("ceo_growth_actions", q => q.in("status", ["queued", "ready", "running"])),
  ]);

  const { data: payments, error } = await supabase
    .from("payments").select("amount").eq("status", "success");
  if (error) throw error;
  const revenue = (payments ?? []).reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);

  return { leads, checkouts, paid, revenue, content, approvedContent, queued, published, applications, members, strategies, actions };
}

function Gate({ title, body }: { title: string; body: string }) {
  return <main className="min-h-screen bg-[#07080a] text-white grid place-items-center p-6">
    <section className="glass-card max-w-lg rounded-3xl p-8 text-center">
      <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-[#D4AF37]" />
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-white/55">{body}</p>
    </section>
  </main>;
}

function Metric({ icon: Icon, label, value, sub, warn = false }: any) {
  return <div className="glass-card rounded-2xl p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</span>
      <Icon className={`h-4 w-4 ${warn ? "text-amber-300" : "text-[#D4AF37]"}`} />
    </div>
    <div className="mt-2 text-2xl font-semibold tabular">{value}</div>
    <div className="mt-1 text-xs text-white/45">{sub}</div>
  </div>;
}

function Panel({ title, icon: Icon, children }: any) {
  return <section className="glass-card rounded-3xl p-5">
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#D4AF37]" />
      <h2 className="font-semibold">{title}</h2>
    </div>
    {children}
  </section>;
}

function CEOGrowthPage() {
  const { session, loading: authLoading, isAdmin, isSuperAdmin, twoFactorVerified } = useAuth();
  const [data, setData] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError("");
    try { setData(await loadSnapshot()); }
    catch (e: any) { setError(e?.message ?? "Production telemetry could not be loaded."); }
    finally { setLoading(false); }
  }, [session?.access_token]);

  useEffect(() => { void load(); }, [load]);

  const target = 1_000_000;
  const remaining = Math.max(target - (data?.revenue ?? 0), 0);
  const conversion = useMemo(() => {
    if (!data?.leads) return "—";
    return `${((data.paid / data.leads) * 100).toFixed(1)}%`;
  }, [data]);

  if (authLoading) return <Gate title="CEO Growth Autopilot" body="Authenticating production access…" />;
  if (!session) return <Gate title="CEO Growth Autopilot" body="Sign in to access the production growth cockpit." />;
  if (!isAdmin && !isSuperAdmin) return <Gate title="Restricted growth cockpit" body="Admin authorization is required." />;
  if (isAdmin && !isSuperAdmin && !twoFactorVerified) return <Gate title="MFA required" body="Complete the required second factor before opening production telemetry." />;

  return <main className="min-h-screen bg-[#07080a] text-white">
    <div className="grid-backdrop pointer-events-none fixed inset-0 opacity-40" />
    <div className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live CEO growth autopilot</div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Commercial Growth Command</h1>
          <p className="mt-1 max-w-3xl text-sm text-white/55">Observe → create → recruit → sell → onboard → retain → learn. Production evidence only.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium hover:bg-white/[0.08] disabled:opacity-50">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh
        </button>
      </header>

      {error && <div className="mb-5 flex gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Target} label="Commercial target" value={NGN(target)} sub={`Verified remaining: ${NGN(remaining)}`} />
        <Metric icon={CircleDollarSign} label="Verified collected" value={NGN(data?.revenue ?? 0)} sub="Successful canonical payments" />
        <Metric icon={Users} label="Paid customers" value={data?.paid ?? "—"} sub={`Lead → paid: ${conversion}`} />
        <Metric icon={Zap} label="Next actions" value={data?.actions ?? "—"} sub="Queued / ready / running" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Commercial funnel" icon={Activity}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={ClipboardList} label="Leads" value={data?.leads ?? "—"} sub="Canonical events" />
            <Metric icon={CircleDollarSign} label="Checkout" value={data?.checkouts ?? "—"} sub="Conversion events" />
            <Metric icon={Users} label="Paid" value={data?.paid ?? "—"} sub="Payment success" />
            <Metric icon={CircleDollarSign} label="Cash" value={NGN(data?.revenue ?? 0)} sub="Customer charge value" />
          </div>
        </Panel>

        <Panel title="Content + acquisition" icon={Bot}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={ClipboardList} label="Assets" value={data?.content ?? "—"} sub={`${data?.approvedContent ?? "—"} QA approved`} />
            <Metric icon={Activity} label="Queue" value={data?.queued ?? "—"} sub="Content opportunities" />
            <Metric icon={CheckCircle2} label="Published" value={data?.published ?? "—"} sub="Recorded queue state" />
            <Metric icon={Users} label="Applications" value={data?.applications ?? "—"} sub="BIGO host intake" />
          </div>
        </Panel>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Panel title="Autopilot operating state" icon={Bot}>
          <div className="space-y-3 text-sm">
            {[
              ["Observe events", "Canonical event/revenue telemetry", true],
              ["Create next content", "Content registry + queue + QA gate", Boolean(data?.content)],
              ["Recruit next person", "BIGO application event bridge", Boolean(data?.applications)],
              ["Sell next product", "Checkout + payment truth", Boolean(data?.paid || data?.checkouts)],
              ["Onboard next member", "Canonical member state", Boolean(data?.members)],
              ["Learn what worked", "Growth strategy/action matrix", Boolean(data?.strategies)],
            ].map(([a,b,ok]) => <div key={String(a)} className="flex items-center justify-between gap-4 rounded-xl border border-white/7 bg-white/[0.02] p-3">
              <div><div className="font-medium">{a}</div><div className="text-xs text-white/40">{b}</div></div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${ok ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{ok ? "LIVE DATA" : "NO EVIDENCE"}</span>
            </div>)}
          </div>
        </Panel>

        <Panel title="Growth strategy matrix" icon={Target}>
          <div className="space-y-3">
            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">Regions</div>
              <div className="mt-2 text-sm text-white/70">South-East · South-South · South-West · North/Abuja · Africa · Global</div>
            </div>
            <div className="rounded-xl border border-white/7 bg-white/[0.02] p-4">
              <div className="text-sm font-medium">{data?.strategies ?? "—"} active strategies</div>
              <div className="mt-1 text-xs text-white/45">{data?.actions ?? "—"} actionable items currently queued/ready/running.</div>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-white/7 p-4 text-xs text-white/50">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              Recurring revenue is only surfaced when an actual commerce plan/eligibility path is verified. No invented pricing or entitlements.
            </div>
          </div>
        </Panel>
      </section>

      <footer className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/35">
        <span>Canonical: resofit.fit</span><span>•</span><span>Production Supabase telemetry</span><span>•</span><span>Safety / payment / entitlement gates preserved</span>
      </footer>
    </div>
  </main>;
}
