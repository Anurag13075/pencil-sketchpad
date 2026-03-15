import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight, Square, Circle, Diamond, Minus, MoveRight,
  Pencil as PencilIcon, Type, MousePointer2, Layers, Zap,
  Download, Grid3X3, Command, Keyboard, Move, ZoomIn,
  Undo2, Copy, Scissors, Github
} from "lucide-react";
import heroImage from "@/assets/hero-canvas.png";

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <ToolShowcase />
      <Features />
      <KeyboardShortcuts />
      <Comparison />
      <CTASection />
      <Footer />
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: "hsla(var(--background) / 0.85)", backdropFilter: "blur(20px)" }}
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={spring}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PencilIcon size={20} strokeWidth={1.5} className="text-primary" />
          <span className="font-semibold tracking-tight text-[15px]">Pencil</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#shortcuts" className="hover:text-foreground transition-colors">Shortcuts</a>
          <a href="#compare" className="hover:text-foreground transition-colors">Why Pencil</a>
        </div>
        <Link
          to="/canvas"
          className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-all active:scale-[0.97]"
        >
          Launch App <ArrowRight size={14} />
        </Link>
      </div>
    </motion.nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <section ref={ref} className="relative pt-32 pb-8 md:pt-40 md:pb-16">
      {/* Background grid */}
      <div className="absolute inset-0 canvas-grid opacity-40" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Precision on an infinite scale
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-center text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08] max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
        >
          The infinite canvas{" "}
          <span className="text-primary">built for precision</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-5 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
        >
          Technical diagrams, system architecture, visual thought — drawn with the
          clarity of a drafting table, not the wobble of a whiteboard.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.45 }}
        >
          <Link
            to="/canvas"
            className="h-11 px-6 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-all active:scale-[0.97] text-sm"
          >
            Start Drawing <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="h-11 px-6 rounded-lg border text-sm font-medium flex items-center gap-2 hover:bg-accent transition-all active:scale-[0.97]"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          className="mt-12 md:mt-16 relative"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.55 }}
          style={{ y: imageY, scale: imageScale }}
        >
          <div className="relative rounded-xl overflow-hidden border shadow-2xl shadow-primary/5">
            <img
              src={heroImage}
              alt="Pencil canvas showing technical diagrams with precise geometric shapes"
              className="w-full h-auto"
              loading="eager"
            />
            {/* Overlay gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          {/* Floating labels */}
          <motion.div
            className="absolute -left-2 top-1/4 hidden lg:block"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background/90 backdrop-blur-sm shadow-sm">
              <Grid3X3 size={14} className="text-primary" />
              <span className="text-xs font-medium">Grid Snap: 4px</span>
            </div>
          </motion.div>

          <motion.div
            className="absolute -right-2 top-1/3 hidden lg:block"
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background/90 backdrop-blur-sm shadow-sm">
              <Layers size={14} className="text-primary" />
              <span className="text-xs font-medium">∞ Canvas</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Tool Showcase ─── */
