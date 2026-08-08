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

const SYSTEM = `You are a senior software architect that reverse-engineers source artifacts into architecture graphs.

You receive raw developer input: application source code, a SQL schema, docker-compose.yml, package.json, Terraform, OpenAPI spec, or a Kubernetes manifest.

Extract the real components and their relationships. Rules:
- Emit a graph of NODES and EDGES only. Never emit coordinates.
- A node is a meaningful architectural unit: service, database, table, queue, cache, external API, cron job, frontend app, storage bucket, lambda/edge function.
- For SQL schemas, each table is a node and each foreign key is an edge labeled with the column.
- For code, each module/route-group/class-with-responsibility is a node; imports, HTTP calls, and queries are edges.
- Edge labels must describe the real interaction ("POST /orders", "reads", "publishes order.created", "FK user_id").
- "kind" must be one of: service, database, table, queue, cache, external, frontend, function, storage, job.
- "layer" is the tier index: 0 = user-facing/entrypoints, increasing as you go deeper into the stack. Use it for layout.
- 4 to 22 nodes. Merge trivia. Never invent components that are not implied by the input.
- notes: 1-2 sentence architect's read of the system, plus any risk you noticed.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { source, hint } = await req.json();
    if (!source || typeof source !== "string" || source.trim().length < 10) {
      return json({ error: "Paste some code, a schema, or a config file first." }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const truncated = source.slice(0, 60000);

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
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `${hint ? `Context from the developer: ${hint}\n\n` : ""}Artifact:\n\`\`\`\n${truncated}\n\`\`\``,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "architecture_graph",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                notes: { type: "string" },
                nodes: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      label: { type: "string" },
                      kind: {
                        type: "string",
                        enum: [
                          "service",
                          "database",
                          "table",
                          "queue",
                          "cache",
                          "external",
                          "frontend",
                          "function",
                          "storage",
                          "job",
                        ],
                      },
                      layer: { type: "integer" },
                      detail: { type: "string" },
                    },
                    required: ["id", "label", "kind", "layer", "detail"],
                  },
                },
                edges: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      from: { type: "string" },
                      to: { type: "string" },
                      label: { type: "string" },
                    },
                    required: ["from", "to", "label"],
                  },
                },
              },
              required: ["title", "notes", "nodes", "edges"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "Rate limit exceeded. Try again shortly." }, 429);
      if (response.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const text = await response.text();
      console.error("AI gateway error", response.status, text);
      return json({ error: "Failed to analyze the source." }, 500);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return json({ error: "The model returned no graph." }, 500);

    let graph: { nodes?: unknown[]; edges?: unknown[] };
    try {
      graph = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return json({ error: "Could not parse the model output." }, 500);
      graph = JSON.parse(m[0]);
    }

    if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
      return json({ error: "No architecture could be detected in that input." }, 422);
    }

    return json(graph);
  } catch (e) {
    console.error("code-to-diagram error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
