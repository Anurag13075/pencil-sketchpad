import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const brands = [
  "Startups", "Design Teams", "Engineers", "Product Managers", 
  "Architects", "Students", "Researchers", "Freelancers"
];

export function LogoBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section className="py-12 border-y" ref={ref}>
      <motion.div
        className="max-w-6xl mx-auto px-6"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Trusted by creators everywhere
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand, i) => (
            <motion.span
              key={brand}
              className="text-sm font-medium text-muted-foreground/60 hover:text-foreground transition-colors"
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
