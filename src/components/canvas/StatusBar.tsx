import { motion } from "framer-motion";

interface StatusBarProps {
  x: number;
  y: number;
  zoom: number;
  elementCount: number;
  gridEnabled: boolean;
  onToggleGrid: () => void;
}

export function StatusBar({ x, y, zoom, elementCount, gridEnabled, onToggleGrid }: StatusBarProps) {
  return (
    <motion.div
      className="status-bar z-50"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 30 }}
    >
      <span className="font-mono-data text-muted-foreground">
        {Math.round(x)}, {Math.round(y)}
      </span>
      <div className="w-px h-4 bg-border" />
      <span className="font-mono-data text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <div className="w-px h-4 bg-border" />
      <span className="font-mono-data text-muted-foreground">
        {elementCount} elem{elementCount !== 1 ? "s" : ""}
      </span>
      <div className="w-px h-4 bg-border" />
      <button
        className="font-mono-data text-muted-foreground hover:text-foreground transition-colors"
        onClick={onToggleGrid}
      >
        Grid: {gridEnabled ? "On" : "Off"}
      </button>
    </motion.div>
  );
}
