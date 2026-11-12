import { useEffect, useId, useRef } from "react";

type Props = {
  active: boolean;
  size?: number;
  monarchMode?: boolean;
};

const SPIKES = 96;

export function PortalVisualizer({ active, size = 320, monarchMode = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const spikesRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let t = 0;
    const freqData = new Uint8Array(128);

    const tick = () => {
      t += 0.05;
      const g = spikesRef.current;
      const ring = ringRef.current;

      const analyser =
        typeof window !== "undefined"
          ? (window as any).audioAnalyser
          : null;

      let hasLiveAudio = false;
      if (active && analyser && typeof analyser.getByteFrequencyData === "function") {
        analyser.getByteFrequencyData(freqData);
        // Detect whether audio signal has audible energy
        for (let b = 0; b < 24; b++) {
          if (freqData[b] > 5) {
            hasLiveAudio = true;
            break;
          }
        }
      }

      if (g) {
        const children = g.children;
        const ampFactor = monarchMode ? 1.85 : 1.0;

        for (let i = 0; i < children.length; i++) {
          const line = children[i] as SVGLineElement;
          const phase = (i / SPIKES) * Math.PI * 2;

          if (active && hasLiveAudio) {
            // Symmetrical frequency mapping across 96 spikes: low bass to high treble
            const binIndex =
              i < 48
                ? Math.floor((i / 48) * 72)
                : Math.floor(((96 - i) / 48) * 72);
            const rawVal = freqData[binIndex] || 0;
            const normVal = rawVal / 255;
            const dynamicAmp = normVal * 36 * ampFactor;
            const flutter = 2 + 2 * Math.sin(phase * 3 + t * 2.2);
            const spikeY2 = -(98 + dynamicAmp + flutter);
            line.setAttribute("y2", String(spikeY2));
          } else {
            // Subtle breathing idle pulse when paused or silent
            const idleAmp =
              4.5 * (0.5 + 0.5 * Math.sin(phase * 2 + t * 1.5) * Math.cos(phase - t * 0.9));
            const idleY2 = -(98 + idleAmp);
            line.setAttribute("y2", String(idleY2));
          }
        }

        const rotSpeed = active
          ? monarchMode
            ? 28
            : 18
          : monarchMode
            ? 7
            : 4;
        g.setAttribute("transform", `rotate(${(t * rotSpeed) % 360})`);
      }

      if (ring) {
        if (active && hasLiveAudio) {
          // Dynamic ring pulse reacting to sub-bass bins (1..8)
          let bassSum = 0;
          for (let b = 1; b <= 8; b++) {
            bassSum += freqData[b] || 0;
          }
          const bassEnergy = bassSum / 8 / 255;
          const bassPulseStrength = monarchMode ? 0.16 : 0.08;
          const pulse = 1 + bassEnergy * bassPulseStrength + Math.sin(t * 2) * 0.02;
          ring.setAttribute("r", String(78 * pulse));
        } else {
          // Gentle idle breathing ring
          const idlePulse = 1 + Math.sin(t * 1.6) * (monarchMode ? 0.04 : 0.025);
          ring.setAttribute("r", String(78 * idlePulse));
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, monarchMode]);

  const spikes = Array.from({ length: SPIKES }, (_, i) => {
    const angle = (i / SPIKES) * 360;
    const isPurple = i % 3 === 0;

    let strokeColor = isPurple ? "oklch(0.5 0.27 295)" : "oklch(0.82 0.16 220)";
    if (monarchMode) {
      strokeColor = isPurple ? "oklch(0.5 0.25 15)" : "oklch(0.65 0.24 20)";
    }

    return (
      <line
        key={i}
        x1={0}
        y1={-92}
        x2={0}
        y2={-100}
        stroke={strokeColor}
        strokeWidth={isPurple ? (monarchMode ? 2.2 : 1.6) : (monarchMode ? 1.4 : 1)}
        strokeLinecap="round"
        transform={`rotate(${angle})`}
        opacity={isPurple ? 0.9 : 0.75}
      />
    );
  });

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      {/* outer glow halo */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: monarchMode
            ? "radial-gradient(circle, oklch(0.6 0.25 20 / 0.5) 0%, oklch(0.6 0.25 20 / 0.2) 40%, transparent 70%)"
            : "radial-gradient(circle, oklch(0.5 0.27 295 / 0.35) 0%, oklch(0.82 0.16 220 / 0.12) 40%, transparent 70%)",
          filter: active ? "blur(20px)" : "blur(28px)",
          opacity: active ? 1 : 0.55,
          transition: "opacity 400ms ease, background 300ms ease",
        }}
      />
      <svg
        viewBox="-120 -120 240 240"
        className="relative w-full h-full"
        filter={`url(#glow-${uid})`}
      >
        {/* concentric guide rings */}
        <circle
          r={110}
          fill="none"
          stroke={monarchMode ? "oklch(0.55 0.2 20 / 0.5)" : "oklch(0.55 0.15 230 / 0.35)"}
          strokeWidth={1}
          strokeDasharray="2 6"
          className="animate-vortex"
          style={{ transformOrigin: "center" }}
        />
        <circle
          r={100}
          fill="none"
          stroke={monarchMode ? "oklch(0.4 0.2 15 / 0.5)" : "oklch(0.5 0.27 295 / 0.4)"}
          strokeWidth={0.8}
        />
        <circle
          ref={ringRef}
          r={78}
          fill="none"
          stroke={monarchMode ? "oklch(0.65 0.24 20 / 0.95)" : "oklch(0.82 0.16 220 / 0.9)"}
          strokeWidth={1.2}
        />
        <circle
          r={56}
          fill="none"
          stroke={monarchMode ? "oklch(0.45 0.2 20 / 0.5)" : "oklch(0.5 0.27 295 / 0.5)"}
          strokeWidth={0.8}
          strokeDasharray="4 4"
        />
        {/* inner core */}
        <defs>
          <radialGradient id={`core-${uid}`}>
            <stop
              offset="0%"
              stopColor={monarchMode ? "oklch(0.85 0.2 20)" : "oklch(0.95 0.12 220)"}
              stopOpacity="0.9"
            />
            <stop
              offset="50%"
              stopColor={monarchMode ? "oklch(0.5 0.25 15)" : "oklch(0.5 0.27 295)"}
              stopOpacity="0.45"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.12 0.02 260)"
              stopOpacity="0"
            />
          </radialGradient>
          <filter
            id={`glow-${uid}`}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle r={48} fill={`url(#core-${uid})`} />
        {/* spikes */}
        <g ref={spikesRef}>{spikes}</g>
        {/* center sigil */}
        <g
          stroke={monarchMode ? "oklch(0.7 0.22 20)" : "oklch(0.82 0.16 220)"}
          strokeWidth={0.8}
          fill="none"
          opacity={0.85}
        >
          <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" />
          <polygon points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7" opacity={0.7} />
          <circle r={4} fill={monarchMode ? "oklch(0.7 0.22 20)" : "oklch(0.82 0.16 220)"} />
        </g>
      </svg>
    </div>
  );
}
