import { motion } from "framer-motion";
import { Wand2, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Wand2,
    badge: "Pencil exclusive",
    title: "Prompt to Diagram",
    description:
      "Describe what you want — 'login flow', 'microservices for an e-commerce app', 'mind map of ML topics' — and Pencil's AI lays out a complete, organized diagram on the canvas in seconds.",
    bullets: ["Up to 25 perfectly-spaced shapes per prompt", "Editable like any other shape", "Switch from blank page to brainstorm in one sentence"],
  },
  {
    icon: BookOpen,
    badge: "Pencil exclusive",
    title: "AI Diagram Explainer",
    description:
      "The opposite direction. Open a slide-out panel and Pencil reads every shape on your canvas, then writes a plain-English explanation of what your diagram represents — perfect for docs, PRs, and standups.",
    bullets: ["Reads structure, labels, and relationships", "Copy-to-clipboard ready", "Re-explain after each edit"],
  },
];

export function UniqueFeatures() {
  return (
    <section className="relative py-32 px-6 border-t overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-background text-xs text-muted-foreground mb-4">
            <Sparkles size={11} className="text-primary" /> Not in Excalidraw
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Two things only Pencil does
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            We took everything you love about open whiteboards and added two AI superpowers no other tool ships.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative rounded-2xl border bg-card p-8 overflow-hidden hover:border-primary/40 transition-colors"
            >
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <f.icon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{f.description}</p>
                <ul className="space-y-2 mb-6">
                  {f.bullets.map((b) => (
                    <li key={b} className="text-xs text-foreground/80 flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/canvas"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2 transition-all"
                >
                  Try it now <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
