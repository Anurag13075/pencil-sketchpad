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

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

async function embed(key: string, text: string): Promise<number[]> {
  const res = await fetch(`${GATEWAY}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text.slice(0, 8000),
      encoding_format: "float",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`embedding failed ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const vector = data.data?.[0]?.embedding;
  if (!Array.isArray(vector)) throw new Error("no embedding returned");
  return vector;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { board_id, title, elements } = await req.json();
    if (!board_id || typeof board_id !== "string") return json({ error: "board_id is required" }, 400);
    if (!Array.isArray(elements)) return json({ error: "elements must be an array" }, 400);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

    const labels = elements
      .filter((e: any) => e && !e.isDeleted && typeof e.text === "string" && e.text.trim())
      .map((e: any) => e.text.trim());
    const shapeCounts = elements.reduce((acc: Record<string, number>, e: any) => {
      if (!e || e.isDeleted) return acc;
      acc[e.type] = (acc[e.type] ?? 0) + 1;
      return acc;
    }, {});

    const skeleton = `Title: ${title ?? "Untitled"}
Shapes: ${Object.entries(shapeCounts).map(([k, v]) => `${v} ${k}`).join(", ") || "none"}
Labels: ${labels.join(" | ") || "none"}`;

    // Short semantic summary — this is what gets embedded and shown in search results.
    let summary = skeleton;
    if (labels.length > 0) {
      const res = await fetch(`${GATEWAY}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          reasoning_effort: "none",
          messages: [
            {
              role: "system",
              content:
                "Write a dense, single-paragraph search summary of a whiteboard diagram from its shapes and labels. Name the domain, the diagram type, the components, and the likely purpose. Include synonyms a teammate might search for. No preamble, max 70 words.",
            },
            { role: "user", content: skeleton },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        summary = data.choices?.[0]?.message?.content?.trim() || skeleton;
      } else if (res.status === 429 || res.status === 402) {
        return json({ error: res.status === 429 ? "Rate limit exceeded." : "AI credits exhausted." }, res.status);
      }
    }

    const content = `${skeleton}\n\nSummary: ${summary}`;
    const embedding = await embed(key, content);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { error } = await admin
      .from("board_embeddings")
      .upsert({ board_id, content, summary, embedding }, { onConflict: "board_id" });
    if (error) {
      console.error("upsert error", error);
      return json({ error: error.message }, 500);
    }

    return json({ indexed: true, summary });
  } catch (e) {
    console.error("index-board error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
