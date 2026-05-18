import { useEffect, useId, useRef } from "react";

type Props = {
  active: boolean;
  size?: number;
};

const SPIKES = 96;

export function PortalVisualizer({ active, size = 320 }: Props) {
  const uid = useId().replace(/:/g, "");
  const spikesRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      const g = spikesRef.current;
      if (g) {
        const children = g.children;
        for (let i = 0; i < children.length; i++) {
          const line = children[i] as SVGLineElement;
          line.setAttribute("y2", String(-100));
        }
        g.setAttribute("transform", "rotate(0)");
      }
      if (ringRef.current) {
        ringRef.current.setAttribute("r", "78");
      }
      return;
    }

    let t = 0;
    const tick = () => {
      t += 0.06;
      const g = spikesRef.current;
      if (g) {
        const children = g.children;
        for (let i = 0; i < children.length; i++) {
          const line = children[i] as SVGLineElement;
          const phase = (i / SPIKES) * Math.PI * 2;
          const amp =
            28 *
            (0.5 +
              0.5 *
                Math.sin(phase * 3 + t * 1.7) *
                Math.cos(phase * 2 - t * 0.9));
          const len = 14 + Math.abs(amp);
          line.setAttribute("y2", String(-len));
        }
        g.setAttribute("transform", `rotate(${(t * 18) % 360})`);
      }
      if (ringRef.current) {
        const pulse = 1 + Math.sin(t * 2) * 0.04;
        ringRef.current.setAttribute("r", String(78 * pulse));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  const spikes = Array.from({ length: SPIKES }, (_, i) => {
    const angle = (i / SPIKES) * 360;
    const isPurple = i % 3 === 0;
    return (
      <line
        key={i}
        x1={0}
        y1={-92}
        x2={0}
        y2={-100}
        stroke={isPurple ? "oklch(0.6 0.27 295)" : "oklch(0.82 0.16 220)"}
        strokeWidth={isPurple ? 1.6 : 1}
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
          background:
            "radial-gradient(circle, oklch(0.5 0.27 295 / 0.35) 0%, oklch(0.82 0.16 220 / 0.12) 40%, transparent 70%)",
          filter: active ? "blur(20px)" : "blur(28px)",
          opacity: active ? 1 : 0.55,
          transition: "opacity 400ms ease",
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
          stroke="oklch(0.55 0.15 230 / 0.35)"
          strokeWidth={1}
          strokeDasharray="2 6"
          className="animate-vortex"
          style={{ transformOrigin: "center" }}
        />
        <circle
          r={100}
          fill="none"
          stroke="oklch(0.5 0.27 295 / 0.4)"
          strokeWidth={0.8}
        />
        <circle
          ref={ringRef}
          r={78}
          fill="none"
          stroke="oklch(0.82 0.16 220 / 0.9)"
          strokeWidth={1.2}
        />
        <circle
          r={56}
          fill="none"
          stroke="oklch(0.5 0.27 295 / 0.5)"
          strokeWidth={0.8}
          strokeDasharray="4 4"
        />
        {/* inner core */}
        <defs>
          <radialGradient id={`core-${uid}`}>
            <stop
              offset="0%"
              stopColor="oklch(0.95 0.12 220)"
              stopOpacity="0.9"
            />
            <stop
              offset="50%"
              stopColor="oklch(0.5 0.27 295)"
              stopOpacity="0.45"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.12 0.02 260)"
              stopOpacity="0"
            />
          </radialGradient>
          <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
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
          stroke="oklch(0.82 0.16 220)"
          strokeWidth={0.8}
          fill="none"
          opacity={0.85}
        >
          <polygon points="0,-22 19,-11 19,11 0,22 -19,11 -19,-11" />
          <polygon points="0,-14 12,-7 12,7 0,14 -12,7 -12,-7" opacity={0.7} />
          <circle r={4} fill="oklch(0.82 0.16 220)" />
        </g>
      </svg>
    </div>
  );
}
