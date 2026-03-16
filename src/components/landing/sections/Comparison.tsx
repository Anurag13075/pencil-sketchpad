import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const rows = [
  { feature: "Default aesthetic", pencil: "Technical drafting", other: "Hand-drawn sketchy", pencilWins: true },
  { feature: "AI image generation", pencil: "Built-in", other: "Third-party only", pencilWins: true },
  { feature: "Grid system", pencil: "20/100px engineering grid", other: "Basic or none", pencilWins: true },
  { feature: "Toolbar position", pencil: "Bottom dock (ergonomic)", other: "Top bar", pencilWins: true },
  { feature: "Performance", pencil: "Native Canvas 2D", other: "SVG / DOM", pencilWins: true },
  { feature: "Keyboard shortcuts", pencil: "Single-key (V, R, O…)", other: "Varies", pencilWins: true },
  { feature: "Style inspector", pencil: "Slide-in panel", other: "Popover menus", pencilWins: true },
  { feature: "Export quality", pencil: "2x retina PNG", other: "1x default", pencilWins: true },
  { feature: "Sign-up required", pencil: "No", other: "Optional", pencilWins: true },
  { feature: "Open in browser", pencil: "Instant, no install", other: "Instant", pencilWins: false },
];

export function Comparison() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="compare" className="py-24 md:py-32 relative" ref={ref}>
      <div className="absolute inset-0 canvas-grid opacity-15" />
      <div className="relative max-w-4xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Why Pencil</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Precision over approximation
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            See how Pencil compares to other drawing tools.
          </p>
        </motion.div>

        <motion.div
          className="border rounded-2xl overflow-hidden bg-background"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.1 }}
        >
          <div className="grid grid-cols-3 border-b bg-accent/50">
            <div className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Feature</div>
            <div className="p-4 text-xs font-medium text-primary uppercase tracking-wider text-center">Pencil</div>
            <div className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Others</div>
          </div>
          {rows.map((row, i) => (
            <motion.div
              key={row.feature}
              className={`grid grid-cols-3 ${i < rows.length - 1 ? "border-b" : ""} hover:bg-accent/30 transition-colors`}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.15 + i * 0.03 }}
            >
              <div className="p-4 text-sm">{row.feature}</div>
              <div className="p-4 text-sm text-center font-medium text-primary flex items-center justify-center gap-1.5">
                {row.pencilWins && <Check size={14} className="text-primary" />}
                {row.pencil}
              </div>
              <div className="p-4 text-sm text-center text-muted-foreground">{row.other}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
