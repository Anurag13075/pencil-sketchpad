import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, User as UserIcon, LogOut } from "lucide-react";
import { nanoid } from "nanoid";
import type { Tool, CanvasElement, HandlePosition, Point, FillStyle, StrokeStyle } from "@/types/canvas";
import { useCanvasHistory } from "@/hooks/use-canvas-history";
import { createElement, drawElement, hitTest, getHandleAtPoint, resizeElement, getElementBounds, setImageLoadListener } from "@/lib/canvas-utils";
import { InstrumentTray } from "./InstrumentTray";
import { StatusBar } from "./StatusBar";
import { PropertyInspector } from "./PropertyInspector";
import { AIImageDialog } from "./AIImageDialog";
import { PromptToDiagramDialog, type DiagramElement } from "./PromptToDiagramDialog";
import { ExplainDiagramPanel } from "./ExplainDiagramPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";

type Action =
  | { type: "none" }
  | { type: "drawing"; elementId: string }
  | { type: "moving"; startX: number; startY: number; originals: Map<string, { x: number; y: number }> }
  | { type: "resizing"; elementId: string; handle: HandlePosition; startX: number; startY: number; original: CanvasElement }
  | { type: "panning"; startX: number; startY: number; startPan: Point };

export function PencilCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const { elements, setElements, commit, undo, redo, canUndo, canRedo } = useCanvasHistory([]);

  const [tool, setTool] = useState<Tool>("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
  const [gridEnabled, setGridEnabled] = useState(false);
  const [action, setAction] = useState<Action>({ type: "none" });

  // Style state
  const [strokeColor, setStrokeColor] = useState("#1e1e1e");
  const [fillColor, setFillColor] = useState("transparent");
  const [fillStyle, setFillStyle] = useState<FillStyle>("none");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>("solid");
  const [opacity, setOpacity] = useState(1);

  // Text editing
  const [editingText, setEditingText] = useState<{ id: string; x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showExplainPanel, setShowExplainPanel] = useState(false);

  const { user, signOut } = useAuth();

  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const screenToCanvas = useCallback(
    (sx: number, sy: number): Point => ({
      x: (sx - panOffset.x) / zoom,
      y: (sy - panOffset.y) / zoom,
    }),
    [panOffset, zoom]
  );

  const canvasToScreen = useCallback(
    (cx: number, cy: number): Point => ({
      x: cx * zoom + panOffset.x,
      y: cy * zoom + panOffset.y,
    }),
    [panOffset, zoom]
  );

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Fill background
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue("--canvas-bg").trim();
    ctx.fillStyle = bg ? `hsl(${bg})` : "#f8f9fb";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid
    if (gridEnabled) {
      drawGrid(ctx, rect.width, rect.height, panOffset, zoom);
    }

    // Transform for elements
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw elements
    const visibleElements = elements.filter((e) => !e.isDeleted);
    for (const el of visibleElements) {
      drawElement(ctx, el, selectedIds.has(el.id), zoom);
    }

    ctx.restore();
  }, [elements, selectedIds, panOffset, zoom, gridEnabled]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      setElements((prev) => [...prev]); // trigger re-render
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [setElements]);

  // Re-render when AI images finish loading
  useEffect(() => {
    setImageLoadListener(() => {
      setElements((prev) => [...prev]);
    });
    return () => setImageLoadListener(() => {});
  }, [setElements]);

  // Mouse handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const { x: cx, y: cy } = screenToCanvas(sx, sy);

      // Middle button or space: pan
      if (e.button === 1) {
        setAction({ type: "panning", startX: e.clientX, startY: e.clientY, startPan: { ...panOffset } });
        return;
      }

      if (tool === "select") {
        // Check resize handles on selected elements
        for (const id of selectedIds) {
          const el = elementsRef.current.find((e) => e.id === id);
          if (el) {
            const handle = getHandleAtPoint(el, cx, cy, zoom);
            if (handle) {
              setAction({ type: "resizing", elementId: id, handle, startX: cx, startY: cy, original: { ...el } });
              return;
            }
          }
        }

        // Check hit on element
        const hit = [...elementsRef.current].reverse().find((el) => !el.isDeleted && hitTest(el, cx, cy));
        if (hit) {
          const newSelected = e.shiftKey ? new Set(selectedIds) : new Set<string>();
          newSelected.add(hit.id);
          setSelectedIds(newSelected);
          const originals = new Map<string, { x: number; y: number }>();
          for (const id of newSelected) {
            const el = elementsRef.current.find((e) => e.id === id);
            if (el) originals.set(id, { x: el.x, y: el.y });
          }
          setAction({ type: "moving", startX: cx, startY: cy, originals });
        } else {
          setSelectedIds(new Set());
          // Start panning
          setAction({ type: "panning", startX: e.clientX, startY: e.clientY, startPan: { ...panOffset } });
        }
        return;
      }

      if (tool === "eraser") {
        const hit = [...elementsRef.current].reverse().find((el) => !el.isDeleted && hitTest(el, cx, cy));
        if (hit) {
          setElements((prev) => prev.map((el) => (el.id === hit.id ? { ...el, isDeleted: true } : el)));
          commit(elementsRef.current.map((el) => (el.id === hit.id ? { ...el, isDeleted: true } : el)));
        }
        return;
      }

      if (tool === "text") {
        setEditingText({ id: nanoid(), x: cx, y: cy });
        setTextValue("");
        setTimeout(() => textInputRef.current?.focus(), 50);
        return;
      }

      if (tool === "ai-image") {
        setShowAIDialog(true);
        return;
      }

      // Create new element
      const id = nanoid();
      const newEl = createElement(id, tool, cx, cy, strokeColor, fillColor, fillStyle, strokeWidth, strokeStyle, opacity, 0);
      setElements((prev) => [...prev, newEl]);
      setAction({ type: "drawing", elementId: id });
      setSelectedIds(new Set([id]));
    },
    [tool, selectedIds, panOffset, zoom, screenToCanvas, strokeColor, fillColor, fillStyle, strokeWidth, strokeStyle, opacity, setElements, commit]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const { x: cx, y: cy } = screenToCanvas(sx, sy);
      setCursorPos({ x: cx, y: cy });

      if (action.type === "panning") {
        const dx = e.clientX - action.startX;
        const dy = e.clientY - action.startY;
        setPanOffset({ x: action.startPan.x + dx, y: action.startPan.y + dy });
        return;
      }

      if (action.type === "drawing") {
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== action.elementId) return el;
            if (el.type === "freedraw") {
              return { ...el, points: [...(el.points || []), { x: cx - el.x, y: cy - el.y }] };
            }
            return { ...el, width: cx - el.x, height: cy - el.y };
          })
        );
        return;
      }

      if (action.type === "moving") {
        const dx = cx - action.startX;
        const dy = cy - action.startY;
        setElements((prev) =>
          prev.map((el) => {
            const orig = action.originals.get(el.id);
            if (!orig) return el;
            return { ...el, x: orig.x + dx, y: orig.y + dy };
          })
        );
        return;
      }

      if (action.type === "resizing") {
        const dx = cx - action.startX;
        const dy = cy - action.startY;
        const updates = resizeElement(action.original, action.handle, dx, dy);
        setElements((prev) =>
          prev.map((el) => (el.id === action.elementId ? { ...el, ...updates } : el))
        );
        return;
      }

      if (tool === "eraser" && e.buttons === 1) {
        const hit = [...elementsRef.current].reverse().find((el) => !el.isDeleted && hitTest(el, cx, cy));
        if (hit) {
          setElements((prev) => prev.map((el) => (el.id === hit.id ? { ...el, isDeleted: true } : el)));
        }
      }
    },
    [action, screenToCanvas, setElements, tool]
  );

  const handlePointerUp = useCallback(() => {
    if (action.type === "drawing" || action.type === "moving" || action.type === "resizing") {
      commit(elementsRef.current);
    }
    if (action.type === "drawing") {
      // If creating a shape, switch back to select
      if (tool !== "freedraw") {
        setTool("select");
      }
    }
    setAction({ type: "none" });
  }, [action, commit, tool]);

  // Zoom with wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.1, Math.min(10, zoom * factor));
        setPanOffset({
          x: sx - (sx - panOffset.x) * (newZoom / zoom),
          y: sy - (sy - panOffset.y) * (newZoom / zoom),
        });
        setZoom(newZoom);
      } else {
        setPanOffset((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    },
    [zoom, panOffset]
  );

  // Open AI dialog when ai-image tool selected
  useEffect(() => {
    if (tool === "ai-image") {
      setShowAIDialog(true);
    }
  }, [tool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing text
      if (editingText) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        exportCanvas();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0) {
          setElements((prev) =>
            prev.map((el) => (selectedIds.has(el.id) ? { ...el, isDeleted: true } : el))
          );
          commit(elementsRef.current.map((el) => (selectedIds.has(el.id) ? { ...el, isDeleted: true } : el)));
          setSelectedIds(new Set());
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(new Set(elements.filter((e) => !e.isDeleted).map((e) => e.id)));
        return;
      }

      const toolMap: Record<string, Tool> = {
        v: "select", "1": "select",
        r: "rectangle", "2": "rectangle",
        o: "ellipse", "3": "ellipse",
        d: "diamond",
        l: "line",
        a: "arrow",
        p: "freedraw",
        t: "text",
        e: "eraser",
      };
      const t = toolMap[e.key.toLowerCase()];
      if (t) setTool(t);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds, editingText, undo, redo, setElements, commit, elements]);

  const exportCanvas = useCallback(() => {
    const visibleElements = elementsRef.current.filter((e) => !e.isDeleted);
    if (visibleElements.length === 0) return;

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of visibleElements) {
      const b = getElementBounds(el);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w);
      maxY = Math.max(maxY, b.y + b.h);
    }

    const pad = 40;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = w * 2;
    exportCanvas.height = h * 2;
    const ctx = exportCanvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.fillStyle = "#f8f9fb";
    ctx.fillRect(0, 0, w, h);
    ctx.translate(-minX + pad, -minY + pad);

    for (const el of visibleElements) {
      drawElement(ctx, el, false, 1);
    }

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pencil-export.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  }, []);

  const handleClear = useCallback(() => {
    setElements([]);
    commit([]);
    setSelectedIds(new Set());
  }, [setElements, commit]);

  const commitTextInput = useCallback(() => {
    if (!editingText || !textValue.trim()) {
      setEditingText(null);
      return;
    }
    const el = createElement(editingText.id, "text", editingText.x, editingText.y, strokeColor, fillColor, fillStyle, strokeWidth, strokeStyle, opacity, 0);
    el.text = textValue;
    el.width = textValue.length * 10;
    el.height = 20;
    const newElements = [...elementsRef.current, el];
    setElements(newElements);
    commit(newElements);
    setEditingText(null);
    setTextValue("");
    setTool("select");
  }, [editingText, textValue, strokeColor, fillColor, fillStyle, strokeWidth, strokeStyle, opacity, setElements, commit]);

  // Update selected element styles reactively
  const updateSelectedStyles = useCallback(
    (updates: Partial<CanvasElement>) => {
      if (selectedIds.size === 0) return;
      setElements((prev) =>
        prev.map((el) => (selectedIds.has(el.id) ? { ...el, ...updates } : el))
      );
      commit(elementsRef.current.map((el) => (selectedIds.has(el.id) ? { ...el, ...updates } : el)));
    },
    [selectedIds, setElements, commit]
  );

  const handleStrokeColorChange = useCallback((c: string) => {
    setStrokeColor(c);
    updateSelectedStyles({ strokeColor: c });
  }, [updateSelectedStyles]);

  const handleFillColorChange = useCallback((c: string) => {
    setFillColor(c);
    updateSelectedStyles({ fillColor: c });
  }, [updateSelectedStyles]);

  const handleFillStyleChange = useCallback((s: FillStyle) => {
    setFillStyle(s);
    updateSelectedStyles({ fillStyle: s });
  }, [updateSelectedStyles]);

  const handleStrokeWidthChange = useCallback((w: number) => {
    setStrokeWidth(w);
    updateSelectedStyles({ strokeWidth: w });
  }, [updateSelectedStyles]);

  const handleStrokeStyleChange = useCallback((s: StrokeStyle) => {
    setStrokeStyle(s);
    updateSelectedStyles({ strokeStyle: s });
  }, [updateSelectedStyles]);

  const handleOpacityChange = useCallback((o: number) => {
    setOpacity(o);
    updateSelectedStyles({ opacity: o });
  }, [updateSelectedStyles]);

  const handleAIImageGenerated = useCallback((imageData: string, width: number, height: number) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    // Center of viewport in canvas coords
    const cx = rect ? (rect.width / 2 - panOffset.x) / zoom : cursorPos.x;
    const cy = rect ? (rect.height / 2 - panOffset.y) / zoom : cursorPos.y;
    const id = nanoid();
    const el = createElement(id, "ai-image" as Tool, cx - width / 2, cy - height / 2, strokeColor, fillColor, fillStyle, strokeWidth, strokeStyle, opacity, 0);
    el.width = width;
    el.height = height;
    el.imageData = imageData;
    el.imageLoaded = true;
    const newElements = [...elementsRef.current, el];
    setElements(newElements);
    commit(newElements);
    setSelectedIds(new Set([id]));
    setShowAIDialog(false);
    setTool("select");
  }, [panOffset, zoom, cursorPos, strokeColor, fillColor, fillStyle, strokeWidth, strokeStyle, opacity, setElements, commit]);

  const handleDiagramGenerated = useCallback((diagramElements: DiagramElement[]) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    // Center the diagram (1000x600 canonical) in viewport
    const vx = rect ? (rect.width / 2 - panOffset.x) / zoom : 0;
    const vy = rect ? (rect.height / 2 - panOffset.y) / zoom : 0;
    const offsetX = vx - 500;
    const offsetY = vy - 300;

    const newOnes: CanvasElement[] = diagramElements.map((d) => {
      const id = nanoid();
      const stroke = d.strokeColor || "#1e1e1e";
      const fill = d.fillColor || "transparent";
      const fillStyleVal: FillStyle = fill !== "transparent" ? "solid" : "none";
      const el = createElement(id, d.type as Tool, d.x + offsetX, d.y + offsetY, stroke, fill, fillStyleVal, 2, "solid", 1, 0);
      el.width = d.width;
      el.height = d.height;
      if (d.text) el.text = d.text;
      return el;
    });
    const merged = [...elementsRef.current, ...newOnes];
    setElements(merged);
    commit(merged);
    setSelectedIds(new Set(newOnes.map((e) => e.id)));
    setShowPromptDialog(false);
  }, [panOffset, zoom, setElements, commit]);

  const getCursor = () => {
    if (tool === "select") return action.type === "panning" ? "grabbing" : "default";
    if (tool === "eraser") return "crosshair";
    if (tool === "text") return "text";
    if (tool === "ai-image") return "crosshair";
    return "crosshair";
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: getCursor() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Text editing overlay */}
      {editingText && (
        <textarea
          ref={textInputRef}
          className="absolute z-50 bg-transparent border border-primary outline-none resize-none p-1 text-foreground"
          style={{
            left: canvasToScreen(editingText.x, editingText.y).x,
            top: canvasToScreen(editingText.x, editingText.y).y,
            fontSize: `${16 * zoom}px`,
            fontFamily: "Inter, system-ui, sans-serif",
            minWidth: "100px",
            minHeight: "30px",
          }}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={commitTextInput}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditingText(null);
              setTextValue("");
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitTextInput();
            }
          }}
        />
      )}

      {/* Title + auth chip */}
      <div className="fixed top-3 left-3 z-50 flex items-center gap-2">
        <Link to="/" className="px-3 py-1.5 border rounded-md bg-background/85 backdrop-blur-xl hover:bg-muted transition">
          <span className="text-sm font-semibold tracking-tight text-foreground">Pencil</span>
          <span className="text-xs text-muted-foreground ml-1.5">Draft</span>
        </Link>
        <ThemeToggle className="border bg-background/85 backdrop-blur-xl" />
        {user ? (
          <div className="flex items-center gap-1 px-2.5 py-1.5 border rounded-md bg-background/85 backdrop-blur-xl">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <UserIcon size={13} className="text-muted-foreground" />
            )}
            <span className="text-xs text-foreground max-w-[120px] truncate">
              {user.user_metadata?.full_name || user.email}
            </span>
            <button onClick={signOut} title="Sign out" className="ml-1 text-muted-foreground hover:text-foreground">
              <LogOut size={12} />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md bg-background/85 backdrop-blur-xl text-xs text-foreground hover:bg-muted transition"
          >
            <LogIn size={12} /> Sign in
          </Link>
        )}
      </div>

      <InstrumentTray
        activeTool={tool}
        onToolChange={setTool}
        onUndo={undo}
        onRedo={redo}
        onClear={handleClear}
        onExport={exportCanvas}
        onAIImage={() => setShowAIDialog(true)}
        onPromptToDiagram={() => setShowPromptDialog(true)}
        onExplainDiagram={() => setShowExplainPanel(true)}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <PropertyInspector
        visible={tool !== "select" || selectedIds.size > 0}
        strokeColor={strokeColor}
        fillColor={fillColor}
        fillStyle={fillStyle}
        strokeWidth={strokeWidth}
        strokeStyle={strokeStyle}
        opacity={opacity}
        onStrokeColorChange={handleStrokeColorChange}
        onFillColorChange={handleFillColorChange}
        onFillStyleChange={handleFillStyleChange}
        onStrokeWidthChange={handleStrokeWidthChange}
        onStrokeStyleChange={handleStrokeStyleChange}
        onOpacityChange={handleOpacityChange}
      />

      <StatusBar
        x={cursorPos.x}
        y={cursorPos.y}
        zoom={zoom}
        elementCount={elements.filter((e) => !e.isDeleted).length}
        gridEnabled={gridEnabled}
        onToggleGrid={() => setGridEnabled((g) => !g)}
      />

      <AIImageDialog
        visible={showAIDialog}
        onClose={() => { setShowAIDialog(false); if (tool === "ai-image") setTool("select"); }}
        onImageGenerated={handleAIImageGenerated}
      />

      <PromptToDiagramDialog
        visible={showPromptDialog}
        onClose={() => setShowPromptDialog(false)}
        onDiagramGenerated={handleDiagramGenerated}
      />

      <ExplainDiagramPanel
        visible={showExplainPanel}
        onClose={() => setShowExplainPanel(false)}
        elements={elements}
      />
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, pan: Point, zoom: number) {
  const minorSize = 20 * zoom;
  const majorSize = 100 * zoom;

  const startX = pan.x % majorSize;
  const startY = pan.y % majorSize;
  const minorStartX = pan.x % minorSize;
  const minorStartY = pan.y % minorSize;

  const style = getComputedStyle(document.documentElement);
  const gridColor = style.getPropertyValue("--grid-major").trim() || "210 10% 10%";
  const isDark = document.documentElement.classList.contains("dark");
  const minorAlpha = isDark ? 0.05 : 0.025;
  const majorAlpha = isDark ? 0.09 : 0.05;

  // Minor grid
  ctx.strokeStyle = `hsla(${gridColor}, ${minorAlpha})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = minorStartX; x < w; x += minorSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = minorStartY; y < h; y += minorSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Major grid
  ctx.strokeStyle = `hsla(${gridColor}, ${majorAlpha})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = startX; x < w; x += majorSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = startY; y < h; y += majorSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}
