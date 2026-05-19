import { useRef } from "react";
import { motion } from "framer-motion";
import { ARTIST, type Track } from "@/lib/shadow-data";
import { HexButton } from "./HexButton";
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
  PictureInPicture,
} from "lucide-react";
import { PortalVisualizer } from "./PortalVisualizer";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatTime } from "@/lib/utils";

type Props = {
  track: Track;
  gateName: string;
  playing: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: "none" | "all" | "one";
  onToggleRepeat: () => void;
  pipActive?: boolean;
  onTogglePip?: () => void;
};

export function MonarchPlayer({
  track,
  gateName,
  playing,
  onToggle,
  onPrev,
  onNext,
  onClose,
  currentTime = 0,
  duration = 0,
  onSeek,
  shuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  pipActive = false,
  onTogglePip,
}: Props) {
  const isMobile = useIsMobile();
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
    <motion.section
      layoutId="player-shell"
      className="panel-clip neon-border bg-surface/70 backdrop-blur-xl relative overflow-hidden w-full max-w-[680px] mx-auto p-6 sm:p-10"
      style={{ boxShadow: "var(--glow-mixed)" }}
      transition={{ type: "spring", stiffness: 200, damping: 26 }}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none scanlines" />
      <div
        className="absolute -inset-32 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.5 0.27 295 / 0.25), transparent 65%)",
        }}
      />

      <motion.div layout className="flex items-center justify-between relative">
        <span className="font-mono text-[10px] text-primary tracking-[0.3em]">
          SYSTEM ACTIVE // NOW PLAYING
        </span>
        <div className="flex items-center gap-3">
          {onTogglePip && (
            <button
              onClick={onTogglePip}
              className={`tap-press transition-colors cursor-pointer ${
                pipActive ? "text-primary text-glow-blue animate-pulse" : "text-muted-foreground hover:text-primary"
              }`}
              title="Toggle Picture-in-Picture Mini-Player"
              aria-label="Toggle Picture-in-Picture"
            >
              <PictureInPicture className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="tap-press text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label="Close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <motion.div layout className="mt-8 grid place-items-center">
        <PortalVisualizer active={playing} size={isMobile ? 260 : 340} />
      </motion.div>

      <motion.div layout className="mt-8 text-center relative">
        <div className="font-mono text-[10px] text-muted-foreground tracking-[0.3em] mb-2">
          {gateName} // TRACK {track.index}
        </div>
        <h2
          className="font-display text-3xl sm:text-5xl font-black tracking-wider text-glow-purple"
          style={{
            textShadow:
              "0 0 12px oklch(0.5 0.27 295 / 0.9), 0 0 36px oklch(0.5 0.27 295 / 0.5)",
          }}
        >
          {track.title}
        </h2>
        <div className="font-mono text-xs text-primary mt-3 tracking-[0.25em]">
          {ARTIST}
        </div>
      </motion.div>

      <motion.div
        layout
        className="mt-8 flex items-center gap-3 font-mono text-[11px] text-muted-foreground"
      >
        <span className="text-primary text-glow-blue w-10 shrink-0">
          {formatTime(currentTime)}
        </span>
        <div
          ref={progressBarRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="flex-1 h-4 flex items-center relative z-20 group cursor-pointer"
        >
          {/* Visual track line */}
          <div className="w-full h-1 bg-border/40 group-hover:bg-border/60 transition-colors relative overflow-hidden rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-primary"
              style={{
                width: `${progressPercent}%`,
                boxShadow:
                  "0 0 10px oklch(0.82 0.16 220), 0 0 22px oklch(0.5 0.27 295 / 0.7)",
              }}
            />
          </div>
          {/* Glowing thumb knob visible on hover */}
          <div
            className="absolute h-3.5 w-3.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              left: `clamp(0px, calc(${progressPercent}% - 7px), calc(100% - 14px))`,
              boxShadow:
                "0 0 8px oklch(0.82 0.16 220), 0 0 16px oklch(0.82 0.16 220)",
            }}
          />
        </div>
        <span className="w-10 shrink-0 text-right">
          {duration > 0 ? formatTime(duration) : track.duration}
        </span>
      </motion.div>

      <motion.div
        layout
        className="mt-8 flex items-center justify-center gap-6 sm:gap-8"
      >
        <button
          onClick={onToggleShuffle}
          className={`tap-press transition-all duration-200 cursor-pointer ${
            shuffle
              ? "text-primary drop-shadow-[0_0_8px_rgba(0,210,255,0.7)]"
              : "text-muted-foreground hover:text-primary"
          }`}
          title={`Shuffle: ${shuffle ? "ON" : "OFF"}`}
          aria-label="Shuffle"
        >
          <Shuffle className="h-4 w-4" />
        </button>
        <button
          onClick={onPrev}
          className="tap-press text-muted-foreground hover:text-primary cursor-pointer"
          aria-label="Previous"
        >
          <SkipBack className="h-6 w-6" />
        </button>
        <HexButton
          size={86}
          onClick={onToggle}
          glow={playing ? "purple" : "blue"}
          aria-label="Play/Pause"
        >
          {playing ? (
            <Pause className="h-7 w-7" fill="currentColor" />
          ) : (
            <Play className="h-7 w-7 ml-1" fill="currentColor" />
          )}
        </HexButton>
        <button
          onClick={onNext}
          className="tap-press text-muted-foreground hover:text-primary cursor-pointer"
          aria-label="Next"
        >
          <SkipForward className="h-6 w-6" />
        </button>
        <button
          onClick={onToggleRepeat}
          className={`tap-press transition-all duration-200 cursor-pointer relative ${
            repeatMode !== "none"
              ? repeatMode === "one"
                ? "text-purple-400 drop-shadow-[0_0_8px_rgba(138,43,226,0.75)]"
                : "text-primary drop-shadow-[0_0_8px_rgba(0,210,255,0.7)]"
              : "text-muted-foreground hover:text-primary"
          }`}
          title={`Repeat: ${repeatMode.toUpperCase()}`}
          aria-label="Repeat"
        >
          <Repeat className="h-4 w-4" />
          {repeatMode === "one" && (
            <span className="absolute -top-1.5 -right-1 text-[7px] font-black bg-purple-950/80 text-purple-300 border border-purple-500/40 rounded-full w-2.5 h-2.5 flex items-center justify-center font-mono">
              1
            </span>
          )}
        </button>
      </motion.div>
    </motion.section>
  );
}
