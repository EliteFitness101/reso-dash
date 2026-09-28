import { createFileRoute } from "@tanstack/react-router";

const VIDEO_MODEL="veo-3.1-generate-preview";
const IMAGE_MODEL="gemini-3.1-flash-image";

export const Route=createFileRoute("/api/digital-product-media-generator-health")({
 server:{handlers:{GET:async()=>{
  const key=process.env.GEMINI_API_KEY;
  const result:any={ok:false,generator:"supabase_edge_gemini_veo",canonical_execution_plane:"Supabase Edge Function: digital-product-media-generator",gemini_api_configured:Boolean(key),gemini_reachable:false,models:{video:VIDEO_MODEL,image:IMAGE_MODEL},checks:{video_model:false,image_model:false},note:"No credentials are returned by this endpoint."};
  try{
   if(key){
    const [video,image]=await Promise.all([
     fetch(`https://generativelanguage.googleapis.com/v1beta/models/${VIDEO_MODEL}?key=${encodeURIComponent(key)}`),
     fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}?key=${encodeURIComponent(key)}`)
    ]);
    result.checks.video_model=video.ok;result.checks.image_model=image.ok;result.gemini_reachable=video.ok&&image.ok;
   }
  }catch{}
  result.ok=Boolean(key)&&result.gemini_reachable&&result.checks.video_model&&result.checks.image_model;
  return Response.json(result,{status:result.ok?200:503});
 }}}});