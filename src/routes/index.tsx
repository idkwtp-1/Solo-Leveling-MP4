import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  GATES,
  NEW_UNASSIGNED_TRACKS,
  type Gate,
  type Track,
} from "@/lib/shadow-data";
import { SystemHeader } from "@/components/Shadow/SystemHeader";
import { GatesGrid } from "@/components/Shadow/GatesGrid";
import { TrackList } from "@/components/Shadow/TrackList";
import { StatusWindow } from "@/components/Shadow/StatusWindow";
import { MonarchPlayer } from "@/components/Shadow/MonarchPlayer";
import { MiniPlayerView } from "@/components/Shadow/MiniPlayerView";
import { SidebarQueue } from "@/components/Shadow/SidebarQueue";
import { MobileQueueDrawer } from "@/components/Shadow/MobileQueueDrawer";
import { ShadowCursor } from "@/components/Shadow/ShadowCursor";
import { useIsMobile } from "@/hooks/use-mobile";
import bgImage from "@/assets/shadow-bg.jpg";
import { AnimatedBackground } from "@/components/Shadow/AnimatedBackground";
import { SettingsDrawer } from "@/components/Shadow/SettingsDrawer";
import { toast } from "sonner";
import { ExitConfirmDialog } from "@/components/Shadow/ExitConfirmDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shadow Player // System Online" },
      {
        name: "description",
        content:
          "Shadow Player — a holographic system interface music player inspired by the Shadow Monarch. Open the gates, awaken the queue.",
      },
      { property: "og:title", content: "Shadow Player // System Online" },
      {
        property: "og:description",
        content: "Holographic system interface music player. Arise.",
      },
    ],
  }),
  component: ShadowPlayerPage,
});

