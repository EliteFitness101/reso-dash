import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowUpRight, Bot, CheckCircle2, CircleDollarSign, Film, GitBranch, Megaphone, RefreshCw, ShieldCheck, Users, UserPlus, WalletCards, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AccessGate } from "@/components/AccessGate";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/ceo-growth")({ component: CEOGrowthRoute });

type Snapshot = {
  revenue30d: number;
  revenueToday: number;
  payments30d: number;
  subscribers: number;
  members: number;
  activeHosts: number;
  highlightsToday: number;
  assetsToday: number;
  queuedToday: number;
  publishedToday: number;
  blockedToday: number;
  failedCaptures: number;
  queuedItems: number;
};

const TARGET = 1_000_000;

function CEOGrowthRoute() {
  return (
    <AccessGate>
      <CEODashboard />
    </AccessGate>
  );
}

function CEODashboard() {
  const { isSuperAdmin, twoFactorVerified } = useAuth();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    try {
      const [payments, subscribers, profiles, sources, highlights, assets, queue, captureJobs] = await Promise.all([
        supabase.from("payments").select("gross_amount,status,paid_at,created_at").gte("created_at", thirtyDaysAgo.toISOString()).limit(5000),
        supabase.from("resoflex_subscribers").select("id,payment_status").limit(5000),
        supabase.from("profiles").select("id").limit(5000),
        supabase.from("bigo_sources").select("id,active,capture_enabled").eq("active", true).eq("capture_enabled", true).limit(5000),
        supabase.from("resofit_live_highlights").select("id,status,created_at").gte("created_at", todayStart.toISOString()).limit(5000),
        supabase.from("content_asset_registry").select("id,qa_status,created_at").gte("created_at", todayStart.toISOString()).limit(5000),
        supabase.from("content_queue").select("id,status,created_at,published_at,safety_checked").limit(5000),
        supabase.from("bigo_capture_jobs").select("id,status,error_message,created_at").gte("created_at", todayStart.toISOString()).limit(5000),
      ]);

      const firstError = [payments, subscribers, profiles, sources, highlights, assets, queue, captureJobs].find((r) => r.error)?.error;
      if (firstError) throw firstError;

      const paid = (payments.data ?? []).filter((p) => ["success", "paid", "completed"].includes(String(p.status ?? "").toLowerCase()));
      const revenue30d = paid.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0);
      const revenueToday = paid
        .filter((p) => new Date(p.paid_at ?? p.created_at ?? 0) >= todayStart)
        .reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0);
      const queueRows = queue.data ?? [];
      const publishedToday = queueRows.filter((q) => q.published_at && new Date(q.published_at) >= todayStart).length;
      const blockedToday = (assets.data ?? []).filter((a) => ["blocked", "rejected", "quarantined", "hold"].includes(String(a.qa_status ?? "").toLowerCase())).length;
      const failedCaptures = (captureJobs.data ?? []).filter((j) => ["failed", "error"].includes(String(j.status ?? "").toLowerCase())).length;

      setSnapshot({
        revenue30d,
        revenueToday,
        payments30d: paid.length,
        subscribers: (subscribers.data ?? []).filter((s) => ["paid", "active", "success", "completed"].includes(String(s.payment_status ?? "").toLowerCase())).length,
        members: (profiles.data ?? []).length,
        activeHosts: (sources.data ?? []).length,
        highlightsToday: (highlights.data ?? []).length,
        assetsToday: (assets.data ?? []).length,
        queuedToday: queueRows.filter((q) => new Date(q.created_at) >= todayStart).length,
        publishedToday,
        blockedToday,
        failedCaptures,
        queuedItems: queueRows.filter((q) => ["queued", "pending", "scheduled"].includes(String(q.status ?? "").toLowerCase())).length,
      });
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Live production data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const targetProgress = Math.min(100, ((snapshot?.revenue30d ?? 0) / TARGET) * 100);
  const health = useMemo(() => {
    if (!snapshot) return { label: "SYNCING", tone: "muted" as const };
    if (snapshot.failedCaptures > 0) return { label: "EXCEPTION", tone: "red" as const };
    if (snapshot.blockedToday > 0) return { label: "GUARDED", tone: "gold" as const };
    return { label: "OPERATING", tone: "green" as const };
  }, [snapshot]);

  if (!isSuperAdmin || !twoFactorVerified) {
    return (
      <div className="min-h-dvh bg-background px-4 py-8 text-foreground">
        <div className="mx-auto max-w-xl glass-card-gold rounded-3xl p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">CEO Growth Autopilot</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Privileged control surface</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">This dashboard requires the CEO control role and verified MFA. No operational controls are exposed until both conditions are satisfied.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="glass-card-gold rounded-3xl p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-gold"><Bot size={15} /><p className="text-[10px] font-semibold uppercase tracking-[0.32em]">ResoFit · CEO Growth Autopilot</p></div>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Daily Growth Command</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Observe → decide → create → recruit → convert → onboard → report → learn → repeat.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={"rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest " + (health.tone === "green" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : health.tone === "red" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-gold/30 bg-gold/10 text-gold")}><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />{health.label}</span>
              <button type="button" onClick={() => void load()} disabled={refreshing} className="rounded-xl border border-border bg-card/60 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-gold disabled:opacity-50"><RefreshCw size={13} className={refreshing ? "mr-1.5 inline animate-spin" : "mr-1.5 inline"} />Refresh</button>
            </div>
          </div>
        </header>

        {loading && <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-xs text-gold">Loading live production metrics…</div>}
        {error && <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-200"><AlertTriangle size={14} className="mr-2 inline" />Live data warning: {error}</div>}

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<CircleDollarSign size={17} />} label="Verified revenue · 30d" value={naira(snapshot?.revenue30d ?? 0)} accent />
          <MetricCard icon={<WalletCards size={17} />} label="Paid transactions · 30d" value={String(snapshot?.payments30d ?? 0)} />
          <MetricCard icon={<UserPlus size={17} />} label="Active BIGO sources" value={String(snapshot?.activeHosts ?? 0)} />
          <MetricCard icon={<Users size={17} />} label="Members / profiles" value={String(snapshot?.members ?? 0)} />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
          <div className="glass-card rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Commercial objective</p><h2 className="mt-1 font-display text-xl font-semibold">₦1,000,000 collection target</h2></div>
              <span className="font-mono text-xs text-gold">{targetProgress.toFixed(1)}%</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-900"><div className="h-full rounded-full bg-gold transition-all" style={{ width: targetProgress + "%" }} /></div>
            <div className="mt-3 flex justify-between text-xs"><span className="text-muted-foreground">Verified 30d: {naira(snapshot?.revenue30d ?? 0)}</span><span className="text-muted-foreground">Target: ₦1,000,000</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><Mini label="Today" value={naira(snapshot?.revenueToday ?? 0)} /><Mini label="Paid" value={String(snapshot?.payments30d ?? 0)} /><Mini label="Subscribers" value={String(snapshot?.subscribers ?? 0)} /></div>
          </div>
          <div className="glass-card rounded-3xl p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Autopilot state</p>
            <div className="mt-4 space-y-3">
              <StateRow icon={<Activity size={14} />} label="Observe events" state="LIVE" />
              <StateRow icon={<Film size={14} />} label="Create next content" state="LIVE" />
              <StateRow icon={<UserPlus size={14} />} label="Recruit next host" state="LIVE" />
              <StateRow icon={<Megaphone size={14} />} label="Convert / publish" state="GATED" />
              <StateRow icon={<ShieldCheck size={14} />} label="Safety + financial gates" state="HARD GATE" />
              <StateRow icon={<GitBranch size={14} />} label="Learn + repeat" state="LIVE" />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Film size={17} />} label="BIGO highlights today" value={String(snapshot?.highlightsToday ?? 0)} />
          <MetricCard icon={<Zap size={17} />} label="Assets enriched today" value={String(snapshot?.assetsToday ?? 0)} />
          <MetricCard icon={<ArrowUpRight size={17} />} label="Published today" value={String(snapshot?.publishedToday ?? 0)} />
          <MetricCard icon={<ShieldCheck size={17} />} label="Safety holds today" value={String(snapshot?.blockedToday ?? 0)} />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <ActionLane title="CREATE NEXT" icon={<Film size={16} />} items={[["New highlights", String(snapshot?.highlightsToday ?? 0)], ["Enriched assets", String(snapshot?.assetsToday ?? 0)], ["Queue backlog", String(snapshot?.queuedItems ?? 0)]]} />
          <ActionLane title="RECRUIT NEXT" icon={<UserPlus size={16} />} items={[["Active capture sources", String(snapshot?.activeHosts ?? 0)], ["Daily host objective", "1+ qualified"], ["Conversion", "Application → active host"]]} />
          <ActionLane title="CONVERT NEXT" icon={<CircleDollarSign size={16} />} items={[["Revenue today", naira(snapshot?.revenueToday ?? 0)], ["Paid transactions", String(snapshot?.payments30d ?? 0)], ["Subscription records", String(snapshot?.subscribers ?? 0)]]} />
        </section>

        <section className="mt-5 glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Exception control</p><h2 className="mt-1 font-display text-xl font-semibold">What needs CEO attention?</h2></div>
            <span className="text-[10px] font-mono text-muted-foreground">{lastUpdated ? "Synced " + lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Syncing…"}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Exception label="Capture failures today" value={snapshot?.failedCaptures ?? 0} critical={Boolean(snapshot?.failedCaptures)} />
            <Exception label="Safety holds today" value={snapshot?.blockedToday ?? 0} critical={false} />
            <Exception label="Queued / pending" value={snapshot?.queuedItems ?? 0} critical={false} />
          </div>
          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">Evidence-first: a hold or unavailable signal is displayed as a hold, not converted into a false success.</p>
        </section>

        <footer className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-[9px] font-mono uppercase tracking-wider text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Reso-Dash · CEO growth control surface</span>
          <span>Production source: resonance-fitness · no secrets exposed</span>
        </footer>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, accent = false }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return <div className={"rounded-2xl border p-4 " + (accent ? "border-gold/25 bg-gold/5" : "border-border bg-card/50")}><div className="flex items-center gap-2 text-gold">{icon}<span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</span></div><p className="mt-3 font-display text-2xl font-semibold tabular">{value}</p></div>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background/30 p-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 font-mono text-sm font-bold tabular">{value}</p></div>;
}

function StateRow({ icon, label, state }: { icon: React.ReactNode; label: string; state: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/30 px-3 py-2.5"><span className="flex items-center gap-2 text-xs">{icon}{label}</span><span className="text-[9px] font-bold uppercase tracking-widest text-gold">{state}</span></div>;
}

function ActionLane({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[][] }) {
  return <div className="glass-card rounded-3xl p-5"><div className="flex items-center gap-2 text-gold"><span>{icon}</span><p className="text-[10px] font-bold uppercase tracking-[0.25em]">{title}</p></div><div className="mt-4 space-y-2">{items.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-border/70 pb-2 text-xs last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className="font-mono text-right text-[10px] text-white">{value}</span></div>)}</div></div>;
}

function Exception({ label, value, critical }: { label: string; value: number; critical: boolean }) {
  return <div className={"rounded-2xl border p-4 " + (critical ? "border-red-500/30 bg-red-500/5" : "border-border bg-background/30")}><div className={"flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest " + (critical ? "text-red-300" : "text-muted-foreground")}>{critical ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}{label}</div><p className="mt-2 font-display text-xl font-semibold tabular">{value}</p></div>;
}

function naira(value: number) {
  return "₦" + Math.round(value).toLocaleString("en-NG");
}
