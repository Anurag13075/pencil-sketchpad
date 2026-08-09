import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, History, Loader2, RotateCcw, Trash2, Camera, Eye } from "lucide-react";
import {
  createSnapshot,
  deleteSnapshot,
  diffElements,
  listSnapshots,
  type SnapshotRow,
} from "@/lib/board-store";
import type { CanvasElement } from "@/types/canvas";

interface Props {
  visible: boolean;
  onClose: () => void;
  boardId: string | null;
  elements: CanvasElement[];
  onPreview: (elements: CanvasElement[] | null) => void;
  onRestore: (elements: CanvasElement[]) => void;
}

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function VersionHistoryPanel({
  visible,
  onClose,
  boardId,
  elements,
  onPreview,
  onRestore,
}: Props) {
  const [rows, setRows] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await listSnapshots(boardId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load history");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (visible) refresh();
    if (!visible) {
      setPreviewing(null);
      onPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, refresh]);

  const snap = async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      await createSnapshot(boardId, elements, "Manual checkpoint");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save checkpoint");
      setLoading(false);
    }
  };

  const togglePreview = (row: SnapshotRow) => {
    if (previewing === row.id) {
      setPreviewing(null);
      onPreview(null);
    } else {
      setPreviewing(row.id);
      onPreview(row.elements);
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <History size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Version timeline</h3>
                <p className="text-[11px] text-muted-foreground">Preview, diff and restore any point</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="p-3 border-b">
            <button
              onClick={snap}
              disabled={!boardId || loading}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              Save checkpoint
            </button>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {error && <p className="text-xs text-destructive">{error}</p>}
            {!boardId && (
              <p className="text-[13px] text-muted-foreground">
                This board isn't in the cloud yet — it'll be saved automatically in a moment.
              </p>
            )}
            {boardId && !loading && rows.length === 0 && (
              <p className="text-[13px] text-muted-foreground">
                No versions yet. Pencil autosaves checkpoints as you work, or save one now.
              </p>
            )}

            {rows.map((row, i) => {
              const prev = rows[i + 1];
              const d = prev ? diffElements(prev.elements, row.elements) : null;
              return (
                <div
                  key={row.id}
                  className={`rounded-lg border p-3 transition ${
                    previewing === row.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{row.label}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {ago(row.created_at)} · {row.element_count} elems
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => togglePreview(row)}
                        title="Preview this version"
                        className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setPreviewing(null);
                          onPreview(null);
                          onRestore(row.elements);
                        }}
                        title="Restore"
                        className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        onClick={async () => {
                          await deleteSnapshot(row.id);
                          refresh();
                        }}
                        title="Delete version"
                        className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted text-destructive"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {d && (
                    <div className="flex gap-2 mt-2 text-[11px] font-mono">
                      <span className="text-emerald-600">+{d.added}</span>
                      <span className="text-destructive">−{d.removed}</span>
                      <span className="text-amber-600">~{d.modified}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
