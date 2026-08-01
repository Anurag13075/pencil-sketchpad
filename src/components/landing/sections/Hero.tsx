import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Grid3X3, Layers, Sparkles } from "lucide-react";
import heroImage from "@/assets/landing-hero-product.png";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const imageRotate = useTransform(scrollYProgress, [0, 1], [0, -1]);

  return (
    <section ref={ref} className="relative pt-32 pb-8 md:pt-44 md:pb-20">
      <div className="absolute inset-0 canvas-grid opacity-40" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "hsl(var(--primary))" }}
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 right-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "hsl(var(--primary))" }}
        animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs text-muted-foreground">
            <Sparkles size={12} className="text-primary" />
            Now with AI-powered image generation
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-center text-4xl md:text-6xl lg:text-[80px] font-semibold tracking-tight leading-[1.05] max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
        >
          The infinite canvas{" "}
          <span className="relative inline-block">
            <span className="text-primary">built for precision</span>
            <motion.span
              className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-primary/30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            />
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
        >
          Technical diagrams, system architecture, visual thought — drawn with the
          clarity of a drafting table and supercharged with AI image generation.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.45 }}
        >
          <Link
            to="/canvas"
            className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-all active:scale-[0.97] text-sm shadow-lg shadow-primary/20"
          >
            Start Drawing — It's Free <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="h-12 px-6 rounded-xl border text-sm font-medium flex items-center gap-2 hover:bg-accent transition-all active:scale-[0.97]"
          >
            Explore Features
          </a>
        </motion.div>

        <motion.p
          className="text-center text-xs text-muted-foreground mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          No sign-up required · Free forever · Works in your browser
        </motion.p>

        {/* Hero Image */}
        <motion.div
          className="mt-14 md:mt-20 relative"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.55 }}
          style={{ y: imageY, scale: imageScale, rotateZ: imageRotate }}
        >
          <div className="relative rounded-2xl overflow-hidden border shadow-2xl shadow-primary/10">
            <img
              src={heroImage}
              alt="Pencil canvas showing technical diagrams with precise geometric shapes on an infinite canvas"
              className="w-full h-auto"
              loading="eager"
            />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </div>

          {/* Floating labels */}
          <motion.div
            className="absolute -left-4 top-1/4 hidden lg:block"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg">
              <Grid3X3 size={14} className="text-primary" />
              <span className="text-xs font-medium">Snap to Grid</span>
            </div>
          </motion.div>

          <motion.div
            className="absolute -right-4 top-1/3 hidden lg:block"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg">
              <Layers size={14} className="text-primary" />
              <span className="text-xs font-medium">∞ Canvas</span>
            </div>
          </motion.div>

          <motion.div
            className="absolute left-1/4 -bottom-4 hidden lg:block"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-background/95 backdrop-blur-sm shadow-lg">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-medium">AI Image Gen</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
