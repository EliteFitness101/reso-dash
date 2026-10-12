import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, Bot, CheckCircle2, ChevronDown, ChevronUp,
  CircleDot, Clock3, Database, ExternalLink, Filter, Mail, PauseCircle, PlayCircle,
  RefreshCw, Search, ShieldAlert, ShieldCheck, TerminalSquare, Wrench, XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/_shell/agents")({ component: ChatB2KAgentsPage });

type Agent = {
  agent_id: string; agent_code?: string | null; name?: string | null; domain?: string | null;
  purpose?: string | null; description?: string | null; status?: string | null; version?: string | null;
  model?: string | null; allowed_tools?: string[] | null; allowed_tables?: string[] | null;
  allowed_routes?: string[] | null; allowed_actions?: string[] | null; permission_level?: string | null;
  enabled?: boolean; health_status?: string | null; last_tested_at?: string | null; updated_at?: string | null;
  kill_switch_enabled?: boolean; kill_switch_reason?: string | null; assigned_email?: string | null;
  email_aliases?: {address:string;purpose?:string;visibility?:string;status?:string}[];
  route_endpoints?: {route:string;url:string}[];
  node?: {parent_node_id?:string;layer?:string;access_level?:string;status?:string;provider_stack?:string[];capability_scope?:Record<string,unknown>;kill_switch_enabled?:boolean} | null;
  historical?: {matched_runs:number;last_run_at?:string|null;latest_runs?:{id:string;run_key:string;engine:string;status:string;started_at:string;completed_at?:string|null;counts?:unknown}[];matched_tasks:number;latest_tasks?:{id:string;task_type:string;channel:string;status:string;due_at?:string|null;created_at:string}[];matched_learning_events:number;latest_learning_events?:{id:string;source:string;event_type:string;topic?:string;action?:string;created_at:string}[]};
  runtime_evidence?: string; metadata?: Record<string,unknown>; contract?: Record<string,unknown>;
};
type Snapshot = {
  ok: boolean; generated_at: string;
  authority: {caller_email:string;can_control:boolean;global_kill_switch:boolean;global_kill_reason?:string|null;global_kill_switched_at?:string|null};
  summary: {requested_agent_ids:number;registered_agents:number;missing_agent_ids:string[];enabled_and_registry_callable:number;disabled:number;killed:number;unhealthy:number;agents_with_assigned_email:number;agents_with_tools:number;agents_with_routes:number;recent_run_records:number;recent_task_records:number;learning_events:number;kill_switch_events:number;tool_gateway_audit_events:number};
  agents: Agent[];
  routes: {route_id:string;provider:string;service_type:string;status:string;owner_node_id?:string;endpoint_class?:string;endpoint_url?:string;updated_at:string}[];
  recent_runs: {id:string;run_key:string;engine:string;status:string;started_at:string;completed_at?:string|null;counts?:unknown}[];
  recent_tasks: {id:string;task_type:string;channel:string;due_at?:string|null;priority:number;status:string;created_at:string;payload?:Record<string,unknown>}[];
  recent_learning_events: {id:string;platform:string;source:string;event_type:string;topic?:string;action?:string;created_at:string}[];
  kill_switch_events: {scope:string;target_id:string;enabled:boolean;reason?:string;created_at:string}[];
  tool_gateway_audit: {created_at:string;actor_role:string;actor_id:string;action:string;tool_name?:string;outcome:string;http_status?:number}[];
};

