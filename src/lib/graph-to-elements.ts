import type { CanvasElement } from "@/types/canvas";
import { autoLayout } from "./auto-layout";

/** Architecture graph returned by the code-to-diagram function. */
export interface ArchNode {
  id: string;
  label: string;
  kind: string;
  layer: number;
  detail?: string;
}
export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
}
export interface ArchGraph {
  title?: string;
  notes?: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
}

/** Shape + colour language per architectural role. */
const STYLE: Record<string, { type: CanvasElement["type"]; stroke: string; fill: string }> = {
  frontend: { type: "rectangle", stroke: "#2563eb", fill: "#dbeafe" },
  service: { type: "rectangle", stroke: "#0f172a", fill: "#e2e8f0" },
  function: { type: "rectangle", stroke: "#7c3aed", fill: "#ede9fe" },
  database: { type: "ellipse", stroke: "#047857", fill: "#d1fae5" },
  table: { type: "rectangle", stroke: "#047857", fill: "#ecfdf5" },
  cache: { type: "ellipse", stroke: "#b45309", fill: "#fef3c7" },
  queue: { type: "diamond", stroke: "#c2410c", fill: "#ffedd5" },
  storage: { type: "rectangle", stroke: "#0369a1", fill: "#e0f2fe" },
  external: { type: "diamond", stroke: "#be123c", fill: "#ffe4e6" },
  job: { type: "diamond", stroke: "#4d7c0f", fill: "#ecfccb" },
};

function sizeFor(label: string) {
  const w = Math.max(140, Math.min(280, label.length * 9 + 48));
  return { w, h: 72 };
}

const base = {
  fillStyle: "solid" as const,
  strokeWidth: 2,
  strokeStyle: "solid" as const,
  opacity: 100,
  angle: 0,
  roughness: 1,
};

/**
 * Turn an architecture graph into real canvas elements: typed shapes, labelled
 * bound connectors, then run the deterministic layered layout so the result is
 * a tidy, readable diagram instead of a pile of boxes.
 */
export function graphToElements(graph: ArchGraph, origin = { x: 0, y: 0 }): CanvasElement[] {
  const idMap = new Map<string, string>();
  const elements: CanvasElement[] = [];

  const byLayer = new Map<number, ArchNode[]>();
  for (const n of graph.nodes) {
    const l = Number.isFinite(n.layer) ? n.layer : 0;
    (byLayer.get(l) ?? byLayer.set(l, []).get(l)!).push(n);
  }

  [...byLayer.keys()].sort((a, b) => a - b).forEach((layer, li) => {
    (byLayer.get(layer) ?? []).forEach((n, i) => {
      const style = STYLE[n.kind] ?? STYLE.service;
      const { w, h } = sizeFor(n.label);
      const id = crypto.randomUUID();
      idMap.set(n.id, id);
      elements.push({
        ...base,
        id,
        type: style.type,
        x: origin.x + li * 340,
        y: origin.y + i * 130,
        width: w,
        height: h,
        text: n.label,
        strokeColor: style.stroke,
        fillColor: style.fill,
        seed: Math.floor(Math.random() * 100000),
        kind: n.kind,
      });
    });
  });

  for (const e of graph.edges) {
    const from = idMap.get(e.from);
    const to = idMap.get(e.to);
    if (!from || !to || from === to) continue;
    const a = elements.find((el) => el.id === from)!;
    const b = elements.find((el) => el.id === to)!;
    elements.push({
      ...base,
      id: crypto.randomUUID(),
      type: "arrow",
      x: a.x + a.width,
      y: a.y + a.height / 2,
      width: b.x - (a.x + a.width),
      height: b.y + b.height / 2 - (a.y + a.height / 2),
      text: e.label || undefined,
      strokeColor: "#64748b",
      fillColor: "transparent",
      seed: Math.floor(Math.random() * 100000),
      startBinding: from,
      endBinding: to,
    });
  }

  return autoLayout(elements, { direction: "horizontal", gapMain: 170, gapCross: 46 });
}
