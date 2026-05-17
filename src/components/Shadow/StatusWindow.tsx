import { useRef } from "react";
import { motion } from "framer-motion";
import { ARTIST, type Track } from "@/lib/shadow-data";
import { HexButton } from "./HexButton";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { PortalVisualizer } from "./PortalVisualizer";
import { formatTime } from "@/lib/utils";

type Props = {
  track: Track | null;
  playing: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentTime?: number;
  duration?: number;
  onExpand?: () => void;
  onSeek?: (time: number) => void;
};

export function StatusWindow({
  track,
  playing,
  onToggle,
  onPrev,
  onNext,
  currentTime = 0,
  duration = 0,
  onExpand,
  onSeek,
}: Props) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleTimelineScrub = (clientX: number) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek?.(clickPercent * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!track) return;
    e.stopPropagation();
    isDragging.current = true;
    handleTimelineScrub(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging.current) {
        handleTimelineScrub(moveEvent.clientX);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!track || e.touches.length === 0) return;
    e.stopPropagation();
    isDragging.current = true;
    handleTimelineScrub(e.touches[0].clientX);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (isDragging.current && moveEvent.touches.length > 0) {
        handleTimelineScrub(moveEvent.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <motion.aside
      layoutId="player-shell"
      className={`panel-clip neon-border bg-surface/70 backdrop-blur-md p-5 lg:p-6 relative overflow-hidden transition-all duration-300 ${
        track ? "hover:border-primary/50 cursor-pointer" : ""
      }`}
      style={{
        boxShadow: track
          ? "var(--glow-mixed), 0 0 15px oklch(0.82 0.16 220 / 0.15)"
          : "var(--glow-mixed)",
      }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      onClick={() => {
        if (track && onExpand) {
          onExpand();
        }
      }}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none scanlines" />

      <motion.div layout className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-primary tracking-[0.3em]">
          STATUS WINDOW
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {track ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand?.();
              }}
              className="hover:text-primary transition-colors text-glow-blue underline decoration-dotted font-bold"
            >
              // EXPAND PLAYER
            </button>
          ) : (
            "// STANDBY"
          )}
        </span>
      </motion.div>

      <motion.div
        layout
        className="mt-6 grid place-items-center"
        title={track ? "Click status window to maximize player" : undefined}
      >
        <PortalVisualizer active={playing} size={200} />
      </motion.div>

      <motion.div layout className="mt-6 text-center">
        <div className="font-display text-lg font-bold text-glow-blue truncate">
          {track?.title ?? "AWAITING SIGNAL"}
        </div>
        <div className="font-mono text-[11px] text-muted-foreground mt-1">
          {ARTIST}
        </div>
      </motion.div>

      <motion.div
        layout
        className="mt-6 flex items-center justify-center gap-5"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="tap-press text-muted-foreground hover:text-primary transition-colors relative z-20"
          aria-label="Previous"
        >
          <SkipBack className="h-5 w-5" />
        </button>
        <div className="relative z-20">
          <HexButton
            size={62}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            glow={playing ? "purple" : "blue"}
            aria-label="Play/Pause"
          >
            {playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            )}
          </HexButton>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="tap-press text-muted-foreground hover:text-primary transition-colors relative z-20"
          aria-label="Next"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </motion.div>

      <motion.div
        layout
        className="mt-6 flex items-center gap-3 font-mono text-[10px] text-muted-foreground"
      >
        <span className="text-primary w-10 shrink-0">
          {formatTime(currentTime)}
        </span>
        <div
          ref={progressBarRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`flex-1 h-4 flex items-center relative z-20 group ${track ? "cursor-pointer" : "cursor-not-allowed"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Visual track line */}
          <div className="w-full h-1 bg-border/40 group-hover:bg-border/60 transition-colors relative overflow-hidden rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-primary"
              style={{
                width: `${progressPercent}%`,
                boxShadow: "0 0 8px oklch(0.82 0.16 220)",
              }}
            />
          </div>
          {/* Glowing thumb knob visible on hover */}
          {track && (
            <div
              className="absolute h-3.5 w-3.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                left: `clamp(0px, calc(${progressPercent}% - 6px), calc(100% - 12px))`,
                boxShadow:
                  "0 0 8px oklch(0.82 0.16 220), 0 0 16px oklch(0.82 0.16 220)",
              }}
            />
          )}
        </div>
        <span className="w-10 shrink-0 text-right">
          {duration > 0 ? formatTime(duration) : (track?.duration ?? "--:--")}
        </span>
      </motion.div>
    </motion.aside>
  );
}
