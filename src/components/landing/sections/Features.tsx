import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ZoomIn, Layers, Download, Undo2, Grid3X3, Zap,
  Move, Copy, Scissors, Eye, Palette, Lock,
} from "lucide-react";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const features = [
  { icon: ZoomIn, title: "Infinite Pan & Zoom", desc: "Scroll to pan. Pinch to zoom. No boundaries, no limits. Scales from sticky note to entire system architecture." },
  { icon: Layers, title: "Precise Selection & Resize", desc: "8-point handles, pixel-perfect positioning. Select one or hundreds. Move, resize with drafting-table precision." },
  { icon: Download, title: "Export to PNG", desc: "One shortcut. 2x retina resolution. Your diagrams leave Pencil looking as sharp as when you drew them." },
  { icon: Undo2, title: "Full Undo History", desc: "Every stroke, move, and delete — recorded and reversible. Ctrl+Z all the way back to blank canvas." },
  { icon: Grid3X3, title: "Technical Grid", desc: "20px minor, 100px major grid lines with toggle. Elements snap to 4px grid for engineering-grade alignment." },
  { icon: Zap, title: "Style Inspector", desc: "Stroke colors, fill styles, stroke width, dash patterns, opacity — all adjustable per element in real-time." },
  { icon: Move, title: "Multi-Element Move", desc: "Select multiple elements and move them together. Shift-click for additive selection." },
  { icon: Palette, title: "Rich Color Palette", desc: "8 stroke colors and 8 fill colors for quick access. Transparent fill support for wireframe-style diagrams." },
  { icon: Eye, title: "Opacity Control", desc: "Fine-grained opacity slider from 10% to 100%. Create layered, semi-transparent visual hierarchies." },
  { icon: Copy, title: "Element Types", desc: "Rectangles, ellipses, diamonds, lines, arrows, freehand drawing, and text — everything you need." },
  { icon: Lock, title: "Browser-Native", desc: "No downloads, no installations, no accounts. Open the URL and start drawing. Your data stays in your browser." },
  { icon: Scissors, title: "Eraser Tool", desc: "Clean eraser with collision detection. Remove elements by clicking or dragging across them." },
];

export function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="py-24 md:py-32 relative" ref={ref}>
      <div className="absolute inset-0 canvas-grid opacity-20" />
      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Features</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Engineered for flow state
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
            The UI recedes until you need it. The canvas is the world.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="p-5 rounded-xl border bg-background hover:border-primary/20 transition-all group"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.04 }}
              whileHover={{ y: -2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
