import { useState } from "react";
import { type Gate } from "@/lib/shadow-data";
import { cn } from "@/lib/utils";
import { Shuffle, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/Shadow/ConfirmDialog";

type Props = {
  gates: Gate[];
  activeId: string | null;
  onSelect: (g: Gate) => void;
  isOffline?: boolean;
  cachedTrackIds?: Set<string>;
  globalShuffleActive?: boolean;
  onGlobalShuffle?: () => void;
  onCreateGate?: () => void;
  onDeleteGate?: (gateId: string) => void;
};

const getRankConfig = (rank: string) => {
  switch (rank) {
    case "S-RANK":
      return {
        border: "border-purple-500/60 hover:border-purple-400",
        activeBorder: "border-purple-400 bg-purple-950/25 shadow-[0_0_22px_rgba(168,85,247,0.45)]",
        badge: "border-purple-400 bg-gradient-to-r from-purple-900/80 to-purple-800/60 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
        threat: "CRITICAL // S-CLASS",
        glyph: "關",
        glow: "rgba(168, 85, 247, 0.45)",
      };
    case "A-RANK":
      return {
        border: "border-cyan-500/50 hover:border-cyan-400",
        activeBorder: "border-cyan-400 bg-cyan-950/25 shadow-[0_0_20px_rgba(6,182,212,0.4)]",
        badge: "border-cyan-400 bg-gradient-to-r from-cyan-950/80 to-cyan-900/60 text-cyan-100 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
        threat: "HIGH // A-CLASS",
        glyph: "門",
        glow: "rgba(6, 182, 212, 0.4)",
      };
    case "B-RANK":
      return {
        border: "border-blue-500/40 hover:border-blue-400",
        activeBorder: "border-blue-400 bg-blue-950/20 shadow-[0_0_16px_rgba(59,130,246,0.35)]",
        badge: "border-blue-400 bg-blue-950/60 text-blue-200",
        threat: "MODERATE // B-CLASS",
        glyph: "界",
        glow: "rgba(59, 130, 246, 0.3)",
      };
    case "C-RANK":
      return {
        border: "border-emerald-500/40 hover:border-emerald-400",
        activeBorder: "border-emerald-400 bg-emerald-950/20 shadow-[0_0_16px_rgba(16,185,129,0.35)]",
        badge: "border-emerald-400 bg-emerald-950/60 text-emerald-200",
        threat: "SECURE // C-CLASS",
        glyph: "域",
        glow: "rgba(16, 185, 129, 0.25)",
      };
    case "??":
    default:
      return {
        border: "border-red-500/80 hover:border-red-400",
        activeBorder: "border-red-500 bg-red-950/35 shadow-[0_0_26px_rgba(239,68,68,0.55)]",
        badge: "border-red-500 bg-red-950/80 text-red-300 animate-pulse shadow-[0_0_14px_rgba(239,68,68,0.6)]",
        threat: "ANOMALY // RED GATE",
        glyph: "獄",
        glow: "rgba(239, 68, 68, 0.55)",
      };
  }
};

export function GatesGrid({
  gates,
  activeId,
  onSelect,
  isOffline = false,
  cachedTrackIds = new Set(),
  globalShuffleActive = false,
  onGlobalShuffle,
  onCreateGate,
  onDeleteGate,
}: Props) {
  const [gateToDelete, setGateToDelete] = useState<Gate | null>(null);
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
                "flex items-center gap-1.5 min-h-[34px] px-3 py-1 border rounded-sm font-mono text-[10px] tracking-wider transition-all duration-300 cursor-pointer tap-press",
                globalShuffleActive
                  ? "border-primary text-primary bg-primary/10 shadow-[0_0_12px_oklch(0.82_0.16_220/0.4)]"
                  : "border-border/60 text-muted-foreground hover:border-primary/60 hover:text-primary hover:shadow-[0_0_8px_oklch(0.82_0.16_220/0.15)]",
              )}
            >
              <Shuffle className="h-3 w-3" />
              SYSTEM SHUFFLE
            </button>
          )}
          {onCreateGate && (
            <button
              onClick={onCreateGate}
              className="flex items-center gap-1.5 min-h-[34px] px-3 py-1 border border-primary/50 text-primary hover:bg-primary/10 rounded-sm font-mono text-[10px] tracking-wider transition-all duration-300 cursor-pointer tap-press"
            >
              <Plus className="h-3 w-3" />
              AWAKEN GATE
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
          const cfg = getRankConfig(g.rank);

          return (
            <button
              key={g.id}
              onClick={() => !isGateDisabled && onSelect(g)}
              disabled={isGateDisabled}
              className={cn(
                "group relative tap-press text-left",
                "panel-clip-sm overflow-hidden",
                "min-h-[118px] sm:min-h-[130px] p-3 sm:p-4",
                "border transition-all duration-300",
                active ? cfg.activeBorder : cn(cfg.border, "bg-surface/50 hover:bg-surface/75"),
                isGateDisabled && "opacity-25 cursor-not-allowed pointer-events-none",
              )}
            >
              {/* Scanlines & animated sheen sweep */}
              <div className="absolute inset-0 opacity-25 pointer-events-none scanlines" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

              {/* Four runic corner markers */}
              <span className="absolute top-1 left-1.5 font-mono text-[7px] text-primary/40 select-none pointer-events-none">┌</span>
              <span className="absolute top-1 right-1.5 font-mono text-[7px] text-primary/40 select-none pointer-events-none">┐</span>
              <span className="absolute bottom-1 left-1.5 font-mono text-[7px] text-primary/40 select-none pointer-events-none">└</span>
              <span className="absolute bottom-1 right-1.5 font-mono text-[7px] text-primary/40 select-none pointer-events-none">┘</span>

              {/* Dynamic mana aura nebula */}
              <div
                className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-50 transition-opacity duration-300 group-hover:opacity-90 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${cfg.glow}, transparent 70%)`,
                }}
              />

              <div className="relative flex flex-col h-full justify-between z-[2]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-primary/90 font-semibold tracking-wider">
                      {g.code}
                    </span>
                    <span className="font-mono text-[8px] text-primary/40 select-none">
                      {cfg.glyph}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Metallic relief rank badge */}
                    <span
                      className={cn(
                        "font-mono text-[9px] px-2 py-0.5 border rounded-xs font-bold tracking-widest transition-transform duration-200 group-hover:scale-105",
                        cfg.badge,
                      )}
                    >
                      {g.rank}
                    </span>
                    {onDeleteGate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGateToDelete(g);
                        }}
                        title="Delete Gate"
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-muted-foreground transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[8px] tracking-[0.2em] text-muted-foreground/75 mb-0.5 uppercase">
                    {cfg.threat}
                  </div>
                  <div className="font-display text-sm sm:text-base font-bold leading-tight tracking-wide text-foreground group-hover:text-primary transition-colors">
                    {g.name}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                    <span>{g.tracks.length} TRACKS</span>
                    {active && (
                      <span className="text-[8px] font-bold text-primary animate-pulse tracking-wider">
                        // RESONATING
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!gateToDelete}
        onOpenChange={(open) => !open && setGateToDelete(null)}
        title="COLLAPSE GATE ARRAY?"
        description={
          gateToDelete
            ? `WARNING: Deleting Gate "${gateToDelete.name}" will unassign all its tracks back to essence storage. Proceed?`
            : ""
        }
        confirmText="DELETE GATE"
        cancelText="ABORT"
        onConfirm={() => {
          if (gateToDelete && onDeleteGate) {
            onDeleteGate(gateToDelete.id);
          }
        }}
      />
    </section>
  );
}
