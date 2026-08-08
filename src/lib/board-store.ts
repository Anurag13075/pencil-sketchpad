import { supabase } from "@/integrations/supabase/client";
import type { CanvasElement } from "@/types/canvas";
import { drawElement, getElementBounds } from "./canvas-utils";

/* Cloud persistence for boards: save/load, shareable slugs, version snapshots,
   thumbnail rendering into private storage, and AI search indexing. */

const OWNER_KEY = "pencil.owner-key";
const RECENT_KEY = "pencil.recent-boards";

export function ownerKey(): string {
  let k = localStorage.getItem(OWNER_KEY);
  if (!k) {
    k = crypto.randomUUID();
    localStorage.setItem(OWNER_KEY, k);
  }
  return k;
}

export interface BoardRow {
  id: string;
  slug: string;
  title: string;
  elements: CanvasElement[];
  thumbnail_path: string | null;
  updated_at: string;
}

function normalize(row: any): BoardRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    elements: Array.isArray(row.elements) ? (row.elements as CanvasElement[]) : [],
    thumbnail_path: row.thumbnail_path ?? null,
    updated_at: row.updated_at,
  };
}

function remember(slug: string) {
  const list: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  const next = [slug, ...list.filter((s) => s !== slug)].slice(0, 20);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export async function createBoard(title = "Untitled board", elements: CanvasElement[] = []) {
  const { data, error } = await supabase
    .from("boards")
    .insert({ title, elements: elements as any, owner_key: ownerKey() })
    .select()
    .single();
  if (error) throw error;
  remember(data.slug);
  return normalize(data);
}

export async function loadBoard(slug: string) {
  const { data, error } = await supabase.from("boards").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  remember(data.slug);
  return normalize(data);
}

export async function saveBoard(id: string, elements: CanvasElement[], title?: string) {
  const patch: Record<string, unknown> = { elements: elements as any };
  if (title !== undefined) patch.title = title;
  const { error } = await supabase.from("boards").update(patch).eq("id", id);
  if (error) throw error;
}

export async function listMyBoards() {
  const recent: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .or(`owner_key.eq.${ownerKey()}${recent.length ? `,slug.in.(${recent.join(",")})` : ""}`)
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data ?? []).map(normalize);
}

/* ------------------------------- snapshots ------------------------------- */

export interface SnapshotRow {
  id: string;
  label: string;
  element_count: number;
  created_at: string;
  elements: CanvasElement[];
}

export async function createSnapshot(boardId: string, elements: CanvasElement[], label: string) {
  const live = elements.filter((e) => !e.isDeleted);
  const { data, error } = await supabase
    .from("board_snapshots")
    .insert({
      board_id: boardId,
      label,
      elements: elements as any,
      element_count: live.length,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listSnapshots(boardId: string): Promise<SnapshotRow[]> {
  const { data, error } = await supabase
    .from("board_snapshots")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    label: r.label,
    element_count: r.element_count,
    created_at: r.created_at,
    elements: Array.isArray(r.elements) ? r.elements : [],
  }));
}

export async function deleteSnapshot(id: string) {
  const { error } = await supabase.from("board_snapshots").delete().eq("id", id);
  if (error) throw error;
}

/** Structural diff between two element sets — powers the version timeline. */
export interface Diff {
  added: number;
  removed: number;
  modified: number;
  movedIds: string[];
}

export function diffElements(from: CanvasElement[], to: CanvasElement[]): Diff {
  const a = new Map(from.filter((e) => !e.isDeleted).map((e) => [e.id, e]));
  const b = new Map(to.filter((e) => !e.isDeleted).map((e) => [e.id, e]));
  let added = 0, removed = 0, modified = 0;
  const movedIds: string[] = [];
  for (const [id, el] of b) {
    const prev = a.get(id);
    if (!prev) { added++; continue; }
    const moved = Math.abs(prev.x - el.x) > 0.5 || Math.abs(prev.y - el.y) > 0.5;
    const resized = Math.abs(prev.width - el.width) > 0.5 || Math.abs(prev.height - el.height) > 0.5;
    const restyled =
      prev.strokeColor !== el.strokeColor ||
      prev.fillColor !== el.fillColor ||
      prev.text !== el.text ||
      prev.strokeWidth !== el.strokeWidth;
    if (moved || resized || restyled) {
      modified++;
      if (moved) movedIds.push(id);
    }
  }
  for (const id of a.keys()) if (!b.has(id)) removed++;
  return { added, removed, modified, movedIds };
}

/* ------------------------------ thumbnails ------------------------------ */

export function renderThumbnail(elements: CanvasElement[], maxSize = 640): Blob | Promise<Blob | null> {
  const visible = elements.filter((e) => !e.isDeleted);
  if (visible.length === 0) return Promise.resolve(null);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of visible) {
    const b = getElementBounds(el);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  const pad = 32;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const scale = Math.min(1, maxSize / Math.max(w, h));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.translate(-minX + pad, -minY + pad);
  for (const el of visible) drawElement(ctx, el, false, 1);

  return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.9));
}

export async function uploadThumbnail(boardId: string, elements: CanvasElement[]) {
  const blob = await renderThumbnail(elements);
  if (!blob) return null;
  const path = `${boardId}/preview.png`;
  const { error } = await supabase.storage
    .from("board-thumbnails")
    .upload(path, blob, { upsert: true, contentType: "image/png" });
  if (error) throw error;
  await supabase.from("boards").update({ thumbnail_path: path }).eq("id", boardId);
  return path;
}

export async function thumbnailUrl(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("board-thumbnails").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/* --------------------------- AI search indexing --------------------------- */

export async function indexBoard(boardId: string, title: string, elements: CanvasElement[]) {
  const { data, error } = await supabase.functions.invoke("index-board", {
    body: { board_id: boardId, title, elements: elements.filter((e) => !e.isDeleted) },
  });
  if (error) throw error;
  return data as { indexed: boolean; summary: string };
}

export interface SearchHit {
  board_id: string;
  slug: string;
  title: string;
  summary: string | null;
  similarity: number;
}

export async function searchBoards(query: string) {
  const { data, error } = await supabase.functions.invoke("search-boards", { body: { query } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.results ?? []) as SearchHit[];
}
