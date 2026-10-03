import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, X, ArrowUpRight, Pencil as PencilIcon, Loader2, Shuffle, Plus, Copy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  TAGS, addComment, getDisplayName, listComments, listPosts, myLikes, renderPreview, setDisplayName, timeAgo, toggleLike,
  type GalleryComment, type GalleryPost,
} from "@/lib/gallery";
import { createBoard } from "@/lib/board-store";

function Thumb({ post, className = "" }: { post: GalleryPost; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const id = requestIdleCallback?.(() => setSrc(renderPreview(post.id, post.elements))) ?? 0;
    if (!window.requestIdleCallback) setSrc(renderPreview(post.id, post.elements));
    return () => window.cancelIdleCallback?.(id);
  }, [post]);
  return src ? <img src={src} alt={post.title} loading="lazy" className={`w-full h-auto block ${className}`} />
    : <div className={`aspect-[4/3] w-full animate-pulse bg-muted ${className}`} />;
}

function Card({ post, liked, onLike, onOpen, index }: { post: GalleryPost; liked: boolean; onLike: () => void; onOpen: () => void; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.04, type: "spring", stiffness: 260, damping: 28 }}
      className="group mb-5 break-inside-avoid"
    >
      <div onClick={onOpen} className="relative cursor-zoom-in overflow-hidden rounded-2xl border bg-card shadow-[0_1px_0_hsl(var(--border))] transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl">
        <div className="p-3"><div className="overflow-hidden rounded-xl border bg-background"><Thumb post={post} className="transition-transform duration-700 group-hover:scale-[1.03]" /></div></div>
        <div className="absolute right-5 top-5 flex gap-1.5 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            aria-label="Like"
            className={`flex h-9 w-9 items-center justify-center rounded-full border bg-background/90 backdrop-blur shadow-sm ${liked ? "text-destructive" : "text-foreground"}`}
          >
            <Heart size={15} fill={liked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3 px-1 pt-3">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-medium tracking-tight">{post.title}</h3>
          <p className="font-mono text-[11px] text-muted-foreground">{post.author_name} · {timeAgo(post.created_at)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <button onClick={onLike} className={`flex items-center gap-1 ${liked ? "text-destructive" : "hover:text-foreground"}`}>
            <Heart size={12} fill={liked ? "currentColor" : "none"} />{post.like_count}
          </button>
          <span className="flex items-center gap-1"><MessageCircle size={12} />{post.comment_count}</span>
        </div>
      </div>
    </motion.article>
  );
}

