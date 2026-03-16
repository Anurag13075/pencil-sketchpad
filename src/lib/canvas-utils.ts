import type { CanvasElement, Point, HandlePosition } from "@/types/canvas";

export function createElement(
  id: string,
  type: CanvasElement["type"],
  x: number,
  y: number,
  strokeColor: string,
  fillColor: string,
  fillStyle: CanvasElement["fillStyle"],
  strokeWidth: number,
  strokeStyle: CanvasElement["strokeStyle"],
  opacity: number,
  roughness: number
): CanvasElement {
  return {
    id,
    type,
    x,
    y,
    width: 0,
    height: 0,
    strokeColor,
    fillColor,
    fillStyle,
    strokeWidth,
    strokeStyle,
    opacity,
    angle: 0,
    roughness,
    seed: Math.floor(Math.random() * 100000),
    points: type === "freedraw" ? [{ x: 0, y: 0 }] : undefined,
  };
}

export function getElementBounds(el: CanvasElement): { x: number; y: number; w: number; h: number } {
  if (el.type === "freedraw" && el.points && el.points.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of el.points) {
      minX = Math.min(minX, el.x + p.x);
      minY = Math.min(minY, el.y + p.y);
      maxX = Math.max(maxX, el.x + p.x);
      maxY = Math.max(maxY, el.y + p.y);
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  if (el.type === "line" || el.type === "arrow") {
    const x1 = el.x, y1 = el.y;
    const x2 = el.x + el.width, y2 = el.y + el.height;
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      w: Math.abs(el.width),
      h: Math.abs(el.height),
    };
  }
  const x = el.width < 0 ? el.x + el.width : el.x;
  const y = el.height < 0 ? el.y + el.height : el.y;
  return { x, y, w: Math.abs(el.width), h: Math.abs(el.height) };
}

