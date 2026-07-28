import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Download, Loader2, Youtube, Check, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  downloads: Record<string, DownloadStatus>;
};

export interface SearchResult {
  id: string;
  title: string;
  channel: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string | null;
  url: string;
}

export interface DownloadStatus {
  videoId: string;
  title: string;
  status: "queued" | "downloading" | "analyzing" | "completed" | "failed";
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
}

export function YouTubeSearchDrawer({ isOpen, onClose, apiBase, downloads }: Props) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`${apiBase}/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      toast.error("SYSTEM ERROR: Failed to search YouTube");
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async (item: SearchResult) => {
    try {
      const res = await fetch(`${apiBase}/api/youtube/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: item.id, title: item.title }),
      });
      if (!res.ok) throw new Error("Download registration failed");
      const data = await res.json();
      
      // The global poller in index.tsx will pick up the new queued item within 2 seconds.
      // We don't need to mutate local state anymore.
      
      toast.info(`SYSTEM: Added "${item.title}" to download queue.`);
    } catch (err) {
      toast.error("SYSTEM ERROR: Failed to start download");
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Search Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] z-[55] bg-surface/95 border-l border-primary/25 backdrop-blur-xl p-6 overflow-y-auto flex flex-col font-mono"
            style={{
              boxShadow:
                "-8px 0 32px rgba(0, 0, 0, 0.5), -2px 0 10px oklch(0.82 0.16 220 / 0.15)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500 animate-pulse" />
                <span className="font-display text-sm tracking-[0.2em] text-glow-blue">
                  // YOUTUBE SEARCH & AUTO-SYNC
                </span>
              </div>
              <button
                onClick={onClose}
                className="tap-press p-1 border border-border hover:border-primary text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="SEARCH YOUTUBE CHANNELS / SONGS..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-background/50 border border-border/70 rounded-xs text-xs font-mono text-primary pl-8 pr-3 py-2 outline-none focus:border-primary/80 transition-colors placeholder:text-muted-foreground/50"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="tap-press px-4 py-2 border border-primary/60 text-primary hover:bg-primary/5 transition-all text-xs font-bold font-display tracking-wider cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                {searching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "SEARCH"
                )}
              </button>
            </form>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 select-none">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-[10px] tracking-widest uppercase animate-pulse">
                    Connecting to Grid...
                  </span>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-[10px] tracking-widest text-center uppercase leading-loose border border-dashed border-border/30 rounded-xs">
                  <span>ENTER SEARCH QUERY ABOVE</span>
                  <span className="opacity-50">RESULTS WILL APPEAR HOLOGRAPHICALLY</span>
                </div>
              ) : (
                results.map((item) => {
                  const dl = downloads[item.id];
                  
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-background/25 border border-border/30 hover:border-primary/30 transition-all rounded-xs relative group"
                    >
                      {/* Thumbnail */}
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-20 h-12 object-cover border border-border/30 rounded-xs flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-20 h-12 bg-surface/50 border border-border/30 rounded-xs flex items-center justify-center flex-shrink-0 font-mono text-[9px] text-muted-foreground">
                          NO IMAGE
                        </div>
                      )}

                      {/* Info & Download Button */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <h3
                            className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors cursor-pointer"
                            title={item.title}
                            onClick={() => window.open(item.url, "_blank")}
                          >
                            {item.title}
                          </h3>
                          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                            <span className="truncate max-w-[180px]">{item.channel}</span>
                            <span>{item.duration}</span>
                          </div>
                        </div>

                        {/* Status/Download control */}
                        <div className="mt-2 flex justify-end">
                          {dl ? (
                            <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase font-semibold">
                              {dl.status === "queued" && (
                                <span className="text-yellow-500/80 animate-pulse">QUEUED</span>
                              )}
                              {dl.status === "downloading" && (
                                <div className="flex items-center gap-1.5">
                                  <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
                                  <span className="text-primary">DOWNLOADING ({Math.round(dl.progress)}%)</span>
                                </div>
                              )}
                              {dl.status === "analyzing" && (
                                <div className="flex items-center gap-1.5">
                                  <RefreshCw className="h-2.5 w-2.5 animate-spin text-purple-400" />
                                  <span className="text-purple-400">ANALYZING DROP...</span>
                                </div>
                              )}
                              {dl.status === "completed" && (
                                <span className="text-emerald-500 flex items-center gap-1">
                                  <Check className="h-3 w-3" /> ADDED & SYNCED
                                </span>
                              )}
                              {dl.status === "failed" && (
                                <span className="text-red-500 flex items-center gap-1" title={dl.error}>
                                  <AlertCircle className="h-3 w-3" /> FAILED
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDownload(item)}
                              className="tap-press flex items-center gap-1.5 px-2.5 py-1 border border-primary/40 hover:border-primary text-glow-blue text-[9px] font-bold transition-all text-primary bg-primary/5 hover:bg-primary/10 rounded-xs cursor-pointer"
                            >
                              <Download className="h-3 w-3" />
                              DOWNLOAD
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer status */}
            <div className="mt-6 pt-4 border-t border-border/20 text-[9px] text-muted-foreground flex justify-between">
              <span>GIT SYNC MODE:</span>
              <span className="text-emerald-500 text-glow-blue uppercase font-bold">
                AUTO-COMMIT & PUSH ENABLED
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
