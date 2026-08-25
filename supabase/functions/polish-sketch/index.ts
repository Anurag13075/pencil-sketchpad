import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Pencil's sketch beautifier. A user hand-drew a rough diagram. A local geometry recogniser already classified each stroke into candidate shapes, connector strokes, and loose text labels.

Your job: infer what the diagram MEANS and return a clean, production-quality version of it.

You receive:
- shapes: recognised blobs with { ref, guess (rectangle|ellipse|diamond), x, y, width, height, nearbyText }
- connectors: rough strokes that link shapes with { fromRef, toRef }
- texts: loose text labels with { text, x, y }

Return via the "rebuild" function:
- title: a short board title
- nodes: cleaned nodes { ref (reuse the incoming ref when it maps to a sketched shape, else a new id), label, shape, x, y, width, height, fillColor }
- edges: { from (ref), to (ref), label (optional) }

Rules:
- KEEP the user's spatial intent: preserve relative left/right/top/bottom ordering and rough positions, but snap onto a tidy grid with generous, even spacing (>= 70px gaps) and consistent sizes (default 170x70).
- Reuse the user's own words from nearbyText/texts as node labels. If a shape has no text, infer a sensible label from context (e.g. a cylinder-ish blob feeding many nodes is likely "Database").
- Consume the loose texts as labels — do NOT return them as separate nodes unless they are genuinely standalone notes.
- Pick the shape semantically: decision points -> diamond, start/end or actors -> ellipse, everything else -> rectangle.
- Colour by role: entry/UI "#dbeafe", services "#ffffff", data stores "#dcfce7", decisions "#fef3c7", external/3rd-party "#e9d5ff", warnings "#fce7f3".
- Never return more than 30 nodes.`;

const TOOL = {
  type: "function",
  function: {
    name: "rebuild",
    description: "Return the cleaned-up diagram",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ref: { type: "string" },
              label: { type: "string" },
              shape: { type: "string", enum: ["rectangle", "ellipse", "diamond"] },
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
              fillColor: { type: "string" },
            },
            required: ["ref", "label", "shape", "x", "y", "width", "height"],
          },
        },
        edges: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              label: { type: "string" },
            },
            required: ["from", "to"],
          },
        },
      },
      required: ["title", "nodes", "edges"],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { shapes, connectors, texts } = await req.json();
    if (!Array.isArray(shapes) || shapes.length === 0) {
      return json({ error: "Draw a rough sketch first — I could not find any shapes." }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              shapes: shapes.slice(0, 60),
              connectors: Array.isArray(connectors) ? connectors.slice(0, 80) : [],
              texts: Array.isArray(texts) ? texts.slice(0, 60) : [],
            }),
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "rebuild" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("polish-sketch gateway error", response.status, text);
      if (response.status === 429) return json({ error: "Rate limited — try again in a moment." }, 429);
      if (response.status === 402) return json({ error: "AI credits exhausted. Add credits to continue." }, 402);
      return json({ error: "Could not clean up that sketch." }, 500);
    }

    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return json({ error: "No diagram returned." }, 500);
    return json(JSON.parse(call.function.arguments));
  } catch (e) {
    console.error("polish-sketch error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
