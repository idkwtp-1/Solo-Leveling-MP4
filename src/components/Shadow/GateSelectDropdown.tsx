import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { Gate } from "@/lib/shadow-data";
import { cn } from "@/lib/utils";

export const getRankBadgeStyle = (rank: string) => {
  const upper = rank.toUpperCase();
  if (upper.includes("S-RANK") || upper === "S") {
    return "border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]";
  }
  if (upper.includes("A-RANK") || upper === "A") {
    return "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.25)]";
  }
  if (upper.includes("B-RANK") || upper === "B") {
    return "border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]";
  }
  if (upper.includes("C-RANK") || upper === "C") {
    return "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]";
  }
  return "border-rose-500/50 bg-rose-500/15 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.25)]";
};

type Props = {
  gates: Gate[];
  selectedGateId?: string | null;
  onSelect: (gateId: string) => void;
  placeholder?: string;
  compact?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function GateSelectDropdown({
  gates,
  selectedGateId,
  onSelect,
  placeholder = "-- CHOOSE DESTINATION --",
  compact = false,
  className,
  ariaLabel = "Select gate destination",
}: Props) {
  const selectedGate = gates.find((g) => g.id === selectedGateId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "group flex items-center justify-between gap-2 bg-surface/90 hover:bg-surface border border-primary/40 hover:border-primary/80 focus-visible:ring-1 focus-visible:ring-primary rounded-xs font-mono transition-all cursor-pointer text-left select-none tap-press",
            compact
              ? "text-[10px] px-2 py-1 h-7 max-w-[120px] sm:max-w-none"
              : "text-xs px-3 py-2 min-h-[38px] w-full",
            className,
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            {selectedGate ? (
              <>
                <span
                  className={cn(
                    "text-[8px] font-bold px-1 py-0.5 rounded-xs border shrink-0",
                    getRankBadgeStyle(selectedGate.rank),
                  )}
                >
                  {selectedGate.rank.replace("-RANK", "")}
                </span>
                <span className="truncate text-foreground font-display font-medium text-xs">
                  {selectedGate.name}
                </span>
              </>
            ) : (
              <span className="text-primary/70 tracking-wider truncate text-[11px] font-medium">
                {placeholder}
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-transform group-data-[state=open]:rotate-180 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="z-50 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[260px] max-w-[92vw] bg-surface/95 backdrop-blur-xl border border-primary/40 shadow-2xl p-1.5 rounded-xs font-mono space-y-1"
        style={{
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.7), 0 0 16px oklch(0.82 0.16 220 / 0.2)",
        }}
      >
        <DropdownMenuLabel className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground px-2 py-1 font-mono border-b border-border/40 flex items-center justify-between">
          <span>SYSTEM DESTINATIONS</span>
          <span className="text-[8px] text-primary/70">{gates.length} ACTIVE</span>
        </DropdownMenuLabel>
        <div className="max-h-[280px] overflow-y-auto space-y-1 py-1">
          {gates.map((g) => {
            const isSelected = g.id === selectedGateId;
            return (
              <DropdownMenuItem
                key={g.id}
                onClick={() => onSelect(g.id)}
                className={cn(
                  "flex items-center justify-between gap-3 px-2.5 py-2 rounded-xs cursor-pointer outline-none transition-all",
                  isSelected
                    ? "bg-primary/20 text-primary border border-primary/50"
                    : "text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-transparent",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "text-[8px] font-bold px-1.5 py-0.5 rounded-xs border shrink-0",
                      getRankBadgeStyle(g.rank),
                    )}
                  >
                    {g.rank}
                  </span>
                  <span className="font-display text-xs font-medium tracking-wide truncate">
                    {g.name}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground shrink-0">
                  {g.code || (g.trackIds ? `${g.trackIds.length} TRK` : "")}
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
