import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const faqs = [
  { q: "Is Pencil free to use?", a: "Yes! Pencil is completely free. No sign-up, no credit card, no hidden fees. Open the canvas and start drawing immediately." },
  { q: "How does the AI image generation work?", a: "Click the AI button in the toolbar, describe what you want to generate, and Pencil creates an image using advanced AI models. The generated image is placed directly on your canvas as a moveable, resizable element." },
  { q: "Can I export my drawings?", a: "Yes. Press ⌘E (or Ctrl+E) to export your canvas as a high-resolution 2x retina PNG. The export automatically crops to your content with padding." },
  { q: "Does my data stay private?", a: "Your drawings are processed entirely in your browser. Nothing is stored on any server. The only external call is for AI image generation, which sends your text prompt to generate images." },
  { q: "What makes Pencil different from Excalidraw?", a: "Pencil focuses on technical precision with a drafting aesthetic, engineering-grade grid system, bottom-docked toolbar for ergonomic use, and built-in AI image generation. It's designed for engineers and architects who need clean, precise diagrams." },
  { q: "Can I use Pencil on mobile?", a: "Pencil is optimized for desktop use with keyboard and mouse/trackpad. While it loads on mobile, the full experience requires a keyboard for shortcuts and a pointer for precise drawing." },
];

export function FAQ() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 md:py-32" ref={ref}>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">FAQ</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Common questions
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="border rounded-xl overflow-hidden bg-background"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-accent/30 transition-colors"
              >
                <span className="text-sm font-medium pr-4">{faq.q}</span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
