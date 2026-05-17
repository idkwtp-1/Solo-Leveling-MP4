import { type Gate, type Track } from "@/lib/shadow-data";
import { TrackList } from "./TrackList";

type Props = {
  gate: Gate;
  gates: Gate[];
  activeId: string | null;
  onPlay: (t: Track) => void;
  onPickGate: (g: Gate) => void;
  isOffline?: boolean;
  cachedTrackIds?: Set<string>;
};

export function SidebarQueue({
  gate,
  gates,
  activeId,
  onPlay,
  onPickGate,
  isOffline = false,
  cachedTrackIds = new Set(),
}: Props) {
  return (
    <aside className="panel-clip neon-border bg-surface/60 backdrop-blur p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-primary tracking-[0.3em]">
          QUEUE // ACTIVE GATE
        </span>
      </div>
      <div className="flex gap-1 mb-4 overflow-x-auto -mx-1 px-1 pb-1">
        {gates.map((g) => {
          const hasCached = g.tracks.some((t) => cachedTrackIds.has(t.id));
          const isGateDisabled = isOffline && !hasCached;

          return (
            <button
              key={g.id}
              onClick={() => !isGateDisabled && onPickGate(g)}
              disabled={isGateDisabled}
              className={`tap-press shrink-0 font-mono text-[10px] px-2 py-1 border ${
                g.id === gate.id
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-shadow"
              } ${isGateDisabled ? "opacity-25 cursor-not-allowed pointer-events-none" : ""}`}
            >
              {g.name}
            </button>
          );
        })}
      </div>
      <TrackList
        gate={gate}
        activeId={activeId}
        onPlay={onPlay}
        compact
        isOffline={isOffline}
        cachedTrackIds={cachedTrackIds}
      />
    </aside>
  );
}
