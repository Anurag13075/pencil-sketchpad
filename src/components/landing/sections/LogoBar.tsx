import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const brands = [
  "Microsoft", "Amazon", "Visa", "Atlassian",
  "Stripe", "Vercel", "Linear", "Notion",
];

export function LogoBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section className="py-14 border-y bg-accent/20" ref={ref}>
      <motion.div
        className="max-w-6xl mx-auto px-6"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-8 font-medium">
          Trusted by teams shipping at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
          {brands.map((brand, i) => (
            <motion.span
              key={brand}
              className="text-base font-semibold text-muted-foreground/50 hover:text-foreground transition-colors tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              {brand}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
