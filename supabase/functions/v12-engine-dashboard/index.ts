import { withSupabase } from "npm:@supabase/server";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
export default { fetch: withSupabase({auth:"user"}, async (_req,ctx)=>{
 const userId=ctx.userClaims?.sub, email=String(ctx.userClaims?.email??"").toLowerCase();
 if(!userId)return json({ok:false,error:"unauthorized"},401);
 const {data:roles}=await ctx.supabaseAdmin.from("user_roles").select("role").eq("user_id",userId);
 const allowed=email==="ceo@resofit.fit"||(roles??[]).some((r:any)=>["admin","moderator","super_admin"].includes(String(r.role??"")));
 if(!allowed)return json({ok:false,error:"forbidden"},403);
 if(_req.method==="POST"){
  const body:any=await _req.json().catch(()=>({}));
  const action=String(body?.action||"");
  const canMutate=email==="ceo@resofit.fit"||(roles??[]).some((r:any)=>["admin","super_admin"].includes(String(r.role??"")));
  if(!canMutate)return json({ok:false,error:"admin_or_ceo_required_for_mutation"},403);
  if(action==="set_provider_route"){
   const routeId=String(body?.route_id||"").trim(),enabled=body?.enabled===true;
   if(!routeId)return json({ok:false,error:"route_id_required"},400);
   const {data:route,error:readError}=await ctx.supabaseAdmin.from("chatb2k_provider_routes").select("route_id,provider,service_type,status,config").eq("route_id",routeId).maybeSingle();
   if(readError)throw readError;
   if(!route)return json({ok:false,error:"provider_route_not_found"},404);
   if(String(route.service_type)!=="social_distribution")return json({ok:false,error:"only_social_distribution_routes_are_mutable_here"},400);
   const config={...(route.config||{}),enabled,approved:enabled,approved_by:userId,approval_updated_at:new Date().toISOString()};
   const {data:updated,error:updateError}=await ctx.supabaseAdmin.from("chatb2k_provider_routes").update({status:enabled?"active":"declared_configured",config,updated_at:new Date().toISOString()}).eq("route_id",routeId).select("route_id,provider,service_type,status,config").single();
   if(updateError)throw updateError;
   return json({ok:true,action,route:updated,applied_immediately:true});
  }
  if(action==="set_publishing_settings"){
   const patch:any={updated_at:new Date().toISOString()};
   if(typeof body?.paused==="boolean")patch.paused=body.paused;
   if(typeof body?.scheduler_enabled==="boolean")patch.scheduler_enabled=body.scheduler_enabled;
   if(Object.keys(patch).length===1)return json({ok:false,error:"paused_or_scheduler_enabled_boolean_required"},400);
   patch.updated_by=userId;
   const {data:updated,error:updateError}=await ctx.supabaseAdmin.from("content_automation_settings").update(patch).eq("id",true).select("id,paused,scheduler_enabled,organization_id,updated_at").single();
   if(updateError)throw updateError;
   return json({ok:true,action,settings:updated,applied_immediately:true});
  }
  return json({ok:false,error:"unsupported_action"},400);
 }
 const [engines,agents,nodes,control,daily,content,growth,security,recruitment,training,certification,learning,socialDestinations,portfolioEvents,syncEvents,portfolioSourceCount,portfolioGeneratedCount,portfolioReviewedCount,healthChecks,providerRoutes,publishingSettings]=await Promise.all([
  ctx.supabaseAdmin.from("resofit_v12_engine_registry").select("*").order("engine_key"),
  ctx.supabaseAdmin.from("chatb2k_agent_registry").select("agent_id,enabled,status,health_status,kill_switch_enabled,metadata").eq("metadata->>control_identity","chatb2k101"),
  ctx.supabaseAdmin.from("chatb2k_orchestration_nodes").select("node_id,enabled,status,health_status,kill_switch_enabled"),
  ctx.supabaseAdmin.from("chatb2k_control_plane").select("kill_switch_enabled,kill_switch_reason,updated_at").eq("id",true).maybeSingle(),
  ctx.supabaseAdmin.from("revenue_engine_daily").select("*").order("business_date",{ascending:false}).limit(7),
  ctx.supabaseAdmin.from("content_queue").select("id",{count:"exact",head:true}),
  ctx.supabaseAdmin.from("cross_platform_growth_intelligence").select("id",{count:"exact",head:true}),
  ctx.supabaseAdmin.from("security_events").select("id",{count:"exact",head:true}),
  ctx.supabaseAdmin.from("farm_candidates").select("id",{count:"exact",head:true}),
  ctx.supabaseAdmin.from("resofit_training_assignments").select("id",{count:"exact",head:true}),
  ctx.supabaseAdmin.from("certificates").select("id",{count:"exact",head:true}),
  ctx.supabaseAdmin.from("chatb2k_learning_events").select("id",{count:"exact",head:true}),
  ctx.supabaseAdmin.from("social_destinations").select("provider,platform,external_channel_id,display_name,active,daily_limit,last_verified_at,capabilities,metadata").order("platform").order("display_name"),
  ctx.supabaseAdmin.from("chatb2k_learning_events").select("id,source,event_type,topic,created_at,observation").in("source",["firecrawl_intelligence_gateway","chatb2k_gemini_firecrawl","chatgpt_human_review"]).order("created_at",{ascending:false}).limit(20),
  ctx.supabaseAdmin.from("resofit_events").select("event_name,created_at,payload").eq("event_name","professional.platform_registry_synced").order("created_at",{ascending:false}).limit(1),
  ctx.supabaseAdmin.from("chatb2k_learning_events").select("id",{count:"exact",head:true}).eq("event_type","portfolio_source_ingested").gte("created_at",new Date(Date.now()-86400000).toISOString()),
  ctx.supabaseAdmin.from("chatb2k_learning_events").select("id",{count:"exact",head:true}).eq("event_type","linkedin_profile_draft_generated"),
  ctx.supabaseAdmin.from("chatb2k_learning_events").select("id",{count:"exact",head:true}).eq("event_type","linkedin_profile_draft_reviewed"),
  ctx.supabaseAdmin.from("system_health_checks").select("service_name,status,latency_ms,version,metadata,checked_at").order("checked_at",{ascending:false}).limit(30),
  ctx.supabaseAdmin.from("chatb2k_provider_routes").select("route_id,provider,service_type,status,owner_node_id,endpoint_class,fallback_provider,config,visibility,updated_at").order("service_type").order("route_id"),
  ctx.supabaseAdmin.from("content_automation_settings").select("paused,scheduler_enabled,organization_id,updated_at").eq("id",true).maybeSingle()
 ]);
 const es=engines.data??[], swarm=agents.data??[], ns=nodes.data??[];
 const destinations=socialDestinations.data??[];
 const portfolioRows=portfolioEvents.data??[];
 const latestDraft=portfolioRows.find((x:any)=>x.event_type==="linkedin_profile_draft_reviewed"||x.event_type==="linkedin_profile_draft_generated")??null;
 const latestSync=(syncEvents.data??[])[0]??null;
 const platformCounts=Object.values(destinations.reduce((acc:any,d:any)=>{const k=String(d.platform||"unknown");acc[k]=acc[k]||{platform:k,total:0,active:0,verified:0,fresh_verified:0};acc[k].total++;if(d.active)acc[k].active++;if(d.active&&d.last_verified_at)acc[k].verified++;if(d.active&&d.last_verified_at&&Date.now()-new Date(d.last_verified_at).getTime()<86400000)acc[k].fresh_verified++;return acc;},{}));
 const since24h=new Date(Date.now()-86400000).toISOString();
 const [credentialRefs,geminiUsage,cronBindings,workerRows,flowRows,mediaRows]=await Promise.all([
  ctx.supabaseAdmin.from("chatb2k_api_key_registry").select("credential_ref,provider,credential_kind,secret_project_ref,secret_store,secret_name,env_name,purpose,status,value_present,last_verified_at").eq("provider","google_gemini").order("credential_ref"),
  ctx.supabaseAdmin.from("chatb2k_gemini_usage").select("function_name,status,http_status,latency_ms,created_at,model").gte("created_at",since24h).order("created_at",{ascending:false}).limit(250),
  ctx.supabaseAdmin.from("chatb2k_infrastructure_bindings").select("binding_id,cron_job_name,function_slug,worker_ref,node_id,status,last_verified_at,evidence").eq("system","supabase_cron").order("cron_job_name"),
  ctx.supabaseAdmin.from("worker_status").select("worker_name,version,last_run_at,last_heartbeat_at,last_duration_ms,last_processed,last_failed,last_skipped,total_runs,total_processed,total_failed,status,updated_at"),
  ctx.supabaseAdmin.from("flow_generation_events").select("status,provider,model,asset_id,created_at,completed_at,failed_at").gte("created_at",since24h).order("created_at",{ascending:false}).limit(250),
  ctx.supabaseAdmin.from("elite_media_generation_jobs").select("job_type,status,output_url,created_at,updated_at").gte("created_at",since24h).order("created_at",{ascending:false}).limit(250)
 ]);
 const gu=geminiUsage.data??[];
 const geminiSuccess=gu.filter((x:any)=>["success","succeeded","ok"].includes(String(x.status??"").toLowerCase())||(Number(x.http_status)>=200&&Number(x.http_status)<300));
 const geminiFailed=gu.filter((x:any)=>Number(x.http_status)>=400||["failed","error"].includes(String(x.status??"").toLowerCase()));
 const keyRefs=(credentialRefs.data??[]).map((x:any)=>({credential_ref:x.credential_ref,credential_kind:x.credential_kind,project_ref:x.secret_project_ref,secret_store:x.secret_store,secret_name:x.secret_name,env_name:x.env_name,purpose:x.purpose,status:x.status,value_present:x.value_present,last_verified_at:x.last_verified_at}));
 const cronRows=(cronBindings.data??[]).map((x:any)=>({binding_id:x.binding_id,job_name:x.cron_job_name,status:x.status,last_verified_at:x.last_verified_at,function_slug:x.function_slug,worker_ref:x.worker_ref,node_id:x.node_id,active:x.evidence?.active??null,runs_24h:x.evidence?.runs_24h??null,latest_run:x.evidence?.latest_run??null,latest_status:x.evidence?.latest_status??null,verification_level:x.evidence?.verification_level??"not_classified",worker_effect_verified:x.evidence?.worker_effect_verified??false,latest_message:x.evidence?.latest_message??null}));
 const flow=(flowRows.data??[]), media=(mediaRows.data??[]);
 const countStatuses=(rows:any[])=>rows.reduce((a:any,x:any)=>{const k=String(x.status??"unknown").toLowerCase();a[k]=(a[k]??0)+1;return a;},{});
 const runtime={
  observed_at:new Date().toISOString(),
  query_ok:{credentials:!credentialRefs.error,gemini:!geminiUsage.error,cron:!cronBindings.error,workers:!workerRows.error,flow:!flowRows.error,media:!mediaRows.error},
  credentials:{provider:"google_gemini",references:keyRefs,present_in_vault_or_registry:keyRefs.filter((x:any)=>x.value_present===true).length,missing:keyRefs.filter((x:any)=>x.value_present===false).length,unverified:keyRefs.filter((x:any)=>x.value_present===null||x.value_present===undefined).length,values_returned:false,interpretation:"Reference metadata only; a present value is not proof of successful provider use or which alias was selected."},
  gemini:{calls_24h:gu.length,success_24h:geminiSuccess.length,failed_24h:geminiFailed.length,last_call_at:gu[0]?.created_at??null,last_success_at:geminiSuccess[0]?.created_at??null,last_failure_at:geminiFailed[0]?.created_at??null,functions:[...new Set(gu.map((x:any)=>x.function_name).filter(Boolean))],key_attribution:"not recorded by the current usage ledger"},
  scheduled_jobs:{total:cronRows.length,scheduler_verified:cronRows.filter((x:any)=>x.latest_status==="succeeded"&&x.status==="runtime_verified").length,blocked:cronRows.filter((x:any)=>x.status==="blocked"||x.latest_status==="failed").length,worker_effect_verified:cronRows.filter((x:any)=>x.worker_effect_verified===true).length,jobs:cronRows},
  workers:(workerRows.data??[]).map((x:any)=>({worker_name:x.worker_name,version:x.version,status:x.status,last_run_at:x.last_run_at,last_heartbeat_at:x.last_heartbeat_at,last_duration_ms:x.last_duration_ms,last_processed:x.last_processed,last_failed:x.last_failed,last_skipped:x.last_skipped,total_runs:x.total_runs,total_processed:x.total_processed,total_failed:x.total_failed,updated_at:x.updated_at,health_evidence:x.last_heartbeat_at?"heartbeat_recorded":"no_runtime_heartbeat"})),
  flow_generation:{events_24h:flow.length,status_counts:countStatuses(flow),assets_linked:flow.filter((x:any)=>Boolean(x.asset_id)).length,latest_event_at:flow[0]?.created_at??null},
  elite_media:{jobs_24h:media.length,status_counts:countStatuses(media),ready_with_output:media.filter((x:any)=>String(x.status).toLowerCase()==="ready"&&Boolean(x.output_url)).length,failed:media.filter((x:any)=>String(x.status).toLowerCase()==="failed").length,latest_updated_at:media.reduce((m:any,x:any)=>!m||String(x.updated_at)>String(m)?x.updated_at:m,null)}
 };
 return json({
  ok:true,generated_at:new Date().toISOString(),engine:"ResoFit V12 / LordB2K State Machine",
  orchestration:{control_identity:"chatb2k101",swarm_population:swarm.length,swarm_enabled:swarm.filter((a:any)=>a.enabled).length,swarm_killed:swarm.filter((a:any)=>a.kill_switch_enabled).length,nodes:ns.length,nodes_killed:ns.filter((n:any)=>n.kill_switch_enabled).length,global_kill:Boolean(control.data?.kill_switch_enabled),global_kill_reason:control.data?.kill_switch_reason??null},
  engines:es,provider_routes:providerRoutes.data??[],publishing_settings:publishingSettings.data??null,revenue:{daily:daily.data??[],today:(daily.data??[])[0]??null},
  operating_evidence:{content_queue:content.count??0,growth_rows:growth.count??0,security_events:security.count??0,recruitment_candidates:recruitment.count??0,training_assignments:training.count??0,certificates:certification.count??0,learning_events:learning.count??0},
  social:{total_destinations:destinations.length,active_destinations:destinations.filter((d:any)=>d.active).length,verified_destinations:destinations.filter((d:any)=>d.active&&d.last_verified_at).length,fresh_verified_destinations:destinations.filter((d:any)=>d.active&&d.last_verified_at&&Date.now()-new Date(d.last_verified_at).getTime()<86400000).length,by_platform:platformCounts,destinations:destinations.map((d:any)=>({provider:d.provider,platform:d.platform,display_name:d.display_name,external_channel_id:d.external_channel_id,active:d.active,daily_limit:d.daily_limit,last_verified_at:d.last_verified_at,verification_status:!d.active?"inactive":!d.last_verified_at?"unverified":Date.now()-new Date(d.last_verified_at).getTime()>86400000?"stale":"fresh",capabilities:d.capabilities,queue_paused:Boolean(d.metadata?.is_queue_paused)})),last_sync:latestSync?{created_at:latestSync.created_at,payload:latestSync.payload}:null,query_ok:!socialDestinations.error},
  qa:{latest_checks:(healthChecks.data??[]).map((c:any)=>({...c,status:Date.now()-new Date(c.checked_at).getTime()>86400000?"stale":c.status})),query_ok:!healthChecks.error},
  portfolio:{source_observations_24h:portfolioSourceCount.count??0,generated_drafts:portfolioGeneratedCount.count??0,reviewed_drafts:portfolioReviewedCount.count??0,latest_draft:latestDraft?{id:latestDraft.id,source:latestDraft.source,event_type:latestDraft.event_type,topic:latestDraft.topic,created_at:latestDraft.created_at,linkedin_headline:latestDraft.observation?.linkedin_headline??latestDraft.observation?.profile_draft?.linkedin_headline??null,source_urls:latestDraft.observation?.source_citations??latestDraft.observation?.source_urls??[]}:null,recent_events:portfolioRows.slice(0,8).map((x:any)=>({id:x.id,source:x.source,event_type:x.event_type,topic:x.topic,created_at:x.created_at})),query_ok:!portfolioEvents.error},
  endpoints:[{name:"V12 dashboard telemetry and controls",slug:"v12-engine-dashboard",path:"/functions/v1/v12-engine-dashboard",method:"GET/POST via authenticated Supabase client"},{name:"Professional channel sync",slug:"chatb2k-professional-authority-sync",path:"/functions/v1/chatb2k-professional-authority-sync",method:"POST",purpose:"Reconcile connected Buffer destinations and optionally refresh sourced portfolio evidence"},{name:"Portfolio intelligence",slug:"chatb2k-portfolio-intelligence",path:"/functions/v1/chatb2k-portfolio-intelligence",method:"POST",purpose:"Firecrawl search/scrape and Gemini portfolio draft generation"},{name:"ChatB2K orchestrator",slug:"chatb2k-orchestrator",path:"/functions/v1/chatb2k-orchestrator",method:"POST",purpose:"Central routing and controlled agentic execution"},{name:"ChatB2K publishing router",slug:"chatb2k-publishing-router",path:"/functions/v1/chatb2k-publishing-router",method:"POST",purpose:"Dispatch approved queue items through the active ChatB2K provider route"},{name:"Ecosystem QA",slug:"resofit-ecosystem-qa",path:"/functions/v1/resofit-ecosystem-qa",method:"POST",purpose:"Firecrawl route discovery, public-route scrape checks, origin reachability and Google PageSpeed mobile Lighthouse diagnostics"}],
  runtime,
  gate:{engine_registry_ok:!engines.error,control_plane_ok:!control.error,swarm_population_ok:swarm.length===72,heartbeat_ok:es.every((e:any)=>e.status!=="PAUSED"&&e.last_heartbeat_at),revenue_refresh_present:(daily.data??[]).some((d:any)=>String(d.business_date)===new Date().toISOString().slice(0,10))}
 });
})};