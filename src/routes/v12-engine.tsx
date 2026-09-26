import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, Bot, CheckCircle2, CircleAlert, Database, ExternalLink, Gauge, Layers3, RefreshCw, Server, ShoppingCart, Sparkles, WalletCards, Workflow } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/v12-engine")({ component: V12EnginePage });

type Snapshot = {
  ok: boolean;
  generated_at: string;
  engine: { name: string; mode: string; model: string; media_policy: string };
  functions: { name: string; version: number; status: string; verify_jwt: boolean }[];
  automation: {
    jobs: { jobid: number; jobname: string; schedule: string; active: boolean }[];
    queue: { total: number; by_status: Record<string, number> };
    media: { total: number; approved: number; approved_buffer_only: number };
  };
  commerce: {
    products: { total: number; published: number };
    payments: { total: number; gross_ngn: number; net_ngn: number; statuses: Record<string, number> };
    referrals: { total: number; attributed_revenue_ngn: number; attribution_events: number };
    revenue_events: { total: number; recorded_revenue_ngn: number };
  };
  ecosystem: {
    verified_sources: number;
    sources: { theme: string; canonical_url: string; runtime_status: number; runtime_ok: boolean; verified_at: string }[];
    connectors: { name: string; status: string }[];
  };
  health: { database: string };
};

const money = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

function V12EnginePage() {
  const { session, loading: authLoading, isAdmin, isSuperAdmin, twoFactorVerified } = useAuth();
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    if (!supabase || !session) {
      setLoading(false);
      return;
    }
    const { data: result, error: fnError } = await supabase.functions.invoke("v12-engine-dashboard");
    if (fnError) setError(fnError.message);
    else setData(result as Snapshot);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [session?.access_token]);

  const overall = useMemo(() => {
    if (!data) return "CHECKING";
    const jobsOk = data.automation.jobs.filter((j) => j.active).length === data.automation.jobs.length;
    const mediaOk = data.automation.media.approved === data.automation.media.approved_buffer_only;
    const sourcesOk = data.ecosystem.verified_sources === data.ecosystem.sources.length;
    return data.health.database === "HEALTHY" && jobsOk && mediaOk && sourcesOk ? "OPERATIONAL" : "DEGRADED";
  }, [data]);

  if (authLoading) return <div className="min-h-screen bg-[#08090b] p-6 text-white">Authenticating V12 console…</div>;
  if (!session) return <Gate title="V12 Engine Console" body="Sign in to access the production control plane." />;
  if (!isAdmin && !isSuperAdmin) return <Gate title="Restricted control plane" body="Admin authorization is required." />;
  if (isAdmin && !isSuperAdmin && !twoFactorVerified) return <Gate title="MFA required" body="Complete the required second factor before opening production telemetry." />;

  return (
    <main className="min-h-screen bg-[#07080a] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live production control plane</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">ResoFit V12 Engine</h1>
            <p className="mt-1 max-w-3xl text-sm text-white/55">Content engine + revenue funnel + ChatB2K intelligence + ingest + workers + external integrations.</p>
          </div>
          <div className="flex flex-wrap gap-2"><a href="/digital-products" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">Digital Products Factory</a><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium hover:bg-white/[0.08]"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh telemetry</button></div>
        </header>

        {error && <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200"><CircleAlert className="mr-2 inline h-4 w-4" />{error}</div>}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Gauge} label="Engine state" value={overall} sub={data?.engine.mode ?? "loading"} good={overall === "OPERATIONAL"} />
          <Metric icon={Workflow} label="Automation jobs" value={String(data?.automation.jobs.filter(j => j.active).length ?? "—")} sub="active cron workers" good />
          <Metric icon={Bot} label="Edge functions" value={String(data?.functions.length ?? "—")} sub="registered production snapshot" good />
          <Metric icon={Database} label="Verified sources" value={String(data?.ecosystem.verified_sources ?? "—")} sub="runtime-verified registry" good />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <Panel title="Revenue funnel engine" icon={WalletCards}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Products" value={data ? `${data.commerce.products.published}/${data.commerce.products.total}` : "—"} />
              <Kpi label="Payments" value={data ? String(data.commerce.payments.total) : "—"} />
              <Kpi label="Gross collected" value={data ? money(data.commerce.payments.gross_ngn) : "—"} />
              <Kpi label="Net recorded" value={data ? money(data.commerce.payments.net_ngn) : "—"} />
              <Kpi label="Referrals" value={data ? String(data.commerce.referrals.total) : "—"} />
              <Kpi label="Attributed revenue" value={data ? money(data.commerce.referrals.attributed_revenue_ngn) : "—"} />
              <Kpi label="Attribution events" value={data ? String(data.commerce.referrals.attribution_events) : "—"} />
              <Kpi label="Revenue events" value={data ? String(data.commerce.revenue_events.total) : "—"} />
            </div>
          </Panel>

          <Panel title="Content engine" icon={Sparkles}>
            <div className="space-y-3">
              <StatusLine label="Queue total" value={data?.automation.queue.total} />
              <StatusLine label="Approved" value={data?.automation.queue.by_status.approved} good />
              <StatusLine label="Scheduled" value={data?.automation.queue.by_status.scheduled} good />
              <StatusLine label="Failed / legacy migration" value={data?.automation.queue.by_status.failed} warn />
              <StatusLine label="Approved Buffer media" value={data ? `${data.automation.media.approved_buffer_only}/${data.automation.media.approved}` : undefined} good />
            </div>
          </Panel>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.4fr]">
          <Panel title="Automation workers" icon={Activity}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-white/35"><tr><th className="pb-3">Worker</th><th className="pb-3">Schedule</th><th className="pb-3">State</th></tr></thead>
                <tbody>{(data?.automation.jobs ?? []).map(j => <tr key={j.jobid} className="border-t border-white/5"><td className="py-3 font-medium">{j.jobname}</td><td className="py-3 font-mono text-xs text-white/55">{j.schedule}</td><td className="py-3"><Badge good={j.active}>{j.active ? "ACTIVE" : "OFF"}</Badge></td></tr>)}</tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Edge-function fleet" icon={Server}>
            <div className="grid max-h-[440px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {(data?.functions ?? []).map(f => <div key={f.name} className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.025] px-3 py-2.5"><div className="min-w-0"><div className="truncate text-sm font-medium">{f.name}</div><div className="text-[11px] text-white/35">v{f.version} · JWT {f.verify_jwt ? "on" : "custom/public"}</div></div><Badge good={f.status === "ACTIVE"}>{f.status}</Badge></div>)}
            </div>
          </Panel>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <Panel title="External + internal connectors" icon={Layers3}>
            <div className="grid gap-2 sm:grid-cols-2">{(data?.ecosystem.connectors ?? []).map(c => <div key={c.name} className="flex items-center justify-between rounded-xl border border-white/7 px-3 py-3"><span>{c.name}</span><Badge good>{c.status}</Badge></div>)}</div>
          </Panel>
          <Panel title="Runtime-verified ecosystem sources" icon={CheckCircle2}>
            <div className="space-y-2">{(data?.ecosystem.sources ?? []).map(s => <div key={s.theme + s.canonical_url} className="flex items-center justify-between gap-3 rounded-xl border border-white/7 px-3 py-2.5"><div className="min-w-0"><div className="text-xs font-semibold">{s.theme}</div><div className="truncate text-[11px] text-white/35">{s.canonical_url}</div></div><Badge good={s.runtime_ok}>{s.runtime_status}</Badge></div>)}</div>
          </Panel>
        </section>

        <footer className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>ResoFlex™ — Powered by Resonance Fitness · V12 production telemetry</span>
          <span>{data ? `Snapshot ${new Date(data.generated_at).toLocaleString("en-NG")}` : "No snapshot"}</span>
        </footer>
      </div>
    </main>
  );
}

