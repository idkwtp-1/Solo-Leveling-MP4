import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getRankBadgeStyle } from "@/components/Shadow/GateSelectDropdown";

interface CreateGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGate: (name: string, rank: string) => void;
}

const AVAILABLE_RANKS = ["S-RANK", "A-RANK", "B-RANK", "C-RANK", "D-RANK", "E-RANK"];

export function CreateGateDialog({
  open,
  onOpenChange,
  onCreateGate,
}: CreateGateDialogProps) {
  const [gateName, setGateName] = useState("");
  const [gateRank, setGateRank] = useState("S-RANK");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateName.trim()) return;
    onCreateGate(gateName.trim(), gateRank);
    setGateName("");
    setGateRank("S-RANK");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[100] w-full max-w-[420px] border border-border/80 bg-background/95 backdrop-blur-md p-6 shadow-[0_0_50px_rgba(0,210,255,0.15)] neon-border font-sans">
        {/* Decorative Top Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <DialogHeader className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(0,210,255,0.2)]">
            <PlusCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2 text-center">
            <DialogTitle className="font-display font-black text-base tracking-wider text-glow-blue uppercase">
              CREATE NEW GATE
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed">
              INITIALIZE A NEW SYSTEM DUNGEON GATE TO CLASSIFY ESSENCE
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              GATE DESIGNATION (NAME)
            </label>
            <input
              type="text"
              autoFocus
              value={gateName}
              onChange={(e) => setGateName(e.target.value)}
              placeholder="e.g. CYBERPUNK MIX"
              className="w-full bg-surface border border-border/60 rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              THREAT LEVEL (RANK)
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-full bg-surface/90 hover:bg-surface border border-border/60 hover:border-primary/60 rounded px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-xs border", getRankBadgeStyle(gateRank))}>
                      {gateRank}
                    </span>
                    <span className="font-display font-medium text-xs">
                      {gateRank} DUNGEON
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-primary/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={4}
                className="z-[110] w-[calc(100vw-3rem)] sm:w-[370px] bg-surface/95 backdrop-blur-xl border border-primary/40 shadow-2xl p-1.5 rounded-xs font-mono space-y-1"
              >
                <DropdownMenuLabel className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground px-2 py-1 font-mono border-b border-border/40">
                  SELECT THREAT LEVEL
                </DropdownMenuLabel>
                {AVAILABLE_RANKS.map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => setGateRank(r)}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-xs cursor-pointer outline-none transition-all",
                      gateRank === r
                        ? "bg-primary/20 text-primary border border-primary/50"
                        : "text-foreground hover:bg-primary/10 hover:text-primary border border-transparent",
                    )}
                  >
                    <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-xs border", getRankBadgeStyle(r))}>
                      {r}
                    </span>
                    <span className="font-display text-xs font-medium tracking-wide">
                      {r} GATE
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DialogFooter className="mt-6 flex sm:justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2 font-mono text-xs tracking-wider uppercase border border-border/60 rounded hover:bg-muted/40 text-muted-foreground cursor-pointer transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!gateName.trim()}
              className="flex-1 px-4 py-2 font-mono text-xs tracking-wider uppercase bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded shadow-[0_0_15px_rgba(0,210,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              INITIALIZE
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
