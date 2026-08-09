import { Check, Copy, Users, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import type { Peer } from "@/hooks/use-realtime-board";
import type { Point } from "@/types/canvas";

interface Props {
  peers: Peer[];
  connected: boolean;
  identity: { name: string; color: string };
  slug: string | null;
  canvasToScreen: (x: number, y: number) => Point;
}

/** Live cursors of remote collaborators + a share/presence chip. */
export function PresenceLayer({ peers, connected, identity, slug, canvasToScreen }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (!slug) return;
    const url = `${window.location.origin}/canvas?board=${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
        {peers.map((p) => {
          if (!p.cursor) return null;
          const s = canvasToScreen(p.cursor.x, p.cursor.y);
          return (
            <div
              key={p.id}
              className="absolute transition-transform duration-75 will-change-transform"
              style={{ transform: `translate(${s.x}px, ${s.y}px)` }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 1.5 L2 14 L5.6 10.6 L8 16 L10.4 15 L8 9.8 L13 9.8 Z" fill={p.color} stroke="white" strokeWidth="1.2" />
              </svg>
              <span
                className="absolute left-4 top-3 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white shadow"
                style={{ backgroundColor: p.color }}
              >
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-lg border bg-background/85 px-2.5 py-1.5 backdrop-blur-xl">
        {connected ? (
          <Wifi size={13} className="text-emerald-500" />
        ) : (
          <WifiOff size={13} className="text-muted-foreground" />
        )}
        <div className="flex items-center gap-1">
          <span
            className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: identity.color }}
            title={`${identity.name} (you)`}
          >
            {identity.name.slice(0, 1)}
          </span>
          {peers.slice(0, 4).map((p) => (
            <span
              key={p.id}
              className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: p.color }}
              title={p.name}
            >
              {p.name.slice(0, 1)}
            </span>
          ))}
          {peers.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{peers.length - 4}</span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
          <Users size={11} /> {peers.length + 1}
        </span>
        <button
          onClick={share}
          disabled={!slug}
          className="ml-1 flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-40"
          title="Copy collaboration link"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />} Share
        </button>
      </div>
    </>
  );
}