function ToolShowcase() {
  const tools = [
    { icon: MousePointer2, name: "Select", desc: "Click, drag, resize" },
    { icon: Square, name: "Rectangle", desc: "Sharp geometric boxes" },
    { icon: Circle, name: "Ellipse", desc: "Circles & ovals" },
    { icon: Diamond, name: "Diamond", desc: "Decision nodes" },
    { icon: Minus, name: "Line", desc: "Clean connections" },
    { icon: MoveRight, name: "Arrow", desc: "Directed flows" },
    { icon: PencilIcon, name: "Freehand", desc: "Sketch freely" },
    { icon: Type, name: "Text", desc: "Labels & annotations" },
  ];

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 md:py-28 relative">
      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Instrument Tray</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Every tool, one click away
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            No hidden menus. No hunting through panels. Your full toolkit, always at your fingertips.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.name}
              className="group relative p-5 rounded-xl border hover:border-primary/30 transition-all cursor-default"
              style={{ background: "hsl(var(--background))" }}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.06 }}
              whileHover={{ y: -2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <tool.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-medium text-sm">{tool.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const features = [
    {
      icon: ZoomIn,
      title: "Infinite Pan & Zoom",
      desc: "Scroll to pan. Pinch to zoom. No boundaries, no limits. Your canvas scales from a sticky note to an entire system architecture.",
    },
    {
      icon: Layers,
      title: "Precise Selection & Resize",
      desc: "8-point handles, pixel-perfect positioning. Select one element or hundreds. Move, resize, and align with drafting-table precision.",
    },
    {
      icon: Download,
      title: "Export to PNG",
      desc: "One shortcut. High-resolution 2x export. Your diagrams leave Pencil looking as sharp as when you drew them.",
    },
    {
      icon: Undo2,
      title: "Full Undo History",
      desc: "Every stroke, every move, every delete — recorded and reversible. Ctrl+Z until you're back to a blank canvas if you want.",
    },
    {
      icon: Grid3X3,
      title: "Technical Grid",
      desc: "20px minor, 100px major grid lines. Toggle on and off. Your elements snap to a 4px grid for that engineering-grade alignment.",
    },
    {
      icon: Zap,
      title: "Style Inspector",
      desc: "Stroke colors, fill styles (solid, hachure, cross-hatch), stroke width, dash patterns, opacity — all adjustable per element.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative" ref={ref}>
      <div className="absolute inset-0 canvas-grid opacity-20" />
      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Engineered for flow state
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            The UI recedes until you need it. The canvas is the world.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="p-6 rounded-xl border bg-background hover:border-primary/20 transition-all"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: i * 0.08 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Keyboard Shortcuts ─── */
function KeyboardShortcuts() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const shortcuts = [
    { keys: ["V"], action: "Select tool" },
    { keys: ["R"], action: "Rectangle" },
    { keys: ["O"], action: "Ellipse" },
    { keys: ["D"], action: "Diamond" },
    { keys: ["L"], action: "Line" },
    { keys: ["A"], action: "Arrow" },
    { keys: ["P"], action: "Freehand draw" },
    { keys: ["T"], action: "Text" },
    { keys: ["E"], action: "Eraser" },
    { keys: ["⌘", "Z"], action: "Undo" },
    { keys: ["⌘", "⇧", "Z"], action: "Redo" },
    { keys: ["⌘", "E"], action: "Export" },
    { keys: ["⌘", "A"], action: "Select all" },
    { keys: ["Del"], action: "Delete selected" },
  ];

  return (
    <section id="shortcuts" className="py-20 md:py-28" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={spring}
          >
            <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Keyboard First</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Designed for your hands on the keyboard
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every tool is one key away. No modifier combos to memorize, no chords to fumble.
              Switch between drawing and selecting in milliseconds.
            </p>
            <Link
              to="/canvas"
              className="inline-flex h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium items-center gap-2 hover:opacity-90 transition-all active:scale-[0.97]"
            >
              Try it now <Keyboard size={15} />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 gap-2"
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0.15 }}
          >
            {shortcuts.map((s, i) => (
              <motion.div
                key={s.action}
                className="flex items-center justify-between px-3 py-2 rounded-lg border bg-background"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.2 + i * 0.03 }}
              >
                <span className="text-xs text-muted-foreground">{s.action}</span>
                <div className="flex gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="min-w-[24px] h-6 px-1.5 rounded border bg-accent text-[10px] font-mono-data flex items-center justify-center font-medium"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Comparison ─── */
function Comparison() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const rows = [
    { feature: "Default aesthetic", pencil: "Technical drafting", other: "Hand-drawn sketchy" },
    { feature: "Grid system", pencil: "20/100px engineering grid", other: "Basic or none" },
    { feature: "Toolbar position", pencil: "Bottom dock (ergonomic)", other: "Top bar" },
    { feature: "Performance", pencil: "Native Canvas 2D", other: "SVG / DOM" },
    { feature: "Keyboard shortcuts", pencil: "Single-key (V, R, O…)", other: "Varies" },
    { feature: "Style inspector", pencil: "Slide-in panel", other: "Popover menus" },
    { feature: "Export quality", pencil: "2x retina PNG", other: "1x default" },
    { feature: "Open in browser", pencil: "Instant, no install", other: "Instant" },
  ];

  return (
    <section id="compare" className="py-20 md:py-28 relative" ref={ref}>
      <div className="absolute inset-0 canvas-grid opacity-15" />
      <div className="relative max-w-4xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
        >
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">Why Pencil</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Precision over approximation
          </h2>
        </motion.div>

        <motion.div
          className="border rounded-xl overflow-hidden bg-background"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.1 }}
        >
          <div className="grid grid-cols-3 border-b bg-accent/50">
            <div className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Feature</div>
            <div className="p-3 text-xs font-medium text-primary uppercase tracking-wider text-center">Pencil</div>
            <div className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Others</div>
          </div>
          {rows.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-3 ${i < rows.length - 1 ? "border-b" : ""}`}>
              <div className="p-3 text-sm">{row.feature}</div>
              <div className="p-3 text-sm text-center font-medium text-primary">{row.pencil}</div>
              <div className="p-3 text-sm text-center text-muted-foreground">{row.other}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 md:py-32" ref={ref}>
      <motion.div
        className="max-w-3xl mx-auto px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={spring}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
          <PencilIcon size={28} strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
          Ready to draw with precision?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
          No sign-up. No download. Just open the canvas and start creating.
        </p>
        <Link
          to="/canvas"
          className="inline-flex h-12 px-8 rounded-lg bg-primary text-primary-foreground text-base font-medium items-center gap-2 hover:opacity-90 transition-all active:scale-[0.97]"
        >
          Open Pencil <ArrowRight size={18} />
        </Link>
        <p className="text-xs text-muted-foreground mt-4">
          Free. Open canvas. No account required.
        </p>
      </motion.div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PencilIcon size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Pencil — Precision on an infinite scale
          </span>
        </div>
        <div className="font-mono-data text-muted-foreground">
          v1.0
        </div>
      </div>
    </footer>
  );
}
