import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Pencil Agent — an autonomous whiteboard operator embedded in an infinite-canvas diagramming app.

You receive:
1. The full current canvas as a list of elements (id, type, position, size, label).
2. A user instruction in natural language.

You then MUST call the "apply_ops" function with a list of canvas operations that fulfil the request, plus a one-or-two sentence "reply" telling the user what you did (friendly, concrete, no markdown).

Operations available:
- add       -> create a shape. fields: shape (rectangle|ellipse|diamond|text), x, y, width, height, text, fillColor
- connect   -> draw a bound arrow between two existing elements. fields: from, to (element ids OR exact labels), label (optional)
- update    -> change an existing element. fields: target (id or label), text, fillColor, strokeColor
- move      -> reposition an element. fields: target, x, y
- remove    -> delete an element. fields: target
- layout    -> run the auto-layout engine over the whole board (no fields)
- annotate  -> add a floating callout note near an element. fields: target, text

Rules:
- Coordinate space is unbounded; place NEW clusters in empty space, never on top of existing elements. Space nodes at least 60px apart.
- Default node size: width 170, height 70. Text elements: height 24.
- Every box you add should carry its own "text" label — do not emit separate text elements for box labels.
- Prefer "connect" over drawing raw arrows so connectors stay glued when shapes move.
- Colors: stroke "#1e1e1e"; fills "#ffffff" "#dbeafe" "#dcfce7" "#fef3c7" "#fce7f3" "#e9d5ff" "#e0f2fe".
- If the user asks a question about the board rather than a change, return an empty ops list and answer in "reply".
- Be decisive and complete: build the whole thing asked for in one pass. Max 40 ops.`;

const OPS_TOOL = {
  type: "function",
  function: {
    name: "apply_ops",
    description: "Apply a batch of operations to the user's canvas and report back.",
    parameters: {
      type: "object",
      properties: {
        reply: { type: "string" },
        ops: {
          type: "array",
          items: {
            type: "object",
            properties: {
              op: {
                type: "string",
                enum: ["add", "connect", "update", "move", "remove", "layout", "annotate"],
              },
              shape: { type: "string", enum: ["rectangle", "ellipse", "diamond", "text"] },
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
              text: { type: "string" },
              label: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
              target: { type: "string" },
              fillColor: { type: "string" },
              strokeColor: { type: "string" },
            },
            required: ["op"],
          },
        },
      },
      required: ["reply", "ops"],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { instruction, elements, history } = await req.json();
    if (!instruction || typeof instruction !== "string") {
      return json({ error: "instruction is required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const canvasSummary = Array.isArray(elements) && elements.length
      ? JSON.stringify(elements.slice(0, 220))
      : "[] (the canvas is empty)";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history.slice(-8) : []),
      {
        role: "user",
        content: `CURRENT CANVAS:\n${canvasSummary}\n\nINSTRUCTION:\n${instruction}`,
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [OPS_TOOL],
        tool_choice: { type: "function", function: { name: "apply_ops" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("canvas-agent gateway error", response.status, text);
      if (response.status === 429) return json({ error: "Rate limited — try again in a moment." }, 429);
      if (response.status === 402) return json({ error: "AI credits exhausted. Add credits to continue." }, 402);
      return json({ error: "The agent could not complete that request." }, 500);
    }

    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      const fallback = data.choices?.[0]?.message?.content ?? "";
      return json({ reply: fallback || "I could not work out an action for that.", ops: [] });
    }
    const args = JSON.parse(call.function.arguments);
    return json({ reply: args.reply ?? "Done.", ops: Array.isArray(args.ops) ? args.ops : [] });
  } catch (e) {
    console.error("canvas-agent error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
