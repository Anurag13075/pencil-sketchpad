import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  MousePointer2, Square, Circle, Diamond, Minus, MoveRight,
  Pencil as PencilIcon, Type,
} from "lucide-react";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const tools = [
  { icon: MousePointer2, name: "Select", desc: "Click, drag, multi-select and resize with precision handles", key: "V" },
  { icon: Square, name: "Rectangle", desc: "Sharp geometric boxes with customizable fill and stroke", key: "R" },
  { icon: Circle, name: "Ellipse", desc: "Perfect circles and ovals with smooth rendering", key: "O" },
  { icon: Diamond, name: "Diamond", desc: "Decision nodes and rhombuses for flowcharts", key: "D" },
  { icon: Minus, name: "Line", desc: "Clean connection lines with adjustable stroke styles", key: "L" },
  { icon: MoveRight, name: "Arrow", desc: "Directed flow arrows with crisp arrowheads", key: "A" },
  { icon: PencilIcon, name: "Freehand", desc: "Sketch freely with natural pen-like strokes", key: "P" },
  { icon: Type, name: "Text", desc: "Labels, annotations and multi-line text blocks", key: "T" },
];

export function ToolShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-32 relative">
      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Instrument Tray</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Every tool, one click away
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
            A complete drawing toolkit designed for speed. Each tool is one keystroke away.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.name}
              className="group relative p-6 rounded-2xl border hover:border-primary/30 transition-all cursor-default bg-background"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                  <tool.icon size={22} strokeWidth={1.5} />
                </div>
                <kbd className="h-6 px-2 rounded border bg-accent text-[10px] font-mono-data flex items-center justify-center font-medium text-muted-foreground">
                  {tool.key}
                </kbd>
              </div>
              <h3 className="font-semibold text-sm mb-1">{tool.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
