import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, Sparkles, LayoutTemplate } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";

export const Route = createFileRoute("/experience-factory")({ component: ExperienceFactoryPage });

type Page = {
  id:string; page_type:string; source_type:string; source_key:string; slug:string;
  canonical_path:string; template_key:string; status:string; version:number; updated_at:string;
};

const TYPES = [
  ["product","product","Canonical commerce product"],
  ["digital_product","product","Digital product / media-led offer"],
  ["service","service","Service detail"],
  ["booking","service","Bookable service experience"],
  ["course","course","Academic / education course"],
  ["program","program","Structured wellness / fitness program"],
  ["provider","provider","Coach / practitioner / provider"],
  ["location","location","Hub / location"],
  ["event","event","Event / registration"],
  ["campaign","campaign","Conversion landing experience"],
  ["article","article","Knowledge / academic content"],
] as const;

function ExperienceFactoryPage(){
  const {session,loading:authLoading,isAdmin,isSuperAdmin,twoFactorVerified}=useAuth();
  const [pages,setPages]=useState<Page[]>([]);
  const [type,setType]=useState("product");
  const [sourceKey,setSourceKey]=useState("");
  const [slug,setSlug]=useState("");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");

  async function load(){
    if(!session)return;
    setLoading(true); setMessage("");
    const {data,error}=await supabase.from("experience_page_registry").select("id,page_type,source_type,source_key,slug,canonical_path,template_key,status,version,updated_at").order("updated_at",{ascending:false}).limit(100);
    if(error)setMessage(error.message); else setPages((data??[]) as Page[]);
    setLoading(false);
  }
  useEffect(()=>{void load()},[session?.access_token]);

  async function build(){
    if(!sourceKey.trim())return;
    setLoading(true);setMessage("");
    const selected=TYPES.find(x=>x[0]===type);
    const {data,error}=await supabase.rpc("build_experience_page",{
      _page_type:type,_source_type:selected?.[1]??type,_source_key:sourceKey.trim(),_slug:slug.trim()||null,
      _template_key:type+".v1",_manifest:{factory:"resofit_experience_factory",generation:"canonical-registry"},_seo:{},
      _commerce:{},_booking:{},_access:{},_media:{}
    });
    if(error)setMessage(error.message); else { setMessage("Experience page built from canonical source. Existing commerce, booking and fulfillment systems were not replaced."); setSourceKey(""); setSlug(""); await load(); }
    setLoading(false);
  }

  if(authLoading)return <Gate text="Authenticating experience factory…"/>;
  if(!session)return <Gate text="Sign in to access the experience factory."/>;
  if(!isAdmin&&!isSuperAdmin)return <Gate text="Admin authorization is required."/>;
  if(isAdmin&&!isSuperAdmin&&!twoFactorVerified)return <Gate text="Complete MFA before opening the experience factory."/>;
  return <main className="min-h-screen bg-[#07080a] text-white"><div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
    <header className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-5">
      <div><div className="flex items-center gap-2 text-xs uppercase tracking-[.28em] text-emerald-400"><LayoutTemplate className="h-4 w-4"/> ResoFit Experience Factory</div>
      <h1 className="mt-2 text-3xl font-semibold">Dynamic Experience & Page Factory</h1>
      <p className="mt-2 max-w-3xl text-sm text-white/50">Builds versioned page manifests from canonical product, service, education, booking and ecosystem records. Rendering remains on the existing customer surfaces.</p></div>
      <button onClick={()=>void load()} className="rounded-xl border border-white/10 bg-white/[.04] p-3"><RefreshCw className={loading?"h-4 w-4 animate-spin":"h-4 w-4"}/></button>
    </header>
    {message&&<div className="mb-5 rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-white/70">{message}</div>}
    <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-400"/><h2 className="text-sm font-semibold">Build experience</h2></div>
        <label className="mt-5 block text-[10px] uppercase tracking-widest text-white/40">Experience type</label>
        <select value={type} onChange={e=>setType(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm">{TYPES.map(x=><option key={x[0]} value={x[0]}>{x[0]} — {x[2]}</option>)}</select>
        <label className="mt-4 block text-[10px] uppercase tracking-widest text-white/40">Canonical source key</label>
        <input value={sourceKey} onChange={e=>setSourceKey(e.target.value)} placeholder={type.includes("product")?"SKU e.g. RESO-DIG-LIFE-001":type==="course"?"course slug":"service / program / provider key"} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"/>
        <label className="mt-4 block text-[10px] uppercase tracking-widest text-white/40">Slug override (optional)</label>
        <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="Leave blank to use canonical slug" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none"/>
        <button disabled={!sourceKey.trim()||loading} onClick={()=>void build()} className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-xs font-semibold uppercase tracking-widest text-black disabled:opacity-40">Build page manifest</button>
        <p className="mt-4 text-[10px] leading-5 text-white/40">Build is additive. It does not create products, change prices, publish checkout, alter fulfillment, or replace existing routes.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Experience registry</h2><span className="text-[10px] text-white/40">{pages.length} records</span></div>
        <div className="space-y-2">{pages.length?pages.map(p=><div key={p.id} className="grid gap-2 rounded-xl border border-white/8 bg-black/20 p-3 md:grid-cols-[1fr_auto]"><div><div className="text-xs font-semibold">{p.canonical_path}</div><div className="mt-1 font-mono text-[10px] text-white/35">{p.page_type} · {p.source_key} · {p.template_key} · v{p.version}</div></div><span className="self-start rounded-full bg-white/5 px-2 py-1 text-[10px]">{p.status}</span></div>):<div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-white/40">No generated experience manifests yet.</div>}</div>
      </div>
    </section>
    <div className="mt-5 grid gap-3 md:grid-cols-4">{["Canonical data","Dynamic rendering","ChatB2K context","Commerce / booking"].map((x,i)=><div key={x} className="rounded-xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] uppercase tracking-widest text-emerald-400">0{i+1}</div><div className="mt-2 text-xs font-semibold">{x}</div></div>)}</div>
  </div></main>;
}
function Gate({text}:{text:string}){return <main className="flex min-h-screen items-center justify-center bg-[#07080a] text-white"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-7 text-sm text-white/60">{text}</div></main>}
