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
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="group tap-press p-1.5 rounded-sm border border-border bg-background/50 hover:border-primary hover:text-primary transition-all duration-200 relative z-20 cursor-pointer"
            title="System Settings"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}
      </div>
    </header>
  );
}
