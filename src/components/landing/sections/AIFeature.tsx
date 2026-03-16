import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, Wand2, ImagePlus, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import aiFeatureImg from "@/assets/landing-ai-feature.png";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

export function AIFeature() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="ai" className="py-24 md:py-32 relative overflow-hidden" ref={ref}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{ background: "hsl(var(--primary))" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary mb-4">
            <Sparkles size={12} />
            NEW — AI Image Generation
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Generate images with AI,<br className="hidden md:block" /> right on the canvas
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Describe what you want and Pencil generates it directly on your canvas. 
            Create illustrations, diagrams, icons, and more — all without leaving your workflow.
          </p>
        </motion.div>

        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.15 }}
        >
          <div className="space-y-6">
            <div className="flex gap-4 p-5 rounded-xl border bg-background hover:border-primary/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wand2 size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Text-to-Image</h4>
                <p className="text-sm text-muted-foreground">
                  Type a prompt like "a flowchart showing user authentication" and get an 
                  AI-generated image placed directly on your canvas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl border bg-background hover:border-primary/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ImagePlus size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Canvas-Native</h4>
                <p className="text-sm text-muted-foreground">
                  Generated images become canvas elements. Move, resize, layer them with 
                  your drawings. Full integration with the infinite canvas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl border bg-background hover:border-primary/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Zap size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Instant Results</h4>
                <p className="text-sm text-muted-foreground">
                  Powered by advanced AI models for fast generation. Create mockups, 
                  illustrations, and visual assets in seconds.
                </p>
              </div>
            </div>

            <Link
              to="/canvas"
              className="inline-flex h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium items-center gap-2 hover:opacity-90 transition-all active:scale-[0.97] shadow-lg shadow-primary/20"
            >
              Try AI Generation <Sparkles size={15} />
            </Link>
          </div>

          <motion.div
            className="rounded-2xl overflow-hidden border shadow-2xl shadow-primary/10"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <img src={aiFeatureImg} alt="AI image generation inside Pencil canvas" className="w-full h-auto" loading="lazy" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
