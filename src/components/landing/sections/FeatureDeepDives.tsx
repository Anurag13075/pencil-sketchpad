import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import canvasDemo from "@/assets/landing-canvas-demo.png";
import inspectorImg from "@/assets/landing-inspector.png";
import exportImg from "@/assets/landing-export.png";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

export function FeatureDeepDives() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-32 relative" ref={ref}>
      <div className="absolute inset-0 canvas-grid opacity-20" />
      <div className="relative max-w-6xl mx-auto px-6 space-y-24">
        {/* Feature 1: Infinite Canvas */}
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Infinite Canvas</p>
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight mb-4">
              No edges. No limits. Just draw.
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your canvas scales from a quick sketch to an entire system architecture. 
              Pan with scroll, zoom with pinch. Navigate effortlessly across any scale — 
              from a single component to a full organizational chart.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Smooth infinite pan & zoom
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                20px minor / 100px major grid system
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Hardware-accelerated Canvas 2D rendering
              </li>
            </ul>
          </div>
          <motion.div
            className="rounded-2xl overflow-hidden border shadow-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <img src={canvasDemo} alt="Infinite canvas with complex diagrams" className="w-full h-auto" loading="lazy" />
          </motion.div>
        </motion.div>

        {/* Feature 2: Style Inspector */}
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={spring}
        >
          <motion.div
            className="rounded-2xl overflow-hidden border shadow-xl order-2 lg:order-1"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <img src={inspectorImg} alt="Property inspector panel with style controls" className="w-full h-auto" loading="lazy" />
          </motion.div>
          <div className="order-1 lg:order-2">
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Style Inspector</p>
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight mb-4">
              Full control over every detail
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A slide-in property panel gives you instant control over stroke colors, fill styles 
              (solid, hachure, cross-hatch), stroke width, dash patterns, and opacity — all 
              adjustable per element in real-time.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                8 stroke colors + 8 fill colors
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                4 fill styles including hachure
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Per-element opacity control
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Feature 3: Export */}
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={spring}
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Export</p>
            <h3 className="text-2xl md:text-4xl font-semibold tracking-tight mb-4">
              Share diagrams that look sharp everywhere
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              One shortcut (⌘E) and your diagrams are exported as high-resolution 2x retina PNGs. 
              Perfect for presentations, documentation, and sharing. The export automatically 
              calculates element bounds and adds padding.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                2x retina PNG export
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Auto-cropped to content bounds
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                One-shortcut workflow
              </li>
            </ul>
          </div>
          <motion.div
            className="rounded-2xl overflow-hidden border shadow-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <img src={exportImg} alt="High resolution export dialog" className="w-full h-auto" loading="lazy" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