const getApiBase = () => {
  if (typeof window === "undefined") return "http://localhost:3001";
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

const API_BASE = getApiBase();

const DEFAULT_ASSIGNMENTS: Record<string, string> = {
  "tiki-tiki-slowed": "boss",
  "veki-veki-slowed": "boss",
  "worry-slowed": "boss",
  "babydoll-perfect-girl": "boss",
  "one-of-the-girls-mashup": "boss",
};

const fetchGates = async (): Promise<Gate[]> => {
  if (import.meta.env.PROD) {
    return GATES;
  }
  const res = await fetch(`${API_BASE}/api/gates`);
  if (!res.ok) throw new Error("Backend connection failed");
  return res.json();
};

const fetchDrops = async (): Promise<Record<string, number[]>> => {
  try {
    const url = import.meta.env.PROD
      ? `${import.meta.env.BASE_URL}media/beat_drops.json`
      : `${API_BASE}/api/drops`;
    const res = await fetch(url);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
};

const fetchTracks = async (): Promise<Track[]> => {
  try {
    const url = import.meta.env.PROD
      ? `${import.meta.env.BASE_URL}media/tracks_inventory.json`
      : `${API_BASE}/api/tracks`;
    const res = await fetch(url);
    if (!res.ok) return NEW_UNASSIGNED_TRACKS;
    
    // Format JSON array or object mapping
    const data = await res.json();
    if (Array.isArray(data)) return data;
    
    // Statically mapped format from file
    return Object.entries(data).map(([id, t]: [string, any]) => ({
      id,
      index: "??",
      title: t.title,
      duration: "??",
      filename: t.filename
    }));
  } catch {
    return NEW_UNASSIGNED_TRACKS;
  }
};

function ShadowPlayerPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowExitDialog((prev) => {
          if (!prev) {
            e.preventDefault();
            return true;
          }
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isMobile = useIsMobile();
  const [isOffline, setIsOffline] = useState(false);
  const [cachedTrackIds, setCachedTrackIds] = useState<Set<string>>(new Set());

  // TanStack Query to fetch gates, fallback to static mock data
  const { data: gatesData } = useQuery<Gate[]>({
    queryKey: ["gates"],
    queryFn: fetchGates,
    retry: false,
    initialData: GATES,
  });

  const { data: trackInventory = NEW_UNASSIGNED_TRACKS } = useQuery<Track[]>({
    queryKey: ["tracks"],
    queryFn: fetchTracks,
    retry: false,
    initialData: NEW_UNASSIGNED_TRACKS,
  });

  const { data: beatDropsData } = useQuery<Record<string, number[]>>({
    queryKey: ["beat-drops"],
    queryFn: fetchDrops,
    retry: false,
    initialData: {},
  });

  const { data: assignmentsData, refetch: refetchAssignments } = useQuery<Record<string, string>>({
    queryKey: ["assignments"],
    queryFn: async () => {
      const url = import.meta.env.PROD
        ? `${import.meta.env.BASE_URL}media/assignments.json`
        : `${API_BASE}/api/assignments`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
    initialData: {},
  });

  // Load track assignments from localStorage on mount
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("slplayer-track-assignments");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, string>;
        }
      }
      localStorage.setItem(
        "slplayer-track-assignments",
        JSON.stringify(DEFAULT_ASSIGNMENTS),
      );
      return DEFAULT_ASSIGNMENTS;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (assignmentsData && Object.keys(assignmentsData).length > 0) {
      setAssignments(assignmentsData);
    }
  }, [assignmentsData]);

  const handleAssignTrack = async (trackId: string, gateId: string) => {
    setAssignments((prev) => {
      const next = { ...prev, [trackId]: gateId };
      localStorage.setItem("slplayer-track-assignments", JSON.stringify(next));
      return next;
    });
    if (import.meta.env.PROD) return;
    try {
      await fetch(`${API_BASE}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, gateId }),
      });
      refetchAssignments();
    } catch (e) {
      console.warn("Failed to sync track assignment to server:", e);
    }
  };

  const handleUnassignTrack = async (trackId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[trackId];
      localStorage.setItem("slplayer-track-assignments", JSON.stringify(next));
      return next;
    });
    if (import.meta.env.PROD) return;
    try {
      await fetch(`${API_BASE}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, gateId: null }),
      });
      refetchAssignments();
    } catch (e) {
      console.warn("Failed to sync track unassignment to server:", e);
    }
  };

  const baseGates = gatesData || GATES;

  const gates = useMemo(() => {
    return baseGates.map((gate) => {
      const assigned = trackInventory.filter(
        (t) => assignments[t.id] === gate.id,
      );
      if (assigned.length === 0) return gate;
      const reindexed = [...gate.tracks, ...assigned].map((track, i) => ({
        ...track,
        index: String(i + 1).padStart(2, "0"),
      }));
      return { ...gate, tracks: reindexed };
    });
  }, [baseGates, assignments, trackInventory]);

  const unassignedTracks = useMemo(() => {
    return trackInventory.filter((t) => !assignments[t.id]);
  }, [assignments, trackInventory]);

  const allGateTracks = useMemo(() => {
    const seen = new Set<string>();
    const uniqueTracks: Track[] = [];
    gates.forEach((gate) => {
      gate.tracks.forEach((track) => {
        if (!seen.has(track.id)) {
          seen.add(track.id);
          uniqueTracks.push(track);
        }
      });
    });
    return uniqueTracks;
  }, [gates]);

  const [activeGateId, setActiveGateId] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const reverbRef = useRef<GainNode | null>(null);
  const normalizationGainRef = useRef<GainNode | null>(null);

  // Hidden references for Picture-in-Picture Mini-Player
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const [pipActive, setPipActive] = useState(false);

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cursorMode, setCursorMode] = useState("monarch");
  const [bgIntensity, setBgIntensity] = useState("subtle");
  const [dspEnabled, setDspEnabled] = useState(false);
  const [normalizationEnabled, setNormalizationEnabled] = useState(true);
  const [bassGain, setBassGain] = useState(0);
  const [midGain, setMidGain] = useState(0);
  const [trebleGain, setTrebleGain] = useState(0);
  const [reverbEnabled, setReverbEnabled] = useState(false);

  const [shuffle, setShuffle] = useState(false);
  const [globalShuffleActive, setGlobalShuffleActive] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");

  const isLoadedRef = useRef(false);

  const initAudioContext = () => {
    if (audioContextRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    (window as any).audioAnalyser = analyser;

    const bass = ctx.createBiquadFilter();
    bass.type = "peaking";
    bass.frequency.value = 100;
    bass.Q.value = 1.0;
    bass.gain.value = dspEnabled ? bassGain : 0;
    bassFilterRef.current = bass;

    const mid = ctx.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 1.0;
    mid.gain.value = dspEnabled ? midGain : 0;
    midFilterRef.current = mid;

    const treble = ctx.createBiquadFilter();
    treble.type = "peaking";
    treble.frequency.value = 5000;
    treble.Q.value = 1.0;
    treble.gain.value = dspEnabled ? trebleGain : 0;
    trebleFilterRef.current = treble;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);
    compressorRef.current = compressor;

    // Simple Feedback Delay for Dungeon Reverb
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.18;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;

    delay.connect(feedback);
    feedback.connect(delay);

    try {
      const source = ctx.createMediaElementSource(audio);
      sourceRef.current = source;

      const normGain = ctx.createGain();
      normGain.gain.value = 1.0;
      normalizationGainRef.current = normGain;

      source.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(compressor);
      compressor.connect(normGain);
      normGain.connect(analyser);

      // Create Dry/Wet mix for reverb
      const wetGain = ctx.createGain();
      wetGain.gain.value = dspEnabled && reverbEnabled ? 0.35 : 0.0;
      reverbRef.current = wetGain;

      analyser.connect(ctx.destination);
      analyser.connect(delay);
      delay.connect(wetGain);
      wetGain.connect(ctx.destination);
    } catch (err) {
      console.error("Failed to connect Web Audio API:", err);
    }
  };

  // Synchronize settings changes with active Web Audio nodes
  useEffect(() => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.setValueAtTime(
        dspEnabled ? bassGain : 0,
        audioContextRef.current?.currentTime || 0,
      );
    }
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-dsp-bass", String(bassGain));
    }
  }, [bassGain, dspEnabled]);

  useEffect(() => {
    if (midFilterRef.current) {
      midFilterRef.current.gain.setValueAtTime(
        dspEnabled ? midGain : 0,
        audioContextRef.current?.currentTime || 0,
      );
    }
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-dsp-mid", String(midGain));
    }
  }, [midGain, dspEnabled]);

  useEffect(() => {
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.setValueAtTime(
        dspEnabled ? trebleGain : 0,
        audioContextRef.current?.currentTime || 0,
      );
    }
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-dsp-treble", String(trebleGain));
    }
  }, [trebleGain, dspEnabled]);

  useEffect(() => {
    if (reverbRef.current) {
      const wetGain = dspEnabled && reverbEnabled ? 0.35 : 0.0;
      reverbRef.current.gain.setValueAtTime(
        wetGain,
        audioContextRef.current?.currentTime || 0,
      );
    }
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-dsp-reverb", String(reverbEnabled));
      localStorage.setItem("slplayer-dsp-enabled", String(dspEnabled));
    }
  }, [reverbEnabled, dspEnabled]);

  useEffect(() => {
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-dsp-normalization", String(normalizationEnabled));
    }
    if (!normalizationEnabled && normalizationGainRef.current) {
      normalizationGainRef.current.gain.setTargetAtTime(1.0, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [normalizationEnabled]);

  useEffect(() => {
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-cursor-mode", cursorMode);
    }
  }, [cursorMode]);

  useEffect(() => {
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-bg-intensity", bgIntensity);
    }
  }, [bgIntensity]);

  useEffect(() => {
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-shuffle", String(shuffle));
    }
  }, [shuffle]);

  useEffect(() => {
    if (isLoadedRef.current) {
      localStorage.setItem("slplayer-repeat-mode", repeatMode);
    }
  }, [repeatMode]);

  // Hydration sync: load from localStorage ONLY on client mount to prevent SSR mismatch
  useEffect(() => {
    try {
      const storedCursor = localStorage.getItem("slplayer-cursor-mode");
      if (storedCursor) setCursorMode(storedCursor);

      const storedBg = localStorage.getItem("slplayer-bg-intensity");
      if (storedBg) setBgIntensity(storedBg);

      const storedDsp = localStorage.getItem("slplayer-dsp-enabled");
      if (storedDsp) setDspEnabled(storedDsp === "true");

      const storedNorm = localStorage.getItem("slplayer-dsp-normalization");
      if (storedNorm) setNormalizationEnabled(storedNorm !== "false");

      const storedBass = localStorage.getItem("slplayer-dsp-bass");
      if (storedBass) setBassGain(Number(storedBass));

      const storedMid = localStorage.getItem("slplayer-dsp-mid");
      if (storedMid) setMidGain(Number(storedMid));

      const storedTreble = localStorage.getItem("slplayer-dsp-treble");
      if (storedTreble) setTrebleGain(Number(storedTreble));

      const storedReverb = localStorage.getItem("slplayer-dsp-reverb");
      if (storedReverb) setReverbEnabled(storedReverb === "true");

      const storedShuffle = localStorage.getItem("slplayer-shuffle");
      if (storedShuffle) setShuffle(storedShuffle === "true");

      const storedRepeat = localStorage.getItem("slplayer-repeat-mode");
      if (storedRepeat) setRepeatMode((storedRepeat as any) || "none");
    } catch (e) {
      console.warn("Failed to load settings from localStorage:", e);
    } finally {
      isLoadedRef.current = true;
    }
  }, []);

  const activeGate = useMemo(
    () => gates.find((g) => g.id === activeGateId) ?? gates[0] ?? GATES[0],
    [activeGateId, gates],
  );

  // SW registration and connection listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[SLPlayer] ServiceWorker failed:", err));
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update cached tracks list scanned from Service Worker
  const updateCachedTracks = async () => {
    if (typeof window === "undefined" || !("caches" in window)) return;
    try {
      const cache = await caches.open("slplayer-audio-v3");
      const requests = await cache.keys();
      const ids = requests.map((req) => {
        const url = new URL(req.url);
        const parts = url.pathname.split("/");
        return decodeURIComponent(parts[parts.length - 1]);
      });
      setCachedTrackIds(new Set(ids));
    } catch (e) {
      console.warn("Failed to retrieve cached track list:", e);
    }
  };

  useEffect(() => {
    updateCachedTracks();
    const interval = setInterval(updateCachedTracks, 4000);
    return () => clearInterval(interval);
  }, [activeTrack, isOffline]);

  // Handle activeGate selection adjustment if current gate is offline-disabled
  useEffect(() => {
    if (isOffline && cachedTrackIds.size > 0 && activeGateId) {
      const activeGateHasCached = activeGate.tracks.some((t) =>
        cachedTrackIds.has(t.id),
      );
      if (!activeGateHasCached) {
        // Find first gate that has cached tracks
        const fallbackGate = gates.find((g) =>
          g.tracks.some((t) => cachedTrackIds.has(t.id)),
        );
        if (fallbackGate) {
          setActiveGateId(fallbackGate.id);
        }
      }
    }
  }, [isOffline, cachedTrackIds, activeGate, gates]);

  // Automatic Gain Control (Loudness Leveling) Tick Loop
  useEffect(() => {
    if (!playing || !normalizationEnabled) return;

    let rafId: number;
    let avgRMS = 0.16; // starting target
    const timeDomainData = new Uint8Array(256); // match analyser.fftSize

    const tick = () => {
      const analyser = analyserRef.current;
      const normGain = normalizationGainRef.current;
      const ctx = audioContextRef.current;

      if (analyser && normGain && ctx) {
        analyser.getByteTimeDomainData(timeDomainData);
        
        // Calculate Root Mean Square (RMS)
        let sumSquares = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const val = (timeDomainData[i] - 128) / 128;
          sumSquares += val * val;
        }
        const instantRMS = Math.sqrt(sumSquares / timeDomainData.length);

        // Exponential Moving Average filter
        if (instantRMS > 0.012) {
          avgRMS = avgRMS * 0.994 + instantRMS * 0.006;
          
          const targetRMS = 0.16;
          let targetGain = targetRMS / avgRMS;
          
          // Safe dynamic range cap
          targetGain = Math.max(0.45, Math.min(1.85, targetGain));
          
          // Smooth volume adjustments
          normGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.45);
        } else {
          // Silent / Voice pause drift back
          normGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.45);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, normalizationEnabled]);

  // Register PiP video event syncs
  useEffect(() => {
    const video = pipVideoRef.current;
    if (!video) return;

    const handleEnter = () => setPipActive(true);
    const handleLeave = () => setPipActive(false);

    video.addEventListener("enterpictureinpicture", handleEnter);
    video.addEventListener("leavepictureinpicture", handleLeave);

    return () => {
      video.removeEventListener("enterpictureinpicture", handleEnter);
      video.removeEventListener("leavepictureinpicture", handleLeave);
    };
  }, []);

  // Keep PiP video running so canvas renders continuously
  useEffect(() => {
    const video = pipVideoRef.current;
    if (!video || !pipActive) return;
    video.play().catch((err) => console.warn("PiP video play interrupted:", err));
  }, [playing, pipActive]);

  const togglePip = async () => {
    const nextState = !pipActive;

    // Check if pywebview is available (running inside desktop app)
    const pywebview = (window as any).pywebview;
    if (pywebview && pywebview.api && pywebview.api.toggle_mini_mode) {
      setPipActive(nextState);
      try {
        await pywebview.api.toggle_mini_mode(nextState);
      } catch (err) {
        console.error("Failed to toggle pywebview mini mode:", err);
      }
      return;
    }

    // Fallback to browser picture-in-picture
    const video = pipVideoRef.current;
    const canvas = pipCanvasRef.current;
    if (!video || !canvas) {
      setPipActive(nextState);
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        if (document.pictureInPictureElement === video) {
          await document.exitPictureInPicture();
        }
      } else {
        if (!video.srcObject) {
          const stream = canvas.captureStream(30);
          video.srcObject = stream;
        }
        await video.play();
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error("Failed to toggle Picture-in-Picture:", err);
      setPipActive(nextState);
      toast.error("SYSTEM ALERT: Native PiP failed, switching to local mini mode");
    }
  };

  // Render to hidden canvas for PiP Mini-Player
  useEffect(() => {
    if (!pipActive) return;

    let rafId: number;
    const canvas = pipCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frequencyData = new Uint8Array(128);
    let marqueeOffset = 0;

    const render = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
      } else {
        frequencyData.fill(0);
      }

      // BG obsidian tone
      ctx.fillStyle = "#090c10";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Active Gate visual context
      const currentGate = gates.find((g) => g.tracks.some((t) => t.id === activeTrack?.id)) || activeGate;
      let themeColor = "#8a2be2"; // Default Purple (S-Rank)
      let borderGlow = "rgba(138, 43, 226, 0.4)";
      if (currentGate?.rank === "S-RANK" && currentGate.id === "boss") {
        themeColor = "#ef4444"; // Red for Boss S-Rank
        borderGlow = "rgba(239, 68, 68, 0.4)";
      } else if (currentGate?.rank === "A-RANK" || currentGate?.id === "hype") {
        themeColor = "#00d2ff"; // Cyan for Shadow Hype
        borderGlow = "rgba(0, 210, 255, 0.4)";
      } else if (currentGate?.rank === "B-RANK") {
        themeColor = "#a855f7"; // Purple
        borderGlow = "rgba(168, 85, 247, 0.4)";
      } else if (currentGate?.rank === "C-RANK") {
        themeColor = "#6b7280"; // Gray
        borderGlow = "rgba(107, 114, 128, 0.4)";
      }

      // Radial gradient bg glow
      const radial = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        10,
        canvas.width / 2,
        canvas.height / 2,
        120
      );
      radial.addColorStop(0, borderGlow.replace("0.4", "0.2"));
      radial.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Neon border
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Gate Info
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 9px 'Orbitron', sans-serif";
      ctx.textAlign = "center";
      const gateTag = currentGate ? `[${currentGate.rank}] ${currentGate.name}` : "SYSTEM OFFLINE";
      ctx.fillText(gateTag, canvas.width / 2, 28);

      // Title Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Orbitron', sans-serif";
      const titleText = activeTrack ? activeTrack.title : "NO CONNECTION";
      const textWidth = ctx.measureText(titleText).width;

      ctx.save();
      ctx.beginPath();
      ctx.rect(15, 38, canvas.width - 30, 24);
      ctx.clip();

      if (textWidth > canvas.width - 45) {
        marqueeOffset -= 0.7;
        if (marqueeOffset < -textWidth - 30) {
          marqueeOffset = canvas.width - 45;
        }
        ctx.textAlign = "left";
        ctx.fillText(titleText, 20 + marqueeOffset, 53);
      } else {
        ctx.textAlign = "center";
        ctx.fillText(titleText, canvas.width / 2, 53);
      }
      ctx.restore();

      // Center status dot/pause lines
      ctx.fillStyle = themeColor;
      const playIconX = canvas.width / 2;
      const playIconY = 78;

      if (playing) {
        ctx.beginPath();
        ctx.arc(playIconX, playIconY, 3 + Math.sin(Date.now() / 120) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(playIconX - 4, playIconY - 4, 2, 8);
        ctx.fillRect(playIconX + 2, playIconY - 4, 2, 8);
      }

      // Visualizer bars (8 bars)
      const barCount = 8;
      const barSpacing = 4;
      const totalWidth = barCount * 12 + (barCount - 1) * barSpacing;
      const startX = (canvas.width - totalWidth) / 2;
      const baselineY = canvas.height - 28;

      for (let i = 0; i < barCount; i++) {
        const freqIndex = Math.floor(i * (frequencyData.length / barCount) * 0.65);
        const freqVal = frequencyData[freqIndex] || 0;
        const barHeight = Math.max(3, (freqVal / 255) * 45);

        const barGrad = ctx.createLinearGradient(0, baselineY, 0, baselineY - barHeight);
        barGrad.addColorStop(0, themeColor);
        barGrad.addColorStop(1, "#ffffff");

        ctx.fillStyle = barGrad;
        const rx = startX + i * (12 + barSpacing);
        const ry = baselineY - barHeight;
        ctx.beginPath();
        ctx.roundRect(rx, ry, 12, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      // Progress line & times
      const progressPercent = duration > 0 ? currentTime / duration : 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(0, canvas.height - 6, canvas.width, 6);

      ctx.fillStyle = themeColor;
      ctx.fillRect(0, canvas.height - 6, canvas.width * progressPercent, 6);

      const formatTimeStr = (secs: number) => {
        if (isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
      };
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "9px 'Roboto Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(formatTimeStr(currentTime), 10, canvas.height - 14);

      ctx.textAlign = "right";
      ctx.fillText(formatTimeStr(duration), canvas.width - 10, canvas.height - 14);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [pipActive, activeTrack, playing, currentTime, duration, gates, activeGate]);

  const handleSelectGate = (g: Gate) => {
    setActiveGateId((prev) => (prev === g.id ? null : g.id));
  };

  const handlePlay = (t: Track) => {
    setGlobalShuffleActive(false);
    setActiveTrack(t);
    setPlaying(true);
    setIsPlayerOpen(true);
  };

  const handleGlobalShuffle = () => {
    const playable = allGateTracks.filter(
      (t) => !isOffline || cachedTrackIds.has(t.id),
    );
    if (playable.length === 0) {
      toast.error("SYSTEM ERROR: No tracks cached for offline use");
      return;
    }
    const randomTrack = playable[Math.floor(Math.random() * playable.length)];
    setGlobalShuffleActive(true);
    setActiveTrack(randomTrack);
    setPlaying(true);
    setIsPlayerOpen(true);
    toast.success("SYSTEM SHUFFLE: All gates randomized");
  };

  const handleToggle = () => {
    if (!activeTrack) {
      const firstAvailable =
        activeGate.tracks.find((t) => !isOffline || cachedTrackIds.has(t.id)) ||
        activeGate.tracks[0];
      if (firstAvailable) {
        handlePlay(firstAvailable);
      }
      return;
    }
    setPlaying((p) => !p);
  };

  const handleNext = (isAutoEnd = false) => {
    if (!activeTrack) return;
    const audio = audioRef.current;

    // Loop single track if repeatMode is "one" and it ended naturally
    if (isAutoEnd === true && repeatMode === "one") {
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((err) => console.warn(err));
      }
      return;
    }

    let nextTrack: Track | null = null;

    if (globalShuffleActive) {
      const playable = allGateTracks.filter(
        (t) => !isOffline || cachedTrackIds.has(t.id),
      );
      if (playable.length > 0) {
        if (playable.length === 1) {
          nextTrack = playable[0];
        } else {
          const filtered = playable.filter((t) => t.id !== activeTrack.id);
          const candidates = filtered.length > 0 ? filtered : playable;
          nextTrack = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }
    } else {
      const currentGate =
        gates.find((g) => g.tracks.some((t) => t.id === activeTrack.id)) ||
        activeGate;
      const availableTracks = currentGate.tracks;
      const len = availableTracks.length;
      if (len === 0) return;

      if (shuffle) {
        const playable = availableTracks.filter(
          (t) => !isOffline || cachedTrackIds.has(t.id),
        );
        if (playable.length > 0) {
          if (playable.length === 1) {
            nextTrack = playable[0];
          } else {
            const filtered = playable.filter((t) => t.id !== activeTrack.id);
            const candidates = filtered.length > 0 ? filtered : playable;
            nextTrack = candidates[Math.floor(Math.random() * candidates.length)];
          }
        }
      } else {
        const currentIndex = availableTracks.findIndex(
          (t) => t.id === activeTrack.id,
        );
        if (currentIndex !== -1) {
          let nextIndex = (currentIndex + 1) % len;
          let attempts = 0;
          while (
            isOffline &&
            !cachedTrackIds.has(availableTracks[nextIndex].id) &&
            attempts < len
          ) {
            nextIndex = (nextIndex + 1) % len;
            attempts++;
          }

          // If auto-ended at the end of playlist and repeat is none, stop playing
          if (isAutoEnd === true && nextIndex === 0 && repeatMode === "none") {
            setPlaying(false);
            if (audio) audio.pause();
            return;
          }

          if (attempts < len) {
            nextTrack = availableTracks[nextIndex];
          }
        }
      }
    }

    if (nextTrack) {
      setActiveTrack(nextTrack);
      setPlaying(true);
    }
  };

  const handlePrev = () => {
    if (!activeTrack) return;
    let prevTrack: Track | null = null;

    if (globalShuffleActive) {
      const playable = allGateTracks.filter(
        (t) => !isOffline || cachedTrackIds.has(t.id),
      );
      if (playable.length > 0) {
        if (playable.length === 1) {
          prevTrack = playable[0];
        } else {
          const filtered = playable.filter((t) => t.id !== activeTrack.id);
          const candidates = filtered.length > 0 ? filtered : playable;
          prevTrack = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }
    } else {
      const currentGate =
        gates.find((g) => g.tracks.some((t) => t.id === activeTrack.id)) ||
        activeGate;
      const availableTracks = currentGate.tracks;
      const len = availableTracks.length;
      if (len === 0) return;

      if (shuffle) {
        const playable = availableTracks.filter(
          (t) => !isOffline || cachedTrackIds.has(t.id),
        );
        if (playable.length > 0) {
          if (playable.length === 1) {
            prevTrack = playable[0];
          } else {
            const filtered = playable.filter((t) => t.id !== activeTrack.id);
            const candidates = filtered.length > 0 ? filtered : playable;
            prevTrack = candidates[Math.floor(Math.random() * candidates.length)];
          }
        }
      } else {
        const currentIndex = availableTracks.findIndex(
          (t) => t.id === activeTrack.id,
        );
        if (currentIndex !== -1) {
          let prevIndex = (currentIndex - 1 + len) % len;
          let attempts = 0;
          while (
            isOffline &&
            !cachedTrackIds.has(availableTracks[prevIndex].id) &&
            attempts < len
          ) {
            prevIndex = (prevIndex - 1 + len) % len;
            attempts++;
          }

          if (attempts < len) {
            prevTrack = availableTracks[prevIndex];
          }
        }
      }
    }

    if (prevTrack) {
      setActiveTrack(prevTrack);
      setPlaying(true);
    }
  };

  const handleClose = () => {
    setIsPlayerOpen(false);
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (audio && isFinite(time) && time >= 0) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Sync actual HTML5 audio object with playing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing && activeTrack) {
      initAudioContext();
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        audioContextRef.current.resume();
      }
      audio.play().catch((err) => {
        console.warn(
          "Audio play interrupted or resource not available offline:",
          err,
        );
        setPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [playing, activeTrack]);

  // Keyboard shortcuts (Space/ESC)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeTrack) handleClose();
      if (e.code === "Space" && activeTrack) {
        const activeEl = document.activeElement;
        const isInput =
          activeEl &&
          (activeEl.tagName === "INPUT" ||
            activeEl.tagName === "SELECT" ||
            activeEl.tagName === "TEXTAREA" ||
            activeEl.getAttribute("contenteditable") === "true");
        if (isInput) return;

        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTrack]);

  // Keep a reference to latest control handlers to avoid stale closures in MediaSession events
  const handlersRef = useRef({
    handlePlay,
    handleToggle,
    handleNext,
    handlePrev,
  });
  useEffect(() => {
    handlersRef.current = { handlePlay, handleToggle, handleNext, handlePrev };
  });

  // Media Session API - Sync track metadata
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (activeTrack) {
      const currentGate =
        gates.find((g) => g.tracks.some((t) => t.id === activeTrack.id)) ||
        activeGate;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeTrack.title,
        artist: "SLPlayer Project",
        album: currentGate.name,
        artwork: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [activeTrack, gates, activeGate]);

  // Media Session API - Sync playback state
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  // Media Session API - Sync position state (timers/scrub progress)
  useEffect(() => {
    const audio = audioRef.current;
    if (
      !audio ||
      typeof window === "undefined" ||
      !("mediaSession" in navigator) ||
      !navigator.mediaSession.setPositionState
    )
      return;

    if (activeTrack && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: audio.playbackRate || 1.0,
          position: currentTime,
        });
      } catch (e) {
        console.warn("Failed to set MediaSession position state:", e);
      }
    }
  }, [currentTime, duration, activeTrack]);

  // Media Session API - Register action handlers for background/OS controls
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        setPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        setPlaying(false);
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        handlersRef.current.handlePrev();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        handlersRef.current.handleNext();
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        const audio = audioRef.current;
        if (audio && details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    } catch (e) {
      console.warn("MediaSession action handler registration failed:", e);
    }

    return () => {
      if (!("mediaSession" in navigator)) return;
      const actions: any[] = [
        "play",
        "pause",
        "previoustrack",
        "nexttrack",
        "seekto",
      ];
      actions.forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore unsupported browsers
        }
      });
    };
  }, []);

  const systemActive = isPlayerOpen && activeTrack !== null;

  const playingGateName = useMemo(() => {
    if (globalShuffleActive) return "GLOBAL SHUFFLE";
    if (!activeTrack) return activeGate.name;
    return (
      gates.find((g) => g.tracks.some((t) => t.id === activeTrack.id))?.name ||
      activeGate.name
    );
  }, [activeTrack, gates, activeGate, globalShuffleActive]);  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* HTML5 Audio Stream Instance */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        src={
          activeTrack
            ? import.meta.env.PROD
              ? `${import.meta.env.BASE_URL}media/${activeTrack.filename || `${activeTrack.id}.mp3`}`
              : `${API_BASE}/api/stream/${encodeURIComponent(activeTrack.id)}`
            : undefined
        }
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime;
          setCurrentTime(time);
          if (activeTrack?.endTime && time >= activeTrack.endTime) {
            handleNext(true);
          }
        }}
        onDurationChange={(e) => {
          setDuration(activeTrack?.endTime || e.currentTarget.duration || 0);
        }}
        onEnded={() => handleNext(true)}
        onError={(e) => {
          if (activeTrack) {
            console.error("Audio stream error:", e);
            setPlaying(false);
            toast.error("SYSTEM ERROR: Audio stream connection failed");
          }
        }}
      />

      {pipActive ? (
        <MiniPlayerView
          track={activeTrack}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          shuffle={globalShuffleActive || shuffle}
          repeatMode={repeatMode}
          onToggle={handleToggle}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={handleSeek}
          onRestore={togglePip}
          onToggleShuffle={() => {
            if (globalShuffleActive) {
              setGlobalShuffleActive(false);
            } else {
              setShuffle(!shuffle);
            }
          }}
          onToggleRepeat={() =>
            setRepeatMode((prev) =>
              prev === "none" ? "all" : prev === "all" ? "one" : "none",
            )
          }
          gates={gates}
          activeGate={activeGate}
        />
      ) : (
        <>
          {/* Background image layer */}
          <div
            aria-hidden
            className="fixed inset-0 z-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          {/* Reactive background canvas */}
          <AnimatedBackground
            intensity={bgIntensity}
            audioRef={audioRef}
            beatDrops={
              activeTrack && beatDropsData
                ? beatDropsData[activeTrack.id]
                : undefined
            }
          />
          {/* Radial gradient mask (exact spec) */}
          <div
            aria-hidden
            className="fixed inset-0 z-[2] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, rgba(11,14,20,0.6) 0%, rgba(11,14,20,0.97) 100%)",
            }}
          />
          {/* subtle grid lines */}
          <div
            aria-hidden
            className="fixed inset-0 z-[3] pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.82 0.16 220) 1px, transparent 1px), linear-gradient(90deg, oklch(0.82 0.16 220) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Connectivity Banner for Offline Mode */}
          {isOffline && (
            <div className="relative z-50 bg-red-950/70 border-b border-red-500/35 px-4 py-1 text-center font-mono text-[10px] text-red-400 tracking-[0.25em] backdrop-blur-sm animate-pulse">
              SYSTEM ERROR: OFFLINE MODE ACTIVE // LOCAL CACHE ONLY
            </div>
          )}

          <main className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col min-h-screen">
            {!hasMounted ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] font-mono text-xs text-primary gap-4">
                <span className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="flex flex-col items-center gap-1.5 mt-2">
                  <span className="tracking-[0.3em] uppercase text-primary font-semibold animate-pulse">
                    [SYSTEM INITIALIZING]
                  </span>
                  <span className="tracking-[0.15em] text-[10px] text-muted-foreground uppercase text-center max-w-xs leading-relaxed">
                    Loading gate conflict arrays & database...
                  </span>
                </div>
              </div>
            ) : (
              <>
                <SystemHeader onOpenSettings={() => setIsSettingsOpen(true)} />

                <LayoutGroup>
                  {!systemActive ? (
                    <motion.div
                      key="state-a"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="mt-8 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-8"
                    >
                      <div className="space-y-10 min-w-0">
                        <GatesGrid
                          gates={gates}
                          activeId={activeGateId}
                          onSelect={handleSelectGate}
                          isOffline={isOffline}
                          cachedTrackIds={cachedTrackIds}
                          globalShuffleActive={globalShuffleActive}
                          onGlobalShuffle={handleGlobalShuffle}
                        />
                        <AnimatePresence mode="wait">
                          {activeGateId && (
                            <motion.div
                              key={activeGateId}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.25 }}
                            >
                              <TrackList
                                gate={activeGate}
                                activeId={activeTrack?.id ?? null}
                                onPlay={handlePlay}
                                isOffline={isOffline}
                                cachedTrackIds={cachedTrackIds}
                                onReassign={handleAssignTrack}
                                onUnassign={handleUnassignTrack}
                                gates={gates}
                                onClose={() => setActiveGateId(null)}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="lg:sticky lg:top-8 self-start space-y-6">
                        <StatusWindow
                          track={activeTrack}
                          playing={playing}
                          onToggle={handleToggle}
                          onPrev={handlePrev}
                          onNext={handleNext}
                          currentTime={currentTime}
                          duration={duration}
                          onExpand={() => setIsPlayerOpen(true)}
                          onSeek={handleSeek}
                        />
                        <AnimatePresence>
                          {unassignedTracks.length > 0 && (
                            <UnassignedPanel
                              tracks={unassignedTracks}
                              gates={gates}
                              onAssign={handleAssignTrack}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="state-b"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 lg:min-h-[calc(100vh-160px)]"
                    >
                      <div className="flex items-center justify-center py-4">
                        <MonarchPlayer
                          track={activeTrack!}
                          gateName={playingGateName}
                          playing={playing}
                          onToggle={handleToggle}
                          onPrev={handlePrev}
                          onNext={handleNext}
                          onClose={handleClose}
                          currentTime={currentTime}
                          duration={duration}
                          onSeek={handleSeek}
                          shuffle={globalShuffleActive || shuffle}
                          onToggleShuffle={() => {
                            if (globalShuffleActive) {
                              setGlobalShuffleActive(false);
                              toast.success("SYSTEM SHUFFLE: Returned to gate queue");
                            } else {
                              setShuffle(!shuffle);
                            }
                          }}
                          repeatMode={repeatMode}
                          onToggleRepeat={() =>
                            setRepeatMode((prev) =>
                              prev === "none" ? "all" : prev === "all" ? "one" : "none",
                            )
                          }
                          pipActive={pipActive}
                          onTogglePip={togglePip}
                        />
                      </div>
                      {/* Desktop queue */}
                      <div className="hidden lg:block max-h-[calc(100vh-160px)]">
                        <SidebarQueue
                          gate={activeGate}
                          gates={gates}
                          activeId={activeTrack?.id ?? null}
                          onPlay={handlePlay}
                          onPickGate={handleSelectGate}
                          isOffline={isOffline}
                          cachedTrackIds={cachedTrackIds}
                        />
                      </div>
                      {/* Mobile drawer trigger */}
                      <div className="lg:hidden flex justify-center pb-8">
                        <MobileQueueDrawer
                          gate={activeGate}
                          activeId={activeTrack?.id ?? null}
                          onPlay={handlePlay}
                          isOffline={isOffline}
                          cachedTrackIds={cachedTrackIds}
                        />
                      </div>
                    </motion.div>
                  )}
                </LayoutGroup>
              </>
            )}

            <footer className="mt-auto pt-6 border-t border-border flex items-center justify-between font-mono text-[10px] text-muted-foreground">
              <span>© SHADOW PLAYER SYSTEM</span>
              <span className="text-primary">v1.0.0</span>
            </footer>
          </main>

          {hasMounted && !isMobile && <ShadowCursor mode={cursorMode} />}

          <SettingsDrawer
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            cursorMode={cursorMode}
            setCursorMode={setCursorMode}
            bgIntensity={bgIntensity}
            setBgIntensity={setBgIntensity}
            dspEnabled={dspEnabled}
            setDspEnabled={setDspEnabled}
            bassGain={bassGain}
            setBassGain={setBassGain}
            midGain={midGain}
            setMidGain={setMidGain}
            trebleGain={trebleGain}
            setTrebleGain={setTrebleGain}
            reverbEnabled={reverbEnabled}
            setReverbEnabled={setReverbEnabled}
            normalizationEnabled={normalizationEnabled}
            setNormalizationEnabled={setNormalizationEnabled}
          />
        </>
      )}

      {/* Hidden Canvas & Video for Picture-in-Picture Mini-Player */}
      <canvas
        ref={pipCanvasRef}
        width="320"
        height="180"
        className="hidden"
        style={{ display: "none" }}
      />
      <video
        ref={pipVideoRef}
        autoPlay
        muted
        playsInline
        className="pointer-events-none fixed opacity-0 z-[-100]"
        style={{
          width: "320px",
          height: "180px",
          top: "-9999px",
          left: "-9999px",
        }}
      />

      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
      />
    </div>
  );
}

