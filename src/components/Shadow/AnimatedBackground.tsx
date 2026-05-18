import { useEffect, useRef } from "react";

type Props = {
  intensity: string;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  beatDrops?: number[];
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  speedMultiplier: number;
  char?: string;
  rotation?: number;
  rotationSpeed?: number;
  type: "mist" | "rune";
};

type RainDrop = {
  x: number;
  y: number;
  len: number;
  speed: number;
  vx: number;
  vy: number;
  alpha: number;
};

type WaterDroplet = {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
  trailY: number[];
};

interface LightningSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

function generateLightningBolt(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  displacement: number,
  minLen: number,
  branchProb: number,
): LightningSegment[] {
  const segments: LightningSegment[] = [];

  function subdivide(
    sx1: number,
    sy1: number,
    sx2: number,
    sy2: number,
    disp: number,
    width: number,
  ) {
    const dx = sx2 - sx1;
    const dy = sy2 - sy1;
    const len = Math.hypot(dx, dy);

    if (len < minLen) {
      segments.push({ x1: sx1, y1: sy1, x2: sx2, y2: sy2, width });
      return;
    }

    const midX = (sx1 + sx2) / 2;
    const midY = (sy1 + sy2) / 2;

    const perpX = -dy / len;
    const perpY = dx / len;
    const offset = (Math.random() - 0.5) * disp;

    const mx = midX + perpX * offset;
    const my = midY + perpY * offset;

    const nextDisp = disp * 0.5;
    subdivide(sx1, sy1, mx, my, nextDisp, width);
    subdivide(mx, my, sx2, sy2, nextDisp, width);

    if (Math.random() < branchProb) {
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.1;
      const branchLen = len * (0.3 + Math.random() * 0.45);
      const bx = mx + Math.cos(angle) * branchLen;
      const by = my + Math.sin(angle) * branchLen;
      subdivide(mx, my, bx, by, nextDisp * 0.8, width * 0.55);
    }
  }

  subdivide(x1, y1, x2, y2, displacement, 3.5);
  return segments;
}

