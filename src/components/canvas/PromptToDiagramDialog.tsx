import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, X, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface DiagramElement {
  type: "rectangle" | "ellipse" | "diamond" | "arrow" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  strokeColor?: string;
  fillColor?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onDiagramGenerated: (elements: DiagramElement[]) => void;
}

const examples = [
  "Login flow with user, validation, and database",
  "Microservices architecture for an e-commerce app",
  "Mind map of machine learning topics",
  "Org chart for a 12-person startup",
];

export function PromptToDiagramDialog({ visible, onClose, onDiagramGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-diagram", {
        body: { prompt: prompt.trim() },
      });
      if (fnError) {
        setError(fnError.message || "Failed to generate");
        setLoading(false);
        return;
      }
      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      if (data?.elements?.length) {
        onDiagramGenerated(data.elements);
        setPrompt("");
        setLoading(false);
      } else {
        setError("No diagram returned. Try a more specific prompt.");
        setLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-lg mx-4 p-6 rounded-2xl border bg-background shadow-2xl"
            initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Wand2 size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Prompt to Diagram
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">Pencil exclusive</span>
                </h3>
                <p className="text-xs text-muted-foreground">Describe a diagram and we'll draw it</p>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A flowchart showing user signup → email verification → onboarding → dashboard"
              className="w-full h-28 px-3 py-2.5 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  disabled={loading}
                  className="text-[11px] px-2 py-1 rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>

            {error && <p className="text-xs text-destructive mt-3">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full mt-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Designing diagram...</> : <><Sparkles size={15} /> Generate Diagram</>}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
