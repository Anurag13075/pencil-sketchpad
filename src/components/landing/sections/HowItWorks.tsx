import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Globe, MousePointer2, Download, Sparkles } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const steps = [
  { icon: Globe, step: "01", title: "Open your browser", desc: "No downloads, no sign-ups. Just navigate to Pencil and you're ready." },
  { icon: MousePointer2, step: "02", title: "Start drawing", desc: "Pick a tool from the instrument tray or press a keyboard shortcut. Draw shapes, lines, and text." },
  { icon: Sparkles, step: "03", title: "Use AI generation", desc: "Press the AI button, describe what you want, and get AI-generated images right on your canvas." },
  { icon: Download, step: "04", title: "Export & share", desc: "Hit ⌘E to export a high-res 2x PNG. Share your diagrams with anyone." },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-32 relative" ref={ref}>
      <div className="absolute inset-0 canvas-grid opacity-15" />
      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">How It Works</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            From zero to diagram in seconds
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              className="relative p-6 rounded-2xl border bg-background"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.1 }}
            >
              <span className="text-5xl font-bold text-primary/10 absolute top-4 right-4">{s.step}</span>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <s.icon size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-sm mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