export function hitTest(el: CanvasElement, px: number, py: number, threshold = 8): boolean {
  const b = getElementBounds(el);
  const expand = threshold;

  if (el.type === "freedraw" && el.points) {
    for (let i = 1; i < el.points.length; i++) {
      const ax = el.x + el.points[i - 1].x;
      const ay = el.y + el.points[i - 1].y;
      const bx = el.x + el.points[i].x;
      const by = el.y + el.points[i].y;
      if (distToSegment(px, py, ax, ay, bx, by) < threshold) return true;
    }
    return false;
  }

  if (el.type === "line" || el.type === "arrow") {
    return distToSegment(px, py, el.x, el.y, el.x + el.width, el.y + el.height) < threshold;
  }

  if (el.type === "text") {
    return px >= b.x - expand && px <= b.x + b.w + expand && py >= b.y - expand && py <= b.y + b.h + expand;
  }

  // For shapes with fill
  if (el.fillStyle !== "none" && el.fillColor !== "transparent") {
    return px >= b.x - expand && px <= b.x + b.w + expand && py >= b.y - expand && py <= b.y + b.h + expand;
  }

  // Border hit test for unfilled shapes
  const inOuter = px >= b.x - expand && px <= b.x + b.w + expand && py >= b.y - expand && py <= b.y + b.h + expand;
  const inInner = px >= b.x + expand && px <= b.x + b.w - expand && py >= b.y + expand && py <= b.y + b.h - expand;
  return inOuter && !inInner;
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function getHandleAtPoint(
  el: CanvasElement,
  px: number,
  py: number,
  zoom: number
): HandlePosition | null {
  const b = getElementBounds(el);
  const size = 6 / zoom;
  const handles: { pos: HandlePosition; x: number; y: number }[] = [
    { pos: "nw", x: b.x, y: b.y },
    { pos: "ne", x: b.x + b.w, y: b.y },
    { pos: "sw", x: b.x, y: b.y + b.h },
    { pos: "se", x: b.x + b.w, y: b.y + b.h },
    { pos: "n", x: b.x + b.w / 2, y: b.y },
    { pos: "s", x: b.x + b.w / 2, y: b.y + b.h },
    { pos: "w", x: b.x, y: b.y + b.h / 2 },
    { pos: "e", x: b.x + b.w, y: b.y + b.h / 2 },
  ];

  for (const h of handles) {
    if (Math.abs(px - h.x) <= size && Math.abs(py - h.y) <= size) {
      return h.pos;
    }
  }
  return null;
}

export function resizeElement(
  el: CanvasElement,
  handle: HandlePosition,
  dx: number,
  dy: number
): Partial<CanvasElement> {
  const updates: Partial<CanvasElement> = {};
  switch (handle) {
    case "se": updates.width = el.width + dx; updates.height = el.height + dy; break;
    case "nw": updates.x = el.x + dx; updates.y = el.y + dy; updates.width = el.width - dx; updates.height = el.height - dy; break;
    case "ne": updates.y = el.y + dy; updates.width = el.width + dx; updates.height = el.height - dy; break;
    case "sw": updates.x = el.x + dx; updates.width = el.width - dx; updates.height = el.height + dy; break;
    case "n": updates.y = el.y + dy; updates.height = el.height - dy; break;
    case "s": updates.height = el.height + dy; break;
    case "w": updates.x = el.x + dx; updates.width = el.width - dx; break;
    case "e": updates.width = el.width + dx; break;
  }
  return updates;
}

export function drawElement(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isSelected: boolean,
  zoom: number
) {
  ctx.save();
  ctx.globalAlpha = el.opacity;
  ctx.strokeStyle = el.strokeColor;
  ctx.lineWidth = el.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (el.strokeStyle === "dashed") {
    ctx.setLineDash([12, 6]);
  } else if (el.strokeStyle === "dotted") {
    ctx.setLineDash([2, 4]);
  }

  const b = getElementBounds(el);

  switch (el.type) {
    case "rectangle":
      drawRect(ctx, el, b);
      break;
    case "ellipse":
      drawEllipse(ctx, el, b);
      break;
    case "diamond":
      drawDiamond(ctx, el, b);
      break;
    case "line":
      drawLine(ctx, el);
      break;
    case "arrow":
      drawArrow(ctx, el);
      break;
    case "freedraw":
      drawFreedraw(ctx, el);
      break;
    case "text":
      drawText(ctx, el);
      break;
    case "ai-image":
      drawImage(ctx, el, b);
      break;
  }

  ctx.restore();

  if (isSelected) {
    drawSelectionBox(ctx, el, zoom);
  }
}

function applyFill(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  if (el.fillStyle === "none" || el.fillColor === "transparent") return;
  ctx.fillStyle = el.fillColor;
  if (el.fillStyle === "solid") {
    ctx.fill();
  } else if (el.fillStyle === "hachure") {
    ctx.fill(); // simplified - just solid fill
  } else if (el.fillStyle === "cross-hatch") {
    ctx.fill();
  }
}

function drawRect(ctx: CanvasRenderingContext2D, el: CanvasElement, b: { x: number; y: number; w: number; h: number }) {
  ctx.beginPath();
  ctx.rect(b.x, b.y, b.w, b.h);
  applyFill(ctx, el);
  ctx.stroke();
}

function drawEllipse(ctx: CanvasRenderingContext2D, el: CanvasElement, b: { x: number; y: number; w: number; h: number }) {
  ctx.beginPath();
  ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
  applyFill(ctx, el);
  ctx.stroke();
}

function drawDiamond(ctx: CanvasRenderingContext2D, el: CanvasElement, b: { x: number; y: number; w: number; h: number }) {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  ctx.beginPath();
  ctx.moveTo(cx, b.y);
  ctx.lineTo(b.x + b.w, cy);
  ctx.lineTo(cx, b.y + b.h);
  ctx.lineTo(b.x, cy);
  ctx.closePath();
  applyFill(ctx, el);
  ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  ctx.beginPath();
  ctx.moveTo(el.x, el.y);
  ctx.lineTo(el.x + el.width, el.y + el.height);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  const x2 = el.x + el.width, y2 = el.y + el.height;
  ctx.beginPath();
  ctx.moveTo(el.x, el.y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(el.height, el.width);
  const headLen = 16;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawFreedraw(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  if (!el.points || el.points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(el.x + el.points[0].x, el.y + el.points[0].y);
  for (let i = 1; i < el.points.length; i++) {
    ctx.lineTo(el.x + el.points[i].x, el.y + el.points[i].y);
  }
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  if (!el.text) return;
  ctx.fillStyle = el.strokeColor;
  ctx.font = `${Math.max(16, el.height || 20)}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = "top";
  const lines = el.text.split("\n");
  const lineHeight = (el.height || 20);
  lines.forEach((line, i) => {
    ctx.fillText(line, el.x, el.y + i * lineHeight);
  });
}

function drawSelectionBox(ctx: CanvasRenderingContext2D, el: CanvasElement, zoom: number) {
  const b = getElementBounds(el);
  const pad = 4;
  ctx.save();
  ctx.strokeStyle = "hsl(215, 100%, 50%)";
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([]);
  ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2);

  // Draw handles
  const handleSize = 6 / zoom;
  ctx.fillStyle = "hsl(0, 0%, 100%)";
  const handles = [
    [b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h],
    [b.x + b.w / 2, b.y], [b.x + b.w / 2, b.y + b.h],
    [b.x, b.y + b.h / 2], [b.x + b.w, b.y + b.h / 2],
  ];
  for (const [hx, hy] of handles) {
    ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
  }
  ctx.restore();
}
