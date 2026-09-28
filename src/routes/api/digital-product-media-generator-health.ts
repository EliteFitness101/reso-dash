import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const VIDEO_MODEL = "veo-3.1-generate-preview";
const IMAGE_MODEL = "gemini-3.1-flash-image";

export const Route = createFileRoute("/api/digital-product-media-generator-health")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.GEMINI_API_KEY;
        const url = process.env.VITE_SUPABASE_URL;
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const result:any = {
          ok: false,
          generator: "gemini_veo",
          gemini_api_configured: Boolean(key),
          supabase_server_configured: Boolean(url && secret),
          gemini_reachable: false,
          supabase_reachable: false,
          models: { video: VIDEO_MODEL, image: IMAGE_MODEL },
          checks: { video_model: false, image_model: false, database: false },
          note: "No credentials are returned by this endpoint.",
        };
        try {
          if (key) {
            const [video, image] = await Promise.all([
              fetch(`https://generativelanguage.googleapis.com/v1beta/models/${VIDEO_MODEL}?key=${encodeURIComponent(key)}`),
              fetch(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}?key=${encodeURIComponent(key)}`),
            ]);
            result.checks.video_model = video.ok;
            result.checks.image_model = image.ok;
            result.gemini_reachable = video.ok && image.ok;
          }
          if (url && secret) {
            try {
              const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
              const { error } = await client.from("digital_product_factory_jobs").select("id").limit(1);
              result.checks.database = !error;
              result.supabase_reachable = !error;
              if (error) result.database_error = error.code ?? error.message;
            } catch (dbError) {
              result.database_error = dbError instanceof Error ? dbError.message : "database_client_exception";
            }
          }
        } catch {
          // Health endpoint intentionally returns booleans only.
        }
        result.ok = result.gemini_api_configured && result.supabase_server_configured &&
          result.gemini_reachable && result.supabase_reachable &&
          result.checks.video_model && result.checks.image_model && result.checks.database;
        return Response.json(result, { status: result.ok ? 200 : 503 });
      },
    },
  },
});