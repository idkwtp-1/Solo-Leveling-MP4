import { useState, useRef, useMemo } from "react";
import { ARTIST, type Track } from "@/lib/shadow-data";
import { formatTime } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Music2,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  tracks: Track[];
  activeTrack: Track | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  onPlay: (track: Track) => void;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: "none" | "all" | "one";
  onToggleRepeat: () => void;
};

export function OfflinePlayer({
  tracks,
  activeTrack,
  playing,
  currentTime,
  duration,
  onPlay,
  onToggle,
  onNext,
  onPrev,
  onSeek,
  shuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tracks, searchQuery]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTimelineScrub = (clientX: number) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(clickPercent * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTrack) return;
    e.stopPropagation();
    isDragging.current = true;
    handleTimelineScrub(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging.current) handleTimelineScrub(moveEvent.clientX);
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
    if (!activeTrack || e.touches.length === 0) return;
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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4 text-primary" />
            <span className="font-display text-xs tracking-[0.25em] text-primary uppercase">
              Shadow Player
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <WifiOff className="h-3 w-3" />
            <span className="font-mono text-[9px] tracking-wider uppercase">
              Offline
            </span>
          </div>
        </div>
      </header>

      {/* ── Search ── */}
      <div className="px-4 pt-3 pb-2 max-w-2xl mx-auto w-full">
        <input
          type="text"
          placeholder="Search tracks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface/60 border border-border/50 rounded-md px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/60 transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {filteredTracks.length} TRACKS
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleShuffle}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 border rounded-sm font-mono text-[9px] tracking-wider transition-all",
                shuffle
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border/50 text-muted-foreground",
              )}
            >
              <Shuffle className="h-2.5 w-2.5" />
              SHUFFLE
            </button>
            <button
              onClick={onToggleRepeat}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 border rounded-sm font-mono text-[9px] tracking-wider transition-all",
                repeatMode !== "none"
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border/50 text-muted-foreground",
              )}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="h-2.5 w-2.5" />
              ) : (
                <Repeat className="h-2.5 w-2.5" />
              )}
              {repeatMode === "none"
                ? "REPEAT"
                : repeatMode === "all"
                  ? "ALL"
                  : "ONE"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Track List ── */}
      <div
        className="flex-1 overflow-y-auto px-4 max-w-2xl mx-auto w-full"
        style={{ paddingBottom: activeTrack ? "7rem" : "1rem" }}
      >
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Music2 className="h-8 w-8 mb-3 opacity-40" />
            <span className="font-mono text-xs">No tracks found</span>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filteredTracks.map((track, i) => {
              const isActive = activeTrack?.id === track.id;
              return (
                <li key={track.id}>
                  <button
                    onClick={() => onPlay(track)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all",
                      isActive
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-surface/60 border border-transparent",
                    )}
                  >
                    {/* Track number */}
                    <span
                      className={cn(
                        "font-mono text-[10px] w-6 text-center shrink-0",
                        isActive
                          ? "text-primary font-bold"
                          : "text-muted-foreground",
                      )}
                    >
                      {isActive && playing ? (
                        <span className="inline-flex gap-[2px] items-end h-3">
                          <span className="w-[2px] bg-primary animate-pulse h-2" />
                          <span
                            className="w-[2px] bg-primary animate-pulse h-3"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-[2px] bg-primary animate-pulse h-1.5"
                            style={{ animationDelay: "300ms" }}
                          />
                        </span>
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>

                    {/* Title + Artist */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-xs font-medium truncate",
                          isActive ? "text-primary" : "text-foreground",
                        )}
                      >
                        {track.title}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">
                        {ARTIST}
                      </div>
                    </div>

                    {/* Duration */}
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {track.duration}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Now Playing Bar (fixed bottom) ── */}
      {activeTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/50">
          {/* Progress bar (thin, top of the bar) */}
          <div
            ref={progressBarRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="w-full h-5 flex items-start cursor-pointer relative -mt-1"
          >
            <div className="w-full h-1 bg-border/30 relative">
              <div
                className="absolute inset-y-0 left-0 bg-primary"
                style={{
                  width: `${progressPercent}%`,
                  boxShadow: "0 0 6px oklch(0.82 0.16 220)",
                }}
              />
            </div>
          </div>

          <div className="px-4 pb-4 pt-0 max-w-2xl mx-auto">
            {/* Time stamps */}
            <div className="flex justify-between font-mono text-[9px] text-muted-foreground mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>
                {duration > 0
                  ? formatTime(duration)
                  : (activeTrack.duration ?? "--:--")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Track info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-primary truncate">
                  {activeTrack.title}
                </div>
                <div className="font-mono text-[9px] text-muted-foreground">
                  {ARTIST}
                </div>
              </div>

              {/* Transport controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onPrev}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  aria-label="Previous"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={onToggle}
                  className="bg-primary/15 border border-primary/40 text-primary rounded-full p-2.5 hover:bg-primary/25 transition-colors"
                  aria-label="Play/Pause"
                >
                  {playing ? (
                    <Pause className="h-4 w-4" fill="currentColor" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={() => onNext()}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  aria-label="Next"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
