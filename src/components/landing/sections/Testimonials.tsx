import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const testimonials = [
  {
    quote: "Finally a canvas tool that feels like an engineering tool, not a toy. The grid system alone saves me hours.",
    name: "Sarah Chen",
    role: "Staff Engineer, Fintech",
    avatar: "SC",
  },
  {
    quote: "The AI image generation is a game changer. I can mock up entire UI flows with generated screenshots inline.",
    name: "Marcus Rivera",
    role: "Product Designer",
    avatar: "MR",
  },
  {
    quote: "I switched from Excalidraw because I needed precision. Pencil's drafting aesthetic matches my documentation style perfectly.",
    name: "Aiko Tanaka",
    role: "Solutions Architect",
    avatar: "AT",
  },
  {
    quote: "Keyboard shortcuts are so intuitive. V to select, R for rectangle — I barely touch my mouse anymore.",
    name: "David Park",
    role: "Frontend Developer",
    avatar: "DP",
  },
  {
    quote: "The export quality is stunning. 2x retina PNGs look incredible in our technical documentation.",
    name: "Elena Kowalski",
    role: "Technical Writer",
    avatar: "EK",
  },
  {
    quote: "No sign-up, no downloads, instant load. I shared the link with my team and everyone was drawing in seconds.",
    name: "James Okonkwo",
    role: "Engineering Manager",
    avatar: "JO",
  },
];

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-32" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Loved by creators
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="p-6 rounded-2xl border bg-background hover:border-primary/20 transition-colors"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.06 }}
            >
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
