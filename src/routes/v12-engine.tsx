import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, Bot, Cable, CheckCircle2, CircleAlert, Cloud, Cpu, Database, ExternalLink, FileInput, Gauge, Globe2, Layers3, Linkedin, Network, RefreshCw, ShieldAlert, ShieldCheck, Sparkles, Terminal, Workflow, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/v12-engine")({ component: V12EnginePage });

type EngineRow = {
  engine_key: string; engine_name: string; version: string; domain: string; control_plane: string;
  status: string; kill_switch_enabled: boolean; last_heartbeat_at: string | null; last_run_at: string | null;
  evidence_count: number; health_score: number; evidence: Record<string, unknown>; updated_at: string;
};
type Destination = {
  provider: string; platform: string; display_name: string; external_channel_id: string; active: boolean;
  daily_limit: number; last_verified_at: string | null; capabilities: Record<string, boolean>; queue_paused: boolean;
};
type Snapshot = {
  ok: boolean; generated_at: string; engine: string;
  orchestration: { control_identity: string; swarm_population: number; swarm_enabled: number; swarm_killed: number; nodes: number; nodes_killed: number; global_kill: boolean; global_kill_reason: string | null };
  engines: EngineRow[];
  revenue: { daily: Record<string, unknown>[]; today: Record<string, unknown> | null };
  operating_evidence: { content_queue: number; growth_rows: number; security_events: number; recruitment_candidates: number; training_assignments: number; certificates: number; learning_events: number };
  gate: Record<string, boolean>;
  social: { total_destinations: number; active_destinations: number; verified_destinations: number; by_platform: { platform: string; total: number; active: number; verified: number }[]; destinations: Destination[]; last_sync: { created_at: string; payload: Record<string, unknown> } | null; query_ok: boolean };
  portfolio: { source_observations_24h: number; generated_drafts: number; reviewed_drafts: number; latest_draft: { id: string; source: string; event_type: string; topic: string; created_at: string; linkedin_headline?: string | null; source_urls?: string[] } | null; recent_events: { id: string; source: string; event_type: string; topic: string; created_at: string }[]; query_ok: boolean };
  endpoints: { name: string; slug: string; path: string; method: string; purpose?: string }[];
  qa?: { latest_checks: { service_name: string; status: string; latency_ms: number | null; version: string | null; metadata: Record<string, unknown>; checked_at: string }[]; query_ok: boolean };
};

const when = (value?: string | null) => value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "No runtime evidence";
const platformLabel = (s: string) => s === "google_business" ? "Google Business" : s.charAt(0).toUpperCase() + s.slice(1);

