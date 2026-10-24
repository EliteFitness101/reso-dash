import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";
import { RefreshCw, Search, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/external-sources")({ component: ExternalSourcesPage });
type Row = Record<string, any>;
type Hit = { url: string; title: string; description: string; query: string; raw: any };
const queries = [
  "gyms fitness pools spas wellness booking Port Harcourt Nigeria official contact",
  "fitness equipment suppliers supplements sports nutrition Nigeria official contact",
  "physiotherapy rehabilitation massage recovery wellness clinics Nigeria",
  "personal trainers yoga pilates gym memberships Nigeria",
  "hotel swimming pools recreational centers spa fitness Port Harcourt",
];
const slug = (s:string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
const unique = (a:string[]) => [...new Set(a)];
function ExternalSourcesPage() {
  const auth = useAuth();
  const [rows,setRows] = useState<Row[]>([]);
  const [hits,setHits] = useState<Hit[]>([]);
  const [q,setQ] = useState("");
  const [filter,setFilter] = useState("all");
  const [busy,setBusy] = useState("");
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [last,setLast] = useState("");
  const load = async () => {
    if(!supabase || !auth.session) return;
    setBusy("load");setError("");
    const r = await supabase.from("resofit_external_business_sources" as any).select("*").order("updated_at",{ascending:false}).limit(1000);
    if(r.error)setError(r.error.message);else{setRows((r.data||[]) as Row[]);setLast(new Date().toLocaleString("en-NG"));}
    setBusy("");
  };
  useEffect(()=>{void load();},[auth.session?.access_token]);
  const discover = async () => {
    if(!supabase)return;setBusy("discover");setError("");setNotice("");setHits([]);
    try {
      const found:Hit[]=[];
      for(const query of queries){
        const r=await supabase.functions.invoke("firecrawl-intelligence-gateway",{body:{action:"search",query,limit:10,lang:"en",country:"ng",observation_type:"external_business_discovery"}});
        if(r.error)throw r.error;if(r.data?.error)throw new Error(String(r.data.error));
        const root=r.data?.result?.data??r.data?.result??{};
        const items=Array.isArray(root)?root:(root.web||root.results||root.data||[]);
        for(const x of items){const url=String(x.url||x.link||"");if(/^https?:\/\//i.test(url))found.push({url,title:String(x.title||url),description:String(x.description||x.snippet||"").slice(0,300),query,raw:x});}
      }
      setHits([...new Map(found.map(x=>[x.url.replace(/\/$/,""),x])).values()]);
      setNotice("Search completed. Candidate records are not verified partners until reviewed.");
    } catch(e){setError(e instanceof Error?e.message:"Firecrawl search failed.");} finally{setBusy("");}
  };
  const importHit = async (h:Hit) => {
    if(!supabase)return;setBusy("import");setError("");setNotice("");
    try{
      const name=h.title.trim()||new URL(h.url).hostname;
      const p={source_key:slug(name)+"-"+slug(new URL(h.url).hostname),business_name:name,business_type:"external_business",categories:["external discovery"],country:"Nigeria",website_url:h.url,source_url:h.url,source_name:"Firecrawl",source_evidence:{query:h.query,description:h.description,discovered_at:new Date().toISOString()},metadata:{search_result:h.raw},verification_status:"discovered",partnership_status:"prospect",ingest_status:"queued",last_checked_at:new Date().toISOString()};
      const r=await supabase.from("resofit_external_business_sources" as any).upsert(p as any,{onConflict:"source_key"});if(r.error)throw r.error;
      setHits(old=>old.filter(x=>x.url!==h.url));setNotice("Imported as an unverified prospect: "+name);await load();
    }catch(e){setError(e instanceof Error?e.message:"Import failed.");}finally{setBusy("");}
  };
  const enrich = async (row:Row) => {
    if(!supabase)return;setBusy("enrich");setError("");setNotice("");
    try{
      const r=await supabase.functions.invoke("firecrawl-intelligence-gateway",{body:{action:"scrape",source_url:row.website_url||row.source_url,formats:["markdown"],onlyMainContent:true,observation_type:"external_business_contact_enrichment"}});
      if(r.error)throw r.error;if(r.data?.error)throw new Error(String(r.data.error));
      const d=r.data?.result?.data??r.data?.result??{};const md=String(d.markdown||d.content||"");
      const em=unique(md.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[]).slice(0,10);
      const ph=unique(md.match(/(?:\+?\d[\d ().-]{7,}\d)/g)||[]).filter(x=>x.replace(/\D/g,"").length>=9&&x.replace(/\D/g,"").length<=15).slice(0,10);
      const social:Record<string,string>={};const re=/https?:\/\/(?:www\.)?(?:instagram\.com|facebook\.com|linkedin\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com|wa\.me)\/[A-Za-z0-9_./?=&%-]+/gi;
      for(const u of md.match(re)||[]){const h=new URL(u).hostname.replace(/^www\./,"");const k=h==="wa.me"?"whatsapp":h.split(".")[0];if(!social[k])social[k]=u;}
      const postcode=md.match(/\b\d{6}\b/)?.[0]||null;
      const maps=(md.match(/https?:\/\/[^\s)\]>"]+/g)||[]).find(x=>/google\.[^/]+\/maps|maps\.app\.goo\.gl/i.test(x))||null;
      const patch:any={social_links:{...(row.social_links||{}),...social},source_evidence:{...(row.source_evidence||{}),scraped_url:row.website_url||row.source_url,scraped_at:new Date().toISOString(),firecrawl_event_id:r.data?.event?.id||null,extracted_emails:em,extracted_phone_candidates:ph,extracted_postcode:postcode,markdown_excerpt:md.slice(0,5000)},last_checked_at:new Date().toISOString(),updated_at:new Date().toISOString()};
      if(!row.email&&em.length)patch.email=em[0];if(!row.phone&&ph.length)patch.phone=ph[0];if(!row.whatsapp&&social.whatsapp)patch.whatsapp=social.whatsapp;if(!row.postcode&&postcode)patch.postcode=postcode;if(!row.google_business_url&&maps)patch.google_business_url=maps;
      if(row.verification_status==="discovered")patch.verification_status="public_source_checked";
      patch.ingest_status=(em.length||ph.length||Object.keys(social).length)?"needs_review":row.ingest_status;
      const u=await supabase.from("resofit_external_business_sources" as any).update(patch).eq("id",row.id);if(u.error)throw u.error;
      setNotice("Enriched "+row.business_name+": "+em.length+" email candidates, "+ph.length+" phone candidates, "+Object.keys(social).length+" social URLs. Review before outreach.");await load();
    }catch(e){setError(e instanceof Error?e.message:"Scrape/enrichment failed.");}finally{setBusy("");}
  };
  const setStatus = async (row:Row,field:string,value:string) => {
    if(!supabase)return;setBusy("status");const r=await supabase.from("resofit_external_business_sources" as any).update({[field]:value,updated_at:new Date().toISOString()}).eq("id",row.id);if(r.error)setError(r.error.message);else setNotice("Status saved for "+row.business_name);await load();
  };
  if(auth.loading)return <Gate title="Checking access" body="Verifying signed-in session." />;
  if(!auth.session)return <Gate title="Sign in required" body="Sign in with your ResoFit account." />;
  if(!auth.isAdmin&&!auth.isSuperAdmin)return <Gate title="Admin access required" body="This dashboard is restricted to authorized admins." />;
  if(!auth.twoFactorVerified)return <Gate title="MFA required" body="Complete verified MFA to access business contacts and onboarding controls." />;
  const visible=rows.filter(r=>(!q||[r.business_name,r.business_type,r.city,r.state,r.email,r.phone,r.website_url].join(" ").toLowerCase().includes(q.toLowerCase()))&&(filter==="all"||[r.verification_status,r.partnership_status,r.ingest_status,r.business_type].includes(filter)));
  return <main className="min-h-screen bg-[#08090b] text-white"><div className="mx-auto max-w-[1450px] space-y-5 px-4 py-6">
    <header className="rounded-3xl border border-amber-200/25 bg-white/[0.035] p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.28em] text-amber-200">ResoFit · CEO resources</p><h1 className="mt-2 text-3xl font-semibold">External Business Sources</h1><p className="mt-2 max-w-3xl text-sm text-white/55">Commerce, gyms, pools, spas, wellness, supplements, booking services, suppliers and public business contacts. Discovered contacts remain unverified until reviewed.</p></div><div className="flex gap-2"><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs"><RefreshCw size={14}/>Refresh</button><button onClick={()=>void discover()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-amber-200 px-3 py-2 text-xs font-bold text-black"><Search size={14}/>{busy==="discover"?"Searching…":"Discover with Firecrawl"}</button></div></div><p className="mt-3 text-[10px] text-white/35">Signed in: {auth.email} · Last refreshed: {last}</p></header>
    {error&&<div className="rounded-xl border border-rose-400/30 p-3 text-sm text-rose-200">{error}</div>}{notice&&<div className="rounded-xl border border-emerald-400/25 p-3 text-sm text-emerald-100">{notice}</div>}
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Records",rows.length],["Source checked",rows.filter(r=>r.verification_status!=="discovered").length],["Contact channels",rows.filter(r=>r.email||r.phone||r.whatsapp).length],["Active partners",rows.filter(r=>r.partnership_status==="active").length],["Needs review",rows.filter(r=>r.ingest_status==="needs_review"||r.verification_status==="discovered").length]].map(([label,value])=><article key={String(label)} className="rounded-2xl border border-white/10 p-4"><div className="text-xs text-white/45">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></article>)}</section>
    {hits.length>0&&<section className="rounded-2xl border border-amber-200/20 p-4"><h2 className="mb-3 font-semibold">Firecrawl candidates · {hits.length}</h2><div className="space-y-2">{hits.map(h=><article key={h.url} className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 p-3 sm:flex-row"><div className="min-w-0"><a href={h.url} target="_blank" rel="noreferrer" className="text-sm text-amber-100 underline">{h.title}</a><p className="break-all text-[10px] text-white/40">{h.url}</p><p className="mt-1 text-xs text-white/55">{h.description}</p></div><button onClick={()=>void importHit(h)} disabled={!!busy} className="rounded-lg border border-amber-200/25 px-3 py-2 text-xs">Import prospect</button></article>)}</div></section>}
    <section className="rounded-2xl border border-white/10 p-4"><div className="flex flex-col gap-3 md:flex-row"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search business, category, contact, location…" className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#101114] px-3 py-2 text-sm"><option value="all">All records</option>{["discovered","public_source_checked","contact_verified","business_verified","prospect","contacted","onboarding","contracted","active","needs_review"].map(x=><option key={x} value={x}>{x}</option>)}</select></div>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="text-[10px] uppercase text-white/40"><tr>{["Business","Location","Email / phone / WhatsApp","Social / booking","Verification","Partnership","Ingest","Actions"].map(x=><th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id} className="border-t border-white/10 align-top"><td className="p-2"><b>{r.business_name}</b><div className="mt-1 text-[10px] text-white/40">{r.business_type}</div><a href={r.website_url||r.source_url} target="_blank" rel="noreferrer" className="break-all text-[10px] text-amber-100 underline">{r.website_url||r.source_url}<ExternalLink size={10} className="inline"/></a>{r.google_business_url&&<a href={r.google_business_url} target="_blank" rel="noreferrer" className="block text-[10px] text-emerald-200 underline">Google Business / Maps</a>}</td><td className="p-2">{[r.city,r.state,r.country].filter(Boolean).join(", ")||"Unknown"}<div className="mt-1 text-white/45">{r.address||"Address not recorded"}</div><div className="text-white/35">Postcode: {r.postcode||"not found"}</div></td><td className="p-2">{r.email||"Email not found"}<div className="mt-1">{r.phone||"Phone not found"}</div><div className="mt-1">{r.whatsapp||"WhatsApp not confirmed"}</div></td><td className="p-2">{Object.entries(r.social_links||{}).map(([k,v])=><a key={k} href={String(v)} target="_blank" rel="noreferrer" className="mr-2 text-amber-100 underline">{k}</a>)}{r.booking_url&&<a href={r.booking_url} target="_blank" rel="noreferrer" className="block text-amber-100 underline">Booking/contact</a>}</td><td className="p-2"><select value={r.verification_status} onChange={e=>void setStatus(r,"verification_status",e.target.value)} className="rounded border border-white/10 bg-[#101114] p-1">{["discovered","public_source_checked","contact_verified","business_verified","rejected"].map(x=><option key={x}>{x}</option>)}</select></td><td className="p-2"><select value={r.partnership_status} onChange={e=>void setStatus(r,"partnership_status",e.target.value)} className="rounded border border-white/10 bg-[#101114] p-1">{["prospect","contacted","onboarding","contracted","active","paused","rejected"].map(x=><option key={x}>{x}</option>)}</select></td><td className="p-2"><select value={r.ingest_status} onChange={e=>void setStatus(r,"ingest_status",e.target.value)} className="rounded border border-white/10 bg-[#101114] p-1">{["queued","enriched","needs_review","approved","published","failed"].map(x=><option key={x}>{x}</option>)}</select></td><td className="p-2"><button onClick={()=>void enrich(r)} disabled={!!busy} className="inline-flex items-center gap-1 rounded-lg border border-amber-200/20 px-2 py-1.5 text-[10px]"><Sparkles size={11}/>{busy==="enrich"?"Scraping…":"Enrich metadata"}</button></td></tr>)}</tbody></table></div><p className="mt-3 text-[10px] text-white/35">Scraped contact values are candidates and must be reviewed. Phone numbers are not assumed to be WhatsApp. Do not bulk-message businesses without lawful basis and opt-out controls.</p></section>
  </div></main>;
}
function Gate({title,body}:{title:string;body:string}){return <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-5 text-white"><section className="max-w-lg rounded-3xl border border-amber-200/20 p-7"><ShieldCheck className="mb-3 text-amber-200"/><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-3 text-sm text-white/55">{body}</p><a href="/ceo-growth" className="mt-5 inline-block underline">Return to CEO dashboard</a></section></main>;}
