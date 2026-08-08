import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FileCode2, Boxes } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { graphToElements, type ArchGraph } from "@/lib/graph-to-elements";
import type { CanvasElement } from "@/types/canvas";

interface Props {
  visible: boolean;
  onClose: () => void;
  onInsert: (elements: CanvasElement[], title?: string) => void;
}

const HINTS = [
  { id: "", label: "Auto-detect" },
  { id: "This is application source code.", label: "App code" },
  { id: "This is a SQL schema; tables are nodes and foreign keys are edges.", label: "SQL schema" },
  { id: "This is Terraform infrastructure.", label: "Terraform" },
  { id: "This is a docker-compose or Kubernetes manifest.", label: "Docker / K8s" },
  { id: "This is an OpenAPI specification.", label: "OpenAPI" },
];

export function CodeToDiagramDialog({ visible, onClose, onInsert }: Props) {
  const [hint, setHint] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setSource((await file.text()).slice(0, 60000));
  };

  const run = async () => {
    if (source.trim().length < 10) {
      setError("Paste some code, a schema, or drop a file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotes(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("code-to-diagram", {
        body: { source: source.slice(0, 60000), hint },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      const graph = data as ArchGraph;
      const elements = graphToElements(graph);
      if (elements.length === 0) throw new Error("No architecture was detected in that input.");
      onInsert(elements, graph.title);
      setNotes(graph.notes ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl rounded-2xl border bg-card shadow-2xl overflow-hidden"
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileCode2 size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Code → Architecture</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Reverse-engineer a laid-out system diagram from your real source
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {HINTS.map((h) => (
                  <button
                    key={h.label}
                    onClick={() => setHint(h.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                      hint === h.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              <textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                onDrop={(e) => {
                  e.preventDefault();
                  readFile(e.dataTransfer.files?.[0]);
                }}
                placeholder={"Paste code, a SQL schema, terraform, docker-compose, or an OpenAPI spec…\nYou can also drop a file here."}
                spellCheck={false}
                className="w-full h-56 rounded-lg border bg-background p-3 font-mono text-[12px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />

              <div className="flex items-center gap-3">
                <label className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="file"
                    className="hidden"
                    accept=".ts,.tsx,.js,.jsx,.py,.go,.rs,.java,.sql,.tf,.yaml,.yml,.json,.txt,.md"
                    onChange={(e) => readFile(e.target.files?.[0])}
                  />
                  Upload a file
                </label>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {source.length.toLocaleString()} chars
                </span>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}
              {notes && (
                <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3 leading-relaxed">
                  {notes}
                </p>
              )}
            </div>

            <div className="border-t px-5 py-3 flex justify-end gap-2">
              <button onClick={onClose} className="h-9 px-4 rounded-md border text-sm hover:bg-muted">
                Close
              </button>
              <button
                onClick={run}
                disabled={loading}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Boxes size={14} />}
                {loading ? "Analyzing…" : "Generate architecture"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
