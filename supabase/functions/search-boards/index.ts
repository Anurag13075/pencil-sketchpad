import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return json({ error: "Type what you're looking for." }, 400);
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: query.slice(0, 2000),
        encoding_format: "float",
      }),
    });
    if (!res.ok) {
      if (res.status === 429) return json({ error: "Rate limit exceeded." }, 429);
      if (res.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const t = await res.text();
      console.error("embedding error", res.status, t);
      return json({ error: "Could not embed the query." }, 500);
    }
    const data = await res.json();
    const embedding = data.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) return json({ error: "No embedding returned." }, 500);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: matches, error } = await admin.rpc("match_boards", {
      query_embedding: embedding,
      match_count: 8,
    });
    if (error) {
      console.error("match_boards error", error);
      return json({ error: error.message }, 500);
    }

    return json({ results: matches ?? [] });
  } catch (e) {
    console.error("search-boards error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