type UnassignedPanelProps = {
  tracks: Track[];
  gates: Gate[];
  onAssign: (trackId: string, gateId: string) => void;
};

function UnassignedPanel({ tracks, gates, onAssign }: UnassignedPanelProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="panel-clip-sm neon-border bg-surface/70 backdrop-blur-md p-5 relative overflow-hidden rounded-sm"
      style={{ boxShadow: "var(--glow-mixed)" }}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none scanlines" />

      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] text-primary tracking-[0.25em] flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-primary animate-pulse" />
          UNASSIGNED ESSENCE
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {tracks.length} DETECTED
        </span>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {tracks.map((track) => (
            <motion.div
              key={track.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
              className="border-b border-border/50 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-sm font-semibold text-foreground truncate">
                    {track.title}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {track.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[9px] text-muted-foreground tracking-[0.1em] uppercase">
                    Select Gate:
                  </span>
                  <select
                    className="flex-1 bg-background/80 border border-border/70 rounded-sm text-xs font-mono text-primary px-2 py-1 outline-none cursor-pointer focus:border-primary/80 transition-colors"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onAssign(track.id, e.target.value);
                      }
                    }}
                  >
                    <option value="" disabled>
                      -- CHOOSE DESTINATION --
                    </option>
                    {gates.map((g) => (
                      <option
                        key={g.id}
                        value={g.id}
                        className="bg-background text-foreground text-xs"
                      >
                        [{g.rank}] {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
