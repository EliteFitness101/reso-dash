import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clapperboard, Image, Play, RefreshCw, Sparkles, Video } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/digital-products")({ component: DigitalProductsFactoryPage });

type Job={id:string;product_sku:string;product_title:string;provider:string;status:string;version:number;asset_count:number;approved_asset_count:number;created_at:string};
type Asset={job_id:string;content_asset_id:string;role:string;required:boolean;status:string};
type Snapshot={jobs:Job[];assets:Asset[]};

function DigitalProductsFactoryPage(){
 const {session,loading:authLoading,isAdmin,isSuperAdmin,twoFactorVerified}=useAuth();
 const [data,setData]=useState<Snapshot>({jobs:[],assets:[]});
 const [loading,setLoading]=useState(false);
 const [sku,setSku]=useState("");
 const [message,setMessage]=useState("");
 const [spec,setSpec]=useState<any>(null);

 async function call(body:any){
  if(!supabase||!session)throw new Error("Sign in required.");
  const {data,error}=await supabase.functions.invoke("digital-product-media-factory",{body});
  if(error)throw error;
  if(!data?.ok)throw new Error(data?.error||"Factory request failed");
  return data;
 }
 async function load(){
  if(!session)return;
  setLoading(true);setMessage("");
  try{const r=await call({action:"status"});setData({jobs:r.jobs||[],assets:r.assets||[]});}
  catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setLoading(false);}
 }
 useEffect(()=>{void load()},[session?.access_token]);

 async function create(){
  setLoading(true);setMessage("");
  try{const r=await call({action:"create_job",product_sku:sku.trim()});setSpec(r.job.generation_spec);setMessage("Factory job created. Generate the listed media in Google Flow, then ingest the resulting assets.");await load();}
  catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setLoading(false);}
 }

 const grouped=useMemo(()=>data.jobs.map(j=>({...j,assets:data.assets.filter(a=>a.job_id===j.id)})),[data]);
 if(authLoading)return <Gate body="Authenticating production factory…"/>;
 if(!session)return <Gate body="Sign in to access the production factory."/>;
 if(!isAdmin&&!isSuperAdmin)return <Gate body="Admin authorization is required."/>;
 if(isAdmin&&!isSuperAdmin&&!twoFactorVerified)return <Gate body="Complete MFA before opening the production factory."/>;

 return <main className="min-h-screen bg-[#07080a] text-white">
  <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
   <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
    <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400"/> Digital media factory</div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Digital Products Factory</h1><p className="mt-1 max-w-3xl text-sm text-white/55">Creates versioned Google Flow / Veo media specifications for canonical digital products. Existing payments, fulfilment, catalogue and content pipelines remain untouched.</p></div>
    <button onClick={()=>void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium"><RefreshCw className={loading?"h-4 w-4 animate-spin":"h-4 w-4"}/>Refresh</button>
   </header>
   {message&&<div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">{message}</div>}
   <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
     <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-400"/><h2 className="text-sm font-semibold">Create media package</h2></div>
     <p className="mt-2 text-xs leading-5 text-white/50">Use the SKU already in the canonical product registry. The factory does not create or change products or prices.</p>
     <div className="mt-4 flex gap-2"><input value={sku} onChange={e=>setSku(e.target.value)} placeholder="e.g. RESO-DIG-LIFE-001" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs outline-none"/><button disabled={!sku.trim()||loading} onClick={()=>void create()} className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-40">Create</button></div>
     {spec&&<div className="mt-5 space-y-2"><div className="text-[10px] uppercase tracking-widest text-white/40">Generation slots</div>{spec.asset_slots.map((x:any)=><div key={x.role} className="rounded-xl border border-white/8 bg-black/20 p-3"><div className="flex items-center justify-between"><span className="text-xs font-semibold">{x.role}</span><span className="text-[10px] text-white/40">{x.type} · {x.aspect_ratio}{x.duration_seconds ? " · "+x.duration_seconds+"s" : ""}</span></div><p className="mt-2 text-[10px] leading-4 text-white/45">{x.prompt}</p></div>)}</div>}
    </div>
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
     <div className="flex items-center gap-2"><Clapperboard className="h-4 w-4 text-emerald-400"/><h2 className="text-sm font-semibold">Factory jobs</h2></div>
     <div className="mt-4 space-y-3">{grouped.length?grouped.map(j=><div key={j.id} className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-semibold">{j.product_title}</div><div className="mt-1 font-mono text-[10px] text-white/40">{j.product_sku} · v{j.version} · {j.provider}</div></div><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold">{j.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2"><Kpi label="Assets" value={String(j.asset_count)}/><Kpi label="Approved" value={String(j.approved_asset_count)}/></div><div className="mt-3 space-y-1">{j.assets.map(a=><div key={a.content_asset_id+a.role} className="flex items-center justify-between rounded-lg border border-white/5 px-2.5 py-2 text-[10px]"><span>{a.role}{a.required?" *":""}</span><span className={a.status==="approved"?"text-emerald-300":"text-white/40"}>{a.status}</span></div>)}</div></div>):<p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-white/40">No factory jobs yet.</p>}</div>
    </div>
   </section>
   <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex items-center gap-2"><Video className="h-4 w-4 text-emerald-400"/><h2 className="text-sm font-semibold">Production contract</h2></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><Contract icon={Play} title="Generate" text="Google Flow / Veo creates the video and image assets from the versioned prompts."/><Contract icon={Image} title="Ingest + QA" text="Existing content-asset-ingestion and ChatB2K/Gemini QA remain the asset verification path."/><Contract icon={CheckCircle2} title="Publish" text="Only explicitly approved packages move toward the existing content, storefront and fulfilment systems."/></div></section>
  </div>
 </main>;
}
function Gate({body}:{body:string}){
 const navigate=useNavigate();
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const signIn=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError("");if(!supabase){setError("Authentication is not configured.");setBusy(false);return;}const {error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error)setError(error.message);else await navigate({to:"/digital-products"});setBusy(false);};
 const needsSignIn=body.includes("Sign in");
 return <main className="flex min-h-screen items-center justify-center bg-[#07080a] px-5 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-7"><div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">ResoFit Digital Factory</div><h1 className="mt-3 text-2xl font-semibold">{needsSignIn?"Sign in": "Access required"}</h1><p className="mt-2 text-sm text-white/55">{body}</p>{needsSignIn&&<form onSubmit={signIn} className="mt-6 space-y-3"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"/><button disabled={busy} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy?"Signing in…":"Sign in"}</button>{error&&<p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">{error}</p>}</form>}{needsSignIn&&<div className="mt-5 grid grid-cols-2 gap-2"><Link to="/signup" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-xs font-medium">Create account</Link><Link to="/forgot-password" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-xs font-medium">Forgot password?</Link></div>}</div></main>}
function Kpi({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-black/20 p-3"><div className="text-[10px] text-white/35">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>}
function Contract({icon:Icon,title,text}:{icon:typeof Play;title:string;text:string}){return <div className="rounded-xl border border-white/8 bg-black/20 p-4"><Icon className="h-4 w-4 text-emerald-400"/><div className="mt-2 text-xs font-semibold">{title}</div><p className="mt-1 text-[10px] leading-4 text-white/45">{text}</p></div>}
