import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Film, Plus, RefreshCw, Save, ShieldCheck, Users, Workflow } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/bigo-ops")({ component: BigoOpsPage });

type Host = {
  bigo_id: string;
  source_url: string;
  display_name: string | null;
  active: boolean;
  capture_enabled: boolean;
  metadata: Record<string, unknown> | null;
};
type Row = Record<string, any>;

const fmt = (value?: string | null) => value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "No recorded run";
const statusTone = (status: unknown) => {
  const s = String(status ?? "").toLowerCase();
  if (["posted", "published", "success", "completed", "captured"].includes(s)) return "text-emerald-400";
  if (["failed", "error", "blocked", "rejected", "quarantined"].includes(s)) return "text-red-400";
  if (["queued", "pending", "processing", "scheduled", "hold"].includes(s)) return "text-amber-300";
  return "text-muted-foreground";
};

function BigoOpsPage() {
  const { session, isAdmin, isSuperAdmin, twoFactorVerified } = useAuth();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [highlights, setHighlights] = useState<Row[]>([]);
  const [jobs, setJobs] = useState<Row[]>([]);
  const [queue, setQueue] = useState<Row[]>([]);
  const [tab, setTab] = useState<"overview" | "hosts" | "highlights" | "captures" | "config">("overview");
  const [hostId, setHostId] = useState("");
  const [hostName, setHostName] = useState("");
  const [attestation, setAttestation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !session) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const [h, l, j, q] = await Promise.all([
        supabase.from("bigo_sources" as any).select("bigo_id,source_url,display_name,active,capture_enabled,metadata").order("bigo_id").limit(2000),
        supabase.from("resofit_live_highlights" as any).select("id,host_id,host_name,title,status,original_url,imagekit_url,created_at,error_message,metadata").order("created_at", { ascending: false }).limit(100),
        supabase.from("bigo_capture_jobs" as any).select("id,status,error_message,created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("content_queue" as any).select("id,title,status,platform,published_at,created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      const bad = [h, l, j, q].find((r: any) => r.error);
      if (bad?.error) throw bad.error;
      setHosts((h.data ?? []) as Host[]);
      setHighlights((l.data ?? []) as Row[]);
      setJobs((j.data ?? []) as Row[]);
      setQueue((q.data ?? []) as Row[]);
      setUpdatedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "BIGO dashboard query failed.");
    } finally { setBusy(false); }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => ({
    hosts: hosts.length,
    active: hosts.filter(h => h.active && h.capture_enabled).length,
    highlights: highlights.length,
    published: highlights.filter(h => ["posted", "published"].includes(String(h.status).toLowerCase())).length,
    failed: jobs.filter(j => ["failed", "error"].includes(String(j.status).toLowerCase())).length,
    queued: queue.filter(q => ["queued", "pending", "scheduled"].includes(String(q.status).toLowerCase())).length,
  }), [hosts, highlights, jobs, queue]);

  const saveHost = async () => {
    if (!supabase || !hostId.trim()) return;
    const id = hostId.trim();
    if (!/^[A-Za-z0-9_.-]{1,128}$/.test(id)) { setError("Use a valid BIGO room ID (letters, numbers, dot, underscore or hyphen)."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const existing = hosts.find(h => h.bigo_id.toLowerCase() === id.toLowerCase());
      const metadata = { ...(existing?.metadata ?? {}) } as Record<string, unknown>;
      if (attestation.trim()) {
        metadata.commercial_republication_attestation = {
          status: "user_authorized",
          statement: attestation.trim(),
          attested_at: new Date().toISOString(),
          attestation_source: "CEO BIGO Ops dashboard",
        };
      }
      const payload = {
        bigo_id: id,
        source_url: `https://www.bigo.tv/${id}`,
        display_name: hostName.trim() || existing?.display_name || id,
        active: existing?.active ?? true,
        capture_enabled: existing?.capture_enabled ?? true,
        metadata,
      };
      const { error: writeError } = await supabase.from("bigo_sources" as any).upsert(payload, { onConflict: "bigo_id" });
      if (writeError) throw writeError;
      setNotice(`Saved registry record for ${id}. The scheduled workflow can discover active registry hosts without editing its JSON configuration. This does not update the encrypted BIGO_VERIFIED_HOST_IDS GitHub secret.`);
      setHostId(""); setHostName(""); setAttestation("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Host registry update failed.");
    } finally { setBusy(false); }
  };

  const toggleHost = async (host: Host, field: "active" | "capture_enabled") => {
    if (!supabase) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { error: writeError } = await supabase.from("bigo_sources" as any).update({ [field]: !host[field] }).eq("bigo_id", host.bigo_id);
      if (writeError) throw writeError;
      setNotice(`${host.bigo_id}: ${field} set to ${!host[field]}.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Host update failed."); }
    finally { setBusy(false); }
  };

  if (!session || (!isAdmin && !isSuperAdmin) || !twoFactorVerified) {
    return <main className="min-h-dvh bg-background p-6 text-foreground"><section className="mx-auto max-w-2xl rounded-3xl border border-gold/30 bg-card p-6"><ShieldCheck className="mb-3 text-gold" /><p className="text-xs uppercase tracking-[0.25em] text-gold">BIGO Operations</p><h1 className="mt-2 text-2xl font-semibold">Privileged dashboard</h1><p className="mt-3 text-sm text-muted-foreground">Sign in with an admin or super-admin account and complete MFA to view or change BIGO registry data.</p></section></main>;
  }

  const tabs = ["overview", "hosts", "highlights", "captures", "config"] as const;
  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-gold/30 bg-card/80 p-5 shadow-xl sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold"><Workflow size={15}/> ResoFit · BIGO Control Room</p><h1 className="mt-2 text-3xl font-semibold">Capture, highlights & automation</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Host registry, capture outcomes, highlight pipeline and publishing queue. Runtime state is read from Supabase; registry edits are applied directly to the source registry.</p></div>
            <button onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:border-gold disabled:opacity-50"><RefreshCw size={15} className={busy ? "animate-spin" : ""}/> Refresh</button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Last refreshed: {fmt(updatedAt)}</p>
          <nav className="mt-5 flex flex-wrap gap-2">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider ${tab === t ? "bg-gold text-black" : "border border-border text-muted-foreground hover:border-gold"}`}>{t}</button>)}</nav>
        </header>

        {error && <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"><AlertTriangle className="mr-2 inline" size={16}/>{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle2 className="mr-2 inline" size={16}/>{notice}</div>}

        {tab === "overview" && <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Registry hosts", metrics.hosts, Users], ["Active + capture-enabled", metrics.active, CheckCircle2],
              ["Highlights recorded", metrics.highlights, Film], ["Published highlights", metrics.published, Activity],
              ["Failed capture jobs", metrics.failed, AlertTriangle], ["Items in publish queue", metrics.queued, Workflow],
            ].map(([label, value, Icon]: any) => <article key={label} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon size={17}/></div><p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p></article>)}
          </section>
          <section className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Recent capture outcomes</h2><div className="mt-4 space-y-3">{jobs.slice(0,8).map(j => <div key={j.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 text-sm"><div><p>{j.host_id || "Host not recorded"}</p><p className="mt-1 text-xs text-muted-foreground">{fmt(j.created_at)}{j.error_message ? " · " + j.error_message : ""}</p></div><span className={statusTone(j.status)}>{j.status}</span></div>)}{!jobs.length && <p className="text-sm text-muted-foreground">No capture-job rows returned by the connected project.</p>}</div></div>
          <div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Recent highlights</h2><div className="mt-4 space-y-3">{highlights.slice(0,8).map(h => <div key={h.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 text-sm"><div><p className="font-medium">{h.title || h.host_name || h.host_id}</p><p className="mt-1 text-xs text-muted-foreground">{h.host_id} · {fmt(h.created_at)}</p></div><span className={statusTone(h.status)}>{h.status}</span></div>)}{!highlights.length && <p className="text-sm text-muted-foreground">No highlight rows returned by the connected project.</p>}</div></div></section>
        </>}

        {tab === "hosts" && <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Users size={18} className="text-gold"/><h2 className="font-semibold">BIGO source registry</h2><span className="text-xs text-muted-foreground">{hosts.length} rows</span></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Host ID</th><th className="p-2">Name</th><th className="p-2">Active</th><th className="p-2">Capture</th><th className="p-2">Attestation</th><th className="p-2">Actions</th></tr></thead><tbody>{hosts.map(h => <tr key={h.bigo_id} className="border-t border-border/60"><td className="p-2 font-mono">{h.bigo_id}</td><td className="p-2">{h.display_name || "—"}</td><td className="p-2">{String(h.active)}</td><td className="p-2">{String(h.capture_enabled)}</td><td className="p-2">{(h.metadata as any)?.commercial_republication_attestation?.status || "Not recorded"}</td><td className="p-2"><div className="flex gap-2"><button disabled={busy} onClick={() => void toggleHost(h, "active")} className="rounded-lg border border-border px-2 py-1 text-xs">Toggle active</button><button disabled={busy} onClick={() => void toggleHost(h, "capture_enabled")} className="rounded-lg border border-border px-2 py-1 text-xs">Toggle capture</button></div></td></tr>)}</tbody></table></div></section>}

        {tab === "highlights" && <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Highlight and replay records</h2><div className="mt-4 space-y-3">{highlights.map(h => <article key={h.id} className="rounded-xl border border-border/70 p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-medium">{h.title || h.host_name || h.host_id}</p><p className="text-xs text-muted-foreground">{h.host_id} · {fmt(h.created_at)}</p></div><span className={statusTone(h.status)}>{h.status}</span></div>{h.original_url && <a className="mt-2 inline-block text-xs text-gold underline" href={h.original_url} target="_blank" rel="noreferrer">Source room</a>}{h.imagekit_url && <a className="ml-4 mt-2 inline-block text-xs text-gold underline" href={h.imagekit_url} target="_blank" rel="noreferrer">Media file</a>}{h.error_message && <p className="mt-2 text-xs text-red-300">{h.error_message}</p>}</article>)}</div></section>}

        {tab === "captures" && <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Capture and publishing queue</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2">Item</th><th className="p-2">Platform</th><th className="p-2">Status</th><th className="p-2">Created</th><th className="p-2">Published</th></tr></thead><tbody>{queue.map(q => <tr key={q.id} className="border-t border-border/60"><td className="p-2">{q.title || q.id}</td><td className="p-2">{q.platform || "—"}</td><td className={`p-2 ${statusTone(q.status)}`}>{q.status}</td><td className="p-2">{fmt(q.created_at)}</td><td className="p-2">{fmt(q.published_at)}</td></tr>)}</tbody></table></div></section>}

        {tab === "config" && <section className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-semibold"><Plus size={17} className="text-gold"/> Add or update host registry</h2><p className="mt-2 text-xs text-muted-foreground">Writes the source registry. Active registry hosts are discovered dynamically by the scheduled capture workflow; no per-host JSON edit is needed.</p><label className="mt-4 block text-xs text-muted-foreground">BIGO host ID<input value={hostId} onChange={e => setHostId(e.target.value)} placeholder="e.g. kisexy" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"/></label><label className="mt-3 block text-xs text-muted-foreground">Display name<input value={hostName} onChange={e => setHostName(e.target.value)} placeholder="Optional display name" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"/></label><label className="mt-3 block text-xs text-muted-foreground">Commercial republication attestation (optional; only enter an actual authorization statement)<textarea value={attestation} onChange={e => setAttestation(e.target.value)} placeholder="Paste the explicit host/rights-holder authorization statement, if you have it." rows={3} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"/></label><button onClick={() => void saveHost()} disabled={busy || !hostId.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"><Save size={15}/> Save registry host</button></div><div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5"><h2 className="font-semibold">Workflow and verified-ID configuration</h2><p className="mt-2 text-sm text-muted-foreground">The capture workflow combines registry hosts with BIGO_HOST_IDS and BIGO_VERIFIED_HOST_IDS. The encrypted GitHub secret values are intentionally not read or exposed by this browser dashboard.</p><ul className="mt-4 list-disc space-y-2 pl-5 text-sm"><li>New active registry host: saved to Supabase; workflow discovers it on a later cycle.</li><li>Verified allowlist membership: manage the encrypted BIGO_VERIFIED_HOST_IDS secret in GitHub Actions settings.</li><li>Session cookie: optional; absent cookie must not stop the normal tokenized capture path.</li><li>Capture archive success is distinct from downstream publication success.</li></ul><a href="https://github.com/EliteFitness101/chatb2k-f9d8a04d/actions" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-gold underline">Open capture workflows <Workflow size={14}/></a></div></section>}

        <footer className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Activity size={14}/> Data from connected Supabase tables; results show only rows readable by the signed-in account. <span>·</span><span>{hosts.length} host records loaded</span></footer>
      </div>
    </main>
  );
}
