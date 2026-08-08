import type { CanvasElement, Point } from "@/types/canvas";
import { getElementBounds } from "./canvas-utils";

/* =========================================================================
   Smart connectors + deterministic layered auto-layout engine.
   No AI. Pure geometry + graph algorithms:
     1. binding inference (proximity -> hard bindings)
     2. edge-anchored connector re-routing (follows shapes as they move)
     3. Sugiyama-style layered layout: cycle break -> layer -> barycenter
        ordering -> coordinate assignment -> straightening
     4. alignment snapping guides
   ========================================================================= */

export const CONNECTOR_TYPES = new Set(["arrow", "line"]);

export function isConnector(el: CanvasElement) {
  return CONNECTOR_TYPES.has(el.type);
}

export function isNode(el: CanvasElement) {
  return !isConnector(el) && el.type !== "freedraw" && !el.isDeleted;
}

function center(el: CanvasElement): Point {
  const b = getElementBounds(el);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/** Nearest node whose bounds (padded) contain the point, else nearest centre within radius. */
function nodeNear(nodes: CanvasElement[], p: Point, radius = 64): CanvasElement | null {
  let best: CanvasElement | null = null;
  let bestD = Infinity;
  for (const n of nodes) {
    const b = getElementBounds(n);
    const inside = p.x >= b.x - 12 && p.x <= b.x + b.w + 12 && p.y >= b.y - 12 && p.y <= b.y + b.h + 12;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = inside ? 0 : Math.hypot(cx - p.x, cy - p.y) - Math.max(b.w, b.h) / 2;
    if (d < bestD && (inside || d < radius)) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

/**
 * Infer bindings for every connector that doesn't have them yet, based on
 * which shapes its endpoints land on/near. Bindings are what make connectors
 * "smart" — once bound they follow their shapes forever.
 */
export function inferBindings(elements: CanvasElement[]): CanvasElement[] {
  const nodes = elements.filter(isNode);
  if (nodes.length === 0) return elements;

  return elements.map((el) => {
    if (!isConnector(el) || el.isDeleted) return el;
    if (el.startBinding || el.endBinding) return el;
    const start = nodeNear(nodes, { x: el.x, y: el.y });
    const end = nodeNear(nodes, { x: el.x + el.width, y: el.y + el.height });
    if (!start && !end) return el;
    if (start && end && start.id === end.id) return el;
    return { ...el, startBinding: start?.id, endBinding: end?.id };
  });
}

/** Where a ray from `from` toward `to` exits the rectangle of `el`. */
function edgeAnchor(el: CanvasElement, toward: Point, gap = 6): Point {
  const b = getElementBounds(el);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const hw = b.w / 2 + gap;
  const hh = b.h / 2 + gap;
  const scale = Math.min(
    Math.abs(dx) < 1e-6 ? Infinity : hw / Math.abs(dx),
    Math.abs(dy) < 1e-6 ? Infinity : hh / Math.abs(dy),
  );

  if (el.type === "ellipse") {
    const t = 1 / Math.hypot(dx / hw, dy / hh);
    return { x: cx + dx * t, y: cy + dy * t };
  }
  if (el.type === "diamond") {
    const t = 1 / (Math.abs(dx) / hw + Math.abs(dy) / hh);
    return { x: cx + dx * t, y: cy + dy * t };
  }
  return { x: cx + dx * scale, y: cy + dy * scale };
}

/**
 * Re-route every bound connector so it starts and ends exactly on the border of
 * the shapes it connects. Call this after any move/resize — it is idempotent.
 */
export function reflowConnectors(elements: CanvasElement[]): CanvasElement[] {
  const byId = new Map(elements.map((e) => [e.id, e]));
  let changed = false;

  const next = elements.map((el) => {
    if (!isConnector(el) || el.isDeleted) return el;
    const a = el.startBinding ? byId.get(el.startBinding) : undefined;
    const b = el.endBinding ? byId.get(el.endBinding) : undefined;
    if (!a && !b) return el;
    if ((a && a.isDeleted) || (b && b.isDeleted)) return el;

    const pStartRaw: Point = a ? center(a) : { x: el.x, y: el.y };
    const pEndRaw: Point = b ? center(b) : { x: el.x + el.width, y: el.y + el.height };

    const start = a ? edgeAnchor(a, pEndRaw) : pStartRaw;
    const end = b ? edgeAnchor(b, pStartRaw) : pEndRaw;

    const nx = start.x;
    const ny = start.y;
    const nw = end.x - start.x;
    const nh = end.y - start.y;

    if (
      Math.abs(nx - el.x) < 0.01 &&
      Math.abs(ny - el.y) < 0.01 &&
      Math.abs(nw - el.width) < 0.01 &&
      Math.abs(nh - el.height) < 0.01
    ) {
      return el;
    }
    changed = true;
    return { ...el, x: nx, y: ny, width: nw, height: nh };
  });

  return changed ? next : elements;
}

/* ---------------------------- layered layout ---------------------------- */

interface Graph {
  nodes: CanvasElement[];
  edges: { from: string; to: string; el: CanvasElement }[];
}

function buildGraph(elements: CanvasElement[]): Graph {
  const nodes = elements.filter(isNode);
  const ids = new Set(nodes.map((n) => n.id));
  const bound = inferBindings(elements);
  const edges: Graph["edges"] = [];
  for (const el of bound) {
    if (!isConnector(el) || el.isDeleted) continue;
    if (el.startBinding && el.endBinding && ids.has(el.startBinding) && ids.has(el.endBinding)) {
      edges.push({ from: el.startBinding, to: el.endBinding, el });
    }
  }
  return { nodes, edges };
}

/** Break cycles with a DFS so layering always terminates. */
function acyclic(nodes: string[], edges: { from: string; to: string }[]) {
  const out = new Map<string, string[]>(nodes.map((n) => [n, []]));
  for (const e of edges) out.get(e.from)?.push(e.to);
  const state = new Map<string, 0 | 1 | 2>();
  const keep: { from: string; to: string }[] = [];

  const visit = (n: string) => {
    state.set(n, 1);
    for (const m of out.get(n) ?? []) {
      const s = state.get(m) ?? 0;
      if (s === 1) continue; // back edge -> drop
      keep.push({ from: n, to: m });
      if (s === 0) visit(m);
    }
    state.set(n, 2);
  };
  for (const n of nodes) if ((state.get(n) ?? 0) === 0) visit(n);
  return keep;
}

/** Longest-path layering. */
function assignLayers(nodes: string[], edges: { from: string; to: string }[]) {
  const preds = new Map<string, string[]>(nodes.map((n) => [n, []]));
  const succs = new Map<string, string[]>(nodes.map((n) => [n, []]));
  for (const e of edges) {
    preds.get(e.to)?.push(e.from);
    succs.get(e.from)?.push(e.to);
  }
  const layer = new Map<string, number>();
  const indeg = new Map(nodes.map((n) => [n, preds.get(n)!.length]));
  const queue = nodes.filter((n) => indeg.get(n) === 0);
  for (const n of queue) layer.set(n, 0);

  let guard = 0;
  while (queue.length && guard++ < 10000) {
    const n = queue.shift()!;
    for (const m of succs.get(n) ?? []) {
      layer.set(m, Math.max(layer.get(m) ?? 0, (layer.get(n) ?? 0) + 1));
      indeg.set(m, (indeg.get(m) ?? 1) - 1);
      if (indeg.get(m) === 0) queue.push(m);
    }
  }
  for (const n of nodes) if (!layer.has(n)) layer.set(n, 0);
  return layer;
}

export interface LayoutOptions {
  direction?: "horizontal" | "vertical";
  gapMain?: number;
  gapCross?: number;
}

/**
 * Layered auto-layout. Returns a new element array with node positions rewritten
 * and all bound connectors rerouted. Unconnected nodes are parked in a tidy grid
 * below the graph so nothing is ever lost.
 */
export function autoLayout(elements: CanvasElement[], opts: LayoutOptions = {}): CanvasElement[] {
  const direction = opts.direction ?? "horizontal";
  const gapMain = opts.gapMain ?? 140;
  const gapCross = opts.gapCross ?? 60;

  const bound = inferBindings(elements);
  const { nodes, edges } = buildGraph(bound);
  if (nodes.length < 2) return bound;

  const ids = nodes.map((n) => n.id);
  const kept = acyclic(ids, edges);
  const layerOf = assignLayers(ids, kept);

  const connected = new Set<string>();
  for (const e of kept) {
    connected.add(e.from);
    connected.add(e.to);
  }

  // group by layer
  const layers: string[][] = [];
  for (const id of ids) {
    if (!connected.has(id)) continue;
    const l = layerOf.get(id) ?? 0;
    (layers[l] ||= []).push(id);
  }

  const succ = new Map<string, string[]>();
  const pred = new Map<string, string[]>();
  for (const e of kept) {
    (succ.get(e.from) ?? succ.set(e.from, []).get(e.from)!).push(e.to);
    (pred.get(e.to) ?? pred.set(e.to, []).get(e.to)!).push(e.from);
  }

  // barycenter ordering sweeps to minimise crossings
  const order = new Map<string, number>();
  layers.forEach((layer) => layer?.forEach((id, i) => order.set(id, i)));
  for (let pass = 0; pass < 6; pass++) {
    const downward = pass % 2 === 0;
    const seq = downward ? layers.keys() : [...layers.keys()].reverse();
    for (const li of seq) {
      const layer = layers[li];
      if (!layer) continue;
      const ref = downward ? pred : succ;
      const scored = layer.map((id) => {
        const neigh = (ref.get(id) ?? []).map((n) => order.get(n) ?? 0);
        const bary = neigh.length ? neigh.reduce((a, b) => a + b, 0) / neigh.length : order.get(id) ?? 0;
        return { id, bary };
      });
      scored.sort((a, b) => a.bary - b.bary);
      layers[li] = scored.map((s) => s.id);
      layers[li].forEach((id, i) => order.set(id, i));
    }
  }

  const byId = new Map(bound.map((e) => [e.id, e]));
  const sizeOf = (id: string) => {
    const b = getElementBounds(byId.get(id)!);
    return { w: Math.max(Math.abs(b.w), 40), h: Math.max(Math.abs(b.h), 30) };
  };

  // anchor layout at the current top-left of the graph so it stays in view
  let originX = Infinity;
  let originY = Infinity;
  for (const id of connected) {
    const b = getElementBounds(byId.get(id)!);
    originX = Math.min(originX, b.x);
    originY = Math.min(originY, b.y);
  }
  if (!Number.isFinite(originX)) originX = 0;
  if (!Number.isFinite(originY)) originY = 0;

  // main-axis offsets per layer
  const layerExtent = layers.map((layer) =>
    layer ? Math.max(...layer.map((id) => (direction === "horizontal" ? sizeOf(id).w : sizeOf(id).h))) : 0,
  );
  const mainOffset: number[] = [];
  let acc = 0;
  for (let i = 0; i < layers.length; i++) {
    mainOffset[i] = acc;
    acc += (layerExtent[i] || 0) + gapMain;
  }

  // cross-axis: stack within layer, centre each layer
  const crossSpan = layers.map((layer) =>
    layer
      ? layer.reduce((sum, id) => sum + (direction === "horizontal" ? sizeOf(id).h : sizeOf(id).w) + gapCross, -gapCross)
      : 0,
  );
  const maxSpan = Math.max(0, ...crossSpan);

  const pos = new Map<string, Point>();
  layers.forEach((layer, li) => {
    if (!layer) return;
    let cross = (maxSpan - crossSpan[li]) / 2;
    for (const id of layer) {
      const s = sizeOf(id);
      const extent = layerExtent[li] || 0;
      if (direction === "horizontal") {
        pos.set(id, {
          x: originX + mainOffset[li] + (extent - s.w) / 2,
          y: originY + cross,
        });
        cross += s.h + gapCross;
      } else {
        pos.set(id, {
          x: originX + cross,
          y: originY + mainOffset[li] + (extent - s.h) / 2,
        });
        cross += s.w + gapCross;
      }
    }
  });

  // park orphan nodes in a grid under the graph
  const orphans = ids.filter((id) => !connected.has(id));
  const graphEnd =
    direction === "horizontal"
      ? originY + maxSpan + gapMain
      : originY + acc + gapMain;
  orphans.forEach((id, i) => {
    const s = sizeOf(id);
    const col = i % 6;
    const row = Math.floor(i / 6);
    pos.set(id, { x: originX + col * (s.w + gapCross), y: graphEnd + row * (s.h + gapCross) });
  });

  const moved = bound.map((el) => {
    const p = pos.get(el.id);
    if (!p) return el;
    const b = getElementBounds(el);
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return el;
    return { ...el, x: el.x + dx, y: el.y + dy };
  });

  return reflowConnectors(moved);
}

/* ---------------------------- snapping guides ---------------------------- */

export interface SnapResult {
  dx: number;
  dy: number;
  guides: { orientation: "v" | "h"; at: number; from: number; to: number }[];
}

/**
 * Figma-style alignment snapping: compares the moving selection's edges and
 * centres against every other node and returns the correction plus the guide
 * lines to render.
 */
export function computeSnap(
  moving: CanvasElement[],
  others: CanvasElement[],
  threshold = 6,
): SnapResult {
  const guides: SnapResult["guides"] = [];
  if (moving.length === 0) return { dx: 0, dy: 0, guides };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const m of moving) {
    const b = getElementBounds(m);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  const selV = [minX, (minX + maxX) / 2, maxX];
  const selH = [minY, (minY + maxY) / 2, maxY];

  let bestDx = 0, bestDy = 0;
  let bestVd = threshold, bestHd = threshold;
  let vTarget: { at: number; from: number; to: number } | null = null;
  let hTarget: { at: number; from: number; to: number } | null = null;

  for (const o of others) {
    if (o.isDeleted || isConnector(o)) continue;
    const b = getElementBounds(o);
    const oV = [b.x, b.x + b.w / 2, b.x + b.w];
    const oH = [b.y, b.y + b.h / 2, b.y + b.h];

    for (const sv of selV) {
      for (const ov of oV) {
        const d = Math.abs(sv - ov);
        if (d < bestVd) {
          bestVd = d;
          bestDx = ov - sv;
          vTarget = { at: ov, from: Math.min(minY, b.y), to: Math.max(maxY, b.y + b.h) };
        }
      }
    }
    for (const sh of selH) {
      for (const oh of oH) {
        const d = Math.abs(sh - oh);
        if (d < bestHd) {
          bestHd = d;
          bestDy = oh - sh;
          hTarget = { at: oh, from: Math.min(minX, b.x), to: Math.max(maxX, b.x + b.w) };
        }
      }
    }
  }

  if (vTarget) guides.push({ orientation: "v", ...vTarget });
  if (hTarget) guides.push({ orientation: "h", ...hTarget });
  return { dx: bestDx, dy: bestDy, guides };
}

/** Distribute + align helpers used by the alignment toolbar. */
export function alignElements(
  elements: CanvasElement[],
  selectedIds: Set<string>,
  mode: "left" | "right" | "top" | "bottom" | "center-x" | "center-y" | "distribute-x" | "distribute-y",
): CanvasElement[] {
  const sel = elements.filter((e) => selectedIds.has(e.id) && !e.isDeleted);
  if (sel.length < 2) return elements;
  const bounds = sel.map((e) => ({ e, b: getElementBounds(e) }));

  const minX = Math.min(...bounds.map((x) => x.b.x));
  const maxX = Math.max(...bounds.map((x) => x.b.x + x.b.w));
  const minY = Math.min(...bounds.map((x) => x.b.y));
  const maxY = Math.max(...bounds.map((x) => x.b.y + x.b.h));

  const delta = new Map<string, Point>();

  if (mode === "distribute-x" || mode === "distribute-y") {
    const horizontal = mode === "distribute-x";
    const sorted = [...bounds].sort((a, b) => (horizontal ? a.b.x - b.b.x : a.b.y - b.b.y));
    const total = horizontal ? maxX - minX : maxY - minY;
    const used = sorted.reduce((s, x) => s + (horizontal ? x.b.w : x.b.h), 0);
    const gap = (total - used) / (sorted.length - 1);
    let cursor = horizontal ? minX : minY;
    for (const item of sorted) {
      delta.set(item.e.id, horizontal ? { x: cursor - item.b.x, y: 0 } : { x: 0, y: cursor - item.b.y });
      cursor += (horizontal ? item.b.w : item.b.h) + gap;
    }
  } else {
    for (const { e, b } of bounds) {
      switch (mode) {
        case "left": delta.set(e.id, { x: minX - b.x, y: 0 }); break;
        case "right": delta.set(e.id, { x: maxX - (b.x + b.w), y: 0 }); break;
        case "top": delta.set(e.id, { x: 0, y: minY - b.y }); break;
        case "bottom": delta.set(e.id, { x: 0, y: maxY - (b.y + b.h) }); break;
        case "center-x": delta.set(e.id, { x: (minX + maxX) / 2 - (b.x + b.w / 2), y: 0 }); break;
        case "center-y": delta.set(e.id, { x: 0, y: (minY + maxY) / 2 - (b.y + b.h / 2) }); break;
      }
    }
  }

  const next = elements.map((el) => {
    const d = delta.get(el.id);
    return d ? { ...el, x: el.x + d.x, y: el.y + d.y } : el;
  });
  return reflowConnectors(next);
}
