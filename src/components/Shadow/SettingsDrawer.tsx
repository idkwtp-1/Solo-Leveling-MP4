import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders, Monitor, MousePointer, Volume2 } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cursorMode: string;
  setCursorMode: (mode: string) => void;
  bgIntensity: string;
  setBgIntensity: (intensity: string) => void;
  dspEnabled: boolean;
  setDspEnabled: (enabled: boolean) => void;
  bassGain: number;
  setBassGain: (gain: number) => void;
  midGain: number;
  setMidGain: (gain: number) => void;
  trebleGain: number;
  setTrebleGain: (gain: number) => void;
  reverbEnabled: boolean;
  setReverbEnabled: (enabled: boolean) => void;
  normalizationEnabled: boolean;
  setNormalizationEnabled: (enabled: boolean) => void;
};

const CURSOR_OPTIONS = [
  {
    id: "monarch",
    name: "🔮 Shadow Monarch",
    desc: "Dark purple flames + lightning arcs",
  },
  {
    id: "kamish",
    name: "⚔️ Kamish's Wrath",
    desc: "Red/gold blade shards + shatter blast",
  },
  {
    id: "gate",
    name: "🌀 System Gate",
    desc: "Swirling black portal + spatial fragments",
  },
  {
    id: "sovereign",
    name: "👑 Sovereignty",
    desc: "Golden crown + bowing subject dust",
  },
  {
    id: "beru",
    name: "💀 Shadow Army",
    desc: "Claw scratch + green matrix escorts",
  },
  {
    id: "default",
    name: "🖱️ Default System",
    desc: "Standard browser cursor (no visual effects)",
  },
];

const BG_OPTIONS = [
  { id: "off", name: "OFF" },
  { id: "subtle", name: "SUBTLE" },
  { id: "medium", name: "MEDIUM" },
  { id: "intense", name: "INTENSE" },
];

