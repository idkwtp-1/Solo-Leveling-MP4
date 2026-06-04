import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

type Props = {
  onOpenSettings?: () => void;
};

export function SystemHeader({ onOpenSettings }: Props) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");

  return (
    <header className="flex items-center justify-between gap-4 pb-6 border-b border-border">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex">
          <span className="absolute inset-0 rounded-full bg-primary blur-md opacity-80" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-primary animate-flicker" />
        </span>
        <h1 className="font-display text-lg sm:text-2xl font-bold text-glow-blue">
          SYSTEM ONLINE
          <span className="text-shadow text-glow-purple mx-2">//</span>
          <span className="text-foreground">SHADOW PLAYER</span>
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
          <span>
            SRL-E-{hh}
            {mm}-{ss}
          </span>
          <span className="text-primary">
            SYS {hh}:{mm}:{ss}
          </span>
        </div>
        
        {/* Custom Window Controls (Visible only in desktop mode when pywebview is available) */}
        <div className="flex items-center gap-2 border-l border-border/50 pl-4">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="group tap-press p-1.5 rounded-sm border border-border bg-background/50 hover:border-primary hover:text-primary transition-all duration-200 relative z-20 cursor-pointer mr-2"
              title="System Settings"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          )}

          <button
            onClick={() => {
              const pywebview = (window as any).pywebview;
              if (pywebview?.api?.minimize_app) pywebview.api.minimize_app();
            }}
            className="group tap-press w-8 h-8 flex items-center justify-center rounded-sm border border-border bg-background/50 hover:border-[#00d2ff] hover:text-[#00d2ff] transition-all duration-200 relative z-20 cursor-pointer"
            title="Minimize"
          >
            <div className="w-3 h-0.5 bg-current group-hover:shadow-[0_0_8px_#00d2ff]" />
          </button>
          <button
            onClick={() => {
              const pywebview = (window as any).pywebview;
              if (pywebview?.api?.close_app) pywebview.api.close_app();
            }}
            className="group tap-press w-8 h-8 flex items-center justify-center rounded-sm border border-border bg-background/50 hover:border-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-all duration-200 relative z-20 cursor-pointer"
            title="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:shadow-[0_0_8px_#ef4444]">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
