import { useEffect, useRef } from "react";

type Particle = {
  id: number;
  type: "wisp" | "spark" | "orbit" | "rune" | "shockwave" | "text" | "shard"
    | "fragment" | "soldier" | "mist" | "riftLine" | "ghost";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  angle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  char?: string;
  rotation?: number;
  rotationSpeed?: number;
  text?: string;
  delay?: number;
  slotIndex?: number;
  targetY?: number;
};

// ----------------------------------------------------
// TIGHT HELPER DRAWING FUNCTIONS FOR CUSTOM CURSORS
// ----------------------------------------------------

function drawRiftCore(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  time: number,
  isHovered: boolean,
) {
  ctx.save();
  ctx.translate(cx, cy);
  
  // Gap height breathing
  const baseRadius = isHovered ? 8 : 5;
  const breathing = Math.sin(time * 3.0) * 1.2;
  const radius = Math.max(3.0, baseRadius + breathing);
  
  // 1. Draw outer glowing blue ring
  ctx.strokeStyle = "rgba(0, 210, 255, 0.85)";
  ctx.lineWidth = 1.0;
  ctx.shadowBlur = isHovered ? 12 : 5;
  ctx.shadowColor = "rgba(0, 210, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
  ctx.stroke();
  
  // 2. Draw spinning dashed inner purple ring (portal runic markers)
  ctx.strokeStyle = "rgba(138, 43, 226, 0.85)";
  ctx.lineWidth = 1.2;
  ctx.shadowBlur = 6;
  ctx.shadowColor = "rgba(138, 43, 226, 0.8)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, time * 2.2, time * 2.2 + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 3. Draw deep void core
  const voidGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius - 1);
  voidGrad.addColorStop(0, "rgba(0, 0, 0, 1)");
  voidGrad.addColorStop(0.5, "rgba(15, 0, 30, 0.95)"); // Deep abyssal indigo
  voidGrad.addColorStop(1, "rgba(0, 210, 255, 0.25)");
  ctx.fillStyle = voidGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 1, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawSoldierShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number,
  hue: number,
  isSnapToAttention: boolean,
  useShadow: boolean = false,
) {
  ctx.save();
  ctx.translate(x, y);
  
  const scale = size / 5; // normalize base size
  const headR = 1.2 * scale;
  const bodyH = (isSnapToAttention ? 4.5 : 3.0) * scale;
  const armLen = 2.5 * scale;
  
  ctx.fillStyle = `rgba(10, 15, 12, ${opacity})`; // void black fill
  ctx.strokeStyle = `hsla(${hue}, 100%, 55%, ${opacity})`; // green outline
  ctx.lineWidth = 0.8;
  
  if (useShadow) {
    ctx.shadowBlur = 4;
    ctx.shadowColor = `hsla(${hue}, 100%, 50%, ${opacity})`;
  }
  
  // Head
  ctx.beginPath();
  ctx.arc(0, -bodyH - headR, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Body (spine)
  ctx.beginPath();
  ctx.moveTo(0, -bodyH);
  ctx.lineTo(0, 0);
  ctx.stroke();
  
  // Arms (\O/)
  ctx.beginPath();
  const armY = -bodyH * 0.5;
  if (isSnapToAttention) {
    ctx.moveTo(0, armY);
    ctx.lineTo(-armLen * 0.5, armY - armLen * 0.85);
    ctx.moveTo(0, armY);
    ctx.lineTo(armLen * 0.5, armY - armLen * 0.85);
  } else {
    ctx.moveTo(0, armY);
    ctx.lineTo(-armLen * 0.7, armY - armLen * 0.7);
    ctx.moveTo(0, armY);
    ctx.lineTo(armLen * 0.7, armY - armLen * 0.7);
  }
  ctx.stroke();
  
  ctx.restore();
}

function drawFormationCore(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hue: number,
  isHovered: boolean,
) {
  ctx.save();
  ctx.translate(cx, cy);
  // Vanguard (tip) - keep shadow glow for the core cursor vanguard
  drawSoldierShape(ctx, 0, -6, 4.5, 0.95, hue, isHovered, true);
  // Flanks (mid)
  drawSoldierShape(ctx, -5, 0, 4.0, 0.9, hue, isHovered, true);
  drawSoldierShape(ctx, 5, 0, 4.0, 0.9, hue, isHovered, true);
  // Rear guard (base)
  drawSoldierShape(ctx, -9, 6, 3.5, 0.8, hue, isHovered, true);
  drawSoldierShape(ctx, 9, 6, 3.5, 0.8, hue, isHovered, true);
  ctx.restore();
}

function drawCornerBracket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  armLen: number,
  dirX: number,
  dirY: number,
  color: string,
  lineWidth: number,
  blur: number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(cx + dirX * armLen, cy);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx, cy + dirY * armLen);
  ctx.stroke();
  ctx.restore();
}

function drawGateSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity: number,
  hue: number,
) {
  ctx.save();
  ctx.translate(x, y - h / 2);
  
  ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${opacity})`;
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.9})`; // Void black fill
  ctx.lineWidth = 2.0;
  ctx.shadowBlur = 10;
  ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${opacity})`;
  
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(-w / 2, -h / 4);
  ctx.quadraticCurveTo(0, -h / 2 - 5, w / 2, -h / 4);
  ctx.lineTo(w / 2, h / 2);
  ctx.closePath();
  
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function ShadowCursor({ mode = "monarch" }: { mode?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mode === "default") return;

    const styleEl = document.createElement("style");
    styleEl.id = "shadow-cursor-hide-rules";
    styleEl.innerHTML = `
      *, *::before, *::after {
        cursor: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [mode]);

  useEffect(() => {
    if (mode === "default") return;
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

    const particles: Particle[] = [];
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let lastMx = mx;
    let lastMy = my;
    let lastTickMx = mx;
    let lastTickMy = my;
    let cursorVisible = false;
    let cursorX = mx;
    let cursorY = my;
    let isHovered = false;

    // Reticle animation states
    let reticleSize = 14;
    let glowOpacity = 0.45;
    let angleInner = 0;
    let angleOuter = 0;

    // Gate mode animation states
    let gateLockSize = 22;
    let scanLineOffset = 0;
    let hudGlitchFrame = 0;
    let glitchBracketIndex = -1;
    let glitchOffset = { x: 0, y: 0 };
    
    // Shadow Army mode animation states
    let hoverFrames = 0;
    
    // Movement angles for military formation
    let targetAngle = 0;
    let currentAngle = 0;

    const drawFlame = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      rotation: number,
      hue: number,
      alpha: number,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Outer burning plasma
      const grad = ctx.createLinearGradient(0, w / 2, 0, -h);
      grad.addColorStop(0, `hsla(${hue}, 100%, 35%, 0)`);
      grad.addColorStop(0.2, `hsla(${hue}, 100%, 45%, ${alpha * 0.4})`);
      grad.addColorStop(0.6, `hsla(${hue + 25}, 100%, 65%, ${alpha})`);
      grad.addColorStop(1, `hsla(${hue + 50}, 100%, 95%, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.quadraticCurveTo(-w / 3, -h / 2, 0, -h);
      ctx.quadraticCurveTo(w / 3, -h / 2, w / 2, 0);
      ctx.quadraticCurveTo(0, w / 4, -w / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Inner intense core
      const innerW = w * 0.45;
      const innerH = h * 0.55;
      const innerGrad = ctx.createLinearGradient(0, innerW / 2, 0, -innerH);
      innerGrad.addColorStop(0, `hsla(${hue + 20}, 100%, 55%, 0)`);
      innerGrad.addColorStop(
        0.4,
        `hsla(${hue + 40}, 100%, 75%, ${alpha * 0.85})`,
      );
      innerGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.moveTo(-innerW / 2, 0);
      ctx.quadraticCurveTo(-innerW / 3, -innerH / 2, 0, -innerH);
      ctx.quadraticCurveTo(innerW / 3, -innerH / 2, innerW / 2, 0);
      ctx.quadraticCurveTo(0, innerW / 4, -innerW / 2, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const drawLightning = (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      hue: number,
      opacity: number,
    ) => {
      const dist = Math.hypot(x2 - x1, y2 - y1);
      if (dist > 90) return;

      const steps = Math.floor(dist / 6);
      ctx.save();
      ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${opacity})`;
      ctx.lineWidth = 0.6 + Math.random() * 0.6;
      ctx.shadowBlur = 4;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${opacity})`;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      let cx = x1;
      let cy = y1;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const targetX = x1 + (x2 - x1) * t;
        const targetY = y1 + (y2 - y1) * t;
        const offset = (Math.random() - 0.5) * 5;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len;
        const py = dx / len;

        cx = targetX + px * offset;
        cy = targetY + py * offset;
        ctx.lineTo(cx, cy);
      }
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    // Mode-specific drawing helper functions
    const drawShadowArms = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      timeVal: number,
    ) => {
      ctx.save();
      ctx.strokeStyle = "rgba(138, 43, 226, 0.35)";
      ctx.lineWidth = 1.25;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(138, 43, 226, 0.75)";

      const numTendrils = 3;
      for (let i = 0; i < numTendrils; i++) {
        const baseAngle = (i / numTendrils) * Math.PI * 2 + timeVal * 0.45;
        const wave = Math.sin(timeVal * 4.5 + i * 2.2) * 11;
        const targetX = cx + Math.cos(baseAngle) * (26 + wave);
        const targetY = cy + Math.sin(baseAngle) * (26 + wave);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const cp1x = cx + Math.cos(baseAngle - 0.25) * 14;
        const cp1y = cy + Math.sin(baseAngle - 0.25) * 14;
        const cp2x = cx + Math.cos(baseAngle + 0.25) * 20;
        const cp2y = cy + Math.sin(baseAngle + 0.25) * 20;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, targetX, targetY);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawDaggerCore = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      color: string,
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;

      // Draw custom dagger shape path
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(2.5, -4);
      ctx.lineTo(1.5, 3);
      ctx.lineTo(3.5, 4);
      ctx.lineTo(2, 6);
      ctx.lineTo(1, 5);
      ctx.lineTo(0.5, 9);
      ctx.lineTo(-0.5, 9);
      ctx.lineTo(-1, 5);
      ctx.lineTo(-2, 6);
      ctx.lineTo(-3.5, 4);
      ctx.lineTo(-1.5, 3);
      ctx.lineTo(-2.5, -4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawCrownCore = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      color: string,
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;

      // Draw custom 5-pointed crown path
      ctx.beginPath();
      ctx.moveTo(-6, 4);
      ctx.lineTo(-8, -2);
      ctx.lineTo(-4, 0);
      ctx.lineTo(0, -6);
      ctx.lineTo(4, 0);
      ctx.lineTo(8, -2);
      ctx.lineTo(6, 4);
      ctx.closePath();
      ctx.fill();

      // Crown bottom band
      ctx.fillRect(-6, 5, 12, 1.5);
      ctx.restore();
    };

    const getModeConfig = (m: string) => {
      switch (m) {
        case "kamish":
          return {
            hues: [35, 0], // Gold/Red
            runes: ["⚔", "▲", "☠", "❂", "✦", "🔥"],
            text: ["VOID STRIKE", "DRAGON'S RAGE", "RUIN", "SHATTER"],
          };
        case "gate":
          return {
            hues: [220, 280], // Electric blue / Indigo-purple
            runes: ["⎈", "❖", "▼", "✦"],
            text: ["GATE OPEN", "D-RANK", "THRESHOLD BREACHED", "ENTERING DUNGEON"],
          };
        case "sovereign":
          return {
            hues: [45, 200], // Gold/Light blue
            runes: ["👑", "✦", "❂", "★", "◆", "✨"],
            text: ["SOVEREIGNTY", "SUBMIT", "BOW DOWN", "COMMAND"],
          };
        case "beru":
          return {
            hues: [140, 280], // Shadow green / Void purple
            runes: [],
            text: ["ARISE", "YES MY LORD"],
          };
        case "monarch":
        default:
          return {
            hues: [275, 195], // Purple/Cyan
            runes: ["▲", "◆", "❖", "⚔", "⚡", "☠"],
            text: ["ARISE", "CRITICAL", "LEVEL UP", "+100 EXP", "MONARCH"],
          };
      }
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cursorVisible = true;

      const dx = mx - lastMx;
      const dy = my - lastMy;
      const speed = Math.min(Math.hypot(dx, dy), 60);
      const len = Math.hypot(dx, dy) || 1;

      const cfg = getModeConfig(modeRef.current);

      const maxParticles = modeRef.current === "gate" ? 120 : modeRef.current === "beru" ? 150 : 180;

      // Spawn wisps/fragments/shards when moving
      if (particles.length < maxParticles) {
        const spawnCount = 1 + Math.floor(speed / 12);
        for (let i = 0; i < spawnCount; i++) {
          const jitter = () => (Math.random() - 0.5) * 8;
          
          let pType: Particle["type"] = "wisp";
          if (modeRef.current === "kamish") {
            pType = "shard";
          } else if (modeRef.current === "gate") {
            pType = "fragment";
          }

          if (pType === "fragment") {
            // Data fragments
            const side = Math.random() < 0.5 ? -10 : 10;
            const px = -dy / len;
            const py = dx / len;
            const spd = 0.5 + Math.random() * 1.5;
            particles.push({
              id: Math.random(),
              type: "fragment",
              x: mx + side + jitter() * 0.5,
              y: my + jitter() * 0.5,
              vx: px * spd * (Math.random() < 0.5 ? -1 : 1) + (Math.random() - 0.5) * 0.3,
              vy: py * spd * (Math.random() < 0.5 ? -1 : 1) + (Math.random() - 0.5) * 0.3,
              life: 0,
              maxLife: 30 + Math.random() * 20,
              size: 2 + Math.random() * 3, // width (2 to 5px)
              rotation: 1.5 + Math.random() * 1.5, // height (1 to 3px)
              hue: Math.random() < 0.65 ? cfg.hues[0] : cfg.hues[1],
            });
          } else {
            particles.push({
              id: Math.random(),
              type: pType,
              x: mx + jitter(),
              y: my + jitter(),
              vx: -dx * 0.08 + (Math.random() - 0.5) * 0.9,
              vy: -dy * 0.08 + (Math.random() - 0.5) * 0.9 - 0.4,
              life: 0,
              maxLife: 40 + Math.random() * 30,
              size: pType === "shard" ? 4 + Math.random() * 4 : 7 + Math.random() * 8,
              hue: Math.random() < 0.65 ? cfg.hues[0] : cfg.hues[1],
              rotation: (Math.random() - 0.5) * 0.4,
              rotationSpeed: (Math.random() - 0.5) * 0.03,
            });
          }
        }
      }

      // Spawn high-velocity electric sparks when moving fast (only if NOT gate or beru modes)
      if (speed > 5 && particles.length < maxParticles && modeRef.current !== "gate" && modeRef.current !== "beru") {
        const sparkCount = Math.floor(speed / 6);
        for (let i = 0; i < sparkCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const sparkSpeed = 1.8 + Math.random() * 4.2;
          particles.push({
            id: Math.random(),
            type: "spark",
            x: mx,
            y: my,
            vx: Math.cos(angle) * sparkSpeed - dx * 0.04,
            vy: Math.sin(angle) * sparkSpeed - dy * 0.04,
            life: 0,
            maxLife: 15 + Math.random() * 18,
            size: 1.5 + Math.random() * 1.5,
            hue: Math.random() < 0.35 ? cfg.hues[0] : cfg.hues[1],
          });
        }
      }

      lastMx = mx;
      lastMy = my;
    };

    const onLeave = () => {
      cursorVisible = false;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive =
          target.closest(
            'a, button, select, input, [role="button"], .cursor-pointer',
          ) !== null;
        isHovered = isInteractive;
      }
    };

    const onClick = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;

      const cfg = getModeConfig(modeRef.current);

      if (modeRef.current === "gate") {
        // 1. Gate silhouette shockwave
        particles.push({
          id: Math.random(),
          type: "shockwave",
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 12, // expanding over 12 frames
          size: 60, // portal frame size
          hue: cfg.hues[0], // blue
        });

        // 2. Spawn 12 data fragment particles in all directions
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
          const spd = 2 + Math.random() * 3;
          particles.push({
            id: Math.random(),
            type: "fragment",
            x: mx,
            y: my,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            maxLife: 25 + Math.random() * 15,
            size: 3 + Math.random() * 2, // width
            rotation: 1.5 + Math.random() * 1.5, // height
            hue: Math.random() < 0.5 ? cfg.hues[0] : cfg.hues[1],
          });
        }

        // 3. Mini dimensional shockwave rings expanding
        for (let j = 0; j < 3; j++) {
          particles.push({
            id: Math.random(),
            type: "shockwave",
            x: mx,
            y: my,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 15 + j * 5,
            size: 25 + j * 12,
            hue: Math.random() < 0.5 ? cfg.hues[0] : cfg.hues[1],
          });
        }

        // 4. Text spawn
        const text = cfg.text[Math.floor(Math.random() * cfg.text.length)];
        particles.push({
          id: Math.random(),
          type: "text",
          x: mx,
          y: my - 12,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -1.3,
          life: 0,
          maxLife: 35,
          size: 10 + Math.random() * 2,
          hue: cfg.hues[1],
          text,
        });

      } else if (modeRef.current === "beru") {
        // 1. Instant 8 shadow soldier particles burst outward in all directions
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
          const spd = 5 + Math.random() * 2;
          particles.push({
            id: Math.random(),
            type: "soldier",
            x: mx,
            y: my,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            maxLife: 30 + Math.random() * 10,
            size: 4 + Math.random() * 2,
            hue: cfg.hues[0], // green
          });
        }

        // 2. After 4 frames: A dark void ripple expands outward
        particles.push({
          id: Math.random(),
          type: "shockwave",
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 24,
          size: 75,
          hue: cfg.hues[0], // green
          delay: 4,
        });

        // 3. From below cursor: 3 soldiers rise in formation directly upward
        const baseSpeedY = -1.8;
        particles.push({
          id: Math.random(),
          type: "soldier",
          x: mx,
          y: my + 15,
          vx: 0,
          vy: baseSpeedY,
          life: 0,
          maxLife: 40,
          size: 7.0,
          hue: cfg.hues[0], // green
          targetY: my - 15,
        });
        particles.push({
          id: Math.random(),
          type: "soldier",
          x: mx - 12,
          y: my + 22,
          vx: 0,
          vy: baseSpeedY,
          life: 0,
          maxLife: 40,
          size: 6.0,
          hue: cfg.hues[0],
          targetY: my - 8,
        });
        particles.push({
          id: Math.random(),
          type: "soldier",
          x: mx + 12,
          y: my + 22,
          vx: 0,
          vy: baseSpeedY,
          life: 0,
          maxLife: 40,
          size: 6.0,
          hue: cfg.hues[0],
          targetY: my - 8,
        });

        // 4. Text spawn
        particles.push({
          id: Math.random(),
          type: "text",
          x: mx,
          y: my - 15,
          vx: 0,
          vy: -1.0,
          life: 0,
          maxLife: 40,
          size: 11,
          hue: cfg.hues[0],
          text: "ARISE",
        });
        
        particles.push({
          id: Math.random(),
          type: "text",
          x: mx,
          y: my - 25,
          vx: 0,
          vy: -0.9,
          life: 0,
          maxLife: 40,
          size: 8.5,
          hue: cfg.hues[0],
          text: "YES MY LORD",
          delay: 8,
        });

      } else {
        particles.push({
          id: Math.random(),
          type: "shockwave",
          x: mx,
          y: my,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 24,
          size: 65,
          hue: isHovered ? cfg.hues[1] : cfg.hues[0],
        });

        // Sparks explosion
        const isKam = modeRef.current === "kamish";
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
          const sparkSpeed = 3.5 + Math.random() * 4.5;
          particles.push({
            id: Math.random(),
            type: isKam ? "shard" : "spark",
            x: mx,
            y: my,
            vx: Math.cos(angle) * sparkSpeed,
            vy: Math.sin(angle) * sparkSpeed,
            life: 0,
            maxLife: 20 + Math.random() * 15,
            size: 1.5 + Math.random() * 1.5,
            hue: Math.random() < 0.35 ? cfg.hues[0] : cfg.hues[1],
          });
        }

        // Floating text
        const text = cfg.text[Math.floor(Math.random() * cfg.text.length)];
        particles.push({
          id: Math.random(),
          type: "text",
          x: mx,
          y: my - 12,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -1.3,
          life: 0,
          maxLife: 35,
          size: 10 + Math.random() * 2,
          hue: cfg.hues[1],
          text,
        });
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseover", onMouseOver);
    window.addEventListener("mousedown", onClick);

    let raf = 0;
    const tick = () => {
      // Fade trail using destination-out to leave beautiful particle trails
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";

      // Lerp cursor core position
      cursorX += (mx - cursorX) * 0.32;
      cursorY += (my - cursorY) * 0.32;

      // Track movement angle to face military formation forward
      const dx = mx - lastTickMx;
      const dy = my - lastTickMy;
      const moveSpeed = Math.hypot(dx, dy);
      if (moveSpeed > 0.5) {
        targetAngle = Math.atan2(dy, dx);
      }
      // Lerp angle smoothly to prevent jitter
      currentAngle += (targetAngle - currentAngle) * 0.15;

      // Update tick positions
      lastTickMx = mx;
      lastTickMy = my;

      // Increment hover frames
      if (isHovered) {
        hoverFrames++;
      } else {
        hoverFrames = 0;
      }

      // Glitch ghost trigger for gate mode during movement
      if (moveSpeed > 1.5 && modeRef.current === "gate") {
        hudGlitchFrame++;
        if (hudGlitchFrame % 10 === 0) {
          const ndx = dx / moveSpeed;
          const ndy = dy / moveSpeed;
          particles.push({
            id: Math.random(),
            type: "ghost",
            x: cursorX - ndx * 6, // lag behind movement
            y: cursorY - ndy * 6,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 5,
            size: 1.1,
            hue: 180, // cyan
          });
        }
      }

      // HUD glitch bracket timing
      hudGlitchFrame++;
      if (hudGlitchFrame % 30 === 0) {
        glitchBracketIndex = Math.floor(Math.random() * 4);
        glitchOffset = {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8,
        };
      }
      if (hudGlitchFrame % 30 === 2) {
        glitchBracketIndex = -1;
      }

      // Increment scanline scrolling Y offset
      scanLineOffset += 0.3;
      if (scanLineOffset > reticleSize * 2) {
        scanLineOffset = 0;
      }

      const cfg = getModeConfig(modeRef.current);

      // Always-on idle wisps (suppressed for gate and beru modes)
      if (cursorVisible && Math.random() < 0.28 && modeRef.current !== "gate" && modeRef.current !== "beru") {
        particles.push({
          id: Math.random(),
          type: modeRef.current === "kamish" ? "shard" : "wisp",
          x: cursorX + (Math.random() - 0.5) * 8,
          y: cursorY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.4 - Math.random() * 0.6,
          life: 0,
          maxLife: 45 + Math.random() * 25,
          size:
            modeRef.current === "kamish"
              ? 4 + Math.random() * 4
              : 7 + Math.random() * 8,
          hue: Math.random() < 0.6 ? cfg.hues[0] : cfg.hues[1],
          rotation: (Math.random() - 0.5) * 0.4,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
        });
      }

      // Idle orbiting / military formation particles
      if (cursorVisible) {
        if (modeRef.current === "beru") {
          const beruOrbits = particles.filter((p) => p.type === "orbit");
          if (beruOrbits.length < 6 && Math.random() < 0.3) {
            // Find unused slot
            const activeSlots = beruOrbits.map((p) => p.slotIndex);
            let slotIndex = 0;
            for (let s = 0; s < 6; s++) {
              if (!activeSlots.includes(s)) {
                slotIndex = s;
                break;
              }
            }
            particles.push({
              id: Math.random(),
              type: "orbit",
              x: cursorX,
              y: cursorY,
              vx: 0,
              vy: 0,
              life: 0,
              maxLife: 999999, // permanent escort formation
              size: 3.5,
              hue: cfg.hues[0], // green
              slotIndex,
            });
          }
        } else {
          // Standard orbiting dots (or rectangular fragments for gate)
          const maxOrbits = modeRef.current === "gate" ? 8 : 24;
          const orbitCount = particles.filter((p) => p.type === "orbit").length;
          
          if (orbitCount < maxOrbits && Math.random() < 0.18) {
            particles.push({
              id: Math.random(),
              type: "orbit",
              x: cursorX,
              y: cursorY,
              vx: 0,
              vy: 0,
              life: 0,
              maxLife: 70 + Math.random() * 40,
              size: 1.2 + Math.random() * 1.5,
              hue: Math.random() < 0.45 ? cfg.hues[0] : cfg.hues[1],
              angle: Math.random() * Math.PI * 2,
              orbitRadius:
                modeRef.current === "sovereign" && !isHovered
                  ? 12 + Math.random() * 16
                  : 24 + Math.random() * 32,
              orbitSpeed: 0.025 + Math.random() * 0.035,
            });
          }
        }
      }

      // Idle runic symbols (suppressed for beru mode)
      if (cursorVisible && Math.random() < 0.035 && modeRef.current !== "beru") {
        particles.push({
          id: Math.random(),
          type: "rune",
          x: cursorX + (Math.random() - 0.5) * 16,
          y: cursorY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.2 - Math.random() * 0.3,
          life: 0,
          maxLife: 55 + Math.random() * 20,
          size: 7 + Math.random() * 4,
          hue: cfg.hues[0],
          char: cfg.runes[Math.floor(Math.random() * cfg.runes.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.04,
        });
      }

      // Draw hover writhing tendrils (arms) for Monarch mode
      if (cursorVisible && isHovered && modeRef.current === "monarch") {
        drawShadowArms(ctx, cursorX, cursorY, angleInner);
      }

      // Draw and update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Handle delayed spawning
        if (p.delay !== undefined && p.delay > 0) {
          p.delay--;
          continue;
        }

        p.life++;
        // Lifecycle cleanups
        const isDead = p.life > p.maxLife;
        const isMismatchedOrbit = p.type === "orbit" && p.slotIndex !== undefined && modeRef.current !== "beru";
        
        if (isDead || isMismatchedOrbit) {
          if (p.type === "soldier" && p.targetY === undefined) {
            // Spawn mist trail upon standard soldier decay
            particles.push({
              id: Math.random(),
              type: "mist",
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 0.2,
              vy: -0.3 - Math.random() * 0.4,
              life: 0,
              maxLife: 20,
              size: 6,
              hue: 140, // deep green
            });
          }
          particles.splice(i, 1);
          continue;
        }

        const t = 1 - p.life / p.maxLife;

        if (p.type === "wisp") {
          p.vy -= 0.04;
          p.vx += Math.sin((p.life + p.id) * 0.1) * 0.08;
          p.x += p.vx;
          p.y += p.vy;
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed;
          }

          const w = p.size * (0.4 + t * 0.8);
          const h = p.size * (0.8 + t * 1.4);
          drawFlame(ctx, p.x, p.y, w, h, p.rotation || 0, p.hue, t * 0.45);
        } else if (p.type === "fragment") {
          // Decelerate and wobble
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.x += p.vx + Math.sin(p.life * 0.2) * 0.4;
          p.y += p.vy;
          
          let alpha = t;
          if (p.maxLife - p.life < 15) {
            alpha = (Math.sin(p.life * 1.5) * 0.5 + 0.5) * t;
          }
          
          ctx.save();
          ctx.translate(p.x, p.y);
          const w = p.size;
          const h = p.rotation || 2;
          ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
          ctx.fillRect(-w / 2, -h / 2, w, h);
          ctx.restore();
        } else if (p.type === "ghost") {
          // Cyan glitch afterimage circular ring duplicate
          ctx.save();
          ctx.strokeStyle = `rgba(0, 255, 255, ${t * 0.35})`;
          ctx.lineWidth = 1.0;
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(0, 255, 255, 0.5)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 6 * (2 - t), 0, Math.PI * 2); // expanding ring
          ctx.stroke();
          ctx.restore();
        } else if (p.type === "soldier") {
          const progress = p.life / p.maxLife;
          let spdScale = 1.0;
          if (progress < 0.4) {
            spdScale = Math.max(0, 1 - (progress / 0.4));
          } else {
            spdScale = 0;
          }

          if (p.targetY !== undefined) {
            if (p.y > p.targetY) {
              p.y += p.vy;
            } else {
              p.y = p.targetY;
              p.vy = 0;
            }
          } else {
            p.x += p.vx * spdScale;
            p.y += p.vy * spdScale;
          }
          
          drawSoldierShape(ctx, p.x, p.y, p.size, t * 0.85, p.hue, isHovered);
        } else if (p.type === "mist") {
          p.x += p.vx;
          p.y += p.vy;
          ctx.save();
          const rad = p.size;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
          const alpha = 0.08 * t;
          grad.addColorStop(0, `rgba(0, 255, 65, ${alpha})`);
          grad.addColorStop(0.6, `rgba(0, 100, 30, ${alpha * 0.4})`);
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.type === "shard") {
          p.vy += 0.06;
          p.x += p.vx;
          p.y += p.vy;
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed * 2.5;
          }
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${t * 0.95})`;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size / 2, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size / 2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (p.type === "spark") {
          p.vx *= 0.94;
          p.vy = p.vy * 0.94 - 0.02;
          p.x += p.vx;
          p.y += p.vy;

          const speed = Math.hypot(p.vx, p.vy);
          const angle = Math.atan2(p.vy, p.vx);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 80%, ${t})`;
          ctx.lineWidth = p.size * t;
          ctx.beginPath();
          ctx.moveTo(-speed * 1.4, 0);
          ctx.lineTo(speed * 1.4, 0);
          ctx.stroke();
          ctx.restore();
        } else if (p.type === "orbit") {
          if (
            p.angle !== undefined &&
            p.orbitRadius !== undefined &&
            p.orbitSpeed !== undefined
          ) {
            if (modeRef.current === "gate") {
              // Flat horizontal ring with erratic stuttering speed
              p.orbitSpeed += Math.sin(p.life * 0.08) * 0.002;
              p.angle += p.orbitSpeed;
              p.orbitRadius *= 0.995;
              
              if (Math.random() < 0.012) {
                p.angle += Math.PI; // glitch teleport to opposite side
              }
              
              const rawX = Math.cos(p.angle) * p.orbitRadius;
              const rawY = Math.sin(p.angle) * (p.orbitRadius * 0.12); // low Y scale = flat plane
              const tiltAngle = Math.PI / 12;
              p.x =
                cursorX +
                (rawX * Math.cos(tiltAngle) - rawY * Math.sin(tiltAngle));
              p.y =
                cursorY +
                (rawX * Math.sin(tiltAngle) + rawY * Math.cos(tiltAngle));
            } else if (p.slotIndex !== undefined && modeRef.current === "beru") {
              // Military Formation Escort
              const cursorSpeed = Math.min(25, Math.hypot(mx - lastTickMx, my - lastTickMy));
              const converge = cursorSpeed < 1.5 ? 0.55 : 1.0;
              
              const cosA = Math.cos(currentAngle);
              const sinA = Math.sin(currentAngle);
              const perpX = -sinA;
              const perpY = cosA;
              
              let ox = 0;
              let oy = 0;
              
              switch (p.slotIndex) {
                case 0: // Vanguard (Point)
                  ox = cosA * 26 * converge;
                  oy = sinA * 26 * converge;
                  break;
                case 1: // Flank Left
                  ox = perpX * 18 * converge;
                  oy = perpY * 18 * converge;
                  break;
                case 2: // Flank Right
                  ox = -perpX * 18 * converge;
                  oy = -perpY * 18 * converge;
                  break;
                case 3: // Rear Left
                  ox = (-cosA * 22 + perpX * 12) * converge;
                  oy = (-sinA * 22 + perpY * 12) * converge;
                  break;
                case 4: // Rear Right
                  ox = (-cosA * 22 - perpX * 12) * converge;
                  oy = (-sinA * 22 - perpY * 12) * converge;
                  break;
                case 5: // Rear Center
                  ox = -cosA * 30 * converge;
                  oy = -sinA * 30 * converge;
                  break;
              }
              
              // Hover Target Lock Surround
              if (isHovered && p.slotIndex >= 3) {
                const angleOffset = ((p.slotIndex - 3) * Math.PI * 2) / 3 + angleInner * 1.5;
                ox = Math.cos(angleOffset) * 22;
                oy = Math.sin(angleOffset) * 22;
              }
              
              const tx = cursorX + ox;
              const ty = cursorY + oy;
              
              const followLag = cursorSpeed > 10 ? 0.09 : 0.16;
              p.x += (tx - p.x) * followLag;
              p.y += (ty - p.y) * followLag;
            } else {
              p.angle += p.orbitSpeed;
              p.orbitRadius *= 0.985;

              const tiltAngle = Math.PI / 6;
              const rawX = Math.cos(p.angle) * p.orbitRadius;
              const rawY = Math.sin(p.angle) * (p.orbitRadius * 0.35);

              p.x =
                cursorX +
                (rawX * Math.cos(tiltAngle) - rawY * Math.sin(tiltAngle));
              p.y =
                cursorY +
                (rawX * Math.sin(tiltAngle) + rawY * Math.cos(tiltAngle));
            }
          }

          ctx.save();
          if (modeRef.current === "gate") {
            const w = 3.5 * t;
            const h = 1.6 * t;
            ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${t * 0.8})`;
            ctx.fillRect(p.x - w / 2, p.y - h / 2, w, h);
          } else if (modeRef.current === "beru" && p.slotIndex !== undefined) {
            const pulseRate = 0.05 + p.slotIndex * 0.02;
            const pulse = Math.sin(p.life * pulseRate) * 0.15 + 0.8;
            drawSoldierShape(ctx, p.x, p.y, p.size, pulse, p.hue, isHovered);
          } else {
            const size = p.size * t;
            ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${t * 0.8})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else if (p.type === "shockwave") {
          const r = p.size * (1 - t * t);
          ctx.save();
          if (modeRef.current === "gate") {
            drawGateSilhouette(ctx, p.x, p.y, r * 0.8, r * 1.25, t, p.hue);
          } else if (modeRef.current === "beru") {
            ctx.fillStyle = `rgba(0, 0, 0, ${t * 0.06})`;
            ctx.strokeStyle = `hsla(${p.hue}, 100%, 55%, ${t * 0.85})`;
            ctx.lineWidth = 2.0 * t;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, ${t})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.strokeStyle = `hsla(${p.hue}, 100%, 70%, ${t * 0.7})`;
            ctx.lineWidth = 1.8 * t;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${p.hue}, 100%, 55%, ${t})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        } else if (p.type === "text") {
          p.vy -= 0.35;
          p.vx *= 0.95;
          p.x += p.vx;
          p.y += p.vy;

          ctx.save();
          ctx.font = `900 ${p.size}px "Orbitron", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillText(p.text || "", p.x + 1, p.y + 1);

          ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${t})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${t})`;
          ctx.fillText(p.text || "", p.x, p.y);
          ctx.restore();
        }
      }

      // Electrical lightning discharge (suppressed in gate mode)
      if (cursorVisible && Math.random() < 0.22 && modeRef.current !== "gate") {
        const eligible = particles.filter(
          (p) => p.type === "orbit" || p.type === "spark",
        );
        if (eligible.length > 0) {
          const target = eligible[Math.floor(Math.random() * eligible.length)];
          const dist = Math.hypot(target.x - cursorX, target.y - cursorY);
          if (dist < 70) {
            drawLightning(
              ctx,
              cursorX,
              cursorY,
              target.x,
              target.y,
              target.hue,
              0.20 + Math.random() * 0.25,
            );
          }
        }
      }

      // Render Rotating HUD Reticle around cursor core
      if (cursorVisible) {
        let targetReticleSize = isHovered ? 24 : 14;
        let targetGlowOpacity = isHovered ? 0.95 : 0.45;

        // Custom lock-on shrink sizing for System Gate
        if (modeRef.current === "gate") {
          if (isHovered) {
            gateLockSize += (16 - gateLockSize) * 0.15;
          } else {
            gateLockSize += (22 - gateLockSize) * 0.15;
          }
          targetReticleSize = gateLockSize;
        }

        reticleSize += (targetReticleSize - reticleSize) * 0.18;
        glowOpacity += (targetGlowOpacity - glowOpacity) * 0.18;

        const speedMultiplier = isHovered ? 4.5 : 1.2;
        angleInner += 0.015 * speedMultiplier;
        angleOuter -= 0.012 * speedMultiplier;

        ctx.save();
        ctx.translate(cursorX, cursorY);

        ctx.shadowBlur = isHovered ? 14 : 5;
        let hudBaseColor = `rgba(0, 210, 255, ${glowOpacity})`;
        let hudSecColor = `rgba(138, 43, 226, ${glowOpacity})`;
        if (modeRef.current === "kamish") {
          ctx.shadowColor = isHovered
            ? "rgba(255, 0, 0, 0.85)"
            : "rgba(255, 215, 0, 0.5)";
          hudBaseColor = `rgba(255, 215, 0, ${glowOpacity * 0.85})`;
          hudSecColor = `rgba(255, 0, 0, ${glowOpacity * 0.95})`;
        } else if (modeRef.current === "gate") {
          ctx.shadowColor = isHovered
            ? "rgba(138, 43, 226, 0.85)"
            : "rgba(0, 0, 255, 0.5)";
          hudBaseColor = `rgba(0, 210, 255, ${glowOpacity})`;
          hudSecColor = `rgba(138, 43, 226, ${glowOpacity})`;
        } else if (modeRef.current === "sovereign") {
          ctx.shadowColor = isHovered
            ? "rgba(255, 215, 0, 0.85)"
            : "rgba(255, 255, 255, 0.5)";
          hudBaseColor = `rgba(255, 215, 0, ${glowOpacity})`;
          hudSecColor = `rgba(255, 255, 255, ${glowOpacity})`;
        } else if (modeRef.current === "beru") {
          ctx.shadowColor = isHovered
            ? "rgba(0, 255, 65, 0.85)"
            : "rgba(138, 43, 226, 0.5)";
          hudBaseColor = `rgba(0, 255, 65, ${glowOpacity})`;
          hudSecColor = `rgba(138, 43, 226, ${glowOpacity})`;
        } else {
          ctx.shadowColor = isHovered
            ? "rgba(0, 210, 255, 0.85)"
            : "rgba(138, 43, 226, 0.5)";
          hudBaseColor = `rgba(0, 210, 255, ${glowOpacity})`;
          hudSecColor = `rgba(138, 43, 226, ${glowOpacity})`;
        }

        // Draw reticle circles/brackets or target L-shape box
        ctx.strokeStyle = hudBaseColor;
        ctx.lineWidth = 1.2;

        if (modeRef.current === "gate") {
          // Draw L-shape rectangular targeting box corners
          const armLen = 10;
          const drawFourBrackets = (
            c: CanvasRenderingContext2D,
            rSize: number,
            col: string,
            gIndex: number,
            gOffset: { x: number; y: number },
          ) => {
            // TL (0)
            let ox = gIndex === 0 ? gOffset.x : 0;
            let oy = gIndex === 0 ? gOffset.y : 0;
            drawCornerBracket(c, -rSize + ox, -rSize + oy, armLen, 1, 1, col, 1.2, 8);
            // TR (1)
            ox = gIndex === 1 ? gOffset.x : 0;
            oy = gIndex === 1 ? gOffset.y : 0;
            drawCornerBracket(c, rSize + ox, -rSize + oy, armLen, -1, 1, col, 1.2, 8);
            // BL (2)
            ox = gIndex === 2 ? gOffset.x : 0;
            oy = gIndex === 2 ? gOffset.y : 0;
            drawCornerBracket(c, -rSize + ox, rSize + oy, armLen, 1, -1, col, 1.2, 8);
            // BR (3)
            ox = gIndex === 3 ? gOffset.x : 0;
            oy = gIndex === 3 ? gOffset.y : 0;
            drawCornerBracket(c, rSize + ox, rSize + oy, armLen, -1, -1, col, 1.2, 8);
          };

          drawFourBrackets(ctx, reticleSize, hudBaseColor, glitchBracketIndex, glitchOffset);

          // Draw chromatic aberration split ghost
          if (glitchBracketIndex !== -1) {
            let ox = glitchBracketIndex === 0 ? -reticleSize : glitchBracketIndex === 1 ? reticleSize : glitchBracketIndex === 2 ? -reticleSize : reticleSize;
            let oy = glitchBracketIndex === 0 ? -reticleSize : glitchBracketIndex === 1 ? -reticleSize : glitchBracketIndex === 2 ? reticleSize : reticleSize;
            let dirX = glitchBracketIndex === 0 || glitchBracketIndex === 2 ? 1 : -1;
            let dirY = glitchBracketIndex === 0 || glitchBracketIndex === 1 ? 1 : -1;
            drawCornerBracket(ctx, ox, oy, armLen, dirX, dirY, "rgba(0, 255, 255, 0.35)", 1.2, 4);
          }

          // Scan line lines scrolling down inside targeting box
          ctx.save();
          ctx.beginPath();
          ctx.rect(-reticleSize, -reticleSize, reticleSize * 2, reticleSize * 2);
          ctx.clip();
          
          ctx.strokeStyle = `rgba(0, 210, 255, 0.10)`;
          ctx.lineWidth = 0.6;
          
          const boxHeight = reticleSize * 2;
          const spacing = boxHeight / 3;
          for (let s = 0; s < 3; s++) {
            const ly = -reticleSize + ((scanLineOffset + s * spacing) % boxHeight);
            ctx.beginPath();
            ctx.moveTo(-reticleSize, ly);
            ctx.lineTo(reticleSize, ly);
            ctx.stroke();
          }
          ctx.restore();

          // Center crosshair with jittery tips
          ctx.save();
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 4;
          ctx.shadowColor = hudBaseColor;
          const jL = 5 + (Math.random() - 0.5) * 1.0;
          const jR = 5 + (Math.random() - 0.5) * 1.0;
          const jT = 5 + (Math.random() - 0.5) * 1.0;
          const jB = 5 + (Math.random() - 0.5) * 1.0;
          
          const gradX = ctx.createLinearGradient(-jL, 0, jR, 0);
          gradX.addColorStop(0, "rgba(0, 210, 255, 0.2)");
          gradX.addColorStop(0.5, "rgba(255, 255, 255, 1)");
          gradX.addColorStop(1, "rgba(0, 210, 255, 0.2)");
          ctx.strokeStyle = gradX;
          ctx.beginPath();
          ctx.moveTo(-jL, 0);
          ctx.lineTo(jR, 0);
          ctx.stroke();
          
          const gradY = ctx.createLinearGradient(0, -jT, 0, jB);
          gradY.addColorStop(0, "rgba(0, 210, 255, 0.2)");
          gradY.addColorStop(0.5, "rgba(255, 255, 255, 1)");
          gradY.addColorStop(1, "rgba(0, 210, 255, 0.2)");
          ctx.strokeStyle = gradY;
          ctx.beginPath();
          ctx.moveTo(0, -jT);
          ctx.lineTo(0, jB);
          ctx.stroke();
          ctx.restore();

        } else if (modeRef.current === "beru") {
          // Tactical corner brackets (keep original angular corners)
          ctx.beginPath();
          ctx.moveTo(-reticleSize, -reticleSize / 3);
          ctx.lineTo(-reticleSize, -reticleSize);
          ctx.lineTo(-reticleSize / 3, -reticleSize);
          ctx.moveTo(reticleSize, -reticleSize / 3);
          ctx.lineTo(reticleSize, -reticleSize);
          ctx.lineTo(reticleSize / 3, -reticleSize);
          ctx.moveTo(reticleSize, reticleSize / 3);
          ctx.lineTo(reticleSize, reticleSize);
          ctx.lineTo(reticleSize / 3, reticleSize);
          ctx.moveTo(-reticleSize, reticleSize / 3);
          ctx.lineTo(-reticleSize, reticleSize);
          ctx.lineTo(-reticleSize / 3, reticleSize);
          ctx.stroke();

          // Hexagonal 6-dot soldier slot formation indicator
          ctx.save();
          const hexRadius = reticleSize * 0.55;
          const sides = 6;
          const activeDot = Math.floor(angleInner * (isHovered ? 8.0 : 2.5)) % 6;
          
          for (let j = 0; j < sides; j++) {
            const angle = angleInner + (j * Math.PI * 2) / sides;
            const x = Math.cos(angle) * hexRadius;
            const y = Math.sin(angle) * hexRadius;
            
            let dotAlpha = 0.25;
            if (isHovered) {
              dotAlpha = 0.55 + Math.sin(angleInner * 12 + j) * 0.4;
            } else if (j === activeDot) {
              dotAlpha = 0.95;
            }
            
            ctx.fillStyle = `rgba(0, 255, 65, ${dotAlpha})`;
            ctx.shadowBlur = j === activeDot || isHovered ? 6 : 2;
            ctx.shadowColor = "rgba(0, 255, 65, 0.8)";
            ctx.beginPath();
            ctx.arc(x, y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

        } else {
          // Circular brackets for Monarch / Kamish / Sovereign
          ctx.beginPath();
          ctx.arc(0, 0, reticleSize, angleOuter, angleOuter + Math.PI * 0.35);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(
            0,
            0,
            reticleSize,
            angleOuter + Math.PI * 0.65,
            angleOuter + Math.PI * 1.0,
          );
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(
            0,
            0,
            reticleSize,
            angleOuter + Math.PI * 1.3,
            angleOuter + Math.PI * 1.65,
          );
          ctx.stroke();

          // Dotted concentric scale
          ctx.strokeStyle = hudBaseColor;
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 5]);
          ctx.beginPath();
          ctx.arc(0, 0, reticleSize + 4, angleInner, angleInner + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Inner spinning hexagon
          ctx.strokeStyle = hudSecColor;
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          const sides = modeRef.current === "sovereign" ? 8 : modeRef.current === "kamish" ? 3 : 6;
          for (let j = 0; j < sides; j++) {
            const angle = angleInner + (j * Math.PI * 2) / sides;
            const x = Math.cos(angle) * (reticleSize * 0.55);
            const y = Math.sin(angle) * (reticleSize * 0.55);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }

        // Lock-on pointers / Text when hovered
        if (isHovered) {
          if (modeRef.current !== "gate") {
            ctx.strokeStyle = hudBaseColor;
            ctx.lineWidth = 1.5;
            for (let j = 0; j < 4; j++) {
              const angle = (j * Math.PI) / 2 + angleOuter * 0.5;
              const x1 = Math.cos(angle) * (reticleSize + 2);
              const y1 = Math.sin(angle) * (reticleSize + 2);
              const x2 = Math.cos(angle) * (reticleSize + 6);
              const y2 = Math.sin(angle) * (reticleSize + 6);
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          }

          // Digital HUD text
          ctx.restore();
          ctx.save();
          ctx.translate(cursorX, cursorY);

          ctx.font = '900 7px "Roboto Mono", monospace';
          ctx.fillStyle = hudBaseColor;
          ctx.shadowBlur = 6;
          ctx.shadowColor = hudBaseColor;

          ctx.strokeStyle = hudBaseColor;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(reticleSize + 1, 0);
          ctx.lineTo(reticleSize + 8, 0);
          ctx.stroke();

          let label = "SYSTEM LOCK // ACTIVE";
          if (modeRef.current === "beru") label = "SOLDIER COMMAND // TARGET ACQUIRED";
          else if (modeRef.current === "gate") label = "SYSTEM: THRESHOLD LOCKED";

          ctx.fillText(label, reticleSize + 11, 2);

          if (modeRef.current === "gate") {
            const ranks = ["D", "C", "B", "A", "S"];
            const currentRank = ranks[Math.floor(Date.now() / 2000) % ranks.length];
            ctx.fillText(`UNKNOWN RANK GATE [${currentRank}-RANK]`, reticleSize + 11, 10);
          }
        }

        ctx.restore();
      }

      // Render Army Counter text below cursor (for Beru mode)
      if (cursorVisible && modeRef.current === "beru") {
        ctx.save();
        ctx.font = '6px "Roboto Mono", monospace';
        const armyCount = 127 + Math.min(35, Math.floor(hoverFrames * 1.2));
        ctx.fillStyle = `rgba(0, 255, 65, ${isHovered ? 0.85 : 0.45})`;
        ctx.shadowBlur = isHovered ? 4 : 0;
        ctx.shadowColor = "rgba(0, 255, 65, 0.8)";
        ctx.textAlign = "center";
        ctx.fillText(`ARMY: ${armyCount}`, cursorX, cursorY + reticleSize + 11);
        ctx.restore();
      }

      // Render custom themed cursor core
      if (cursorVisible) {
        ctx.save();
        const coreSize = isHovered ? 4 : 5.5;

        let color = "rgba(138, 43, 226, 0.9)";
        if (modeRef.current === "kamish") color = "rgba(255, 215, 0, 0.95)";
        else if (modeRef.current === "gate") color = "rgba(0, 0, 255, 0.85)";
        else if (modeRef.current === "sovereign") color = "rgba(255, 215, 0, 0.95)";
        else if (modeRef.current === "beru") color = "rgba(0, 255, 65, 0.95)";

        if (modeRef.current === "kamish") {
          drawDaggerCore(ctx, cursorX, cursorY, color);
        } else if (modeRef.current === "sovereign") {
          drawCrownCore(ctx, cursorX, cursorY, color);
        } else if (modeRef.current === "beru") {
          drawFormationCore(ctx, cursorX, cursorY, 140, isHovered);
        } else if (modeRef.current === "gate") {
          drawRiftCore(ctx, cursorX, cursorY, angleInner, isHovered);
        } else {
          // Monarch default radial glow
          const core = ctx.createRadialGradient(
            cursorX,
            cursorY,
            0,
            cursorX,
            cursorY,
            coreSize,
          );
          core.addColorStop(0, "rgba(255, 255, 255, 1)");
          core.addColorStop(
            0.35,
            isHovered ? "rgba(0, 210, 255, 0.9)" : "rgba(138, 43, 226, 0.9)",
          );
          core.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = core;
          ctx.beginPath();
          ctx.arc(cursorX, cursorY, coreSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("mousedown", onClick);
    };
  }, [mode]);

  if (mode === "default") return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
