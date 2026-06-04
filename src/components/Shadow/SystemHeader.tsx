import { Settings } from "lucide-react";

type Props = {
  onOpenSettings?: () => void;
};

export function SystemHeader({ onOpenSettings }: Props) {
  return (
    <header className="flex items-center justify-between gap-4 pb-6 border-b border-border select-none">
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
        </div>
      </div>
    </header>
  );
}
