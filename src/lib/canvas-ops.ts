import { nanoid } from "nanoid";
import { createElement } from "@/lib/canvas-utils";
import { autoLayout, reflowConnectors } from "@/lib/auto-layout";
import type { CanvasElement, FillStyle, Tool } from "@/types/canvas";

/* ------------------------------------------------------------------ *
 * Agent operation interpreter.
 * Translates the whiteboard agent's abstract ops into real canvas
 * elements, resolving targets by id OR by fuzzy label match, and
 * keeping connectors glued via bindings.
 * ------------------------------------------------------------------ */

export interface AgentOp {
  op: "add" | "connect" | "update" | "move" | "remove" | "layout" | "annotate";
  shape?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  label?: string;
  from?: string;
  to?: string;
  target?: string;
  fillColor?: string;
  strokeColor?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function resolve(elements: CanvasElement[], ref?: string): CanvasElement | undefined {
  if (!ref) return undefined;
  const byId = elements.find((e) => !e.isDeleted && e.id === ref);
  if (byId) return byId;
  const want = norm(ref);
  if (!want) return undefined;
  const live = elements.filter((e) => !e.isDeleted && e.text);
  return (
    live.find((e) => norm(e.text!) === want) ??
    live.find((e) => norm(e.text!).includes(want)) ??
    live.find((e) => want.includes(norm(e.text!)))
  );
}

function makeNode(op: AgentOp, fallbackX: number, fallbackY: number): CanvasElement {
  const shape = (["rectangle", "ellipse", "diamond", "text"].includes(op.shape ?? "")
    ? op.shape
    : "rectangle") as Tool;
  const fill = op.fillColor && op.fillColor !== "transparent" ? op.fillColor : "#ffffff";
  const fillStyle: FillStyle = shape === "text" ? "none" : "solid";
  const el = createElement(
    nanoid(),
    shape,
    op.x ?? fallbackX,
    op.y ?? fallbackY,
    op.strokeColor || "#1e1e1e",
    shape === "text" ? "transparent" : fill,
    fillStyle,
    2,
    "solid",
    1,
    0,
  );
  el.width = op.width ?? (shape === "text" ? Math.max(60, (op.text?.length ?? 8) * 9) : 170);
  el.height = op.height ?? (shape === "text" ? 24 : 70);
  if (op.text) el.text = op.text;
  return el;
}

function makeConnector(from: CanvasElement, to: CanvasElement, label?: string): CanvasElement[] {
  const arrow = createElement(nanoid(), "arrow", from.x + from.width, from.y + from.height / 2, "#64748b", "transparent", "none", 2, "solid", 1, 0);
  arrow.width = to.x - (from.x + from.width);
  arrow.height = to.y + to.height / 2 - (from.y + from.height / 2);
  arrow.startBinding = from.id;
  arrow.endBinding = to.id;
  const out = [arrow];
  if (label) {
    const mid = createElement(
      nanoid(),
      "text",
      (from.x + from.width + to.x) / 2 - label.length * 3.5,
      (from.y + from.height / 2 + to.y + to.height / 2) / 2 - 18,
      "#64748b",
      "transparent",
      "none",
      1,
      "solid",
      1,
      0,
    );
    mid.text = label;
    mid.width = Math.max(40, label.length * 8);
    mid.height = 20;
    out.push(mid);
  }
  return out;
}

/** Free space to the right of everything currently on the board. */
function freeSpot(elements: CanvasElement[]) {
  const live = elements.filter((e) => !e.isDeleted);
  if (live.length === 0) return { x: 0, y: 0 };
  const maxX = Math.max(...live.map((e) => e.x + e.width));
  const minY = Math.min(...live.map((e) => e.y));
  return { x: maxX + 140, y: minY };
}

export interface ApplyResult {
  elements: CanvasElement[];
  created: string[];
  ranLayout: boolean;
}

export function applyAgentOps(current: CanvasElement[], ops: AgentOp[]): ApplyResult {
  let elements = [...current];
  const created: string[] = [];
  let ranLayout = false;
  const anchor = freeSpot(current);
  let cursorY = anchor.y;

  for (const op of ops) {
    switch (op.op) {
      case "add": {
        const el = makeNode(op, anchor.x, cursorY);
        if (op.x === undefined || op.y === undefined) cursorY += (el.height || 70) + 60;
        elements.push(el);
        created.push(el.id);
        break;
      }
      case "connect": {
        const from = resolve(elements, op.from);
        const to = resolve(elements, op.to);
        if (!from || !to) break;
        const made = makeConnector(from, to, op.label);
        elements.push(...made);
        created.push(...made.map((m) => m.id));
        break;
      }
      case "update": {
        const t = resolve(elements, op.target);
        if (!t) break;
        elements = elements.map((e) =>
          e.id === t.id
            ? {
                ...e,
                ...(op.text !== undefined ? { text: op.text } : {}),
                ...(op.fillColor ? { fillColor: op.fillColor, fillStyle: "solid" as FillStyle } : {}),
                ...(op.strokeColor ? { strokeColor: op.strokeColor } : {}),
              }
            : e,
        );
        break;
      }
      case "move": {
        const t = resolve(elements, op.target);
        if (!t) break;
        elements = elements.map((e) =>
          e.id === t.id ? { ...e, x: op.x ?? e.x, y: op.y ?? e.y } : e,
        );
        break;
      }
      case "remove": {
        const t = resolve(elements, op.target);
        if (!t) break;
        elements = elements.map((e) => (e.id === t.id ? { ...e, isDeleted: true } : e));
        break;
      }
      case "annotate": {
        const t = resolve(elements, op.target);
        const text = op.text ?? op.label ?? "";
        if (!text) break;
        const note = createElement(
          nanoid(),
          "text",
          (t ? t.x : anchor.x),
          (t ? t.y - 34 : cursorY),
          "#ec4899",
          "transparent",
          "none",
          1,
          "solid",
          1,
          0,
        );
        note.text = text;
        note.width = Math.max(60, text.length * 8);
        note.height = 22;
        elements.push(note);
        created.push(note.id);
        break;
      }
      case "layout": {
        ranLayout = true;
        break;
      }
    }
  }

  elements = reflowConnectors(elements);
  if (ranLayout) elements = autoLayout(elements, { direction: "horizontal" });
  return { elements, created, ranLayout };
}
