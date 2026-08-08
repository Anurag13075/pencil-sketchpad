import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const TARGETS: Record<string, string> = {
  mermaid:
    "Mermaid diagram source. Choose the most fitting Mermaid graph type (flowchart, erDiagram, sequenceDiagram, classDiagram) based on the drawing. Must render without errors in Mermaid v10.",
  sql:
    "PostgreSQL DDL. One CREATE TABLE per entity box, sensible column types, primary keys, and foreign keys for every connector. Add indexes where a FK exists.",
  terraform:
    "Terraform HCL for AWS. Map each box to the closest real resource, wire them with references, include required arguments only, and add a short comment above each resource.",
  typescript:
    "TypeScript domain model: exported interfaces/types for every entity, relations typed as references or arrays, plus a discriminated union of the events implied by the arrows.",
  openapi:
    "OpenAPI 3.1 YAML. Derive paths from the flow, schemas from the entity boxes, and correct request/response bodies.",
  python:
    "Python: SQLAlchemy 2.0 declarative models plus Pydantic v2 schemas for each entity, with relationships wired from the connectors.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { elements, target } = await req.json();
    if (!Array.isArray(elements) || elements.length === 0) {
      return json({ error: "Canvas is empty — draw a diagram first." }, 400);
    }
    const spec = TARGETS[target as string];
    if (!spec) return json({ error: "Unsupported output target." }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Serialize geometry + inferred connections so the model can read structure, not pixels.
    const boxes = elements.filter((e: any) => e.type !== "arrow" && e.type !== "line");
    const links = elements.filter((e: any) => e.type === "arrow" || e.type === "line");

    const describe = (e: any) =>
      `${e.type}#${e.id?.slice(0, 6) ?? "?"} "${e.text ?? ""}" box(${Math.round(e.x)},${Math.round(e.y)},${Math.round(
        e.width,
      )}x${Math.round(e.height)})`;

    const linkDesc = links
      .map((l: any) => {
        const near = (x: number, y: number) =>
          boxes
            .map((b: any) => {
              const cx = b.x + b.width / 2;
              const cy = b.y + b.height / 2;
              return { b, d: Math.hypot(cx - x, cy - y) };
            })
            .sort((a, b) => a.d - b.d)[0];
        const a = near(l.x, l.y);
        const b = near(l.x + l.width, l.y + l.height);
        const nameOf = (n: any) => (n ? `"${n.b.text || n.b.type}"` : "unknown");
        return `${l.type}: ${nameOf(a)} -> ${nameOf(b)}${l.text ? ` labeled "${l.text}"` : ""}`;
      })
      .join("\n");

    const prompt = `Diagram boxes:\n${boxes.map(describe).join("\n")}\n\nConnections (resolved by proximity):\n${
      linkDesc || "(none drawn)"
    }\n\nUse the spatial layout to infer hierarchy and flow direction (left-to-right and top-to-bottom).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          {
            role: "system",
            content: `You convert hand-drawn whiteboard diagrams into production-quality code artifacts.

Target: ${spec}

Rules:
- Output ONLY the code for the requested target. No prose, no markdown fences, no explanation.
- The output must be syntactically valid and immediately usable.
- Infer names from the shape labels; slugify them idiomatically for the target language.
- If a label is ambiguous, choose the most conventional interpretation for that target.`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "Rate limit exceeded. Try again shortly." }, 429);
      if (response.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const text = await response.text();
      console.error("AI gateway error", response.status, text);
      return json({ error: "Failed to generate code." }, 500);
    }

    const data = await response.json();
    let code: string = data.choices?.[0]?.message?.content ?? "";
    code = code.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
    if (!code) return json({ error: "The model returned nothing." }, 500);

    return json({ code, target });
  } catch (e) {
    console.error("diagram-to-code error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