function Gate({ title, body }: { title: string; body: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#07080a] px-5 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-7"><div className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">ResoFit V12</div><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-white/55">{body}</p><a href="/today" className="mt-6 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Open dashboard</a></div></main>;
}

function Metric({ icon: Icon, label, value, sub, good }: { icon: typeof Activity; label: string; value: string; sub: string; good?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between"><span className="text-xs text-white/45">{label}</span><Icon className="h-4 w-4 text-white/35" /></div><div className="mt-3 text-xl font-semibold">{value}</div><div className={`mt-1 text-[11px] ${good ? "text-emerald-300/70" : "text-white/35"}`}>{sub}</div></div>;
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><Icon className="h-4 w-4 text-emerald-400" /><h2 className="text-sm font-semibold">{title}</h2></div>{children}</section>;
}

function Kpi({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-black/20 p-3"><div className="text-[11px] text-white/35">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>; }
function StatusLine({ label, value, good, warn }: { label: string; value?: number | string; good?: boolean; warn?: boolean }) { return <div className="flex items-center justify-between border-b border-white/5 pb-2 text-sm last:border-0 last:pb-0"><span className="text-white/55">{label}</span><span className={warn ? "text-amber-300" : good ? "text-emerald-300" : "text-white"}>{value ?? "—"}</span></div>; }
function Badge({ children, good }: { children: React.ReactNode; good?: boolean }) { return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide ${good ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{children}</span>; }
