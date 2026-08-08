import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FileCode2, Boxes } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { CanvasElement } from "@/types/canvas";

interface Props {
  visible: boolean;
  onClose: () => void;
  onInsert: (elements: CanvasElement[]) => void;
}

const SOURCES = [
  { id: "auto", label: "Auto-detect" },
  { id: "code", label: "App code" },
  { id: "sql", label: "SQL schema" },
  { id: "terraform", label: "Terraform" },
  { id: "compose", label: "Docker / K8s" },
  { id: "openapi", label: "OpenAPI" },
];

export function CodeToDiagramDialog({ visible, onClose, onInsert }: Props) {
  const [source, setSource] = useState("auto");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setCode((await file.text()).slice(0, 60000));
  };

  const run = async () => {
    if (!code.trim()) {
      setError("Paste some code, a schema, or drop a file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("code-to-diagram", {
        body: { code: code.slice(0, 60000), sourceType: source },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      const elements: CanvasElement[] = data?.elements ?? [];
      if (elements.length === 0) throw new Error("The analyzer found no architecture in that input.");
      onInsert(elements);
      setNote(`Generated ${elements.length} elements from your ${data?.detected ?? source} source.`);
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
                    Reverse-engineer a real system diagram from your source
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {SOURCES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSource(s.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                      source === s.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files?.[0]);
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
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                  Upload a file
                </label>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {code.length.toLocaleString()} chars
                </span>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}
              {note && <p className="text-xs text-primary">{note}</p>}
            </div>

            <div className="border-t px-5 py-3 flex justify-end gap-2">
              <button onClick={onClose} className="h-9 px-4 rounded-md border text-sm hover:bg-muted">
                Cancel
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
