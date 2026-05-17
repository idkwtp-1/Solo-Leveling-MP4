import { type Gate } from "@/lib/shadow-data";
import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";

type Props = {
  gates: Gate[];
  activeId: string | null;
  onSelect: (g: Gate) => void;
  isOffline?: boolean;
  cachedTrackIds?: Set<string>;
  globalShuffleActive?: boolean;
  onGlobalShuffle?: () => void;
};

export function GatesGrid({
  gates,
  activeId,
  onSelect,
  isOffline = false,
  cachedTrackIds = new Set(),
  globalShuffleActive = false,
  onGlobalShuffle,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <h2 className="font-display text-xs sm:text-sm tracking-[0.3em] text-primary text-glow-blue">
            GATES // SELECT ENTRY
          </h2>
          {onGlobalShuffle && (
            <button
              onClick={onGlobalShuffle}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-0.5 border rounded-sm font-mono text-[9px] tracking-wider transition-all duration-300 cursor-pointer tap-press",
                globalShuffleActive
                  ? "border-primary text-primary bg-primary/10 shadow-[0_0_10px_oklch(0.82_0.16_220/0.3)]"
                  : "border-border/60 text-muted-foreground hover:border-primary/60 hover:text-primary hover:shadow-[0_0_8px_oklch(0.82_0.16_220/0.15)]"
              )}
            >
              <Shuffle className="h-2.5 w-2.5" />
              SYSTEM SHUFFLE
            </button>
          )}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {gates.length} ENTRIES DETECTED
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {gates.map((g) => {
          const active = g.id === activeId;
          const hasCached = g.tracks.some((t) => cachedTrackIds.has(t.id));
          const isGateDisabled = isOffline && !hasCached;

          return (
            <button
              key={g.id}
              onClick={() => !isGateDisabled && onSelect(g)}
              disabled={isGateDisabled}
              className={cn(
                "group relative tap-press text-left",
                "panel-clip-sm overflow-hidden",
                "h-28 sm:h-32 p-3 sm:p-4",
                "border transition-all duration-200",
                active
                  ? "border-primary/70 bg-shadow/15"
                  : "border-shadow/40 bg-surface/40 hover:border-primary/60",
                isGateDisabled &&
                  "opacity-25 cursor-not-allowed pointer-events-none",
              )}
              style={{
                boxShadow: active
                  ? "0 0 18px oklch(0.82 0.16 220 / 0.45), inset 0 0 24px oklch(0.5 0.27 295 / 0.25)"
                  : undefined,
              }}
            >
              <div className="absolute inset-0 opacity-30 pointer-events-none scanlines" />
              <div
                className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl opacity-60 transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.5 0.27 295 / 0.7), transparent 70%)",
                }}
              />
              <div className="relative flex flex-col h-full justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-primary/80">
                    {g.code}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px] px-1.5 py-0.5 border",
                      g.rank === "S-RANK"
                        ? "border-shadow text-shadow"
                        : g.rank === "??"
                          ? "border-primary text-primary animate-flicker"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {g.rank}
                  </span>
                </div>
                <div>
                  <div className="font-display text-sm sm:text-base font-bold leading-tight">
                    {g.name}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-1">
                    {g.tracks.length} TRACKS
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