export function AnimatedBackground({ intensity, audioRef, beatDrops }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (intensity === "off") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle pool settings based on intensity
    let maxParticles = 60;
    let opacityMultiplier = 0.7;
    if (intensity === "subtle") {
      maxParticles = 30;
      opacityMultiplier = 0.35;
    } else if (intensity === "intense") {
      maxParticles = 120;
      opacityMultiplier = 1.0;
    }

    const particles: Particle[] = [];
    const runesList = [
      "▲",
      "◆",
      "❖",
      "이",
      "어",
      "날",
      "개",
      "빛",
      "그",
      "림",
      "자",
      "⚔",
      "⚡",
    ];

    const rainDrops: RainDrop[] = [];
    const screenDroplets: WaterDroplet[] = [];
    if (intensity === "intense") {
      for (let i = 0; i < 60; i++) {
        rainDrops.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          len: 15 + Math.random() * 20,
          speed: 15 + Math.random() * 15,
          vx: 8 + Math.random() * 6,
          vy: 20 + Math.random() * 10,
          alpha: 0.15 + Math.random() * 0.35,
        });
      }
      for (let i = 0; i < 20; i++) {
        screenDroplets.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: 1.5 + Math.random() * 3,
          vy: 0.2 + Math.random() * 0.6,
          alpha: 0.4 + Math.random() * 0.4,
          trailY: [],
        });
      }
    }

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      const type = Math.random() < 0.65 ? "mist" : "rune";
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy:
          type === "rune"
            ? -0.15 - Math.random() * 0.3
            : -0.05 - Math.random() * 0.1,
        size:
          type === "mist" ? 40 + Math.random() * 120 : 10 + Math.random() * 8,
        alpha: 0,
        baseAlpha:
          type === "mist"
            ? 0.08 + Math.random() * 0.12
            : 0.25 + Math.random() * 0.35,
        speedMultiplier: 0.6 + Math.random() * 0.8,
        type,
        char:
          type === "rune"
            ? runesList[Math.floor(Math.random() * runesList.length)]
            : undefined,
        rotation: type === "rune" ? Math.random() * Math.PI * 2 : undefined,
        rotationSpeed:
          type === "rune" ? (Math.random() - 0.5) * 0.02 : undefined,
      });
    }

    let raf = 0;
    let t = 0;
    const frequencyData = new Uint8Array(128);

    // Lightning strike animation variables
    const enableLightning = intensity === "medium" || intensity === "intense";
    let currentBolt: LightningSegment[] | null = null;
    let currentBolt2: LightningSegment[] | null = null;
    let boltLife = 0;
    let flashOpacity = 0;
    let lastStrikeTime = Date.now() - 3000;
    let nextStrikeDelay =
      intensity === "intense"
        ? 2000 + Math.random() * 3000
        : 4000 + Math.random() * 6000;
    let lastAudioTime = 0;

    const tick = () => {
      t += 0.01;

      // 1. Fetch real-time Web Audio API frequency data if available
      let bass = 0;
      let mid = 0;
      let treble = 0;
      let hasAudio = false;

      const analyser = (window as any).audioAnalyser;
      if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        hasAudio = true;

        // Calculate frequency band averages
        const bassSum = frequencyData.slice(0, 8).reduce((a, b) => a + b, 0);
        bass = bassSum / 8 / 255; // Normalized 0.0 - 1.0

        const midSum = frequencyData.slice(8, 48).reduce((a, b) => a + b, 0);
        mid = midSum / 40 / 255;

        const trebleSum = frequencyData
          .slice(48, 96)
          .reduce((a, b) => a + b, 0);
        treble = trebleSum / 48 / 255;
      }

      // Clear with radial gradient to create ambient dark background
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw background pulse glow
      if (hasAudio) {
        const bgGlow = ctx.createRadialGradient(
          window.innerWidth / 2,
          window.innerHeight / 2,
          10,
          window.innerWidth / 2,
          window.innerHeight / 2,
          window.innerWidth * 0.75,
        );
        const purpleIntensity = bass * 0.35 * opacityMultiplier;
        const blueIntensity = mid * 0.22 * opacityMultiplier;
        bgGlow.addColorStop(0, `rgba(138, 43, 226, ${purpleIntensity})`); // Purple core
        bgGlow.addColorStop(0.5, `rgba(0, 210, 255, ${blueIntensity * 0.5})`); // Cyan mid
        bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Fade in from spawn
        if (p.alpha < p.baseAlpha) {
          p.alpha += 0.005;
        }

        // Apply audio reactivity
        let currentSpeedY = p.vy;
        let currentSize = p.size;
        let currentAlpha = p.alpha * opacityMultiplier;

        if (hasAudio) {
          if (p.type === "mist") {
            // Bass swells the mist particles and makes them rise faster
            currentSize = p.size * (1 + bass * 0.45);
            currentSpeedY = p.vy * (1 + bass * 1.5) * p.speedMultiplier;
            currentAlpha = p.alpha * (1 + bass * 0.8) * opacityMultiplier;
          } else if (p.type === "rune") {
            // Mid frequencies accelerate the rising runes
            currentSpeedY = p.vy * (1 + mid * 2.8) * p.speedMultiplier;
            currentAlpha = p.alpha * (1 + mid * 0.6) * opacityMultiplier;
          }
        } else {
          // Slow ambient idle drift
          if (p.type === "mist") {
            currentSpeedY = p.vy * (1 + Math.sin(t + i) * 0.25);
          }
        }

        // Physics update
        p.x += p.vx;
        p.y += currentSpeedY;

        // Wrap around bounds
        if (p.x < -p.size) p.x = window.innerWidth + p.size;
        if (p.x > window.innerWidth + p.size) p.x = -p.size;
        if (p.y < -p.size) {
          p.y = window.innerHeight + p.size;
          p.x = Math.random() * window.innerWidth;
          p.alpha = 0; // Fade in on respawn
        }
        if (p.y > window.innerHeight + p.size) {
          p.y = -p.size;
          p.x = Math.random() * window.innerWidth;
          p.alpha = 0;
        }

        // Rendering
        ctx.save();
        if (p.type === "mist") {
          // Mist glow circle
          const grad = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            currentSize / 2,
          );
          // Dark obsidian/purple hue
          const color = i % 2 === 0 ? "138, 43, 226" : "0, 180, 255";
          grad.addColorStop(0, `rgba(${color}, ${currentAlpha * 0.45})`);
          grad.addColorStop(0.5, `rgba(${color}, ${currentAlpha * 0.15})`);
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "rune") {
          // Runic glyphs
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed * (hasAudio ? 1 + mid * 1.5 : 1);
          }
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);

          ctx.font = `bold ${currentSize}px "Orbitron", "Rajdhani", sans-serif`;
          ctx.fillStyle = `rgba(0, 210, 255, ${currentAlpha})`;
          ctx.shadowBlur = hasAudio ? 6 + treble * 12 : 6;
          ctx.shadowColor = `rgba(138, 43, 226, ${currentAlpha * 0.85})`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.char || "", 0, 0);
        }
        ctx.restore();
      }

      // --- Intense Rain & Droplets ---
      if (intensity === "intense") {
        ctx.save();
        // Rain
        for (const drop of rainDrops) {
          drop.x += drop.vx * (hasAudio ? 1 + bass * 0.5 : 1);
          drop.y += drop.vy * (hasAudio ? 1 + bass * 0.5 : 1);

          if (drop.x > window.innerWidth || drop.y > window.innerHeight) {
            drop.x =
              Math.random() * window.innerWidth - window.innerHeight * 0.5; // start further left
            drop.y = -50;
          }

          ctx.strokeStyle = `rgba(0, 210, 255, ${drop.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + drop.vx * 0.6, drop.y + drop.vy * 0.6);
          ctx.stroke();
        }

        // Condensation Screen Droplets
        for (const drop of screenDroplets) {
          const speedMod = hasAudio ? 1 + bass * 1.5 : 1;
          drop.y += drop.vy * speedMod;

          if (Math.random() < 0.1) {
            drop.trailY.push(drop.y);
            if (drop.trailY.length > 15) drop.trailY.shift();
          }

          if (drop.y > window.innerHeight + 10) {
            drop.y = -10;
            drop.x = Math.random() * window.innerWidth;
            drop.trailY = [];
          }

          // Draw trail
          if (drop.trailY.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 210, 255, ${drop.alpha * 0.15})`;
            ctx.lineWidth = drop.r * 1.2;
            ctx.lineCap = "round";
            ctx.moveTo(drop.x, drop.trailY[0]);
            for (let i = 1; i < drop.trailY.length; i++) {
              ctx.lineTo(drop.x, drop.trailY[i]);
            }
            ctx.lineTo(drop.x, drop.y);
            ctx.stroke();
          }

          // Draw drop
          ctx.fillStyle = `rgba(11, 14, 20, ${drop.alpha * 0.45})`;
          ctx.beginPath();
          ctx.arc(drop.x + 1, drop.y + 1, drop.r, 0, Math.PI * 2);
          ctx.fill();

          const dropGrad = ctx.createRadialGradient(
            drop.x - drop.r * 0.2,
            drop.y - drop.r * 0.2,
            drop.r * 0.1,
            drop.x,
            drop.y,
            drop.r,
          );
          dropGrad.addColorStop(0, `rgba(255, 255, 255, ${drop.alpha * 0.7})`);
          dropGrad.addColorStop(0.5, `rgba(0, 210, 255, ${drop.alpha * 0.3})`);
          dropGrad.addColorStop(1, `rgba(138, 43, 226, ${drop.alpha * 0.25})`);
          ctx.fillStyle = dropGrad;
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // --- Lightning Strike Effect (Medium/Intense modes only) ---
      if (enableLightning) {
        // 1. Flash decay
        if (flashOpacity > 0.01) {
          flashOpacity *= 0.9; // Slower exponential decay for lingering flash
        } else {
          flashOpacity = 0;
        }

        // 2. Render background flash overlay
        if (flashOpacity > 0) {
          ctx.save();
          // Add screen shake to the ambient flash glow too
          const shakeVal = (Math.random() - 0.5) * 14 * flashOpacity;
          ctx.translate(shakeVal, shakeVal * 0.7);

          const grad = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
          // High intensity neon overlay
          grad.addColorStop(0, `rgba(255, 255, 255, ${flashOpacity * 0.32})`); // Blinding white flash at top
          grad.addColorStop(0.15, `rgba(0, 210, 255, ${flashOpacity * 0.22})`); // Cyan transition
          grad.addColorStop(0.4, `rgba(138, 43, 226, ${flashOpacity * 0.12})`); // Deep shadow purple mid
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
          ctx.restore();
        }

        // 3. Trigger conditions
        const now = Date.now();
        let triggerStrike = false;

        // Trigger on periodic delay
        if (now - lastStrikeTime > nextStrikeDelay) {
          triggerStrike = true;
        }

        // Trigger on EXACT beat drop
        if (audioRef?.current && beatDrops && beatDrops.length > 0) {
          const cTime = audioRef.current.currentTime;

          for (const drop of beatDrops) {
            // If we just crossed the drop timestamp in the last frame
            if (
              lastAudioTime < drop &&
              cTime >= drop &&
              cTime - lastAudioTime < 1.0
            ) {
              triggerStrike = true;
              break;
            }
          }
          lastAudioTime = cTime;
        }

        // Trigger on extreme audio bass drops (fallback)
        if (hasAudio && bass > 0.88 && now - lastStrikeTime > 3000) {
          triggerStrike = true;
        }

        if (triggerStrike) {
          lastStrikeTime = now;
          if (intensity === "intense") {
            nextStrikeDelay = 2000 + Math.random() * 4000; // 2-6s for intense storm
          } else {
            nextStrikeDelay = 8000 + Math.random() * 8000; // 8-16s for normal
          }

          const startX = Math.random() * window.innerWidth;
          const endX =
            startX + (Math.random() - 0.5) * (window.innerWidth * 0.45);
          const endY = window.innerHeight * (0.65 + Math.random() * 0.35);

          // Generate primary bolt with wilder zig-zag coordinates
          currentBolt = generateLightningBolt(
            startX,
            0,
            endX,
            endY,
            window.innerWidth * 0.26, // Greater displacement for wilder zig-zags
            8.0, // Thinner segments for high fractal resolution
            0.38, // More branching branches
          );

          // Twin lightning strike (45% probability)
          if (Math.random() < 0.45) {
            const startX2 = startX + (Math.random() - 0.5) * 200;
            const endX2 =
              startX2 + (Math.random() - 0.5) * (window.innerWidth * 0.3);
            const endY2 = window.innerHeight * (0.55 + Math.random() * 0.45);
            currentBolt2 = generateLightningBolt(
              startX2,
              0,
              endX2,
              endY2,
              window.innerWidth * 0.2,
              10.0,
              0.28,
            );
          } else {
            currentBolt2 = null;
          }

          boltLife = 9 + Math.floor(Math.random() * 6); // 9 to 15 frames of visual life
          flashOpacity = 0.25 + Math.random() * 0.15; // Decreased opacity (0.25 - 0.40) for better HUD visibility
        }

        // 4. Render lightning bolt tree (with electrical strobe effect)
        if (currentBolt && boltLife > 0) {
          boltLife--;
          // Draw with flickering strobe
          if (boltLife % 2 === 0 || Math.random() < 0.65) {
            ctx.save();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            // Screen Shake during main bolt render
            const shake = (Math.random() - 0.5) * 18 * flashOpacity;
            ctx.translate(shake, shake * 0.8);

            const drawBoltPath = (
              bolt: LightningSegment[],
              width: number,
              strokeColor: string,
              blur: number,
              blurColor: string,
            ) => {
              ctx.save();
              ctx.strokeStyle = strokeColor;
              ctx.shadowBlur = blur;
              ctx.shadowColor = blurColor;
              ctx.lineWidth = width;
              ctx.beginPath();
              for (const seg of bolt) {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
              }
              ctx.stroke();
              ctx.restore();
            };

            // Main bolt rendering layers (Ambient -> Glow -> Inner Core)
            drawBoltPath(
              currentBolt,
              34,
              "rgba(138, 43, 226, 0.15)",
              55,
              "rgba(138, 43, 226, 0.95)",
            );
            drawBoltPath(
              currentBolt,
              13,
              "rgba(0, 210, 255, 0.55)",
              24,
              "rgba(0, 210, 255, 0.9)",
            );
            drawBoltPath(
              currentBolt,
              3.8,
              "rgba(255, 255, 255, 1.0)",
              6,
              "rgba(255, 255, 255, 1.0)",
            );

            // Twin bolt rendering layers (thinner & dimmer secondary lightning)
            if (currentBolt2) {
              drawBoltPath(
                currentBolt2,
                22,
                "rgba(138, 43, 226, 0.1)",
                35,
                "rgba(138, 43, 226, 0.8)",
              );
              drawBoltPath(
                currentBolt2,
                8,
                "rgba(0, 210, 255, 0.45)",
                16,
                "rgba(0, 210, 255, 0.8)",
              );
              drawBoltPath(
                currentBolt2,
                2.2,
                "rgba(255, 255, 255, 0.95)",
                4,
                "rgba(255, 255, 255, 0.95)",
              );
            }

            ctx.restore();
          }

          if (boltLife <= 0) {
            currentBolt = null;
            currentBolt2 = null;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [intensity, beatDrops, audioRef]);

  if (intensity === "off") return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
