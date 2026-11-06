import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/ceo-compound-video")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin) {
          try {
            if (new URL(origin).host !== new URL(request.url).host) {
              return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
            }
          } catch {
            return Response.json({ error: "Invalid request origin." }, { status: 400 });
          }
        }

        const authorization = request.headers.get("authorization") ?? "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
        if (!token) return Response.json({ error: "Authentication required." }, { status: 401 });

        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          return Response.json({ error: "Authentication service is not configured." }, { status: 503 });
        }
        if (!geminiApiKey) {
          return Response.json({ error: "Gemini video generation is not configured in this deployment." }, { status: 503 });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
          return Response.json({ error: "Session is invalid or expired." }, { status: 401 });
        }

        let claims: Record<string, unknown>;
        try {
          const payload = token.split(".")[1];
          if (!payload) throw new Error("Missing token payload");
          claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Session claims could not be verified." }, { status: 401 });
        }
        if (claims.aal !== "aal2") {
          return Response.json({ error: "Multi-factor authentication is required." }, { status: 403 });
        }

        const { data: workspaceRole, error: roleError } = await supabase.rpc("get_my_workspace_role");
        if (roleError || workspaceRole !== "super_admin") {
          return Response.json({ error: "Owner authorization required." }, { status: 403 });
        }

        let body: { prompt?: unknown };
        try {
          body = await request.json() as { prompt?: unknown };
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }
        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
        if (!prompt || prompt.length > 2000) {
          return Response.json({ error: "Prompt must contain 1–2,000 characters." }, { status: 400 });
        }

        try {
          const generation = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiApiKey,
            },
            body: JSON.stringify({
              model: "gemini-omni-1.1-flash",
              input: prompt,
              response_format: { type: "video", aspect_ratio: "16:9", resolution: "360p" },
            }),
          });

          if (!generation.ok) {
            const providerText = await generation.text();
            console.error("Gemini video generation failed", generation.status, providerText.slice(0, 500));
            return Response.json({ error: "Gemini video generation failed. Check provider quota and model access." }, { status: 502 });
          }

          const result = await generation.json() as {
            status?: string;
            steps?: Array<{ type?: string; content?: Array<{ type?: string; mime_type?: string; data?: string }> }>;
          };
          const video = result.steps
            ?.filter((step) => step.type === "model_output")
            .flatMap((step) => step.content ?? [])
            .find((item) => item.type === "video" && typeof item.data === "string");

          if (!video?.data) {
            return Response.json({ error: "Gemini completed without returning a video asset." }, { status: 502 });
          }

          const bytes = Buffer.from(video.data, "base64");
          return new Response(bytes, {
            status: 200,
            headers: {
              "Content-Type": video.mime_type || "video/mp4",
              "Content-Length": String(bytes.byteLength),
              "Cache-Control": "private, no-store",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch (error) {
          console.error("Gemini video request error", error);
          return Response.json({ error: "Video generation could not be completed. Retry after checking server logs." }, { status: 502 });
        }
      },
    },
  },
});
