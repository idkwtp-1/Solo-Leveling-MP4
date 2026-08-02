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
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  onConfirm,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full border border-border/80 bg-background/95 backdrop-blur-md max-w-[420px] p-6 shadow-[0_0_50px_rgba(138,43,226,0.15)] neon-border font-sans z-[100]">
        {/* Decorative Top Line */}
        <div
          className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
            variant === "danger"
              ? "from-transparent via-red-500 to-transparent"
              : "from-transparent via-primary to-transparent"
          }`}
        />

        <AlertDialogHeader className="space-y-4">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border ${
              variant === "danger"
                ? "bg-red-950/50 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
                : "bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(138,43,226,0.2)] animate-pulse"
            }`}
          >
            {variant === "danger" ? (
              <Trash2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-2 text-center">
            <AlertDialogTitle className="font-display font-black text-base tracking-wider text-glow-blue uppercase">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex sm:justify-center gap-3">
          <AlertDialogCancel className="flex-1 font-mono text-xs tracking-wider uppercase border-border/60 hover:bg-muted/40 cursor-pointer">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
              onOpenChange(false);
            }}
            className={`flex-1 font-mono text-xs tracking-wider uppercase cursor-pointer ${
              variant === "danger"
                ? "bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                : "bg-primary/80 hover:bg-primary border border-primary/50 text-primary-foreground"
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
