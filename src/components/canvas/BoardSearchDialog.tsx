import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Search, Sparkles, ArrowUpRight } from "lucide-react";
import { searchBoards, type SearchHit } from "@/lib/board-store";

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenBoard: (slug: string) => void;
}

const EXAMPLES = [
  "the board with the payment flow",
  "database schema for users and orders",
  "queue based background jobs",
];

export function BoardSearchDialog({ visible, onClose, onOpenBoard }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (q = query) => {
    if (q.trim().length < 2) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setHits(null);
    try {
      setHits(await searchBoards(q));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-background/70 backdrop-blur-sm p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl rounded-2xl border bg-card shadow-2xl overflow-hidden"
            initial={{ scale: 0.97, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: -8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Search size={16} className="text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="Describe the board you're looking for…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading ? (
                <Loader2 size={15} className="animate-spin text-muted-foreground" />
              ) : (
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="p-4 space-y-2 max-h-[50vh] overflow-auto">
              {error && <p className="text-xs text-destructive">{error}</p>}

              {!hits && !loading && !error && (
                <>
                  <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                    <Sparkles size={12} /> Semantic search — meaning, not keywords.
                  </p>
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => run(ex)}
                      className="w-full text-left text-[13px] px-3 py-2 rounded-lg border hover:bg-muted transition"
                    >
                      {ex}
                    </button>
                  ))}
                </>
              )}

              {hits?.length === 0 && (
                <p className="text-[13px] text-muted-foreground">
                  Nothing matched. Boards get indexed a few seconds after you edit them.
                </p>
              )}

              {hits?.map((h) => (
                <button
                  key={h.board_id}
                  onClick={() => {
                    onOpenBoard(h.slug);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg border hover:bg-muted transition group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium truncate">{h.title}</span>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      {Math.round(h.similarity * 100)}%
                      <ArrowUpRight size={12} className="inline ml-1 opacity-0 group-hover:opacity-100" />
                    </span>
                  </div>
                  {h.summary && (
                    <p className="text-[11.5px] text-muted-foreground mt-0.5 line-clamp-2">{h.summary}</p>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
