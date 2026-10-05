import { motion, AnimatePresence } from "framer-motion";

export type OfflineCacheProgress = {
  cached: number;
  skipped: number;
  total: number;
};

type Props = {
  progress: OfflineCacheProgress | null;
};

export function GlobalOfflineProgress({ progress }: Props) {
  const isVisible = progress !== null && progress.total > 0;
  const doneCount = progress ? progress.cached + progress.skipped : 0;
  const pct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((doneCount / progress.total) * 100))
      : 0;

  const totalBars = 10;
  const filledBars = Math.floor((pct / 100) * totalBars);
  const barStr = `[${"|".repeat(filledBars)}${" ".repeat(Math.max(0, totalBars - filledBars))}]`;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {isVisible && progress && (
          <motion.div
            key="offline-cache-hud"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background/90 border border-primary/40 backdrop-blur-md p-3 rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.15)] flex flex-col gap-1 min-w-[280px] sm:min-w-[300px] pointer-events-auto"
          >
            <div className="text-[11px] font-mono text-primary truncate uppercase tracking-wide">
              {">"} OFFLINE CACHE MATRIX SYNC
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1">
              <span>
                SYNC: {doneCount}/{progress.total} ({pct}%)
              </span>
              <span className="text-primary tracking-widest whitespace-pre">
                {barStr}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
