import { motion, AnimatePresence } from "framer-motion";
import type { DownloadStatus } from "./YouTubeSearchDrawer";

type Props = {
  downloads: Record<string, DownloadStatus>;
};

export function GlobalDownloadProgress({ downloads }: Props) {
  const activeDownloads = Object.values(downloads).filter(
    (d) => d.status !== "completed" && d.status !== "failed"
  );

  if (activeDownloads.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {activeDownloads.map((d) => {
          let statusText = "";
          if (d.status === "queued") statusText = "QUEUED";
          if (d.status === "analyzing") statusText = "ANALYZING";
          if (d.status === "downloading") {
            statusText = `DL: ${Math.round(d.progress)}%`;
            if (d.speed && d.eta) {
              statusText += ` | ${d.speed} - ETA ${d.eta}`;
            }
          }

          // Build minimalistic bar [|||||   ]
          const totalBars = 10;
          const filledBars = Math.floor((d.progress / 100) * totalBars);
          const barStr = `[${"|".repeat(filledBars)}${" ".repeat(Math.max(0, totalBars - filledBars))}]`;

          return (
            <motion.div
              key={d.videoId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background/90 border border-primary/40 backdrop-blur-md p-3 rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.15)] flex flex-col gap-1 min-w-[300px] pointer-events-auto"
            >
              <div className="text-[11px] font-mono text-primary truncate max-w-[280px] uppercase tracking-wide">
                {">"} {d.title}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1">
                <span>{statusText}</span>
                {d.status === "downloading" && (
                  <span className="text-primary tracking-widest whitespace-pre">{barStr}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