export function SettingsDrawer({
  isOpen,
  onClose,
  cursorMode,
  setCursorMode,
  bgIntensity,
  setBgIntensity,
  dspEnabled,
  setDspEnabled,
  bassGain,
  setBassGain,
  midGain,
  setMidGain,
  trebleGain,
  setTrebleGain,
  reverbEnabled,
  setReverbEnabled,
  normalizationEnabled,
  setNormalizationEnabled,
}: Props) {
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

          {/* Settings Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] z-[55] bg-surface/95 border-l border-primary/25 backdrop-blur-xl p-6 overflow-y-auto flex flex-col font-mono"
            style={{
              boxShadow:
                "-8px 0 32px rgba(0, 0, 0, 0.5), -2px 0 10px oklch(0.82 0.16 220 / 0.15)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-display text-sm tracking-[0.2em] text-glow-blue">
                  // SYSTEM SETTINGS
                </span>
              </div>
              <button
                onClick={onClose}
                className="tap-press p-1 border border-border hover:border-primary text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-8 pr-1">
              {/* Section 1: Cursors */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-display text-[11px] text-primary tracking-[0.2em] border-b border-border/10 pb-1.5">
                  <MousePointer className="h-3 w-3" />
                  CURSOR SYSTEM
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {CURSOR_OPTIONS.map((c) => {
                    const active = cursorMode === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCursorMode(c.id)}
                        className={`tap-press w-full text-left p-2.5 border transition-all duration-200 flex flex-col relative overflow-hidden group cursor-pointer ${
                          active
                            ? "bg-primary/5 border-primary"
                            : "bg-background/25 border-border/30 hover:border-primary/50"
                        }`}
                      >
                        {/* active diagonal corner glow */}
                        {active && (
                          <div className="absolute top-0 right-0 w-6 h-6 bg-primary opacity-20 rotate-45 translate-x-3 -translate-y-3" />
                        )}
                        <span
                          className={`text-[11px] font-bold ${active ? "text-primary" : "text-foreground"}`}
                        >
                          {c.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground mt-0.5 group-hover:text-foreground/80 transition-colors">
                          {c.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Animated Background */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-display text-[11px] text-primary tracking-[0.2em] border-b border-border/10 pb-1.5">
                  <Monitor className="h-3 w-3" />
                  ATMOSPHERIC ABYSS
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {BG_OPTIONS.map((b) => {
                    const active = bgIntensity === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setBgIntensity(b.id)}
                        className={`tap-press p-2 text-center border font-mono text-[9px] cursor-pointer transition-colors ${
                          active
                            ? "border-primary text-primary bg-primary/5 font-bold"
                            : "border-border/30 text-muted-foreground hover:border-primary/45 hover:text-foreground"
                        }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[9px] text-muted-foreground leading-normal italic">
                  Abyss mist and rune particles. Reactive mode pulses to the
                  music frequency.
                </div>
              </div>

              {/* Section 3: Audio DSP EQ */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                  <div className="flex items-center gap-2 font-display text-[11px] text-primary tracking-[0.2em]">
                    <Volume2 className="h-3 w-3" />
                    MONARCH DSP ENGINE
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dspEnabled}
                      onChange={(e) => setDspEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-border/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                <div
                  className={`space-y-4 transition-all duration-200 ${dspEnabled ? "opacity-100 pointer-events-auto" : "opacity-30 pointer-events-none"}`}
                >
                  {/* EQ Sliders */}
                  <div className="space-y-3.5">
                    {/* Bass */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-foreground font-bold">
                          BASS BOOST
                        </span>
                        <span
                          className={
                            bassGain > 0
                              ? "text-primary text-glow-blue"
                              : "text-muted-foreground"
                          }
                        >
                          {bassGain > 0 ? `+${bassGain}` : bassGain} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="15"
                        value={bassGain}
                        onChange={(e) => setBassGain(Number(e.target.value))}
                        className="w-full h-1 bg-border/40 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                      />
                    </div>

                    {/* Mids */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-foreground font-bold">
                          VOCAL MID
                        </span>
                        <span
                          className={
                            midGain > 0
                              ? "text-primary text-glow-blue"
                              : "text-muted-foreground"
                          }
                        >
                          {midGain > 0 ? `+${midGain}` : midGain} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={midGain}
                        onChange={(e) => setMidGain(Number(e.target.value))}
                        className="w-full h-1 bg-border/40 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                      />
                    </div>

                    {/* Treble */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-foreground font-bold">
                          TREBLE SHINE
                        </span>
                        <span
                          className={
                            trebleGain > 0
                              ? "text-primary text-glow-blue"
                              : "text-muted-foreground"
                          }
                        >
                          {trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={trebleGain}
                        onChange={(e) => setTrebleGain(Number(e.target.value))}
                        className="w-full h-1 bg-border/40 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Cinematic Reverb */}
                  <div className="flex items-center justify-between border-t border-border/10 pt-3">
                    <span className="text-[10px] text-foreground font-bold">
                      DUNGEON REVERB
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reverbEnabled}
                        onChange={(e) => setReverbEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-border/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>

                  {/* Loudness Leveling */}
                  <div className="flex items-center justify-between border-t border-border/10 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-foreground font-bold">
                        LOUDNESS LEVELING
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        Normalize dynamic range spikes
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={normalizationEnabled}
                        onChange={(e) => setNormalizationEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-border/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Status Indicators */}
            <div className="mt-8 pt-4 border-t border-border/20 text-[9px] text-muted-foreground flex flex-col gap-1">
              <div className="flex justify-between">
                <span>SYSTEM STATUS:</span>
                <span className="text-primary text-glow-blue animate-pulse">
                  OPTIMIZED
                </span>
              </div>
              <div className="flex justify-between">
                <span>DSP CORE:</span>
                <span
                  className={
                    dspEnabled
                      ? "text-primary text-glow-blue"
                      : "text-muted-foreground"
                  }
                >
                  {dspEnabled ? "ACTIVE" : "BYPASSED"}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
