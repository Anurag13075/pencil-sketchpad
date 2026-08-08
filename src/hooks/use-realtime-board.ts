import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CanvasElement, Point } from "@/types/canvas";

/* Realtime multiplayer: presence (live cursors + names) and element broadcast
   with last-write-wins merging by element version counter. No AI, no auth —
   identity is a per-tab random peer with a colour. */

export interface Peer {
  id: string;
  name: string;
  color: string;
  cursor: Point | null;
  selection: string[];
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
const ANIMALS = ["Otter", "Falcon", "Panther", "Heron", "Lynx", "Marlin", "Bison", "Ibex", "Cobra", "Wren"];

function makeIdentity() {
  const id = crypto.randomUUID();
  const name = `${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]} ${Math.floor(Math.random() * 90) + 10}`;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { id, name, color };
}

interface Options {
  slug: string | null;
  enabled: boolean;
  onRemoteElements: (elements: CanvasElement[]) => void;
  getElements: () => CanvasElement[];
}

export function useRealtimeBoard({ slug, enabled, onRemoteElements, getElements }: Options) {
  const identity = useMemo(makeIdentity, []);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastCursorSent = useRef(0);
  const suppress = useRef(false);

  useEffect(() => {
    if (!enabled || !slug) {
      setConnected(false);
      setPeers([]);
      return;
    }

    const channel = supabase.channel(`board:${slug}`, {
      config: { presence: { key: identity.id }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    const syncPeers = () => {
      const state = channel.presenceState<{
        id: string; name: string; color: string; cursor: Point | null; selection: string[];
      }>();
      const list: Peer[] = [];
      for (const key of Object.keys(state)) {
        const meta = state[key]?.[0];
        if (!meta || meta.id === identity.id) continue;
        list.push({
          id: meta.id,
          name: meta.name,
          color: meta.color,
          cursor: meta.cursor ?? null,
          selection: meta.selection ?? [],
        });
      }
      setPeers(list);
    };

    channel
      .on("presence", { event: "sync" }, syncPeers)
      .on("presence", { event: "join" }, syncPeers)
      .on("presence", { event: "leave" }, syncPeers)
      .on("broadcast", { event: "elements" }, ({ payload }) => {
        if (!payload?.elements) return;
        suppress.current = true;
        onRemoteElements(payload.elements as CanvasElement[]);
        setTimeout(() => (suppress.current = false), 0);
      })
      .on("broadcast", { event: "request-state" }, () => {
        // whoever has state answers, newcomers converge
        channel.send({ type: "broadcast", event: "elements", payload: { elements: getElements() } });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await channel.track({ ...identity, cursor: null, selection: [] });
          channel.send({ type: "broadcast", event: "request-state", payload: {} });
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnected(false);
        }
      });

    return () => {
      setConnected(false);
      setPeers([]);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, enabled]);

  const sendCursor = useCallback(
    (cursor: Point | null, selection: string[] = []) => {
      const ch = channelRef.current;
      if (!ch || !connected) return;
      const now = performance.now();
      if (now - lastCursorSent.current < 45) return;
      lastCursorSent.current = now;
      ch.track({ ...identity, cursor, selection });
    },
    [connected, identity],
  );

  const broadcastElements = useCallback(
    (elements: CanvasElement[]) => {
      const ch = channelRef.current;
      if (!ch || !connected || suppress.current) return;
      ch.send({ type: "broadcast", event: "elements", payload: { elements } });
    },
    [connected],
  );

  return { identity, peers, connected, sendCursor, broadcastElements };
}
