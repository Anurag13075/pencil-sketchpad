import React from "react";
import { motion } from "framer-motion";
import {
  MousePointer2, Square, Circle, Diamond, Minus, MoveRight,
  Pencil, Type, Eraser, Undo2, Redo2, Download, Trash2, Sparkles,
  Wand2, BookOpen, Shapes
} from "lucide-react";
import type { Tool } from "@/types/canvas";

interface InstrumentTrayProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onAIImage: () => void;
  onPromptToDiagram: () => void;
  onExplainDiagram: () => void;
  onIconLibrary: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const tools: { tool: Tool; icon: React.ElementType; label: string; shortcut: string }[] = [
  { tool: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { tool: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
  { tool: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
  { tool: "diamond", icon: Diamond, label: "Diamond", shortcut: "D" },
  { tool: "line", icon: Minus, label: "Line", shortcut: "L" },
  { tool: "arrow", icon: MoveRight, label: "Arrow", shortcut: "A" },
  { tool: "freedraw", icon: Pencil, label: "Draw", shortcut: "P" },
  { tool: "text", icon: Type, label: "Text", shortcut: "T" },
  { tool: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
];

export function InstrumentTray({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onAIImage,
  onPromptToDiagram,
  onExplainDiagram,
  onIconLibrary,
  canUndo,
  canRedo,
}: InstrumentTrayProps) {
  return (
    <motion.div
      className="instrument-tray z-50"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {tools.map(({ tool, icon: Icon, label, shortcut }) => (
        <button
          key={tool}
          className={`tool-btn ${activeTool === tool ? "active" : ""}`}
          onClick={() => onToolChange(tool)}
          title={`${label} (${shortcut})`}
        >
          <Icon size={18} strokeWidth={1.5} />
        </button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      <button
        className="tool-btn"
        onClick={onIconLibrary}
        title="Icon library — insert any icon"
      >
        <Shapes size={18} strokeWidth={1.5} />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        className="tool-btn text-primary"
        onClick={onPromptToDiagram}
        title="Prompt to Diagram (AI)"
      >
        <Wand2 size={18} strokeWidth={1.5} />
      </button>
      <button
        className="tool-btn text-primary"
        onClick={onAIImage}
        title="AI Image Generation"
      >
        <Sparkles size={18} strokeWidth={1.5} />
      </button>
      <button
        className="tool-btn text-primary"
        onClick={onExplainDiagram}
        title="Explain my diagram (AI)"
      >
        <BookOpen size={18} strokeWidth={1.5} />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={{ opacity: canUndo ? 1 : 0.3 }}
      >
        <Undo2 size={16} strokeWidth={1.5} />
      </button>
      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        style={{ opacity: canRedo ? 1 : 0.3 }}
      >
        <Redo2 size={16} strokeWidth={1.5} />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button className="tool-btn" onClick={onClear} title="Clear canvas">
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
      <button className="tool-btn" onClick={onExport} title="Export (Ctrl+E)">
        <Download size={16} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}
