import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { type Gate, type Track } from "@/lib/shadow-data";
import { TrackList } from "./TrackList";
import { ListMusic } from "lucide-react";

type Props = {
  gate: Gate;
  activeId: string | null;
  onPlay: (t: Track) => void;
  isOffline?: boolean;
  cachedTrackIds?: Set<string>;
};

export function MobileQueueDrawer({
  gate,
  activeId,
  onPlay,
  isOffline = false,
  cachedTrackIds = new Set(),
}: Props) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          className="tap-press panel-clip-sm neon-border bg-surface/80 px-4 py-2 flex items-center gap-2 font-mono text-[11px] text-primary"
          style={{ boxShadow: "0 0 12px oklch(0.82 0.16 220 / 0.4)" }}
        >
          <ListMusic className="h-3.5 w-3.5" />
          OPEN QUEUE // {gate.name}
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-surface border-t border-primary/50">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display tracking-[0.25em] text-primary text-glow-blue">
            QUEUE // {gate.name}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
          <TrackList
            gate={gate}
            activeId={activeId}
            onPlay={onPlay}
            compact
            isOffline={isOffline}
            cachedTrackIds={cachedTrackIds}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
