import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

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
            <select
              value={gateRank}
              onChange={(e) => setGateRank(e.target.value)}
              className="w-full bg-surface border border-border/60 rounded px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {AVAILABLE_RANKS.map((r) => (
                <option key={r} value={r} className="bg-background text-foreground">
                  {r}
                </option>
              ))}
            </select>
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
