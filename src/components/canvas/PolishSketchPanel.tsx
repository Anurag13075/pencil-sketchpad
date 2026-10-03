import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand, X, Loader2, Check, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recognizeSketch } from "@/lib/sketch-recognizer";
import type { CanvasElement } from "@/types/canvas";

interface Props {
  visible: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  onApply: (next: CanvasElement[], createdIds: string[]) => void;
}

interface PNode { ref: string; label: string; shape: "rectangle" | "ellipse" | "diamond"; x: number; y: number; width: number; height: number; fillColor?: string }
interface PEdge { from: string; to: string; label?: string }
interface Result { title: string; nodes: PNode[]; edges: PEdge[] }

const uid = () => Math.random().toString(36).slice(2, 11);

function base(id: string, type: CanvasElement["type"], x: number, y: number, w: number, h: number, fill = "transparent"): CanvasElement {
  return {
    id, type, x, y, width: w, height: h,
    strokeColor: "#1e293b", fillColor: fill, fillStyle: fill === "transparent" ? "none" : "solid",
    strokeWidth: 2, strokeStyle: "solid", opacity: 100, angle: 0, roughness: 0,
    seed: Math.floor(Math.random() * 100000),
  };
}

function build(result: Result): CanvasElement[] {
  const byRef = new Map<string, CanvasElement>();
  const out: CanvasElement[] = [];
  for (const n of result.nodes) {
    const el = { ...base(uid(), n.shape, n.x, n.y, n.width || 170, n.height || 70, n.fillColor || "#ffffff"), text: n.label };
    byRef.set(n.ref, el);
    out.push(el);
  }
  for (const e of result.edges) {
    const a = byRef.get(e.from), b = byRef.get(e.to);
    if (!a || !b) continue;
    const ac = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const bc = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    const dx = bc.x - ac.x, dy = bc.y - ac.y;
    // clip to box edges
    const clip = (el: CanvasElement, sx: number, sy: number) => {
      const tx = Math.abs(sx) > 0 ? el.width / 2 / Math.abs(sx) : Infinity;
      const ty = Math.abs(sy) > 0 ? el.height / 2 / Math.abs(sy) : Infinity;
      return Math.min(tx, ty);
    };
    const t1 = clip(a, dx, dy), t2 = clip(b, dx, dy);
    const sx = ac.x + dx * t1, sy = ac.y + dy * t1;
    const ex = bc.x - dx * t2, ey = bc.y - dy * t2;
    out.push({
      ...base(uid(), "arrow", sx, sy, ex - sx, ey - sy),
      points: [{ x: 0, y: 0 }, { x: ex - sx, y: ey - sy }],
      startBinding: a.id, endBinding: b.id,
      text: e.label,
    });
  }
  return out;
}

