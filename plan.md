# Shadow Player — Build Plan

A single-page React frontend for "Shadow Player," styled as a Solo Leveling "System Interface." All artist text is locked to **"SLPlayer Project"**. No backend, no audio playback — purely a high-fidelity aesthetic prototype with simulated play state.

## 1. Design System (src/styles.css)

Replace tokens with a Solo Leveling system palette (all `oklch`):
- `--background` → abyssal obsidian (#0B0E14)
- `--surface` → deep space slate (#121620)
- `--primary` → neon system blue (#00D2FF)
- `--accent` → royal sapphire (#0047AB)
- `--shadow` → deep shadow purple (#8A2BE2 / #4B0082)
- `--border` → translucent sapphire
- Custom tokens: `--glow-blue`, `--glow-purple`, `--clip-panel` (polygon clip-path), `--shadow-aura` (layered box-shadows)

Fonts via Google Fonts `<link>` injected in `__root.tsx` head:
- **Orbitron** + **Rajdhani** (display/headers)
- **Roboto Mono** (timers, indices, serial codes)

Global radius capped (`--radius` ≈ 2px → max `rounded-sm`). Utility classes: `.panel-clip` (clip-path polygon corners), `.neon-border`, `.glow-blue`, `.glow-purple`, `.scale-97:active`.

## 2. Route & Shell

Single route `src/routes/index.tsx`. Replace placeholder index. Update `__root.tsx` head metadata + font links. Define meta title/description for "Shadow Player // System Online".

App shell stack (in order):
1. Fixed background image layer (`<div>` with bg-image — placeholder generated via imagegen, a moody monarch throne / shadow gate).
2. Absolute radial gradient overlay exactly per spec: `radial-gradient(circle at center, rgba(11,14,20,0.6) 0%, rgba(11,14,20,0.97) 100%)`.
3. App content layer.
4. Shadow-aura cursor canvas (desktop only, `pointer-events-none`, top layer).

## 3. State Management

Local React state inside index route (no global store needed):
- `activeTrackId: string | null`
- `playing: boolean`
- `activePlaylist: string`

`activeTrackId !== null` triggers **State B** (System Active). Otherwise **State A** (System Start).

Mock data file `src/lib/shadow-data.ts`:
- 6 gates/playlists: BOSS THEMES, SHADOW HYPE, CHILL VOID, MONARCH'S DOMAIN, DUNGEON RUN, AWAKENING.
- Tracks per playlist (e.g., MONARCH'S APPROACH, IRON BODY, ARISE, RULER'S HAND, etc.), each with `id`, `index`, `title`, `duration`. **Artist is hard-coded to "SLPlayer Project" everywhere it renders** (not stored — rendered as constant) to satisfy the critical text regulation.

## 4. Components (src/components/shadow/)

- `SystemHeader.tsx` — "SYSTEM ONLINE // SHADOW PLAYER" glowing title, monospace serial code, status dot.
- `GatesGrid.tsx` — 3×2 grid of clipped polygon cards, purple/blue neon border, hover lifts glow.
- `TrackList.tsx` — "GATE OPEN: {playlist}" header + rows with mono index, title, "SLPlayer Project" artist, right-aligned mono duration. Click → set active track.
- `StatusWindow.tsx` — compact right-column player (State A): album glyph, title, "SLPlayer Project", hexagon play button, small rotating vortex SVG.
- `MonarchPlayer.tsx` — maximized centered player (State B): large title (e.g., "ARISE"), "SLPlayer Project" subtitle, hexagon play/pause, prev/next, scrub bar (mono timers), and `PortalVisualizer`.
- `PortalVisualizer.tsx` — SVG circular waveform ring. Animated via `requestAnimationFrame`: pulsing concentric rings, rotating dashed arcs, and N radial spikes whose lengths oscillate (sin-driven, layered frequencies) in neon blue + purple. Pure SVG, no audio analyser needed.
- `SidebarQueue.tsx` — narrow right-hand scrollable queue (State B desktop). Reuses TrackList row at compressed density.
- `MobileQueueDrawer.tsx` — bottom swipeable drawer for State B mobile. Uses existing `src/components/ui/drawer.tsx`.
- `ShadowCursor.tsx` — desktop-only canvas tendril cursor.
- `HexButton.tsx` — reusable hexagon clip-path button (used for play/pause).

## 5. Dual-State Layout (index.tsx)

Use Framer Motion (`motion` + `LayoutGroup` + `layoutId`) so the Status Window → Monarch Player transition is a true shared-layout morph rather than two separate components.

- Shared `layoutId="player-shell"` between `StatusWindow` and `MonarchPlayer`.
- State A grid: `grid-cols-1 lg:grid-cols-[60%_40%]` with Gates + TrackList left, StatusWindow right.
- State B desktop grid: `grid-cols-[1fr_320px]` — MonarchPlayer fills the left/center (with internal `max-w` + centered), SidebarQueue on right. Center the player vertically via flex.
- State B mobile: MonarchPlayer centered full-width; queue collapses into bottom Drawer with a visible handle / "QUEUE" tab.
- Gates grid + full TrackList animate out via `AnimatePresence` (scale + fade) when entering State B; SidebarQueue animates in.

## 6. Shadow-Aura Cursor (desktop only)

`useIsMobile()` (already in `src/hooks/use-mobile.tsx`) gates the mount.

Implementation in `ShadowCursor.tsx`:
- Full-viewport `<canvas>`, `position: fixed`, `pointer-events: none`, `mix-blend-mode: screen`.
- On `mousemove`, push particle with position, velocity (slight randomized lag), life, hue (alternating ~270° purple and ~195° blue).
- RAF loop: fade canvas by drawing semi-transparent black rect each frame (creates trail). For each particle: update position with drift + slight upward curl (flame-like), shrink radius, draw radial gradient blob. Spawn 2–3 particles per move event so trail feels heavy/plumed.
- Cleanup on unmount; resize listener.

## 7. Micro-interactions

- All buttons: `transition-transform active:scale-[0.97]`, border flashes via `:active` ring.
- Gate cards & track rows: hover raises `box-shadow` glow (blue on hover, purple on active).
- Hexagon play button: CSS `clip-path: polygon(...)` with layered drop-shadow glow; pulses softly when `playing`.
- Track row click: subtle ripple + sets active track (triggers State B morph).

## 8. Assets

One generated background image via `imagegen` (premium not required): atmospheric shadow gate / monarch throne silhouette, dark, mostly negative space so the radial mask reads cleanly. Saved to `src/assets/shadow-bg.jpg` and imported.

## 9. Dependencies

Add via `bun add`:
- `framer-motion` (shared layout transitions)

Already present: Tailwind v4, shadcn drawer, lucide-react.

## 10. QA Checklist before finishing

- Placeholder removed from index.
- Every visible artist string === "SLPlayer Project" (grep).
- State A ↔ State B transition smooth on desktop and mobile viewports.
- Cursor canvas only mounts on desktop; verified no listeners on mobile.
- Radial gradient overlay exact rgba values per spec.
- Fonts loaded (Orbitron/Rajdhani/Roboto Mono).
- No rounded corners exceeding `rounded-sm`.
- Build passes.

---

## Technical notes

- File-based routing: single `src/routes/index.tsx`; no new routes needed (single-page app per spec).
- No backend / Lovable Cloud needed — purely a frontend aesthetic build.
- All colors expressed as `oklch` in `styles.css`; hex values from the brief converted at implementation time.
- Audio is not implemented; play/pause toggles a visual `playing` state that drives the visualizer animation intensity.

## Open question

None blocking — spec is thorough. Will proceed with a generated background image; if you have specific artwork in mind, drop it in `src/assets/` and I'll swap it.
