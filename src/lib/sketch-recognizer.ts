import type { CanvasElement, Point } from "@/types/canvas";

/* ------------------------------------------------------------------ *
 * Local geometric stroke recogniser.
 *
 * Classifies hand-drawn freedraw strokes into shape candidates and
 * connector strokes using turning-angle analysis, closure detection,
 * corner extraction (Ramer–Douglas–Peucker simplification) and
 * circularity ratios. Runs entirely on-device; the AI layer only
 * handles semantics (labels + relationships), not geometry.
 * ------------------------------------------------------------------ */

export interface ShapeCandidate {
  ref: string;
  guess: "rectangle" | "ellipse" | "diamond";
  x: number;
  y: number;
  width: number;
  height: number;
  nearbyText: string[];
  sourceIds: string[];
}

export interface ConnectorCandidate {
  fromRef: string | null;
  toRef: string | null;
  sourceIds: string[];
}

export interface Recognition {
  shapes: ShapeCandidate[];
  connectors: ConnectorCandidate[];
  texts: { text: string; x: number; y: number }[];
  consumedIds: string[];
}

function absPoints(el: CanvasElement): Point[] {
  return (el.points ?? []).map((p) => ({ x: el.x + p.x, y: el.y + p.y }));
}

function bbox(pts: Point[]) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function pathLength(pts: Point[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

/** Ramer–Douglas–Peucker polyline simplification. */
function rdp(pts: Point[], eps: number): Point[] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let maxD = -1;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], a, b);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= eps) return [a, b];
  const left = rdp(pts.slice(0, idx + 1), eps);
  const right = rdp(pts.slice(idx), eps);
  return [...left.slice(0, -1), ...right];
}

function perpDist(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

function isClosed(pts: Point[]) {
  const first = pts[0];
  const last = pts[pts.length - 1];
  const gap = Math.hypot(last.x - first.x, last.y - first.y);
  const len = pathLength(pts) || 1;
  return gap < Math.max(24, len * 0.22);
}

/** Fraction of stroke length that stays near the bbox edges → boxy. */
function edgeAffinity(pts: Point[], box: ReturnType<typeof bbox>) {
  const tol = Math.max(6, Math.min(box.width, box.height) * 0.16);
  let near = 0;
  for (const p of pts) {
    const dl = Math.abs(p.x - box.x);
    const dr = Math.abs(p.x - (box.x + box.width));
    const dt = Math.abs(p.y - box.y);
    const db = Math.abs(p.y - (box.y + box.height));
    if (Math.min(dl, dr, dt, db) <= tol) near++;
  }
  return near / Math.max(1, pts.length);
}

function classifyClosed(pts: Point[], box: ReturnType<typeof bbox>): ShapeCandidate["guess"] {
  const corners = rdp(pts, Math.max(5, Math.min(box.width, box.height) * 0.09));
  const cornerCount = Math.max(0, corners.length - 1);
  const affinity = edgeAffinity(pts, box);

  // Diamonds: 4 corners but the extreme points sit at edge midpoints.
  if (cornerCount >= 4 && cornerCount <= 6 && affinity < 0.55) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const midish = corners.filter(
      (c) =>
        Math.abs(c.x - cx) < box.width * 0.18 || Math.abs(c.y - cy) < box.height * 0.18,
    ).length;
    if (midish >= 3) return "diamond";
  }
  if (affinity > 0.6 && cornerCount <= 8) return "rectangle";
  return "ellipse";
}

function centerOf(s: { x: number; y: number; width: number; height: number }) {
  return { x: s.x + s.width / 2, y: s.y + s.height / 2 };
}

function nearestShape(p: Point, shapes: ShapeCandidate[], maxDist = 130) {
  let best: { ref: string; d: number } | null = null;
  for (const s of shapes) {
    const c = centerOf(s);
    const dx = Math.max(s.x - p.x, 0, p.x - (s.x + s.width));
    const dy = Math.max(s.y - p.y, 0, p.y - (s.y + s.height));
    const d = Math.hypot(dx, dy) || Math.hypot(p.x - c.x, p.y - c.y) * 0.01;
    if (!best || d < best.d) best = { ref: s.ref, d };
  }
  return best && best.d <= maxDist ? best.ref : null;
}

export function recognizeSketch(all: CanvasElement[]): Recognition {
  const live = all.filter((e) => !e.isDeleted);
  const strokes = live.filter((e) => e.type === "freedraw" && (e.points?.length ?? 0) > 3);
  const texts = live.filter((e) => e.type === "text" && e.text);
  const drawnShapes = live.filter((e) => ["rectangle", "ellipse", "diamond"].includes(e.type));
  const drawnLines = live.filter((e) => e.type === "arrow" || e.type === "line");

  const shapes: ShapeCandidate[] = [];
  const openStrokes: { pts: Point[]; id: string }[] = [];
  const consumedIds: string[] = [];

  // already-perfect shapes count as candidates too, so mixed boards work
  for (const el of drawnShapes) {
    const box = {
      x: Math.min(el.x, el.x + el.width),
      y: Math.min(el.y, el.y + el.height),
      width: Math.abs(el.width),
      height: Math.abs(el.height),
    };
    shapes.push({
      ref: `s${shapes.length}`,
      guess: el.type as ShapeCandidate["guess"],
      ...box,
      nearbyText: el.text ? [el.text] : [],
      sourceIds: [el.id],
    });
    consumedIds.push(el.id);
  }

  for (const el of strokes) {
    const pts = absPoints(el);
    const box = bbox(pts);
    const closed = isClosed(pts) && box.width > 24 && box.height > 24;
    if (closed) {
      shapes.push({
        ref: `s${shapes.length}`,
        guess: classifyClosed(pts, box),
        ...box,
        nearbyText: [],
        sourceIds: [el.id],
      });
    } else {
      openStrokes.push({ pts, id: el.id });
    }
    consumedIds.push(el.id);
  }

  // attach text labels to the shape that contains / sits closest to them
  const looseTexts: { text: string; x: number; y: number }[] = [];
  for (const t of texts) {
    const p = { x: t.x + (t.width || 0) / 2, y: t.y + (t.height || 0) / 2 };
    const inside = shapes.find(
      (s) => p.x >= s.x - 8 && p.x <= s.x + s.width + 8 && p.y >= s.y - 8 && p.y <= s.y + s.height + 8,
    );
    const host = inside ?? shapes.find((s) => s.ref === nearestShape(p, shapes, 70));
    if (host) host.nearbyText.push(t.text!);
    else looseTexts.push({ text: t.text!, x: t.x, y: t.y });
    consumedIds.push(t.id);
  }

  // connector strokes: endpoints snapped to their nearest shapes
  const connectors: ConnectorCandidate[] = [];
  for (const s of openStrokes) {
    const from = nearestShape(s.pts[0], shapes);
    const to = nearestShape(s.pts[s.pts.length - 1], shapes);
    if (from && to && from !== to) connectors.push({ fromRef: from, toRef: to, sourceIds: [s.id] });
  }
  for (const l of drawnLines) {
    const start = { x: l.x, y: l.y };
    const end = { x: l.x + l.width, y: l.y + l.height };
    const from = nearestShape(start, shapes);
    const to = nearestShape(end, shapes);
    if (from && to && from !== to) connectors.push({ fromRef: from, toRef: to, sourceIds: [l.id] });
    consumedIds.push(l.id);
  }

  return { shapes, connectors, texts: looseTexts, consumedIds };
}
