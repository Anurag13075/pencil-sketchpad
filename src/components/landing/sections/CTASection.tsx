import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Pencil as PencilIcon } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-28 md:py-36 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-3xl"
          style={{ background: "hsl(var(--primary))" }}
        />
      </div>
      
      <motion.div
        className="relative max-w-3xl mx-auto px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={spring}
      >
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-8"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <PencilIcon size={32} strokeWidth={1.5} />
        </motion.div>
        <h2 className="text-3xl md:text-6xl font-semibold tracking-tight mb-5">
          Ready to draw with precision?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
          No sign-up. No download. No limits. Just open the canvas, pick a tool, and start creating.
        </p>
        <Link
          to="/onboarding"
          className="inline-flex h-14 px-10 rounded-2xl bg-primary text-primary-foreground text-base font-medium items-center gap-2 hover:opacity-90 transition-all active:scale-[0.97] shadow-xl shadow-primary/25"
        >
          Open Pencil <ArrowRight size={18} />
        </Link>
        <p className="text-xs text-muted-foreground mt-5">
          Free forever · No account required · Works in any modern browser
        </p>
      </motion.div>
    </section>
  );
}
