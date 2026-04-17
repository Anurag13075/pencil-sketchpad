import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, Wand2, BookOpen } from "lucide-react";
import aiPromptImg from "@/assets/landing-ai-prompt.png";

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

const prompts = [
  "Build a microservices architecture for a chat app",
  "Create an ERD for a SaaS billing system",
  "Show OAuth 2.0 sequence flow",
  "Design a Kubernetes deployment topology",
];

export function AIPromptShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-36 relative bg-foreground text-background overflow-hidden">
      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "hsl(var(--primary))" }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div
          className="text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-background/20 mb-5">
            <Sparkles size={12} className="text-primary" />
            <span className="text-xs uppercase tracking-widest opacity-70">AI Native</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
            Type a sentence.
            <br />
            <span className="opacity-60">Get a diagram.</span>
          </h2>
          <p className="opacity-70 mt-5 text-lg leading-relaxed">
            Pencil's AI engine turns plain English into structured diagrams,
            generates inline images on your canvas, and explains your work back
            to you in human language.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden border border-background/10"
          >
            <img src={aiPromptImg} alt="AI prompt generating a diagram" className="w-full h-auto" loading="lazy" />
          </motion.div>

          {/* Prompts list */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0.2 }}
            className="space-y-3"
          >
            <p className="text-xs uppercase tracking-widest opacity-50 mb-4">Try a prompt</p>
            {prompts.map((p, i) => (
              <motion.div
                key={p}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: 0.3 + i * 0.08 }}
                className="group flex items-center gap-3 p-4 rounded-xl border border-background/10 bg-background/[0.03] hover:bg-background/[0.06] transition-colors cursor-default"
              >
                <Wand2 size={14} className="text-primary flex-shrink-0" />
                <span className="text-sm font-mono opacity-90">{p}</span>
              </motion.div>
            ))}
            <div className="pt-6 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-background/10">
                <Sparkles size={16} className="text-primary mb-2" />
                <h4 className="text-sm font-semibold mb-1">AI Image Gen</h4>
                <p className="text-xs opacity-60 leading-relaxed">Drop generated illustrations directly onto your canvas.</p>
              </div>
              <div className="p-4 rounded-xl border border-background/10">
                <BookOpen size={16} className="text-primary mb-2" />
                <h4 className="text-sm font-semibold mb-1">Diagram Explainer</h4>
                <p className="text-xs opacity-60 leading-relaxed">Get plain-English documentation for any drawing.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
