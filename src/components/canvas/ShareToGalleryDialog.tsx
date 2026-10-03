import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Send, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { CanvasElement } from "@/types/canvas";
import { TAGS, getDisplayName, renderPreview, setDisplayName, sharePost } from "@/lib/gallery";

interface Props { visible: boolean; onClose: () => void; elements: CanvasElement[] }

export function ShareToGalleryDialog({ visible, onClose, elements }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState(getDisplayName());
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => { if (visible) { setDone(false); setError(null); } }, [visible]);

  const live = elements.filter((e) => !e.isDeleted);
  const preview = useMemo(
    () => (visible ? renderPreview(`share-${Date.now()}`, live, 700) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible],
  );

  const submit = async () => {
    if (!title.trim() || !live.length) return;
    setBusy(true); setError(null);
    try {
      setDisplayName(author);
      await sharePost({ title, description, author, tags, elements });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not share.");
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border bg-background shadow-2xl overflow-hidden grid md:grid-cols-2"
            initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }}>
            <div className="bg-muted/40 p-4 flex items-center justify-center border-b md:border-b-0 md:border-r min-h-[220px]">
              {preview ? <img src={preview} alt="Preview" className="max-h-72 rounded-lg border bg-card shadow-sm" />
                : <p className="font-mono text-xs text-muted-foreground">Draw something first</p>}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gallery</p>
                  <h2 className="text-lg font-semibold tracking-tight">Share your diagram</h2>
                </div>
                <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md hover:bg-muted"><X size={16} /></button>
              </div>
              {done ? (
                <div className="space-y-3 py-6">
                  <p className="text-sm">It's live in the gallery.</p>
                  <Link to="/gallery" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                    View in gallery <ExternalLink size={14} />
                  </Link>
                </div>
              ) : (
                <>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Title — e.g. Event-driven checkout"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 ring-primary" />
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} rows={3} placeholder="What does it show? (optional)"
                    className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 ring-primary" />
                  <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={60} placeholder="Your name"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 ring-primary" />
                  <div className="flex flex-wrap gap-1.5">
                    {TAGS.map((t) => {
                      const on = tags.includes(t);
                      return (
                        <button key={t} type="button" onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t].slice(0, 3))}
                          className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition ${on ? "bg-foreground text-background border-foreground" : "hover:bg-muted"}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <button onClick={submit} disabled={busy || !title.trim() || !live.length}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40">
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publish to gallery
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
