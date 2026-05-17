import { ARTIST, type Gate, type Track } from "@/lib/shadow-data";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

type Props = {
  gate: Gate;
  activeId: string | null;
  onPlay: (t: Track) => void;
  compact?: boolean;
  isOffline?: boolean;
  cachedTrackIds?: Set<string>;
  onReassign?: (trackId: string, gateId: string) => void;
  onUnassign?: (trackId: string) => void;
  gates?: Gate[];
  onClose?: () => void;
};

export function TrackList({
  gate,
  activeId,
  onPlay,
  compact = false,
  isOffline = false,
  cachedTrackIds = new Set(),
  onReassign,
  onUnassign,
  gates,
  onClose,
}: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xs sm:text-sm tracking-[0.3em] text-primary text-glow-blue">
          GATE OPEN: <span className="text-foreground">{gate.name}</span>
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-muted-foreground">
            {gate.code}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="font-mono text-[9px] border border-border/40 hover:border-primary/50 text-muted-foreground hover:text-primary px-1.5 py-0.5 rounded-sm transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          )}
        </div>
      </div>
      {gate.tracks.length === 0 ? (
        <div className="border border-border/20 bg-background/30 rounded-sm px-4 py-8 text-center">
          <div className="font-mono text-[10px] text-muted-foreground tracking-[0.25em] animate-pulse">
            // NO ESSENCE DETECTED
          </div>
          <div className="font-mono text-[9px] text-border mt-2 tracking-[0.15em]">
            ASSIGN TRACKS VIA UNASSIGNED ESSENCE PANEL
          </div>
        </div>
      ) : (
        <ul
          className={cn(
            "divide-y divide-border/20 border border-border/20 bg-background/30 rounded-sm overflow-hidden",
            compact && "text-sm",
          )}
        >
          {gate.tracks.map((t) => {
            const active = t.id === activeId;
            const isTrackDisabled = isOffline && !cachedTrackIds.has(t.id);

            return (
              <li key={t.id}>
                <div
                  className={cn(
                    "group w-full flex items-center gap-3 sm:gap-4 px-2 sm:px-3 py-2.5 text-left transition-colors",
                    active ? "bg-shadow/15" : "hover:bg-primary/5",
                    isTrackDisabled && "opacity-25",
                  )}
                >
                  {/* Clickable play area */}
                  <button
                    onClick={() => !isTrackDisabled && onPlay(t)}
                    disabled={isTrackDisabled}
                    className={cn(
                      "flex-1 flex items-center gap-3 sm:gap-4 text-left min-w-0 tap-press disabled:cursor-not-allowed disabled:pointer-events-none",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-xs w-8 shrink-0",
                        active
                          ? "text-primary text-glow-blue"
                          : "text-muted-foreground",
                      )}
                    >
                      {t.index}
                    </span>
                    <span className="relative w-5 h-5 grid place-items-center shrink-0">
                      <Play
                        className={cn(
                          "h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity",
                          active && "opacity-100 text-primary",
                        )}
                        fill="currentColor"
                      />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-display font-semibold truncate",
                          compact ? "text-xs" : "text-sm sm:text-base",
                          active && "text-glow-purple text-foreground",
                        )}
                      >
                        {t.title}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground truncate">
                        {ARTIST}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-xs shrink-0 mr-2",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {t.duration}
                    </span>
                  </button>

                  {/* Assignment / Unassignment Controls */}
                  {onReassign && onUnassign && gates && (
                    <div className="flex items-center gap-2 shrink-0 relative z-20">
                      {/* Gate Transfer Dropdown */}
                      <select
                        aria-label="Transfer to gate"
                        value={gate.id}
                        onChange={(e) => {
                          if (e.target.value && e.target.value !== gate.id) {
                            onReassign(t.id, e.target.value);
                          }
                        }}
                        className="bg-background/85 border border-border/40 hover:border-primary/50 rounded-sm text-[9px] font-mono text-primary px-1.5 py-0.5 outline-none cursor-pointer transition-colors max-w-[80px] sm:max-w-none"
                      >
                        {gates.map((g) => (
                          <option
                            key={g.id}
                            value={g.id}
                            className="bg-background text-foreground text-[10px]"
                          >
                            [{g.rank.replace("-RANK", "")}]{" "}
                            {g.name.split(" ")[0]}
                          </option>
                        ))}
                      </select>

                      {/* Unassign (Unbind) Button */}
                      <button
                        onClick={() => onUnassign(t.id)}
                        title="Unassign track"
                        className="border border-red-500/40 hover:border-red-500 hover:bg-red-950/30 text-red-400 font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-all"
                      >
                        UNBIND
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
