import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const stats = [
  { value: "9", label: "Drawing tools" },
  { value: "14+", label: "Keyboard shortcuts" },
  { value: "2x", label: "Retina export" },
  { value: "∞", label: "Canvas size" },
  { value: "<1s", label: "Load time" },
  { value: "0", label: "Sign-ups required" },
];

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 border-y" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.06 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{s.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
