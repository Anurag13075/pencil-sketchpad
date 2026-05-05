import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Keyboard } from "lucide-react";
import shortcutsImg from "@/assets/landing-shortcuts.png";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const shortcuts = [
  { keys: ["V"], action: "Select tool" },
  { keys: ["R"], action: "Rectangle" },
  { keys: ["O"], action: "Ellipse" },
  { keys: ["D"], action: "Diamond" },
  { keys: ["L"], action: "Line" },
  { keys: ["A"], action: "Arrow" },
  { keys: ["P"], action: "Freehand draw" },
  { keys: ["T"], action: "Text" },
  { keys: ["E"], action: "Eraser" },
  { keys: ["⌘", "Z"], action: "Undo" },
  { keys: ["⌘", "⇧", "Z"], action: "Redo" },
  { keys: ["⌘", "E"], action: "Export" },
  { keys: ["⌘", "A"], action: "Select all" },
  { keys: ["Del"], action: "Delete selected" },
];

export function KeyboardShortcuts() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="shortcuts" className="py-24 md:py-32" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={spring}
          >
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Keyboard First</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Designed for your hands on the keyboard
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every tool is one key away. No modifier combos to memorize, no chords to fumble.
              Switch between drawing and selecting in milliseconds. The fastest way to create.
            </p>

            <div className="rounded-2xl overflow-hidden border shadow-lg mb-6">
              <img src={shortcutsImg} alt="Keyboard shortcuts reference" className="w-full h-auto" loading="lazy" />
            </div>

            <Link
              to="/onboarding"
              className="inline-flex h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium items-center gap-2 hover:opacity-90 transition-all active:scale-[0.97]"
            >
              Try it now <Keyboard size={15} />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 gap-2"
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0.15 }}
          >
            {shortcuts.map((s, i) => (
              <motion.div
                key={s.action}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-background hover:border-primary/20 transition-colors"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.2 + i * 0.03 }}
              >
                <span className="text-xs text-muted-foreground">{s.action}</span>
                <div className="flex gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="min-w-[24px] h-6 px-1.5 rounded border bg-accent text-[10px] font-mono-data flex items-center justify-center font-medium"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
