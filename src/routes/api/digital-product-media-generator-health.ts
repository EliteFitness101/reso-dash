import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/digital-product-media-generator-health")({
  server: {
    handlers: {
      GET: async () => {
        const configured = Boolean(process.env.GEMINI_API_KEY);
        const supabaseConfigured = Boolean(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
        return Response.json({
          ok: configured && supabaseConfigured,
          generator: "gemini_veo",
          gemini_api_configured: configured,
          supabase_server_configured: supabaseConfigured,
          models: { video: "veo-3.1-generate-preview", image: "gemini-3.1-flash-image" },
          note: "No credentials are returned by this endpoint.",
        });
      },
    },
  },
});