function Detail({ post, liked, onLike, onClose, onCommented }: { post: GalleryPost; liked: boolean; onLike: () => void; onClose: () => void; onCommented: () => void }) {
  const [comments, setComments] = useState<GalleryComment[] | null>(null);
  const [body, setBody] = useState("");
  const [name, setName] = useState(getDisplayName());
  const [busy, setBusy] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { listComments(post.id).then(setComments).catch(() => setComments([])); }, [post.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      setDisplayName(name);
      await addComment(post.id, name, body);
      setBody("");
      setComments(await listComments(post.id));
      onCommented();
    } finally { setBusy(false); }
  };

  const remix = async () => {
    setRemixing(true);
    try {
      const b = await createBoard(`Remix · ${post.title}`, post.elements);
      navigate(`/canvas?board=${b.slug}`);
    } finally { setRemixing(false); }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-md p-3 md:p-8"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()}
        initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="grid h-full max-h-[880px] w-full max-w-6xl overflow-hidden rounded-3xl border bg-background shadow-2xl md:grid-cols-[1fr_360px]">
        <div className="relative flex items-center justify-center overflow-auto canvas-grid bg-card p-6 md:p-10">
          <div className="rounded-xl border bg-background shadow-xl"><Thumb post={post} className="rounded-xl max-h-[70vh] w-auto" /></div>
          <span className="absolute left-5 top-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">fig. {post.id.slice(0, 4)}</span>
        </div>
        <aside className="flex min-h-0 flex-col border-t md:border-l md:border-t-0">
          <div className="space-y-3 border-b p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold leading-tight tracking-tight">{post.title}</h2>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">by {post.author_name} · {timeAgo(post.created_at)}</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-muted"><X size={16} /></button>
            </div>
            {post.description && <p className="text-[13px] leading-relaxed text-muted-foreground">{post.description}</p>}
            {!!post.tags.length && (
              <div className="flex flex-wrap gap-1.5">{post.tags.map((t) => <span key={t} className="rounded-full border px-2 py-0.5 font-mono text-[10px]">{t}</span>)}</div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={onLike}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${liked ? "border-destructive/40 bg-destructive/10 text-destructive" : "hover:bg-muted"}`}>
                <Heart size={15} fill={liked ? "currentColor" : "none"} /> {post.like_count}
              </button>
              <button onClick={remix} disabled={remixing}
                className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                {remixing ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />} Remix in canvas
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{post.comment_count} comments</p>
            {comments === null ? <Loader2 size={14} className="animate-spin text-muted-foreground" />
              : comments.length === 0 ? <p className="text-[13px] text-muted-foreground">Be the first to say something nice.</p>
              : comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] uppercase">{c.author_name[0]}</span>
                  <div>
                    <p className="text-[12px]"><span className="font-medium">{c.author_name}</span> <span className="font-mono text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span></p>
                    <p className="text-[13px] leading-relaxed">{c.body}</p>
                  </div>
                </div>
              ))}
          </div>
          <div className="space-y-2 border-t p-4">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Your name"
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-[12px] outline-none focus:ring-1 ring-primary" />
            <div className="flex gap-2">
              <input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} maxLength={1000} placeholder="Add a comment…"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-[13px] outline-none focus:ring-1 ring-primary" />
              <button onClick={send} disabled={busy || !body.trim()} className="rounded-lg bg-foreground px-3 text-[13px] text-background disabled:opacity-40">
                {busy ? <Loader2 size={14} className="animate-spin" /> : "Post"}
              </button>
            </div>
          </div>
        </aside>
      </motion.div>
    </motion.div>
  );
}

export default function Gallery() {
  const [posts, setPosts] = useState<GalleryPost[] | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"new" | "top">("new");
  const [tag, setTag] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPosts(null);
    listPosts(sort).then(setPosts).catch((e) => { setError(e.message); setPosts([]); });
    myLikes().then(setLiked).catch(() => {});
  }, [sort]);

  const shown = useMemo(() => (posts ?? []).filter((p) => !tag || p.tags.includes(tag)), [posts, tag]);
  const open = posts?.find((p) => p.id === openId) ?? null;

  const like = async (p: GalleryPost) => {
    const was = liked.has(p.id);
    const next = new Set(liked); was ? next.delete(p.id) : next.add(p.id);
    setLiked(next);
    setPosts((ps) => ps?.map((x) => (x.id === p.id ? { ...x, like_count: x.like_count + (was ? -1 : 1) } : x)) ?? ps);
    try { await toggleLike(p.id, was); } catch { setLiked(liked); }
  };

  const bumpComment = (id: string) => setPosts((ps) => ps?.map((x) => (x.id === id ? { ...x, comment_count: x.comment_count + 1 } : x)) ?? ps);
  const surprise = () => shown.length && setOpenId(shown[Math.floor(Math.random() * shown.length)].id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2"><PencilIcon size={18} className="text-primary" /><span className="text-[15px] font-semibold tracking-tight">Pencil</span><span className="font-mono text-[11px] text-muted-foreground">/ gallery</span></Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/canvas" className="flex h-8 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background"><Plus size={14} /> Share a diagram</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1500px] px-5 pb-24">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start pt-10 space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Sheet 01 — Community</p>
              <h1 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-tight">Diagrams worth<br />stealing from.</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">Architectures, flows and sketches drawn in Pencil. Like the good ones, leave notes, remix any of them into your own board.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={surprise} className="flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-[14px] hover:bg-muted transition"><Shuffle size={15} /> Surprise me</button>
              <Link to="/canvas" className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground shadow-lg shadow-primary/20">Start drawing <ArrowUpRight size={15} /></Link>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Filter</p>
              <div className="flex flex-wrap gap-1.5">
                {[null, ...TAGS].map((t) => (
                  <button key={t ?? "all"} onClick={() => setTag(t)}
                    className={`rounded-full px-3 py-1.5 text-[12px] transition ${tag === t ? "bg-primary text-primary-foreground" : "bg-muted/60 hover:bg-muted"}`}>
                    {t ?? "All"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex w-fit rounded-full border p-0.5 font-mono text-[11px]">
              {(["new", "top"] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)} className={`rounded-full px-3 py-1 capitalize transition ${sort === s ? "bg-foreground text-background" : "text-muted-foreground"}`}>{s === "new" ? "Newest" : "Most liked"}</button>
              ))}
            </div>
          </aside>

          <main className="pt-10">
            {posts === null ? (
              <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="mb-5 break-inside-avoid rounded-2xl bg-muted animate-pulse" style={{ height: 180 + (i % 3) * 70 }} />)}
              </div>
            ) : shown.length === 0 ? (
              <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed canvas-grid text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Empty sheet</p>
                <p className="mt-2 text-lg font-medium">{error ?? "No diagrams here yet."}</p>
                <Link to="/canvas" className="mt-4 rounded-full bg-foreground px-4 py-2 text-[13px] text-background">Be the first to share</Link>
              </div>
            ) : (
              <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
                {shown.map((p, i) => <Card key={p.id} index={i} post={p} liked={liked.has(p.id)} onLike={() => like(p)} onOpen={() => setOpenId(p.id)} />)}
              </div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {open && <Detail post={open} liked={liked.has(open.id)} onLike={() => like(open)} onClose={() => setOpenId(null)} onCommented={() => bumpComment(open.id)} />}
      </AnimatePresence>
    </div>
  );
}