export function PolishSketchPanel({ visible, onClose, elements, onApply }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; built: CanvasElement[]; consumed: string[] } | null>(null);

  const recognition = useMemo(() => (visible ? recognizeSketch(elements) : null), [visible, elements]);

  useEffect(() => { if (!visible) { setPreview(null); setError(null); } }, [visible]);

  const run = async () => {
    if (!recognition) return;
    setBusy(true); setError(null); setPreview(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("polish-sketch", {
        body: {
          shapes: recognition.shapes.map(({ sourceIds, ...s }) => s),
          connectors: recognition.connectors.map(({ sourceIds, ...c }) => c),
          texts: recognition.texts,
        },
      });
      if (fnErr) {
        let msg = fnErr.message;
        try { const b = await (fnErr as any).context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      const built = build(data as Result);
      if (!built.length) throw new Error("The beautifier returned an empty diagram.");
      setPreview({ title: data.title ?? "Polished diagram", built, consumed: recognition.consumedIds });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not polish this sketch.");
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!preview) return;
    const consumed = new Set(preview.consumed);
    const next = [
      ...elements.map((el) => (consumed.has(el.id) ? { ...el, isDeleted: true } : el)),
      ...preview.built,
    ];
    onApply(next, preview.built.map((e) => e.id));
    onClose();
  };

  // mini preview bounds
  const svg = useMemo(() => {
    if (!preview) return null;
    const els = preview.built;
    const xs = els.flatMap((e) => [e.x, e.x + e.width]);
    const ys = els.flatMap((e) => [e.y, e.y + e.height]);
    const minX = Math.min(...xs) - 20, minY = Math.min(...ys) - 20;
    const w = Math.max(...xs) - minX + 20, h = Math.max(...ys) - minY + 20;
    return { minX, minY, w, h, els };
  }, [preview]);

  const counts = recognition
    ? `${recognition.shapes.length} shapes · ${recognition.connectors.length} connectors · ${recognition.texts.length} labels detected`
    : "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-3 right-3 z-50 w-[400px] max-h-[calc(100vh-24px)] rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden"
          initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary"><Wand size={16} /></span>
              <div>
                <p className="text-sm font-semibold text-foreground">Polish Sketch</p>
                <p className="text-[11px] font-mono text-muted-foreground">{counts}</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><X size={16} /></button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
            {!preview && (
              <p className="text-[13px] text-muted-foreground">
                Draw boxes, circles and arrows with the pencil tool, then let Pencil rebuild them into a clean diagram. You'll see a preview before anything changes.
              </p>
            )}
            {svg && (
              <div className="rounded-lg border bg-card p-2">
                <p className="text-[11px] font-mono text-muted-foreground mb-1">{preview!.title}</p>
                <svg viewBox={`${svg.minX} ${svg.minY} ${svg.w} ${svg.h}`} className="w-full h-56">
                  {svg.els.map((e) =>
                    e.type === "arrow" ? (
                      <line key={e.id} x1={e.x} y1={e.y} x2={e.x + e.width} y2={e.y + e.height} className="stroke-foreground" strokeWidth={2} />
                    ) : (
                      <g key={e.id}>
                        {e.type === "ellipse" ? (
                          <ellipse cx={e.x + e.width / 2} cy={e.y + e.height / 2} rx={e.width / 2} ry={e.height / 2} fill={e.fillColor} className="stroke-foreground" strokeWidth={2} />
                        ) : e.type === "diamond" ? (
                          <polygon points={`${e.x + e.width / 2},${e.y} ${e.x + e.width},${e.y + e.height / 2} ${e.x + e.width / 2},${e.y + e.height} ${e.x},${e.y + e.height / 2}`} fill={e.fillColor} className="stroke-foreground" strokeWidth={2} />
                        ) : (
                          <rect x={e.x} y={e.y} width={e.width} height={e.height} rx={8} fill={e.fillColor} className="stroke-foreground" strokeWidth={2} />
                        )}
                        <text x={e.x + e.width / 2} y={e.y + e.height / 2} textAnchor="middle" dominantBaseline="middle" fontSize={14} fill="#0f172a">{e.text}</text>
                      </g>
                    ),
                  )}
                </svg>
                <p className="text-[11px] font-mono text-muted-foreground mt-1">
                  Replaces {preview!.consumed.length} rough strokes · undo anytime with Ctrl+Z
                </p>
              </div>
            )}
            {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>}
          </div>

          <div className="border-t p-3 flex gap-2">
            {preview ? (
              <>
                <button onClick={run} disabled={busy} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] hover:bg-muted text-foreground">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Try again
                </button>
                <button onClick={apply} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] text-primary-foreground">
                  <Check size={14} /> Apply to board
                </button>
              </>
            ) : (
              <button
                onClick={run}
                disabled={busy || !recognition?.shapes.length}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] text-primary-foreground disabled:opacity-40"
              >
                {busy ? <><Loader2 size={14} className="animate-spin" /> Polishing…</> : <><Wand size={14} /> Polish my sketch</>}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
