import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Loader2, ArrowUp, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { applyAgentOps, type AgentOp } from "@/lib/canvas-ops";
import type { CanvasElement } from "@/types/canvas";

interface Props {
  visible: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  onApply: (next: CanvasElement[], createdIds: string[]) => void;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ops?: AgentOp[];
}

const SUGGESTIONS = [
  "Draw a 3-tier web architecture",
  "Add a Redis cache between API and database",
  "Tidy up and auto-layout this board",
  "Label every unlabelled arrow",
];

export function AgentChatPanel({ visible, onClose, elements, onApply }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (instruction: string) => {
    const text = instruction.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setBusy(true);
    try {
      const sanitized = elements
        .filter((e) => !e.isDeleted)
        .map((e) => ({
          id: e.id,
          type: e.type,
          x: Math.round(e.x),
          y: Math.round(e.y),
          width: Math.round(e.width),
          height: Math.round(e.height),
          text: e.text,
        }));

      const { data, error: fnError } = await supabase.functions.invoke("canvas-agent", {
        body: { instruction: text, elements: sanitized, history },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const ops: AgentOp[] = Array.isArray(data?.ops) ? data.ops : [];
      const reply: string = data?.reply ?? "Done.";

      if (ops.length) {
        const result = applyAgentOps(elements, ops);
        onApply(result.elements, result.created);
      }
      setMessages((prev) => [...prev, { role: "assistant", content: reply, ops }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "The agent could not complete that.";
      setError(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-3 right-3 bottom-3 z-50 w-[380px] rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot size={16} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight text-foreground">Pencil Agent</p>
                <p className="text-[11px] font-mono text-muted-foreground">operates your board</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close agent"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tell me what to build or change and I&apos;ll do it directly on the canvas.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[13px] px-3 py-2 rounded-lg border bg-muted/40 hover:bg-muted transition text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-[13px] text-primary-foreground">
                    {m.content}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">{m.content}</p>
                    {!!m.ops?.length && (
                      <details className="rounded-lg border bg-muted/30 px-3 py-2">
                        <summary className="cursor-pointer text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                          <Wrench size={12} /> {m.ops.length} canvas operation{m.ops.length === 1 ? "" : "s"}
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {m.ops.map((op, j) => (
                            <li key={j} className="text-[11px] font-mono text-muted-foreground">
                              {op.op}
                              {op.shape ? ` ${op.shape}` : ""}
                              {op.text || op.label ? ` “${op.text ?? op.label}”` : ""}
                              {op.from && op.to ? ` ${op.from} → ${op.to}` : ""}
                              {op.target ? ` @${op.target}` : ""}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Working on your board…
              </p>
            )}
          </div>

          {error && (
            <p className="mx-4 mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {error}
            </p>
          )}

          <form
            className="border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="relative">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="e.g. add a load balancer in front of the API"
                className="w-full resize-none rounded-xl border bg-background px-3 py-2 pr-11 text-[13px] text-foreground outline-none focus:ring-1 ring-primary"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send instruction"
                className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={15} />}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
