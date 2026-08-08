import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Code2, Copy, Check, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { CanvasElement } from "@/types/canvas";

const TARGETS = [
  { id: "mermaid", label: "Mermaid", ext: "mmd" },
  { id: "sql", label: "Postgres DDL", ext: "sql" },
  { id: "terraform", label: "Terraform", ext: "tf" },
  { id: "typescript", label: "TypeScript", ext: "ts" },
  { id: "openapi", label: "OpenAPI", ext: "yaml" },
  { id: "python", label: "SQLAlchemy", ext: "py" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  elements: CanvasElement[];
}

export function DiagramToCodePanel({ visible, onClose, elements }: Props) {
  const [target, setTarget] = useState("mermaid");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async (t = target) => {
    setTarget(t);
    setLoading(true);
    setError(null);
    setCode("");
    try {
      const payload = elements
        .filter((e) => !e.isDeleted && e.type !== "ai-image")
        .map((e) => ({
          id: e.id,
          type: e.type,
          x: e.x,
          y: e.y,
          width: e.width,
          height: e.height,
          text: e.text,
        }));
      if (payload.length === 0) throw new Error("Canvas is empty — draw a diagram first.");
      const { data, error: fnError } = await supabase.functions.invoke("diagram-to-code", {
        body: { elements: payload, target: t },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setCode(data.code ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const ext = TARGETS.find((t) => t.id === target)?.ext ?? "txt";
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `pencil-diagram.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-3 right-3 bottom-3 z-50 w-[440px] rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden"
          initial={{ x: 460, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 460, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Code2 size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Diagram → Code</h3>
                <p className="text-[11px] text-muted-foreground">Ship your whiteboard as real artifacts</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 p-3 border-b">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                onClick={() => run(t.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                  target === t.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-3">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-[13px]">
                <Loader2 size={14} className="animate-spin" /> Generating {target}…
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            {!loading && !error && !code && (
              <p className="text-[13px] text-muted-foreground">
                Pick a target above and Pencil converts the shapes, labels, and arrows on your canvas into
                working code — Mermaid, SQL DDL, Terraform, TypeScript models, OpenAPI, or SQLAlchemy.
              </p>
            )}
            {code && (
              <pre className="text-[11.5px] font-mono leading-relaxed whitespace-pre-wrap text-foreground">
                {code}
              </pre>
            )}
          </div>

          {code && (
            <div className="border-t p-3 flex gap-2">
              <button
                onClick={copy}
                className="flex-1 h-9 rounded-md border text-sm flex items-center justify-center gap-1.5 hover:bg-muted"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
              <button
                onClick={download}
                className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90"
              >
                <Download size={14} /> Download
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
