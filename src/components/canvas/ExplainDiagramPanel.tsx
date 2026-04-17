import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { CanvasElement } from "@/types/canvas";

interface Props {
  visible: boolean;
  onClose: () => void;
  elements: CanvasElement[];
}

export function ExplainDiagramPanel({ visible, onClose, elements }: Props) {
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    setError(null);
    setExplanation("");
    try {
      const sanitized = elements
        .filter((e) => !e.isDeleted && e.type !== "ai-image")
        .map((e) => ({ type: e.type, x: e.x, y: e.y, width: e.width, height: e.height, text: e.text }));
      if (sanitized.length === 0) {
        setError("Canvas is empty. Draw something first!");
        setLoading(false);
        return;
      }
      const { data, error: fnError } = await supabase.functions.invoke("explain-diagram", {
        body: { elements: sanitized },
      });
      if (fnError) { setError(fnError.message); setLoading(false); return; }
      if (data?.error) { setError(data.error); setLoading(false); return; }
      setExplanation(data?.explanation || "");
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-3 right-3 bottom-3 z-50 w-[360px] rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden"
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Diagram Explainer
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">New</span>
                </h3>
                <p className="text-[11px] text-muted-foreground">AI reads your canvas</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
            {!explanation && !loading && !error && (
              <div className="text-muted-foreground text-[13px]">
                Click "Explain my diagram" and Pencil's AI will read every shape on your canvas and write a plain-English summary of what it represents.
              </div>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-[13px]">
                <Loader2 size={14} className="animate-spin" /> Reading your canvas...
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            {explanation && (
              <div className="whitespace-pre-wrap text-foreground">{explanation}</div>
            )}
          </div>

          <div className="border-t p-3 flex gap-2">
            <button
              onClick={handleExplain}
              disabled={loading}
              className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
              {explanation ? "Re-explain" : "Explain my diagram"}
            </button>
            {explanation && (
              <button
                onClick={copy}
                className="h-9 px-3 rounded-md border text-sm hover:bg-muted transition flex items-center gap-1.5"
                title="Copy"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