const fmt = (value?: string | null) => value ? new Date(value).toLocaleString() : "No timestamp recorded";
const arr = (value?: string[] | null) => Array.isArray(value) ? value : [];
const pill = (value: string, tone: "green" | "amber" | "red" | "muted" = "muted") => {
  const cls = tone === "green" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : tone === "amber" ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : tone === "red" ? "border-rose-400/30 bg-rose-400/10 text-rose-300" : "border-white/10 bg-white/5 text-white/60";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{value}</span>;
};
function ChatB2KAgentsPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("chatb2k101");
  const [panel, setPanel] = useState<"overview"|"tools"|"jobs"|"governance">("overview");

  const refresh = useCallback(async () => {
    if (!supabase) { setError("Supabase client is not configured in this build."); return; }
    setBusy(true); setError("");
    const { data, error: invokeError } = await supabase.functions.invoke("chatb2k-agent-command-center", { body: { action: "snapshot" } });
    if (invokeError) setError(invokeError.message || "Could not load the agent command center.");
    else if (!data?.ok) setError(data?.error || "Command center returned an error.");
    else { setSnapshot(data as Snapshot); setNotice(""); }
    setBusy(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const agents = snapshot?.agents ?? [];
  const filtered = useMemo(() => agents.filter(agent => {
    const haystack = [agent.agent_id, agent.agent_code, agent.name, agent.domain, agent.purpose, agent.assigned_email].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "killed" ? agent.kill_switch_enabled : statusFilter === "needs-tools" ? !arr(agent.allowed_tools).length : statusFilter === "unhealthy" ? agent.health_status === "FAILED" : agent.status === statusFilter.toUpperCase());
    return matchesSearch && matchesStatus;
  }), [agents, search, statusFilter]);
  const selected = agents.find(a => a.agent_id === selectedId) ?? agents[0] ?? null;

  const command = async (action: "set_agent_kill_switch"|"set_global_kill_switch", enabled: boolean, agentId?: string) => {
    if (!supabase || !snapshot?.authority.can_control) return;
    const target = agentId || "GLOBAL ORCHESTRATION";
    const reason = enabled ? window.prompt(`Reason for pausing ${target} (required for audit):`, "CEO-directed operational pause") : "";
    if (enabled && (!reason || reason.trim().length < 6)) return;
    const question = enabled ? `Pause ${target}? New work may stop routing until resumed.` : `Resume ${target}?`;
    if (!window.confirm(question)) return;
    const key = agentId || "global";
    setActionBusy(key); setError(""); setNotice("");
    const { data, error: invokeError } = await supabase.functions.invoke("chatb2k-agent-command-center", {
      body: { action, enabled, ...(agentId ? { agent_id: agentId } : {}), reason: reason?.trim() || null },
    });
    if (invokeError || !data?.ok) setError(invokeError?.message || data?.error || "The control action failed.");
    else { setNotice(`${target}: ${enabled ? "paused" : "resumed"} at ${fmt(data.changed_at)}. Audit event recorded.`); await refresh(); }
    setActionBusy(null);
  };

  return (
    <div className="space-y-4 pb-6">
      <section className="overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-5 shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300"><Bot size={14}/> LordB2K · State Command</div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Agent Command Center</h1>
            <p className="mt-1 text-xs leading-relaxed text-white/55">chatb2k101 · 72-agent workforce + chatb2k101 root controller · live registry, route, job and control evidence</p>
          </div>
          <button onClick={() => void refresh()} disabled={busy} aria-label="Refresh agent data" className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-amber-200 hover:bg-white/10 disabled:opacity-50"><RefreshCw size={17} className={busy ? "animate-spin" : ""}/></button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {pill(snapshot?.authority.global_kill_switch ? "GLOBAL PAUSE ACTIVE" : "GLOBAL PAUSE OFF", snapshot?.authority.global_kill_switch ? "red" : "green")}
          {pill(snapshot?.authority.can_control ? "CEO CONTROL ENABLED" : "READ-ONLY VIEW", snapshot?.authority.can_control ? "green" : "amber")}
          <span className="text-[10px] text-white/40">Snapshot: {fmt(snapshot?.generated_at)}</span>
        </div>
        {snapshot?.authority.global_kill_switch && <div className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200"><ShieldAlert size={14} className="mr-1 inline"/> Global kill switch is active: {snapshot.authority.global_kill_reason || "No reason recorded"}</div>}
        {snapshot?.authority.can_control && <div className="mt-4 flex gap-2">
          <button disabled={!!actionBusy} onClick={() => void command("set_global_kill_switch", !snapshot.authority.global_kill_switch)} className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${snapshot.authority.global_kill_switch ? "bg-emerald-300 text-black hover:bg-emerald-200" : "border border-rose-300/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"}`}>
            {snapshot.authority.global_kill_switch ? <><PlayCircle size={15} className="mr-1 inline"/> Resume all orchestration</> : <><PauseCircle size={15} className="mr-1 inline"/> Global kill switch</>}
          </button>
        </div>}
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-xs text-rose-200"><AlertTriangle size={14} className="mr-1 inline"/>{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200"><CheckCircle2 size={14} className="mr-1 inline"/>{notice}</div>}

      <section className="grid grid-cols-2 gap-2">
        {[
          ["Registered", snapshot?.summary.registered_agents ?? "—", "of 73 expected"],
          ["Registry callable", snapshot?.summary.enabled_and_registry_callable ?? "—", "enabled · not killed"],
          ["Missing IDs", snapshot?.summary.missing_agent_ids.length ?? "—", "not in agent registry"],
          ["With tools", snapshot?.summary.agents_with_tools ?? "—", "declared tool permissions"],
          ["Run records", snapshot?.summary.recent_run_records ?? "—", "sampled history"],
          ["Gateway audit", snapshot?.summary.tool_gateway_audit_events ?? "—", "tool invocations logged"],
        ].map(([label,value,sub]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{label}</div>
          <div className="mt-1 text-2xl font-black tabular-nums text-white">{value}</div>
          <div className="mt-1 text-[10px] text-white/35">{sub}</div>
        </div>)}
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/75 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3">
          <Search size={15} className="text-white/35"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agent, domain, role or email…" className="w-full bg-transparent py-3 text-xs text-white outline-none placeholder:text-white/30"/>
          <Filter size={14} className="text-white/30"/>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {[["all","All"],["enabled","Enabled"],["killed","Paused"],["unhealthy","Unhealthy"],["needs-tools","No tools"]].map(([value,label]) => <button key={value} onClick={() => setStatusFilter(value)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${statusFilter===value ? "border-amber-300/50 bg-amber-300/10 text-amber-200" : "border-white/10 text-white/45 hover:bg-white/5"}`}>{label}</button>)}
        </div>
        <div className="mt-3 space-y-2">
          {filtered.map(agent => {
            const isSelected = selected?.agent_id === agent.agent_id;
            const active = agent.enabled && agent.status === "ENABLED" && !agent.kill_switch_enabled && agent.health_status !== "FAILED";
            return <div key={agent.agent_id} className={`rounded-xl border p-3 transition ${isSelected ? "border-amber-300/40 bg-amber-300/[0.05]" : "border-white/[0.07] bg-white/[0.02]"}`}>
              <button onClick={() => {setSelectedId(agent.agent_id);setPanel("overview");}} className="w-full text-left">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 rounded-lg border border-white/10 bg-black/30 p-2 text-amber-200"><Bot size={15}/></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5"><span className="text-[10px] font-bold text-amber-200">{agent.agent_id}</span>{pill(agent.kill_switch_enabled ? "paused" : active ? "enabled" : agent.status || "unknown", agent.kill_switch_enabled ? "red" : active ? "green" : "amber")}</div>
                    <div className="mt-1 text-xs font-bold leading-snug text-white">{agent.name || agent.agent_code || agent.agent_id}</div>
                    <div className="mt-1 text-[10px] text-white/45">{agent.domain || "unassigned domain"} · {agent.permission_level || "role not set"}</div>
                  </div>
                  {isSelected ? <ChevronUp size={15} className="text-white/40"/> : <ChevronDown size={15} className="text-white/40"/>}
                </div>
              </button>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-black/30 px-2 py-1 text-[10px] text-white/45"><Wrench size={11} className="mr-1 inline"/>{arr(agent.allowed_tools).length} tools</span>
                <span className="rounded-md bg-black/30 px-2 py-1 text-[10px] text-white/45"><Activity size={11} className="mr-1 inline"/>{agent.historical?.matched_runs ?? 0} attributed runs</span>
                {agent.assigned_email && <span className="max-w-full truncate rounded-md bg-black/30 px-2 py-1 text-[10px] text-white/45"><Mail size={11} className="mr-1 inline"/>{agent.assigned_email}</span>}
              </div>
              {isSelected && <div className="mt-3 border-t border-white/10 pt-3">
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {(["overview","tools","jobs","governance"] as const).map(key => <button key={key} onClick={() => setPanel(key)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold capitalize ${panel===key ? "bg-amber-300 text-black" : "bg-white/5 text-white/50"}`}>{key}</button>)}
                </div>
                {panel === "overview" && <div className="space-y-2 text-xs">
                  <p className="text-white/70">{agent.description || agent.purpose || "No purpose description recorded."}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Metric label="Health" value={agent.health_status || "Unknown"}/>
                    <Metric label="Last tested" value={fmt(agent.last_tested_at)}/>
                    <Metric label="Registry updated" value={fmt(agent.updated_at)}/>
                    <Metric label="Last attributed run" value={fmt(agent.historical?.last_run_at)}/>
                  </div>
                  <div className="rounded-xl bg-black/30 p-3">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Assigned mail</div>
                    <div className="break-words text-white/80">{agent.assigned_email || "No individual control email assigned"}</div>
                    {agent.email_aliases?.length ? <div className="mt-2 space-y-1">{agent.email_aliases.map(alias => <div key={alias.address} className="flex flex-wrap justify-between gap-2 text-[10px] text-white/50"><span>{alias.address}</span><span>{alias.purpose || alias.visibility || alias.status}</span></div>)}</div> : <div className="mt-1 text-[10px] text-white/35">No email aliases routed to this agent.</div>
                  </div>
                  <div className="text-[10px] text-white/35">Execution evidence: {agent.runtime_evidence === "historical_agent_id_match" ? "historical records reference this agent ID" : "no per-agent attribution found in sampled runs/tasks/learning events"}</div>
                </div>}
                {panel === "tools" && <div className="space-y-3">
                  <InfoList title="Allowed tools / APIs" values={arr(agent.allowed_tools)} empty="No tools are declared for this agent."/>
                  <InfoList title="Registered routes" values={arr(agent.allowed_routes)} empty="No route is declared for this agent."/>
                  <InfoList title="Allowed actions" values={arr(agent.allowed_actions)} empty="No action is declared for this agent."/>
                  <InfoList title="Allowed tables" values={arr(agent.allowed_tables)} empty="No table permissions are declared."/>
                  <div className="space-y-1">{agent.route_endpoints?.map(route => <a key={route.route} href={route.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-white/10 p-2 text-[10px] text-amber-200 hover:bg-white/5"><span className="break-all">{route.route}</span><ExternalLink size={12} className="shrink-0"/></a>)}</div>
                </div>}
                {panel === "jobs" && <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2"><Metric label="Matched runs" value={String(agent.historical?.matched_runs ?? 0)}/><Metric label="Matched tasks" value={String(agent.historical?.matched_tasks ?? 0)}/><Metric label="Learning events" value={String(agent.historical?.matched_learning_events ?? 0)}/></div>
                  <div className="space-y-2">{(agent.historical?.latest_runs ?? []).map(run => <div key={run.id} className="rounded-lg border border-white/10 p-2"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-white">{run.engine}</span>{pill(run.status, run.status === "completed" ? "green" : run.status === "degraded" ? "amber" : "muted")}</div><div className="mt-1 text-[10px] text-white/40">{run.run_key} · {fmt(run.started_at)}</div></div>)}</div>
                  {!agent.historical?.latest_runs?.length && <div className="rounded-lg border border-dashed border-white/10 p-3 text-[10px] text-white/40">No historical run is explicitly attributable to this agent in the current 500-run sample. Engine-level history is shown below.</div>}
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Recent engine-level jobs</div>
                  {(snapshot?.recent_runs ?? []).slice(0,8).map(run => <div key={run.id} className="rounded-lg bg-white/[0.03] p-2"><div className="text-[10px] text-white/75">{run.engine}</div><div className="mt-1 text-[10px] text-white/40">{run.status} · {fmt(run.started_at)}</div></div>)}
                </div>}
                {panel === "governance" && <div className="space-y-3 text-xs">
                  <div className="rounded-xl border border-white/10 p-3"><div className="mb-2 flex items-center gap-2 text-white"><ShieldCheck size={15} className="text-amber-200"/>Authority & state</div><div className="grid grid-cols-2 gap-2"><Metric label="Permission" value={agent.permission_level || "Unset"}/><Metric label="Enabled" value={String(agent.enabled)}/><Metric label="Status" value={agent.status || "Unset"}/><Metric label="Node status" value={agent.node?.status || "No node record"}/></div></div>
                  <div className="rounded-xl border border-white/10 p-3"><div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Kill switch</div><div className="text-white/70">{agent.kill_switch_enabled ? `Paused: ${agent.kill_switch_reason || "reason not recorded"}` : "Agent kill switch is off."}</div>{snapshot?.authority.can_control && <button disabled={!!actionBusy} onClick={() => void command("set_agent_kill_switch", !agent.kill_switch_enabled, agent.agent_id)} className={`mt-3 w-full rounded-lg px-3 py-2 font-bold disabled:opacity-50 ${agent.kill_switch_enabled ? "bg-emerald-300 text-black" : "border border-rose-300/25 bg-rose-400/10 text-rose-200"}`}>{actionBusy === agent.agent_id ? "Applying…" : agent.kill_switch_enabled ? "Resume agent" : "Pause agent"}</button>}</div>
                  <div className="text-[10px] text-white/40">Changes require the authenticated CEO identity and are written to the kill-switch event ledger and admin audit log.</div>
                </div>}
              </div>}
            </div>;
          })}
          {!filtered.length && <div className="p-6 text-center text-xs text-white/40">No agents match this filter.</div>}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/75 p-3">
        <div className="mb-3 flex items-center justify-between"><div className="text-xs font-bold text-white"><TerminalSquare size={14} className="mr-1 inline text-amber-200"/> Recent control evidence</div><span className="text-[10px] text-white/35">{snapshot?.tool_gateway_audit.length ?? 0} gateway events</span></div>
        {(snapshot?.tool_gateway_audit ?? []).slice(0,8).map((event,i) => <div key={event.request_id || event.created_at+i} className="flex items-start justify-between gap-3 border-t border-white/[0.06] py-2"><div className="min-w-0"><div className="break-all text-[10px] text-white/70">{event.action}{event.tool_name ? ` · ${event.tool_name}` : ""}</div><div className="mt-0.5 text-[10px] text-white/35">{event.actor_role} · {fmt(event.created_at)}</div></div>{pill(event.outcome, event.outcome === "success" ? "green" : "amber")}</div>)}
        {!snapshot?.tool_gateway_audit.length && <div className="rounded-xl border border-dashed border-white/10 p-3 text-[10px] text-white/40">No tool-gateway invocation has been recorded yet. Agent registry health is not a substitute for invocation evidence.</div>}
      </section>

      <section className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3 text-[10px] leading-relaxed text-white/45">
        <Database size={13} className="mr-1 inline text-amber-200"/> Source of truth: Supabase registry, orchestration nodes, automation run/task ledgers, learning events, email aliases and gateway audit. Per-agent job attribution is only shown when stored run/task/learning payloads contain the agent ID; unattributed engine runs are not assigned by guesswork.
      </section>
    </div>
  );
}

function Metric({label,value}:{label:string;value:string}) {
  return <div className="min-w-0 rounded-lg bg-black/30 p-2"><div className="text-[9px] uppercase tracking-wider text-white/35">{label}</div><div className="mt-1 break-words text-[10px] font-semibold text-white/75">{value}</div></div>;
}
function InfoList({title,values,empty}:{title:string;values:string[];empty:string}) {
  return <div><div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">{title}</div>{values.length ? <div className="flex flex-wrap gap-1">{values.map(value => <span key={value} className="max-w-full break-all rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-white/65">{value}</span>)}</div> : <div className="text-[10px] text-white/35">{empty}</div>}</div>;
}
