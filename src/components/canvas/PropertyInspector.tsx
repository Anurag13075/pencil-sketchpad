import { motion, AnimatePresence } from "framer-motion";
import type { StrokeStyle, FillStyle } from "@/types/canvas";

interface PropertyInspectorProps {
  visible: boolean;
  strokeColor: string;
  fillColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  onStrokeColorChange: (c: string) => void;
  onFillColorChange: (c: string) => void;
  onFillStyleChange: (s: FillStyle) => void;
  onStrokeWidthChange: (w: number) => void;
  onStrokeStyleChange: (s: StrokeStyle) => void;
  onOpacityChange: (o: number) => void;
}

const COLORS = [
  "#1e1e1e", "#e03131", "#2f9e44", "#1971c2",
  "#f08c00", "#6741d9", "#0c8599", "#e8590c",
];

const FILL_COLORS = [
  "transparent", "#ffc9c9", "#b2f2bb", "#a5d8ff",
  "#ffec99", "#d0bfff", "#99e9f2", "#ffd8a8",
];

export function PropertyInspector({
  visible,
  strokeColor,
  fillColor,
  fillStyle,
  strokeWidth,
  strokeStyle,
  opacity,
  onStrokeColorChange,
  onFillColorChange,
  onFillStyleChange,
  onStrokeWidthChange,
  onStrokeStyleChange,
  onOpacityChange,
}: PropertyInspectorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="inspector-panel z-50"
          initial={{ x: "110%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <Section label="Stroke">
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <ColorSwatch key={c} color={c} active={strokeColor === c} onClick={() => onStrokeColorChange(c)} />
              ))}
            </div>
          </Section>

          <Section label="Fill">
            <div className="flex gap-1.5 flex-wrap">
              {FILL_COLORS.map((c) => (
                <ColorSwatch key={c} color={c} active={fillColor === c} onClick={() => onFillColorChange(c)} />
              ))}
            </div>
            <div className="flex gap-1 mt-2">
              {(["none", "solid", "hachure", "cross-hatch"] as FillStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onFillStyleChange(s)}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    fillStyle === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>

          <Section label="Stroke Width">
            <div className="flex gap-1">
              {[1, 2, 4, 6].map((w) => (
                <button
                  key={w}
                  onClick={() => onStrokeWidthChange(w)}
                  className={`w-8 h-8 flex items-center justify-center rounded border text-xs transition-colors ${
                    strokeWidth === w
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </Section>

          <Section label="Stroke Style">
            <div className="flex gap-1">
              {(["solid", "dashed", "dotted"] as StrokeStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onStrokeStyleChange(s)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    strokeStyle === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>

          <Section label={`Opacity: ${Math.round(opacity * 100)}%`}>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </Section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1.5 font-medium tracking-wide uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

function ColorSwatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-5 h-5 rounded-full border-2 transition-all ${
        active ? "border-primary scale-110" : "border-border"
      }`}
      style={{
        backgroundColor: color === "transparent" ? "transparent" : color,
        backgroundImage: color === "transparent"
          ? "linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%)"
          : undefined,
        backgroundSize: color === "transparent" ? "6px 6px" : undefined,
        backgroundPosition: color === "transparent" ? "0 0, 3px 3px" : undefined,
      }}
    />
  );
}
