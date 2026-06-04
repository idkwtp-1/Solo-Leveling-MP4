import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertOctagon } from "lucide-react";

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExitConfirmDialog({ open, onOpenChange }: ExitConfirmDialogProps) {
  const handleExit = () => {
    const pywebview = (window as any).pywebview;
    if (pywebview?.api?.close_app) {
      pywebview.api.close_app();
    } else {
      console.log("pywebview close_app not available (non-desktop mode).");
      // Fallback in case window.close is permitted or just close setting
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full border border-border/80 bg-background/95 backdrop-blur-md max-w-[420px] p-6 shadow-[0_0_50px_rgba(138,43,226,0.15)] neon-border font-sans">
        {/* Decorative Top Line/Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div className="space-y-2 text-center">
            <AlertDialogTitle className="font-display font-black text-lg tracking-wider text-glow-blue uppercase">
              System Disconnection
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed">
              WARNING: Are you sure you want to terminate the Shadow Player system connection? Unsaved player states may be lost.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex sm:justify-center gap-3">
          <AlertDialogCancel className="flex-1 font-mono text-xs tracking-wider uppercase border-border/60 hover:bg-muted/40 cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            onClick={handleExit}
            className="flex-1 font-mono text-xs tracking-wider uppercase bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer"
          >
            Terminate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
