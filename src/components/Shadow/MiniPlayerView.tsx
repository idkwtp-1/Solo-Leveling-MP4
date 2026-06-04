import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Minimize2,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { Track, Gate } from "@/lib/shadow-data";
import { ARTIST } from "@/lib/shadow-data";
import { HexButton } from "./HexButton";
import { PortalVisualizer } from "./PortalVisualizer";
import { formatTime } from "@/lib/utils";

interface MiniPlayerViewProps {
  track: Track | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  shuffle?: boolean;
  repeatMode?: "none" | "all" | "one";
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onRestore: () => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  gates: Gate[];
  activeGate: Gate;
}

export function MiniPlayerView({
  track,
  playing,
  currentTime,
  duration,
  shuffle = false,
  repeatMode = "none",
  onToggle,
  onPrev,
  onNext,
  onSeek,
  onRestore,
  onToggleShuffle,
  onToggleRepeat,
  gates,
  activeGate,
}: MiniPlayerViewProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const currentGate =
    gates.find((g) => g.tracks.some((t) => t.id === track?.id)) || activeGate;
  const gateName = currentGate?.name ?? "UNKNOWN GATE";
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ── Seek scrubbing ──────────────────────────────────────────────────────────
  const handleTimelineScrub = (clientX: number) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(pct * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!track) return;
    e.stopPropagation();
    isDragging.current = true;
    handleTimelineScrub(e.clientX);
    const onMove = (ev: MouseEvent) => {
      if (isDragging.current) handleTimelineScrub(ev.clientX);
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!track || e.touches.length === 0) return;
    e.stopPropagation();
    isDragging.current = true;
    handleTimelineScrub(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) => {
      if (isDragging.current && ev.touches.length > 0)
        handleTimelineScrub(ev.touches[0].clientX);
    };
    const onEnd = () => {
      isDragging.current = false;
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-background text-foreground select-none"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* ── Same purple radial glow as MonarchPlayer ── */}
      <div
        className="absolute -inset-32 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.5 0.27 295 / 0.25), transparent 65%)",
        }}
      />
      {/* ── Scanlines overlay ── */}
      <div className="absolute inset-0 opacity-20 pointer-events-none scanlines" />

      {/* ── Neon border panel — same as MonarchPlayer ── */}
      <div
        className="absolute inset-0 panel-clip neon-border pointer-events-none"
        style={{ boxShadow: "var(--glow-mixed)" }}
      />

      {/* ══════════════════════════════════════════════════
          ZONE 1 — Header  (identical to MonarchPlayer top row)
      ══════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-2 shrink-0 select-none">
        <span className="font-mono text-[9px] text-primary tracking-[0.3em]">
          SYSTEM ACTIVE // NOW PLAYING
        </span>
        <button
          onClick={onRestore}
          className="tap-press text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          title="Restore Full Screen"
          aria-label="Restore Full Screen"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          ZONE 2 — Main body: two-column landscape layout
          Left = PortalVisualizer orb | Right = track info
      ══════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center gap-3 px-3 pt-1 pb-1 min-h-0"
           style={{ height: "calc(100% - 110px)" }}>

        {/* Left column: Portal Visualizer — same component, smaller size */}
        <motion.div
          layout
          className="shrink-0 grid place-items-center"
          style={{ width: 130, height: 130 }}
        >
          <PortalVisualizer active={playing} size={130} />
        </motion.div>

        {/* Right column: track metadata — same typography as MonarchPlayer */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Gate + track number — same mono label */}
          <div className="font-mono text-[8px] text-muted-foreground tracking-[0.25em] truncate">
            {gateName} // TRACK {track?.index ?? "01"}
          </div>

          {/* Track title — same Orbitron display font + purple glow */}
          <h2
            className="font-display font-black tracking-wider leading-tight"
            style={{
              fontSize: "clamp(11px, 3.2vw, 17px)",
              textShadow:
                "0 0 10px oklch(0.5 0.27 295 / 0.9), 0 0 28px oklch(0.5 0.27 295 / 0.5)",
              color: "oklch(0.96 0.01 240)",
              // Truncate long titles
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {track ? track.title : "AWAITING SIGNAL"}
          </h2>

          {/* Artist — same primary cyan mono */}
          <div className="font-mono text-[9px] text-primary tracking-[0.2em]">
            {ARTIST}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          ZONE 3 — Progress bar  (identical style to MonarchPlayer)
      ══════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center gap-2 px-3 font-mono text-[9px] text-muted-foreground shrink-0">
        <span className="text-primary text-glow-blue w-8 shrink-0">
          {formatTime(currentTime)}
        </span>

        {/* ── Draggable progress bar ── */}
        <div
          ref={progressBarRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="flex-1 h-4 flex items-center relative z-20 group cursor-pointer"
        >
          <div className="w-full h-[3px] bg-border/40 group-hover:bg-border/60 transition-colors relative overflow-hidden rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-primary"
              style={{
                width: `${progressPercent}%`,
                boxShadow:
                  "0 0 10px oklch(0.82 0.16 220), 0 0 22px oklch(0.5 0.27 295 / 0.7)",
              }}
            />
          </div>
          {/* Glowing thumb knob */}
          <div
            className="absolute h-3 w-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              left: `clamp(0px, calc(${progressPercent}% - 6px), calc(100% - 12px))`,
              boxShadow:
                "0 0 8px oklch(0.82 0.16 220), 0 0 16px oklch(0.82 0.16 220)",
            }}
          />
        </div>

        <span className="w-8 shrink-0 text-right">
          {duration > 0 ? formatTime(duration) : track?.duration ?? "0:00"}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════
          ZONE 4 — Controls  (same layout as MonarchPlayer)
      ══════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center justify-center gap-4 px-3 pb-2 shrink-0">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className={`tap-press transition-all duration-200 cursor-pointer ${
            shuffle
              ? "text-primary drop-shadow-[0_0_8px_rgba(0,210,255,0.7)]"
              : "text-muted-foreground hover:text-primary"
          }`}
          aria-label="Shuffle"
        >
          <Shuffle className="h-3 w-3" />
        </button>

        {/* Skip Back */}
        <button
          onClick={onPrev}
          className="tap-press text-muted-foreground hover:text-primary cursor-pointer"
          aria-label="Previous"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        {/* HexButton Play/Pause — identical to MonarchPlayer */}
        <HexButton
          size={48}
          onClick={onToggle}
          glow={playing ? "purple" : "blue"}
          aria-label="Play/Pause"
        >
          {playing ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
          )}
        </HexButton>

        {/* Skip Forward */}
        <button
          onClick={onNext}
          className="tap-press text-muted-foreground hover:text-primary cursor-pointer"
          aria-label="Next"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        {/* Repeat */}
        <button
          onClick={onToggleRepeat}
          className={`tap-press transition-all duration-200 cursor-pointer relative ${
            repeatMode !== "none"
              ? repeatMode === "one"
                ? "text-purple-400 drop-shadow-[0_0_8px_rgba(138,43,226,0.75)]"
                : "text-primary drop-shadow-[0_0_8px_rgba(0,210,255,0.7)]"
              : "text-muted-foreground hover:text-primary"
          }`}
          aria-label="Repeat"
        >
          <Repeat className="h-3 w-3" />
          {repeatMode === "one" && (
            <span className="absolute -top-1.5 -right-1 text-[6px] font-black bg-purple-950/80 text-purple-300 border border-purple-500/40 rounded-full w-2 h-2 flex items-center justify-center font-mono">
              1
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
