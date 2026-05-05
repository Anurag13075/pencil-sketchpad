import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as rCreateElement } from "react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Sparkles } from "lucide-react";

interface IconLibraryDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (svgDataUrl: string, name: string) => void;
}

// Build a curated list of useful icons for diagrams (filter to a sane subset)
const EXCLUDE = new Set([
  "createLucideIcon",
  "Icon",
  "icons",
  "default",
  "LucideIcon",
  "LucideProps",
]);

// Build a list of all available Lucide icons
const ICON_NAMES = Object.keys(LucideIcons).filter((k) => {
  if (EXCLUDE.has(k)) return false;
  if (!/^[A-Z]/.test(k)) return false;
  const v = (LucideIcons as any)[k];
  return typeof v === "object" || typeof v === "function";
});

const POPULAR = [
  "Database", "Server", "Cloud", "Globe", "Cpu", "HardDrive", "Network", "Wifi",
  "User", "Users", "Lock", "Shield", "Key", "Mail", "MessageSquare", "Phone",
  "Folder", "File", "Image", "Video", "Music", "Code", "Terminal", "GitBranch",
  "Box", "Package", "ShoppingCart", "CreditCard", "DollarSign", "BarChart",
  "PieChart", "TrendingUp", "Activity", "Zap", "Star", "Heart", "Bookmark",
  "Calendar", "Clock", "Bell", "Search", "Settings", "Home", "Map", "Pin",
  "Smartphone", "Monitor", "Laptop", "Printer", "Camera", "Mic", "Headphones",
];

function iconToSvgDataUrl(IconComp: any, color = "#1e1e1e", size = 64): string {
  const element = rCreateElement(IconComp, {
    color,
    size,
    strokeWidth: 1.75,
    xmlns: "http://www.w3.org/2000/svg",
  });
  const svg = renderToStaticMarkup(element);
  // Ensure xmlns is present
  const withNs = svg.includes("xmlns=")
    ? svg
    : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const encoded = encodeURIComponent(withNs)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function IconLibraryDialog({ visible, onClose, onSelect }: IconLibraryDialogProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [visible]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return POPULAR.filter((n) => (LucideIcons as any)[n]);
    }
    return ICON_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 200);
  }, [query]);

  const handlePick = (name: string) => {
    const Comp = (LucideIcons as any)[name];
    if (!Comp) return;
    const dataUrl = iconToSvgDataUrl(Comp);
    onSelect(dataUrl, name);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-background/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[min(640px,92vw)] max-h-[80vh] flex flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Sparkles size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">Icon library</h2>
              <span className="text-xs text-muted-foreground ml-1">
                {ICON_NAMES.length}+ icons
              </span>
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-4 py-3 border-b">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search icons (database, cloud, user…)"
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/40 border border-border focus:border-primary outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {results.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No icons match “{query}”
                </div>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                  {results.map((name) => {
                    const Comp = (LucideIcons as any)[name];
                    if (!Comp) return null;
                    return (
                      <button
                        key={name}
                        onClick={() => handlePick(name)}
                        title={name}
                        className="aspect-square flex items-center justify-center rounded-lg border border-transparent hover:border-primary hover:bg-primary/5 text-foreground transition-all"
                      >
                        <Comp size={20} strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t text-[11px] text-muted-foreground bg-muted/30">
              Tip: drop icons onto your canvas, then connect with arrows to build architecture diagrams.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