function V12EnginePage() {
  const { session, loading: authLoading, isAdmin, isSuperAdmin, twoFactorVerified } = useAuth();
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"sync" | "portfolio" | "qa" | "assessment" | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [qaResult, setQaResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "machines" | "orchestration" | "endpoints" | "integrations" | "distribution" | "qa">("overview");

  const load = async () => {
    setLoading(true);
    setError("");
    if (!supabase || !session) { setLoading(false); return; }
    const { data: result, error: fnError } = await supabase.functions.invoke("v12-engine-dashboard");
    if (fnError) setError(fnError.message);
    else if (!result?.ok) setError(result?.error || "V12 telemetry returned an invalid response.");
    else setData(result as Snapshot);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [session?.access_token]);

  const runAction = async (action: "sync" | "portfolio" | "qa" | "assessment") => {
    if (!supabase) { setError("Supabase is not configured in this deployment."); return; }
    setBusy(action); setActionMessage(""); setError("");
    try {
      if (action === "assessment") {
        setAssessmentResult(null);
        const { data: result, error: fnError } = await supabase.functions.invoke("resofit-ecosystem-qa", { body: { action: "assessment_smoke_test" } });
        if (fnError) setError(fnError.message);
        else if (result?.error || result?.ok === false) setError(String(result?.error || "Assessment smoke test did not complete."));
        else {
          setAssessmentResult(result?.assessment_smoke_test ?? null);
          setActionMessage(result?.assessment_smoke_test?.ok
            ? "Assessment interaction smoke test passed. No checkout or payment was triggered."
            : "Assessment interaction smoke test returned a failure/unsupported result. Review the recorded details before calling the assessment healthy.");
        }
      } else if (action === "qa") {
        const offset = qaResult?.route_audit_truncated ? Number(qaResult.next_route_offset || 0) : 0;
        const { data: result, error: fnError } = await supabase.functions.invoke("resofit-ecosystem-qa", { body: { action: "full_audit", max_routes: 250, route_offset: offset } });
        if (fnError) setError(fnError.message);
        else if (result?.error || result?.ok === false) setError(String(result?.error || "Ecosystem QA did not complete."));
        else {
          setQaResult((previous: any) => offset > 0 && previous ? { ...result, route_results: [...(previous.route_results || []), ...(result.route_results || [])], routes_checked: Number(previous.routes_checked || 0) + Number(result.routes_checked || 0), routes_passed: Number(previous.routes_passed || 0) + Number(result.routes_passed || 0), routes_failed: Number(previous.routes_failed || 0) + Number(result.routes_failed || 0) } : result);
          setActionMessage("QA batch completed: " + (result?.routes_passed ?? 0) + "/" + (result?.routes_checked ?? 0) + " routes passed; " + (result?.routes_failed ?? 0) + " failed; " + (result?.performance?.length ?? 0) + " mobile PageSpeed checks returned.");
        }
      } else {
        const isPortfolio = action === "portfolio";
        const { data: result, error: fnError } = await supabase.functions.invoke(isPortfolio ? "chatb2k-portfolio-intelligence" : "chatb2k-professional-authority-sync", { body: isPortfolio
          ? { action: "portfolio_refresh", query: "Audit the public ResoFit, ResoFlex and ChatB2K CEO portfolio. Cite source URLs, separate first-party claims from independent corroboration, and prepare a conservative LinkedIn draft. Do not publish or edit profiles." }
          : { refresh_portfolio: false, source: "v12-ceo-dashboard" } });
        if (fnError) setError(fnError.message);
        else if (result?.error || result?.ok === false) setError(String(result?.error || "The action did not complete successfully."));
        else setActionMessage(isPortfolio
          ? "Portfolio refresh returned: " + (result?.usable_sources ?? result?.scraped ?? "—") + " usable sources; AI enrichment " + (result?.ai_enrichment?.ok ? "completed" : "needs review") + "."
          : "Channel sync returned: " + (result?.registry_rows_synced ?? "—") + " registry rows synced; " + (result?.errors?.length ?? 0) + " errors.");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "The requested operation failed."); }
    finally { setBusy(null); await load(); }
  };

  const engineStatus = useMemo(() => {
    if (!data) return "CHECKING";
    if (data.orchestration.global_kill) return "GLOBAL HALT";
    const active = data.engines.filter(e => e.status === "ACTIVE" && !e.kill_switch_enabled).length;
    return active === data.engines.length && data.gate.engine_registry_ok && data.gate.control_plane_ok ? "OPERATIONAL" : "DEGRADED";
  }, [data]);

  if (authLoading) return <main className="min-h-screen bg-[#07080a] p-6 text-white">Authenticating V12 console…</main>;
  if (!session) return <Gate title="V12 Engine Console" body="Sign in to access the production control plane." />;
  if (!isAdmin && !isSuperAdmin) return <Gate title="Restricted control plane" body="CEO/admin authorization is required." />;
  if (isAdmin && !isSuperAdmin && !twoFactorVerified) return <Gate title="MFA required" body="Complete the required second factor before opening production telemetry." />;

  return (
    <main className="min-h-screen bg-[#07080a] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300"><span className="h-2 w-2 rounded-full bg-amber-300" /> CEO review · production telemetry</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">ResoFit V12 · LordB2K</h1>
            <p className="mt-1 max-w-3xl text-sm text-white/55">One control plane for orchestration, engine health, social distribution and professional portfolio intelligence.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="https://www.resofit.fit/coach-buchi" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/[0.06]">Public portfolio <ExternalLink className="h-4 w-4" /></a>
            <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm hover:bg-white/[0.08] disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh telemetry</button>
          </div>
        </header>

        <nav aria-label="V12 dashboard views" className="mb-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
          {([
            ["overview", "Overview", Gauge],
            ["machines", "Machines & Engines", Cpu],
            ["orchestration", "ChatB2K + Gemini", Bot],
            ["endpoints", "APIs & Endpoints", Terminal],
            ["integrations", "Sources & Ingest", FileInput],
            ["distribution", "Social Distribution", Globe2],
            ["qa", "QA & CEO Gates", ShieldCheck],
          ] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => { setActiveTab(key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              aria-current={activeTab === key ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${activeTab === key ? "border-amber-300/35 bg-amber-300/10 text-amber-100" : "border-white/10 bg-white/[0.025] text-white/55 hover:bg-white/[0.07] hover:text-white"}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>

        {error && <div className="mb-4 rounded-xl border border-rose-400/25 bg-rose-400/5 p-3 text-sm text-rose-200"><CircleAlert className="mr-2 inline h-4 w-4" />{error}</div>}
        {actionMessage && <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200">{actionMessage}</div>}

        {activeTab === "overview" && <>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Gauge} label="V12 control state" value={engineStatus} sub={data?.engine ?? "loading snapshot"} good={engineStatus === "OPERATIONAL"} warn={engineStatus === "GLOBAL HALT"} />
          <Metric icon={Bot} label="Agent swarm" value={data ? `${data.orchestration.swarm_enabled}/${data.orchestration.swarm_population}` : "—"} sub={`${data?.orchestration.nodes ?? "—"} orchestration nodes`} good={Boolean(data && data.orchestration.swarm_population === 72)} />
          <Metric icon={ShieldCheck} label="Global kill switch" value={data?.orchestration.global_kill ? "ENGAGED" : data ? "DISENGAGED" : "—"} sub={data?.orchestration.global_kill_reason || "Read from canonical control plane"} good={Boolean(data && !data.orchestration.global_kill)} warn={Boolean(data?.orchestration.global_kill)} />
          <Metric icon={Database} label="Learning events" value={data ? data.operating_evidence.learning_events.toLocaleString("en-NG") : "—"} sub="Canonical ChatB2K learning store" good />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <Panel title="LordB2K state machine · registered engines" icon={Workflow}>
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              {["DISCOVER", "ASSESS & ROUTE", "EXECUTE", "VERIFY", "LEARN & ADAPT"].map((stage, i) => <div key={stage} className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="text-[10px] uppercase tracking-wider text-amber-300/80">Stage {i + 1}</div><div className="mt-1 text-xs font-semibold">{stage}</div></div>)}
            </div>
            <p className="mb-3 text-xs text-white/45">The stages describe the intended orchestration lifecycle; engine registry and heartbeat values below are the runtime evidence.</p>
            <div className="space-y-2">
              {(data?.engines ?? []).map(e => <div key={e.engine_key} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/7 px-3 py-2.5 sm:grid-cols-[1fr_90px_80px]">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{e.engine_name}</div><div className="text-[11px] text-white/40">{e.domain} · {e.version} · evidence {e.evidence_count.toLocaleString("en-NG")}</div><div className="text-[10px] text-white/30">Heartbeat {when(e.last_heartbeat_at)}</div></div>
                <Badge good={e.status === "ACTIVE" && !e.kill_switch_enabled} warn={e.kill_switch_enabled}>{e.kill_switch_enabled ? "KILLED" : e.status}</Badge>
                <div className="hidden text-right text-xs text-white/50 sm:block">Health {e.health_score}</div>
              </div>)}
            </div>
          </Panel>

          <Panel title="Commerce + operating evidence" icon={Activity}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Kpi label="Content queue" value={data?.operating_evidence.content_queue.toLocaleString("en-NG") ?? "—"} />
              <Kpi label="Growth intelligence rows" value={data?.operating_evidence.growth_rows.toLocaleString("en-NG") ?? "—"} />
              <Kpi label="Security events" value={data?.operating_evidence.security_events.toLocaleString("en-NG") ?? "—"} />
              <Kpi label="Recruitment candidates" value={data?.operating_evidence.recruitment_candidates.toLocaleString("en-NG") ?? "—"} />
              <Kpi label="Training assignments" value={data?.operating_evidence.training_assignments.toLocaleString("en-NG") ?? "—"} />
              <Kpi label="Certificates" value={data?.operating_evidence.certificates.toLocaleString("en-NG") ?? "—"} />
            </div>
            <div className="mt-4 rounded-xl border border-white/10 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Revenue engine · latest snapshot</div>
              {data?.revenue.today ? <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs text-white/65">{JSON.stringify(data.revenue.today, null, 2)}</pre> : <div className="text-sm text-white/40">No daily revenue snapshot returned.</div>}
            </div>
          </Panel>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <Panel title="Social distribution · verified destinations" icon={Globe2}>
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <Kpi label="Registered" value={String(data?.social.total_destinations ?? "—")} />
              <Kpi label="Active" value={String(data?.social.active_destinations ?? "—")} />
              <Kpi label="Active + verified" value={String(data?.social.verified_destinations ?? "—")} />
            </div>
            <div className="space-y-2">
              {(data?.social.destinations ?? []).map(d => <div key={d.provider + d.platform + d.external_channel_id} className="flex flex-col gap-2 rounded-xl border border-white/7 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><div className="text-sm font-medium">{d.display_name}</div><div className="text-[11px] text-white/40">{platformLabel(d.platform)} · {d.provider} · limit {d.daily_limit}/day</div><div className="text-[10px] text-white/30">Verified {when(d.last_verified_at)}</div></div>
                <div className="flex items-center gap-2"><Badge good={d.active && Boolean(d.last_verified_at)}>{d.active && d.last_verified_at ? "VERIFIED" : d.active ? "ACTIVE / UNVERIFIED" : "INACTIVE"}</Badge>{d.queue_paused && <Badge warn>QUEUE PAUSED</Badge>}</div>
              </div>)}
              {!data?.social.destinations?.length && <p className="text-sm text-white/40">No social destinations returned.</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="https://www.linkedin.com/in/mcjerry-michael-371772118" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]"><Linkedin className="h-4 w-4" /> LinkedIn profile <ExternalLink className="h-3 w-3" /></a>
              <a href="https://business.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]">Google Business Manager <ExternalLink className="h-3 w-3" /></a>
            </div>
            <p className="mt-3 text-[11px] text-white/35">Connected distribution is not the same as profile-edit permission. Posts remain governed by the approval queue.</p>
          </Panel>

          <Panel title="Professional portfolio intelligence" icon={Sparkles}>
            <div className="grid gap-2 sm:grid-cols-3">
              <Kpi label="Sources ingested (24h)" value={String(data?.portfolio.source_observations_24h ?? "—")} />
              <Kpi label="AI drafts" value={String(data?.portfolio.generated_drafts ?? "—")} />
              <Kpi label="Reviewed drafts" value={String(data?.portfolio.reviewed_drafts ?? "—")} />
            </div>
            <div className="mt-4 rounded-xl border border-white/10 p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/45">Latest saved draft</div>
              {data?.portfolio.latest_draft ? <><div className="mt-2 text-sm font-medium">{data.portfolio.latest_draft.topic}</div><div className="mt-1 break-all text-[10px] text-white/35">{data.portfolio.latest_draft.id}</div><div className="mt-2 text-[11px] text-white/45">{data.portfolio.latest_draft.event_type} · {when(data.portfolio.latest_draft.created_at)}</div>{data.portfolio.latest_draft.linkedin_headline && <p className="mt-3 text-xs text-white/70">{data.portfolio.latest_draft.linkedin_headline}</p>}</> : <p className="mt-2 text-sm text-white/40">No profile draft returned.</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => void runAction("sync")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05] disabled:opacity-50"><RefreshCw className={busy === "sync" ? "h-3 w-3 animate-spin" : "h-3 w-3"} /> {busy === "sync" ? "Syncing…" : "Sync professional channels"}</button>
              <button onClick={() => void runAction("portfolio")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-300/15 disabled:opacity-50"><Sparkles className={busy === "portfolio" ? "h-3 w-3 animate-pulse" : "h-3 w-3"} /> {busy === "portfolio" ? "Refreshing…" : "Refresh portfolio evidence"}</button>
            </div>
            <div className="mt-4 space-y-2">
              {(data?.endpoints ?? []).filter(e => ["chatb2k-professional-authority-sync", "chatb2k-portfolio-intelligence", "chatb2k-orchestrator", "buffer-publisher", "resofit-ecosystem-qa"].includes(e.slug)).map(e => <div key={e.slug} className="rounded-lg border border-white/7 px-3 py-2"><div className="text-xs font-medium">{e.name}</div><div className="mt-1 break-all font-mono text-[10px] text-amber-200/70">{e.path}</div><div className="mt-1 text-[10px] text-white/35">{e.method} · {e.purpose}</div></div>)}
            </div>
            <p className="mt-3 text-[11px] text-white/35">Refresh actions crawl public sources or reconcile channels; they do not modify LinkedIn profile fields or Google Business details, and do not publish posts.</p>
          </Panel>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <Panel title="Ecosystem reliability · Firecrawl + independent performance" icon={Gauge}>
            <p className="mb-3 text-xs text-white/45">Manual, read-only audit of public routes, origin reachability and mobile Lighthouse scores. No forms submitted or payments initiated.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void runAction("qa")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-300/15 disabled:opacity-50"><Gauge className={busy === "qa" ? "h-3 w-3 animate-pulse" : "h-3 w-3"} /> {busy === "qa" ? "Auditing routes + speed…" : qaResult?.route_audit_truncated ? "Run next route batch" : "Run full ecosystem QA"}</button>
              <button onClick={() => void runAction("assessment")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05] disabled:opacity-50"><Activity className={busy === "assessment" ? "h-3 w-3 animate-pulse" : "h-3 w-3"} /> {busy === "assessment" ? "Testing assessment…" : "Test assessment flow"}</button>
              <a href="https://pagespeed.web.dev/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]">PageSpeed Insights <ExternalLink className="h-3 w-3" /></a>
              <a href="https://www.browserstack.com/automate/playwright" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]">Real-device browser QA <ExternalLink className="h-3 w-3" /></a>
            </div>
            {assessmentResult && <div className="mt-4 rounded-xl border border-white/10 p-3"><div className="flex items-center justify-between gap-2"><div className="text-xs font-semibold uppercase tracking-wider text-white/50">Assessment interaction test</div><Badge good={assessmentResult.ok} warn={!assessmentResult.ok}>{assessmentResult.ok ? "PASS" : "CHECK"}</Badge></div><div className="mt-2 break-all text-xs text-white/65">{assessmentResult.url}</div><div className="mt-1 text-[11px] text-white/45">Latency {assessmentResult.latency_ms == null ? "—" : String(Math.round(Number(assessmentResult.latency_ms))) + " ms"} · Interaction HTTP {assessmentResult.interaction_status ?? "not returned"}</div>{assessmentResult.error && <p className="mt-2 text-xs text-rose-300">{assessmentResult.error}</p>}{assessmentResult.output && <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[10px] text-white/45">{String(assessmentResult.output).slice(0,3000)}</pre>}<p className="mt-2 text-[10px] text-white/35">Read-only assessment choices only; no personal data, checkout, or payment was submitted.</p></div>}
            {qaResult && <div className="mt-4 rounded-xl border border-white/10 p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Latest manual audit</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3"><Kpi label="Routes discovered" value={String(qaResult.routes_discovered_total ?? 0)} /><Kpi label="Routes passed / checked" value={String(qaResult.routes_passed ?? 0) + " / " + String(qaResult.routes_checked ?? 0)} /><Kpi label="Routes failed" value={String(qaResult.routes_failed ?? 0)} /></div>
              {qaResult.route_audit_truncated && <p className="mt-2 text-xs text-amber-200">The route map exceeds this run's 150-route sample. Run follow-up batches before declaring full coverage.</p>}
              <div className="mt-3 space-y-2">
                {(qaResult.performance ?? []).map((p: any) => <div key={p.url} className="rounded-lg border border-white/7 px-3 py-2"><div className="break-all text-xs font-medium">{p.url}</div>{p.ok ? <div className="mt-1 text-[11px] text-white/55">Mobile scores · Performance {p.scores?.performance ?? "—"} · Accessibility {p.scores?.accessibility ?? "—"} · Best practices {p.scores?.best_practices ?? "—"} · SEO {p.scores?.seo ?? "—"} · LCP {p.metrics?.largest_contentful_paint ?? "—"}</div> : <div className="mt-1 text-[11px] text-rose-300">{p.error || "PageSpeed check failed"}</div>}</div>)}
              </div>
              {(qaResult.route_results ?? []).filter((r: any) => !r.ok).slice(0,10).map((r: any) => <div key={r.url} className="break-all py-1 text-[11px] text-rose-200/80">{r.status_code ?? "no status"} · {r.url} · {r.error || "check failed"}</div>)}
              <p className="mt-3 text-[10px] text-white/35">Started {when(qaResult.started_at)} · Mobile Lighthouse is lab data, not proof of live-user INP or assessment completion.</p>
            </div>}
            <div className="mt-4 rounded-xl border border-white/10 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Persisted health checks</div>
              <div className="space-y-2">
                {(data?.qa?.latest_checks ?? []).slice(0,12).map((c) => <div key={c.service_name + c.checked_at} className="flex flex-col gap-1 rounded-lg border border-white/7 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="break-all text-xs font-medium">{c.service_name}</div><div className="text-[10px] text-white/35">{when(c.checked_at)} · {c.version || "version unreported"}</div></div><div className="flex items-center gap-2"><span className="text-[11px] text-white/50">{c.latency_ms == null ? "—" : String(Math.round(Number(c.latency_ms))) + " ms"}</span><Badge good={c.status === "healthy"} warn={c.status === "failed"}>{c.status.toUpperCase()}</Badge></div></div>)}
                {!data?.qa?.latest_checks?.length && <p className="text-sm text-white/40">No persisted QA health checks yet. Run the audit to populate this section.</p>}
              </div>
            </div>
          </Panel>
          <Panel title="CEO operations · external test surfaces" icon={ShieldCheck}>
            <div className="space-y-3 text-sm text-white/65">
              <div><div className="font-medium text-white">Customer assessment</div><p className="mt-1 text-xs text-white/45">Acceptance test: assessment input → recommendation → product/program routing → consent/lead capture, without making a live payment.</p></div>
              <div><div className="font-medium text-white">Independent browsers</div><p className="mt-1 text-xs text-white/45">Run desktop Chromium, Firefox and WebKit, plus real iOS Safari and Android. Preserve screenshots, traces, console errors and failed network requests.</p></div>
              <div><div className="font-medium text-white">External execution</div><p className="mt-1 text-xs text-white/45">The QA suite runs from a hosted environment, independent of the CEO's iPhone and mobile connection.</p></div>
            </div>
          </Panel>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2"><Network className="h-4 w-4 text-amber-300" /><h2 className="text-sm font-semibold">API ownership · drift elimination</h2><Badge warn>Legacy cleanup pending</Badge></div>
          <p className="mb-4 text-xs text-white/45">Audit snapshot 2026-10-12. The canonical web API is same-origin under resofit.fit/api/*, owned by reso-web and implemented by shopb2k server routes. Assessment/recommendation remains on the canonical Supabase / ChatB2K control plane. The legacy api.resofit.fit project is failed/unverified and its repository contains a mock payment-success handler; do not use it for payments.</p>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.035] p-3">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-white">Canonical website API</span><Badge good>Source verified</Badge></div>
              <div className="mt-2 break-all text-xs text-emerald-200">https://www.resofit.fit/api/*</div>
              <p className="mt-2 text-[11px] text-white/45">Owned by reso-web · handlers in shopb2k. Examples: /api/cart, /api/makaveli/checkout, /api/makaveli/verify, /api/asset-sync-cron.</p>
              <a href="https://www.resofit.fit" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-amber-200">Open canonical site <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.025] p-3">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-white">Vercel project: resofit-api</span><Badge warn>Orphan candidate</Badge></div>
              <div className="mt-2 text-xs text-rose-200">live=false · latest deployment ERROR</div>
              <p className="mt-2 text-[11px] text-white/45">No custom API domain; the same source repo and commit sequence also back the legacy automation project. Latest deployments fail and project reports live=false. Do not route production consumers here; decommission only after consumer/log review.</p>
              <a href="https://vercel.com/resonancefitnessng-2206/resofit-api" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-amber-200">Inspect project <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.025] p-3">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-white">api.resofit.fit</span><Badge warn>Unverified legacy</Badge></div>
              <div className="mt-2 text-xs text-amber-100">Attached to legacy automation project</div>
              <p className="mt-2 text-[11px] text-white/45">Assigned to resonance-fitness-automation (latest deploy ERROR, live=false). Its source contains a mock payment-verification handler that returns SUCCESS without verifying payment. Treat as unsafe legacy surface until disabled/redirected and externally tested. A separate resoflex-intelligence-node scaffold also references this hostname.</p>
              <a href="https://github.com/EliteFitness101/resoflex-intelligence-node" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-amber-200">Inspect legacy source <ExternalLink className="h-3 w-3" /></a>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/45">Decommission guardrail</div>
            <p className="mt-2 text-xs text-white/60">Do not delete legacy project/repository or change DNS until access logs, cron jobs, OAuth/webhook callbacks, secrets, and external consumers have been checked. Canonical architecture and evidence ledger are recorded in <a href="https://github.com/EliteFitness101/shopb2k/blob/main/docs/API-OWNERSHIP.md" target="_blank" rel="noreferrer" className="text-amber-200 underline">docs/API-OWNERSHIP.md</a>.</p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2"><Layers3 className="h-4 w-4 text-amber-300" /><h2 className="text-sm font-semibold">Runtime gates and CEO review</h2></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data?.gate ?? {}).map(([key, value]) => <div key={key} className="flex items-center justify-between gap-2 rounded-lg border border-white/7 px-3 py-2"><span className="text-xs text-white/55">{key.replaceAll("_", " ")}</span><Badge good={Boolean(value)}>{value ? "PASS" : "CHECK"}</Badge></div>)}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/7 px-3 py-2"><span className="text-xs text-white/55">Social registry query</span><Badge good={Boolean(data?.social.query_ok)}>{data?.social.query_ok ? "PASS" : "CHECK"}</Badge></div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/7 px-3 py-2"><span className="text-xs text-white/55">Portfolio registry query</span><Badge good={Boolean(data?.portfolio.query_ok)}>{data?.portfolio.query_ok ? "PASS" : "CHECK"}</Badge></div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"><span>ResoFit™ · ChatB2K™ · LordB2K V12 · CEO control plane</span><span>{data ? `Snapshot ${when(data.generated_at)}` : "No snapshot"}</span></div>
        </section>

        </>}

        {activeTab === "machines" && (
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Cpu} label="Registered engines" value={String(data?.engines.length ?? "—")} sub="Read from resofit_v12_engine_registry" good={Boolean(data)} />
              <Metric icon={Bot} label="ChatB2K agent population" value={data ? String(data.orchestration.swarm_population) : "—"} sub={data ? `${data.orchestration.swarm_enabled} enabled · ${data.orchestration.swarm_killed} killed` : "Awaiting telemetry"} good={Boolean(data && data.orchestration.swarm_population === 72)} />
              <Metric icon={Network} label="Orchestration nodes" value={String(data?.orchestration.nodes ?? "—")} sub={`${data?.orchestration.nodes_killed ?? "—"} killed nodes`} />
              <Metric icon={ShieldAlert} label="Global control" value={data?.orchestration.global_kill ? "HALTED" : data ? "NOT HALTED" : "—"} sub={data?.orchestration.global_kill_reason || "Canonical control-plane flag"} good={Boolean(data && !data.orchestration.global_kill)} warn={Boolean(data?.orchestration.global_kill)} />
            </section>
            <Panel title="Registered engine machines" icon={Cpu}>
              <div className="mb-3 text-xs text-white/40">Registry inventory and heartbeat evidence. A registered engine is not automatically proof of a successful recent execution.</div>
              <div className="space-y-2">
                {(data?.engines ?? []).map(e => <div key={e.engine_key} className="grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0"><div className="break-words text-sm font-semibold">{e.engine_name}</div><div className="mt-1 break-all font-mono text-[10px] text-white/40">{e.engine_key}</div><div className="mt-1 text-xs text-white/50">{e.domain} · {e.version} · health {e.health_score} · evidence {e.evidence_count}</div><div className="mt-1 text-[10px] text-white/35">Heartbeat: {when(e.last_heartbeat_at)} · Last run: {when(e.last_run_at)}</div></div>
                  <div className="flex flex-wrap items-center gap-2"><Badge good={e.status === "ACTIVE" && !e.kill_switch_enabled} warn={e.kill_switch_enabled}>{e.kill_switch_enabled ? "KILL SWITCH ON" : e.status}</Badge><Badge>{e.control_plane}</Badge></div>
                </div>)}
                {!data?.engines.length && <p className="text-sm text-white/45">No engine rows returned. Refresh telemetry and inspect the error state before assuming the registry is empty.</p>}
              </div>
            </Panel>
            <Panel title="Machine lifecycle" icon={Workflow}>
              <div className="grid gap-3 sm:grid-cols-5">
                {["DISCOVER", "ASSESS & ROUTE", "EXECUTE", "VERIFY", "LEARN & ADAPT"].map((stage, i) => <div key={stage} className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="text-[10px] uppercase tracking-wider text-amber-300/80">Stage {i + 1}</div><div className="mt-1 text-xs font-semibold">{stage}</div></div>)}
              </div>
              <p className="mt-3 text-xs text-white/40">Lifecycle stages describe the control-plane model. Runtime status comes from the engine registry, agent registry, orchestration nodes and control-plane query—not from this diagram.</p>
            </Panel>
          </div>
        )}

        {activeTab === "orchestration" && (
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Bot} label="Control identity" value={data?.orchestration.control_identity ?? "—"} sub="ChatB2K101 / LordB2K V12" good={Boolean(data)} />
              <Metric icon={Cpu} label="Swarm enabled" value={data ? `${data.orchestration.swarm_enabled}/${data.orchestration.swarm_population}` : "—"} sub="Agent registry snapshot" good={Boolean(data && data.orchestration.swarm_enabled > 0)} />
              <Metric icon={Zap} label="Gemini media request" value="Last known: HTTP 429" sub="Quota/billing rejection in prior audit; not a live check" warn />
              <Metric icon={Activity} label="Learning events" value={String(data?.operating_evidence.learning_events ?? "—")} sub="Canonical ChatB2K learning store" good={Boolean(data)} />
            </section>
            <Panel title="ChatB2K orchestration and Gemini execution path" icon={Bot}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Network className="h-4 w-4 text-amber-300" /> ChatB2K orchestrator</div><p className="mt-2 text-xs leading-5 text-white/50">Central routing and controlled agent execution. Endpoint is listed in the authenticated telemetry response; this view does not directly invoke it.</p><div className="mt-3 font-mono text-[10px] text-amber-200/80">/functions/v1/chatb2k-orchestrator</div><Badge good={Boolean(data?.endpoints.some(e => e.slug === "chatb2k-orchestrator"))}> {data?.endpoints.some(e => e.slug === "chatb2k-orchestrator") ? "REGISTERED IN TELEMETRY" : "NOT IN SNAPSHOT"} </Badge></div>
                <div className="rounded-xl border border-white/10 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-amber-300" /> Gemini API / media factory</div><p className="mt-2 text-xs leading-5 text-white/50">The prior media-generation attempt reached the Gemini provider but was rejected with a quota/billing HTTP 429. No generated assets were registered in that audit.</p><div className="mt-3 flex flex-wrap gap-2"><a href="https://aistudio.google.com/rate-limit" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-amber-100 hover:bg-white/[0.05]">Gemini rate limits <ExternalLink className="h-3 w-3" /></a><a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-amber-100 hover:bg-white/[0.05]">Billing & pricing <ExternalLink className="h-3 w-3" /></a></div></div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-3"><div className="text-xs font-semibold text-amber-100">Evidence boundary</div><p className="mt-1 text-xs leading-5 text-white/50">This dashboard currently reads the V12 registry and telemetry function inventory. It does not directly query live Gemini quota, every model run, or every orchestration trace. Treat provider and agent health as unverified unless fresh runtime evidence is shown.</p></div>
            </Panel>
            <Panel title="Related CEO and factory dashboards" icon={Layers3}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[{name:"V12 Engine Control Plane",path:"/v12-engine",detail:"Engine registry, orchestration, telemetry, API ownership"},{name:"Digital Product Factory",path:"/digital-products",detail:"Factory jobs, generated assets, ingest and approval flow"},{name:"CEO Growth",path:"/ceo-growth",detail:"Growth and revenue operations dashboard"},{name:"Canonical ResoFit Website",path:"https://www.resofit.fit",detail:"Public customer experience and commerce entry point"}].map(d => <a key={d.path} href={d.path} target={d.path.startsWith("http") ? "_blank" : undefined} rel={d.path.startsWith("http") ? "noreferrer" : undefined} className="group rounded-xl border border-white/10 p-4 transition-colors hover:border-amber-300/25 hover:bg-white/[0.035]"><div className="flex items-start justify-between gap-2"><div className="text-sm font-semibold">{d.name}</div><ExternalLink className="h-4 w-4 shrink-0 text-white/35 group-hover:text-amber-200" /></div><p className="mt-2 text-xs leading-5 text-white/45">{d.detail}</p><div className="mt-3 break-all font-mono text-[10px] text-amber-200/75">{d.path}</div></a>)}
              </div>
            </Panel>
            <Panel title="ChatB2K / Gemini related endpoint inventory" icon={Terminal}>
              <div className="space-y-2">{(data?.endpoints ?? []).filter(e => /chatb2k|gemini|digital-product|buffer-publisher|ecosystem-qa/i.test(e.slug + " " + e.name)).map(e => <div key={e.slug} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="text-sm font-medium">{e.name}</div><div className="mt-1 break-all font-mono text-[10px] text-amber-200/70">{e.path}</div><div className="mt-1 text-[10px] text-white/35">{e.method} · {e.purpose || "Purpose not supplied by telemetry"}</div></div><Badge good>INVENTORY ENTRY</Badge></div>)}{!data?.endpoints.length && <p className="text-sm text-white/45">Endpoint inventory unavailable until telemetry loads.</p>}</div>
            </Panel>
          </div>
        )}

        {activeTab === "endpoints" && (
          <div className="space-y-5">
            <Panel title="API and Edge Function directory" icon={Terminal}>
              <p className="mb-3 text-xs leading-5 text-white/45">These paths are displayed as inventory, not invoked by opening a link. Most are authenticated POST endpoints; do not treat a browser GET as a health test.</p>
              <div className="space-y-2">{(data?.endpoints ?? []).map(e => { const url = "https://vbqjvmnhdtdhmeeudqnn.supabase.co" + e.path; return <div key={e.slug} className="rounded-xl border border-white/10 p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="text-sm font-semibold">{e.name}</div><div className="mt-1 break-all font-mono text-[10px] text-amber-200/75">{url}</div><div className="mt-1 text-[10px] text-white/40">{e.method} · {e.purpose || "No purpose description returned"}</div></div><button onClick={() => { void navigator.clipboard?.writeText(url).then(() => setActionMessage("Endpoint URL copied: " + e.slug)).catch(() => setError("Clipboard access was denied. Select and copy the endpoint URL manually.")); }} className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.06]"><Terminal className="h-3 w-3" /> Copy URL</button></div></div>})}{!data?.endpoints.length && <p className="text-sm text-white/45">No endpoint inventory returned.</p>}</div>
            </Panel>
            <Panel title="API ownership and routing rules" icon={Network}>
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-xl border border-emerald-400/15 p-3"><Badge good>CANONICAL</Badge><div className="mt-2 text-sm font-semibold">Website API</div><div className="mt-1 break-all text-xs text-emerald-200">https://www.resofit.fit/api/*</div><p className="mt-2 text-xs text-white/45">Owned by reso-web; handlers in shopb2k. Commerce remains the source of truth for pricing, payment, fulfillment and entitlements.</p></div>
                <div className="rounded-xl border border-amber-300/15 p-3"><Badge warn>UNVERIFIED LEGACY</Badge><div className="mt-2 text-sm font-semibold">api.resofit.fit</div><p className="mt-2 text-xs text-white/45">Do not route production traffic here until its deployment and payment-verification behavior are re-audited. This panel preserves the existing warning; it does not change DNS.</p></div>
                <div className="rounded-xl border border-white/10 p-3"><Badge>CONTROL PLANE</Badge><div className="mt-2 text-sm font-semibold">Supabase Edge Functions</div><div className="mt-1 break-all text-xs text-white/60">vbqjvmnhdtdhmeeudqnn</div><p className="mt-2 text-xs text-white/45">V12 telemetry and ChatB2K execution endpoints remain separate from the canonical commerce API.</p></div>
              </div>
              <a href="https://github.com/EliteFitness101/shopb2k/blob/main/docs/API-OWNERSHIP.md" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]">Open API ownership record <ExternalLink className="h-3 w-3" /></a>
            </Panel>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={Database} label="Canonical telemetry" value={data ? "LOADED" : "WAITING"} sub="Authenticated V12 dashboard function" good={Boolean(data)} warn={!data} />
              <Metric icon={Globe2} label="Social destinations" value={String(data?.social.total_destinations ?? "—")} sub={`${data?.social.active_destinations ?? "—"} active · ${data?.social.verified_destinations ?? "—"} verified`} good={Boolean(data?.social.query_ok)} />
              <Metric icon={FileInput} label="Portfolio ingest (24h)" value={String(data?.portfolio.source_observations_24h ?? "—")} sub="Learning-event count" good={Boolean(data?.portfolio.query_ok)} />
              <Metric icon={Activity} label="Last channel sync" value={data?.social.last_sync ? when(data.social.last_sync.created_at) : "No sync evidence"} sub="Registry sync event" good={Boolean(data?.social.last_sync)} />
            </section>
            <Panel title="External source and service inventory" icon={Cable}>
              <p className="mb-3 text-xs leading-5 text-white/45">Status labels are intentionally evidence-based. This V12 telemetry endpoint does not perform live health checks against every third-party account, CDN, archive or billing project.</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {name:"Supabase · resonance-fitness",role:"Canonical registry, control plane, learning events and Edge Functions",status:data ? "TELEMETRY READ" : "NOT LOADED",good:Boolean(data),warn:false},
                  {name:"Gemini API / Google AI Studio",role:"AI enrichment and media-generation provider path",status:"LAST MEDIA ATTEMPT: HTTP 429",good:false,warn:true},
                  {name:"Firecrawl",role:"Portfolio source discovery and ecosystem route QA",status:(data?.endpoints ?? []).some(e => /portfolio-intelligence|ecosystem-qa/.test(e.slug)) ? "ENDPOINT REGISTERED" : "NOT IN SNAPSHOT",good:Boolean((data?.endpoints ?? []).some(e => /portfolio-intelligence|ecosystem-qa/.test(e.slug))),warn:false},
                  {name:"Buffer",role:"Approved content distribution and connected social destinations",status:data?.social.total_destinations ? `${data.social.active_destinations} ACTIVE DESTINATIONS` : "NO DESTINATION EVIDENCE",good:Boolean(data?.social.total_destinations),warn:false},
                  {name:"Paystack",role:"Payment verification/webhook and commerce payment lifecycle",status:"NOT LIVE-CHECKED IN THIS VIEW",good:false,warn:false},
                  {name:"Dropbox · BIGO archive",role:"Intended archive for raw captures, metadata, processed media and logs",status:"NOT LIVE-CHECKED IN THIS VIEW",good:false,warn:false},
                  {name:"Google Flow / Veo",role:"External/manual video-generation surface; distinct from Gemini API routing",status:"API CONNECTIVITY NOT VERIFIED",good:false,warn:true},
                  {name:"ImageKit",role:"Product media delivery and transformations",status:"NOT LIVE-CHECKED IN THIS VIEW",good:false,warn:false},
                  {name:"Cloudinary",role:"Image/video asset processing and delivery",status:"NOT LIVE-CHECKED IN THIS VIEW",good:false,warn:false},
                  {name:"Cloudflare R2 / media.resofit.fit",role:"Proposed media object storage and CDN delivery route",status:"NOT LIVE-CHECKED IN THIS VIEW",good:false,warn:false},
                  {name:"GitHub · reso-dash",role:"Dashboard source and change history",status:"SOURCE REPOSITORY",good:true,warn:false},
                  {name:"Vercel · reso-dash",role:"Dashboard build and deployment hosting",status:"DEPLOYMENT NOT LIVE-CHECKED HERE",good:false,warn:false},
                ].map(source => <div key={source.name} className="rounded-xl border border-white/10 p-3"><div className="flex items-start gap-2"><Cloud className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/80" /><div className="min-w-0"><div className="break-words text-sm font-semibold">{source.name}</div><p className="mt-1 text-xs leading-5 text-white/45">{source.role}</p></div></div><div className="mt-3"><Badge good={source.good} warn={source.warn}>{source.status}</Badge></div></div>)}
              </div>
            </Panel>
            <Panel title="Ingestion and media-factory route" icon={FileInput}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[["1","DISCOVER","Source URL / brief / SKU"],["2","GENERATE","Configured provider and model"],["3","INGEST","Store file + metadata + provenance"],["4","QA & APPROVE","Asset checks, human approval, publish gate"]].map(([n,title,desc]) => <div key={n} className="rounded-xl border border-white/10 p-3"><div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300/25 text-xs font-semibold text-amber-200">{n}</div><div className="mt-3 text-sm font-semibold">{title}</div><p className="mt-1 text-xs leading-5 text-white/45">{desc}</p></div>)}
              </div>
              <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-3"><div className="text-sm font-semibold text-amber-100">Last audited factory result</div><p className="mt-1 text-xs leading-5 text-white/50">The prior RESO-DIG-LIFE-001 attempt was rejected at the Gemini video submission step with HTTP 429. The last recorded job state was awaiting_ingest with zero registered and zero approved assets. This is historical audit evidence, not a fresh job query.</p><a href="/digital-products" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]">Open Digital Product Factory <ExternalLink className="h-3 w-3" /></a></div>
            </Panel>
          </div>
        )}

        {activeTab === "distribution" && (
          <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-3">
              <Metric icon={Globe2} label="Registered destinations" value={String(data?.social.total_destinations ?? "—")} sub="social_destinations registry" good={Boolean(data?.social.query_ok)} />
              <Metric icon={CheckCircle2} label="Active + verified" value={String(data?.social.verified_destinations ?? "—")} sub="Active and timestamp-verified" good={Boolean(data?.social.verified_destinations)} />
              <Metric icon={Activity} label="Active but unverified" value={String(Math.max(0, (data?.social.active_destinations ?? 0) - (data?.social.verified_destinations ?? 0)))} sub="Requires fresh verification" warn={Boolean(data && data.social.active_destinations > data.social.verified_destinations)} />
            </section>
            <Panel title="Connected social destinations" icon={Globe2}>
              <div className="space-y-2">{(data?.social.destinations ?? []).map(d => <div key={d.provider + d.platform + d.external_channel_id} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="text-sm font-semibold">{d.display_name}</div><div className="mt-1 break-all text-[10px] text-white/40">{d.platform} · {d.provider} · channel {d.external_channel_id}</div><div className="mt-1 text-[10px] text-white/35">Last verified {when(d.last_verified_at)} · daily limit {d.daily_limit} · queue {d.queue_paused ? "paused" : "not marked paused"}</div></div><div className="flex flex-wrap gap-2"><Badge good={d.active && Boolean(d.last_verified_at)} warn={d.active && !d.last_verified_at}>{d.active && d.last_verified_at ? "ACTIVE + VERIFIED" : d.active ? "ACTIVE / UNVERIFIED" : "INACTIVE"}</Badge>{d.queue_paused && <Badge warn>QUEUE PAUSED</Badge>}</div></div>)}{!data?.social.destinations.length && <p className="text-sm text-white/45">No destinations returned in this telemetry snapshot.</p>}</div>
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void runAction("sync")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05] disabled:opacity-50"><RefreshCw className={busy === "sync" ? "h-3 w-3 animate-spin" : "h-3 w-3"} />{busy === "sync" ? "Syncing…" : "Sync professional channels"}</button><a href="https://business.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]">Google Business Manager <ExternalLink className="h-3 w-3" /></a><a href="https://www.linkedin.com/in/mcjerry-michael-371772118" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]">LinkedIn <ExternalLink className="h-3 w-3" /></a></div>
            </Panel>
          </div>
        )}

        {activeTab === "qa" && (
          <div className="space-y-5">
            <Panel title="QA execution controls" icon={Gauge}>
              <p className="mb-3 text-xs leading-5 text-white/45">These controls invoke the existing authenticated QA and assessment functions. They do not submit checkout or payment.</p>
              <div className="flex flex-wrap gap-2"><button onClick={() => void runAction("qa")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100 disabled:opacity-50"><Gauge className="h-3 w-3" />{busy === "qa" ? "Auditing…" : "Run ecosystem QA"}</button><button onClick={() => void runAction("assessment")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-50"><Activity className="h-3 w-3" />{busy === "assessment" ? "Testing…" : "Test assessment flow"}</button><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs disabled:opacity-50"><RefreshCw className={loading ? "h-3 w-3 animate-spin" : "h-3 w-3"} />Refresh telemetry</button></div>
              {qaResult && <div className="mt-4 grid gap-3 sm:grid-cols-3"><Kpi label="Routes checked" value={String(qaResult.routes_checked ?? "—")} /><Kpi label="Routes passed" value={String(qaResult.routes_passed ?? "—")} /><Kpi label="Routes failed" value={String(qaResult.routes_failed ?? "—")} /></div>}
              {assessmentResult && <div className="mt-3 rounded-xl border border-white/10 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">Assessment smoke test</span><Badge good={assessmentResult.ok} warn={!assessmentResult.ok}>{assessmentResult.ok ? "PASS" : "CHECK"}</Badge></div><div className="mt-1 text-xs text-white/45">{assessmentResult.url} · HTTP {assessmentResult.interaction_status ?? "not returned"}</div></div>}
            </Panel>
            <Panel title="CEO runtime gates" icon={ShieldCheck}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(data?.gate ?? {}).map(([key,value]) => <div key={key} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"><span className="text-xs text-white/55">{key.replaceAll("_"," ")}</span><Badge good={Boolean(value)} warn={!value}>{value ? "PASS" : "CHECK"}</Badge></div>)}<div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"><span className="text-xs text-white/55">Social registry query</span><Badge good={Boolean(data?.social.query_ok)}>{data?.social.query_ok ? "PASS" : "CHECK"}</Badge></div><div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"><span className="text-xs text-white/55">Portfolio registry query</span><Badge good={Boolean(data?.portfolio.query_ok)}>{data?.portfolio.query_ok ? "PASS" : "CHECK"}</Badge></div></div>
            </Panel>
            <Panel title="Latest persisted health checks" icon={Activity}>
              <div className="space-y-2">{(data?.qa?.latest_checks ?? []).slice(0,20).map(c => <div key={c.service_name + c.checked_at} className="flex flex-col gap-1 rounded-xl border border-white/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-semibold">{c.service_name}</div><div className="text-[10px] text-white/35">{when(c.checked_at)} · {c.version || "version unreported"}</div></div><div className="flex items-center gap-2"><span className="text-[11px] text-white/45">{c.latency_ms == null ? "—" : Math.round(Number(c.latency_ms)) + " ms"}</span><Badge good={c.status === "healthy"} warn={c.status === "failed"}>{c.status.toUpperCase()}</Badge></div></div>)}{!data?.qa?.latest_checks.length && <p className="text-sm text-white/45">No persisted checks returned.</p>}</div>
            </Panel>
          </div>
        )}
      </div>
    </main>
  );
}

function Gate({ title, body }: { title: string; body: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#07080a] px-5 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-7"><div className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">ResoFit V12</div><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-white/55">{body}</p><a href="/today" className="mt-6 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Open dashboard</a></div></main>;
}
function Metric({ icon: Icon, label, value, sub, good, warn }: { icon: typeof Activity; label: string; value: string; sub: string; good?: boolean; warn?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex items-center justify-between"><span className="text-xs text-white/45">{label}</span><Icon className="h-4 w-4 text-white/35" /></div><div className="mt-3 text-xl font-semibold">{value}</div><div className={`mt-1 text-[11px] ${warn ? "text-rose-300" : good ? "text-emerald-300/70" : "text-white/35"}`}>{sub}</div></div>;
}
function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><Icon className="h-4 w-4 text-amber-300" /><h2 className="text-sm font-semibold">{title}</h2></div>{children}</section>;
}
function Kpi({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-black/20 p-3"><div className="text-[11px] text-white/35">{label}</div><div className="mt-1 break-words text-sm font-semibold">{value}</div></div>; }
function Badge({ children, good, warn }: { children: React.ReactNode; good?: boolean; warn?: boolean }) { return <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide ${warn ? "bg-rose-400/10 text-rose-300" : good ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{children}</span>; }
