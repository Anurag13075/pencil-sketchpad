import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Cloud, Database, GitBranch, Workflow } from "lucide-react";
import flowchartImg from "@/assets/landing-flowchart.png";
import erdImg from "@/assets/landing-erd.png";
import sequenceImg from "@/assets/landing-sequence.png";
import heroProduct from "@/assets/landing-hero-product.png";

const types = [
  {
    icon: Cloud,
    name: "Cloud Architecture",
    desc: "Visualize your infrastructure with crisp service diagrams that match how engineers actually think.",
    image: heroProduct,
  },
  {
    icon: Workflow,
    name: "Flow Charts",
    desc: "Map out process and logic flows with snapping connectors that always stay aligned.",
    image: flowchartImg,
  },
  {
    icon: Database,
    name: "Entity Relationship",
    desc: "Sketch data models with crow's foot notation that's instantly readable and exportable.",
    image: erdImg,
  },
  {
    icon: GitBranch,
    name: "Sequence Diagrams",
    desc: "Trace request flows between services with vertical lifelines and message arrows.",
    image: sequenceImg,
  },
];

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

export function DiagramTypes() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  return (
    <section className="py-24 md:py-36 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/10 to-background" />
      <div className="relative max-w-7xl mx-auto px-6" ref={ref}>
        <motion.div
          className="text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">
            Beautiful by default
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Diagrams that look like you spent hours.
            <span className="text-muted-foreground"> Drawn in minutes.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
          {/* Tabs */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {types.map((t, i) => (
              <motion.button
                key={t.name}
                onClick={() => setActive(i)}
                className={`relative text-left p-4 rounded-xl border transition-all flex-shrink-0 lg:flex-shrink min-w-[240px] lg:min-w-0 ${
                  active === i
                    ? "bg-background border-primary/40 shadow-lg shadow-primary/5"
                    : "bg-background/40 border-border hover:border-border/60 hover:bg-background"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ ...spring, delay: i * 0.08 }}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      active === i ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"
                    }`}
                  >
                    <t.icon size={16} strokeWidth={1.8} />
                  </div>
                  <span className="font-semibold text-sm">{t.name}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-11">{t.desc}</p>
              </motion.button>
            ))}
          </div>

          {/* Preview */}
          <motion.div
            key={active}
            className="relative rounded-2xl overflow-hidden border bg-background shadow-2xl shadow-primary/5"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-accent/30">
              <img
                src={types[active].image}
                alt={`${types[active].name} example`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
