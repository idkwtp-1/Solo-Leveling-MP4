import { useState } from "react";
import type { Gate, Track } from "@/lib/shadow-data";
import { ARTIST } from "@/lib/shadow-data";
import { Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/Shadow/ConfirmDialog";
import { GateSelectDropdown } from "@/components/Shadow/GateSelectDropdown";

type Props = {
  gate: Gate;
  activeId: string | null;
  onPlay: (track: Track) => void;
  onClose?: () => void;
  compact?: boolean;
  onReassign?: (trackId: string, newGateId: string) => void;
  onUnassign?: (trackId: string) => void;
  onDelete?: (track: Track) => void;
  gates?: Gate[];
  isOffline?: boolean;
  cachedTrackIds?: Set<string>;
};

export function TrackList({
  gate,
  activeId,
  onPlay,
  onClose,
  compact = false,
  onReassign,
  onUnassign,
  onDelete,
  gates,
  isOffline = false,
  cachedTrackIds = new Set(),
}: Props) {
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm tracking-wider font-semibold text-foreground">
            {gate.name}
          </span>
          <span className="font-mono text-[10px] text-primary/70 border border-primary/30 px-1.5 py-0.2 rounded-xs">
            {gate.code}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            // {gate.tracks.length} TRACKS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-border tracking-[0.2em]">
            SYSTEM PLAYLIST
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
                    "group w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 text-left transition-colors",
                    active ? "bg-shadow/15" : "hover:bg-primary/5",
                    isTrackDisabled && "opacity-25",
                  )}
                >
                  {/* Clickable play area */}
                  <button
                    onClick={() => !isTrackDisabled && onPlay(t)}
                    disabled={isTrackDisabled}
                    className={cn(
                      "flex-1 flex items-center gap-2 sm:gap-3 text-left min-w-0 tap-press disabled:cursor-not-allowed disabled:pointer-events-none",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-[11px] w-5 shrink-0",
                        active
                          ? "text-primary text-glow-blue"
                          : "text-muted-foreground",
                      )}
                    >
                      {t.index}
                    </span>
                    <span className="relative w-4 h-4 grid place-items-center shrink-0">
                      <Play
                        className={cn(
                          "h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity",
                          active && "opacity-100 text-primary",
                        )}
                        fill="currentColor"
                      />
                    </span>
                    <div className="flex-1 min-w-0 pr-1">
                      <div
                        className={cn(
                          "font-display font-semibold truncate text-xs sm:text-sm",
                          active && "text-glow-purple text-foreground",
                        )}
                      >
                        {t.title}
                      </div>
                      <div className="font-mono text-[9px] text-muted-foreground truncate">
                        {ARTIST}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-[10px] shrink-0 mr-1",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {t.duration}
                    </span>
                  </button>

                  {/* Assignment / Unassignment Controls */}
                  {onReassign && onUnassign && gates && (
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative z-20">
                      {/* Gate Transfer Dropdown (Compact rank badge only: S, A, B, etc.) */}
                      <GateSelectDropdown
                        gates={gates}
                        selectedGateId={gate.id}
                        onSelect={(gateId) => {
                          if (gateId !== gate.id) {
                            onReassign(t.id, gateId);
                          }
                        }}
                        compact
                        ariaLabel="Transfer to gate"
                      />

                      {/* Unassign (Unbind) Button */}
                      <button
                        onClick={() => onUnassign(t.id)}
                        title="Unassign track"
                        className="border border-red-500/40 hover:border-red-500 hover:bg-red-950/30 text-red-400 font-mono text-[8px] px-1 py-0.5 h-6 rounded-xs transition-all tracking-wider"
                      >
                        UNBIND
                      </button>

                      {/* Delete Track Button */}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackToDelete(t);
                          }}
                          title="Delete track permanently"
                          className="border border-red-500/40 hover:border-red-500 hover:bg-red-950/50 text-red-400 p-1 h-6 w-6 flex items-center justify-center rounded-xs transition-all cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!trackToDelete}
        onOpenChange={(open) => !open && setTrackToDelete(null)}
        title="PURGE ESSENCE PERMANENTLY?"
        description={
          trackToDelete
            ? `WARNING: Deleting "${trackToDelete.title}" will permanently remove its audio file and system bindings. Proceed?`
            : ""
        }
        confirmText="DELETE TRACK"
        destructive
        onConfirm={() => {
          if (trackToDelete && onDelete) {
            onDelete(trackToDelete);
            setTrackToDelete(null);
          }
        }}
      />
    </div>
  );
}
