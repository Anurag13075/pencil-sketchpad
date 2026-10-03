import { supabase } from "@/integrations/supabase/client";
import type { CanvasElement } from "@/types/canvas";
import { drawElement, getElementBounds } from "./canvas-utils";
import { ownerKey } from "./board-store";

export interface GalleryPost {
  id: string;
  title: string;
  description: string | null;
  author_name: string;
  tags: string[];
  elements: CanvasElement[];
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface GalleryComment {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

const NAME_KEY = "pencil.display-name";
export const getDisplayName = () => localStorage.getItem(NAME_KEY) || "";
export const setDisplayName = (n: string) => localStorage.setItem(NAME_KEY, n);

export const TAGS = ["Architecture", "Flowchart", "ERD", "Sequence", "Wireframe", "Mind map", "Sketch"];

export async function listPosts(sort: "new" | "top") {
  const { data, error } = await supabase
    .from("gallery_posts")
    .select("*")
    .order(sort === "top" ? "like_count" : "created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, elements: (r.elements as unknown as CanvasElement[]) ?? [] })) as GalleryPost[];
}

export async function sharePost(input: { title: string; description: string; author: string; tags: string[]; elements: CanvasElement[] }) {
  const live = input.elements.filter((e) => !e.isDeleted);
  const { data, error } = await supabase
    .from("gallery_posts")
    .insert({
      title: input.title.trim().slice(0, 120),
      description: input.description.trim().slice(0, 600) || null,
      author_name: input.author.trim().slice(0, 60) || "Anonymous",
      tags: input.tags,
      elements: live as any,
      owner_key: ownerKey(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function myLikes(): Promise<Set<string>> {
  const { data } = await supabase.from("gallery_likes").select("post_id").eq("owner_key", ownerKey());
  return new Set((data ?? []).map((r) => r.post_id));
}

export async function toggleLike(postId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from("gallery_likes").delete().eq("post_id", postId).eq("owner_key", ownerKey());
    if (error) throw error;
  } else {
    const { error } = await supabase.from("gallery_likes").insert({ post_id: postId, owner_key: ownerKey() });
    if (error) throw error;
  }
}

export async function listComments(postId: string) {
  const { data, error } = await supabase
    .from("gallery_comments")
    .select("id, author_name, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GalleryComment[];
}

export async function addComment(postId: string, author: string, body: string) {
  const { error } = await supabase
    .from("gallery_comments")
    .insert({ post_id: postId, author_name: author.trim().slice(0, 60) || "Anonymous", body: body.trim().slice(0, 1000) });
  if (error) throw error;
}

/** Render elements to a PNG data URL (cached). */
const cache = new Map<string, string>();
export function renderPreview(key: string, elements: CanvasElement[], maxSize = 900): string | null {
  if (cache.has(key)) return cache.get(key)!;
  const visible = elements.filter((e) => !e.isDeleted);
  if (!visible.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of visible) {
    const b = getElementBounds(el);
    minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
  }
  const pad = 48;
  const w = maxX - minX + pad * 2, h = maxY - minY + pad * 2;
  const scale = Math.min(2, maxSize / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.translate(-minX + pad, -minY + pad);
  for (const el of visible) drawElement(ctx, el, false, 1);
  const url = c.toDataURL("image/png");
  cache.set(key, url);
  return url;
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
