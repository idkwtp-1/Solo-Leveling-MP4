# Changelog: Shadow Player (Solo Leveling MP4)

All notable changes, architectural evolutions, bug fixes, and feature releases for the Shadow Player project are documented in this file.

---

## [2.2.0] - 2026-11-12 — Hardware Media Navigation, Offline DSP Engine, Multi-User Audit & Hardening
*Comprehensive Release: Hardware & Bluetooth track navigation, offline Web Audio DSP with continuous equalizer/overdrive/reverb sliders, lockscreen seekbar synchronization, live FFT audio-reactive visualizer, complete offline catalog bundling, desktop cursor fail-safe, and publication-grade improvement audit.*

### Completed
- **Earphone & Bluetooth Hardware Track Navigation (R1 / Milestone 1)**:
  - Implemented `MediaSessionCompat.Callback` in `ShadowAudioService.java` handling `onPlay()`, `onPause()`, `onSkipToNext()`, `onSkipToPrevious()`, and `onMediaButtonEvent()`.
  - Registered `MediaButtonReceiver` intent filters in `AndroidManifest.xml` and `ShadowAudioService` to route `KEYCODE_MEDIA_NEXT` and `KEYCODE_MEDIA_PREVIOUS`.
  - Wired headset hook keyevent debouncing (`repeatCount == 0`) and multi-click detection (single-click toggle, double-click skip next, triple-click skip prev) in `MainActivity.java`.
  - Added robust Android Audio Focus management via `AudioManager.requestAudioFocus` with `AUDIOFOCUS_LOSS_TRANSIENT` ducking and auto-resume.
- **Lockscreen Position & Duration Seekbar Synchronization (R1 & R2)**:
  - Resolved unresponsive lockscreen controls and frozen `00:00 - 00:00` seekbar by piping live `position` and track `duration` from the Web Audio player into `ShadowAudioPlugin.updatePlayback()`.
  - Populated `MediaMetadataCompat.METADATA_KEY_DURATION` and `PlaybackStateCompat.setState(PLAYING, positionMs, 1.0f)` with live playback position, enabling smooth OS scrubber interpolation.
  - Implemented `onSeekTo(long pos)` callback in `ShadowAudioService.java` and `ShadowAudioPlugin.notifySeek()` communicating lockscreen scrub events back to the React player.
- **Offline Monarch Web Audio DSP Engine & Manual Equalizer (R2 / Milestone 2)**:
  - Unblocked Web Audio API initialization on native Android by decoupling `initAudioContext()` from `mobileAudioMode`.
  - Implemented hyperbolic tangent (`tanh`) soft-saturation `WaveShaperNode` with `oversample = "2x"` inserted into the audio chain for genuine warm tube overdrive distortion.
  - Added continuous manual sliders in `SettingsDrawer.tsx`:
    - **Bass Boost**: `-15 dB` to `+15 dB` peaking filter.
    - **Vocal Mid**: `-15 dB` to `+15 dB` peaking filter.
    - **Treble Shine**: `-15 dB` to `+15 dB` peaking filter.
    - **Monarch Overdrive**: `0.0` to `10.0` continuous distortion gain with real-time saturation curve generation.
    - **Dungeon Reverb Depth**: `0%` to `100%` continuous wet space depth slider.
  - Retained full Monarch holographic HUD offline on native Android (`!isNativeAndroid()`) and added settings button to `OfflinePlayer.tsx` for offline PWA mode.
  - Ensured Web Audio context auto-resumes on playback gestures, track changes, and `visibilitychange` events.
- **PortalVisualizer Live Web Audio FFT Audio Reactivity (R3 / Milestone 3)**:
  - Replaced synthetic trigonometric sine/cosine math in `PortalVisualizer.tsx` with live Web Audio frequency data sampled via `(window as any).audioAnalyser.getByteFrequencyData()`.
  - Mapped 128 frequency bins symmetrically across 96 circular rune spikes from sub-bass to high treble.
  - Connected sub-bass bins (1..8) to dynamic inner ring pulsing, with amplitude boosted in Monarch Mode (`ampFactor = 1.85`) and an idle breathing pulse when paused.
- **Standalone Offline Catalog Bundling (R3 / Milestone 3)**:
  - Bundled all 68 tracks from `backend/media/tracks_inventory.json` directly into `NEW_UNASSIGNED_TRACKS` in `src/lib/shadow-data.ts`.
  - Guarantees 100% offline track catalog availability out-of-the-box without requiring an active backend connection.
- **Desktop Custom Cursor Fail-Safe & Recovery (R3 / Milestone 3)**:
  - Added multi-layered cursor recovery handlers in `src/components/Shadow/ShadowCursor.tsx`.
  - Added `Escape` key listener that immediately toggles and strips the global `cursor: none !important;` style tag.
  - Added window `blur` and `focus` event listeners to restore the OS cursor when Alt-Tabbing or switching applications.
  - Added `error` and `unhandledrejection` listeners and wrapped the animation loop in `try/catch` to ensure the OS mouse pointer is never trapped.
- **Publication-Grade Improvement Audit (`IMPROVEMENT_AUDIT.md`) (R3 / Milestone 3)**:
  - Released comprehensive audit adhering to the *Universal Project Improvement Audit Prompt* and *Project Enhancement Guide*.
  - Scored 10 core dimensions (current vs target), simulated 4 user personas (Tariq, Marcus, Elena, Kenji) across 7 critical flows.
  - Formulated Top 9 Quick Wins (QW-1 to QW-9) and Top 6 Bigger Investments (BI-1 to BI-6).
  - Designed distinctive Solo Leveling aesthetic & feature proposals: Runic Gate Seals, "ARISE" Shadow Extraction gate assignment animation, and Shadow Soldier DSP Sound Profiles (Igris, Iron, Beru, Tank, Monarch).
- **Desktop & PyWebView Non-Regression (R4 / Milestone 4)**:
  - Verified `run_pywebview.py` syntax, WinForms/WPF window controls, AppUserModelID, and Node.js Express server process lifecycle management.
  - Confirmed Express static asset server serving `dist/client/index.html` and bundled media assets with HTTP 200 responses.
  - Clean build verified: `npm run build` (exit code 0), `npx cap sync android` (exit code 0), `gradlew.bat assembleDebug` (`BUILD SUCCESSFUL in 17s`, 190.99 MB APK).

---

## [2.1.0] - 2026-11-11 — Hardware Media Controls & Offline Web Audio DSP
*Major Update: Fixed earphone hardware track navigation, restored responsive lock-screen scrubber/controls, and unlocked full offline Web Audio DSP equalizer on Android.*

### Completed
- **Earphone & Headset Hardware Media Buttons (R1 / Milestone 1)**:
  - Implemented `MediaSessionCompat.Callback` in `ShadowAudioService.java` handling `onPlay()`, `onPause()`, `onSkipToNext()`, `onSkipToPrevious()`, and `onMediaButtonEvent()`.
  - Registered `MediaButtonReceiver` intent filters in `AndroidManifest.xml` and `ShadowAudioService`.
  - Wired headset hook keyevent debouncing (`repeatCount == 0`) and multi-click detection (single-click toggle, double-click next, triple-click prev) in `MainActivity.java`.
  - Added transient audio focus loss and auto-resume handling (`AUDIOFOCUS_LOSS_TRANSIENT`).
- **Responsive Lock-Screen Playback Scrubber & Duration (R1 & R2)**:
  - Resolved unresponsive lock-screen controls and frozen `00:00 - 00:00` seekbar by piping live `position` and track `duration` from the Web Audio player into `ShadowAudioPlugin.updatePlayback()`.
  - Populated `MediaMetadataCompat.METADATA_KEY_DURATION` and `PlaybackStateCompat.setState(PLAYING, positionMs, 1.0f)` with current playback position.
  - Implemented `onSeekTo(long pos)` callback in `ShadowAudioService.java` communicating scrub events back to WebView.
- **Offline Monarch DSP Engine & Equalizer on Android (R2 / Milestone 2)**:
  - Unblocked Web Audio API initialization on native Android by decoupling `initAudioContext()` from `mobileAudioMode`.
  - Implemented hyperbolic tangent (`tanh`) soft-saturation `WaveShaperNode` for genuine non-linear warm tube overdrive distortion.
  - Added expanded continuous sliders in `SettingsDrawer.tsx`:
    - **Bass Boost**: `-15 dB` to `+15 dB` (peaking filter).
    - **Vocal Mid**: `-15 dB` to `+15 dB` (peaking filter).
    - **Treble Shine**: `-15 dB` to `+15 dB` (peaking filter).
    - **Monarch Overdrive**: `0.0` to `10.0` continuous slider with numeric readout and Solo Leveling aesthetic.
    - **Dungeon Reverb Depth**: `0%` to `100%` continuous wet space depth slider.
  - Retained full Monarch holographic HUD offline on native Android (`!isNativeAndroid()`) and added settings button to `OfflinePlayer.tsx` for offline PWA mode.
  - Ensured Web Audio context auto-resumes on playback gestures, track changes, and `visibilitychange` events.

---

## [2.0.0] - 2026-11-05 — PWA to Full Native Android Application
*Major Milestone: Complete migration from Mobile PWA to standalone native Android application (`com.shadowplayer.app`).*

### Completed
- **Full Android Native App (Capacitor & Gradle)**:
  - Packaged React/Vite frontend into a native Android APK (`app-debug.apk`, 181.38 MB).
  - Configured `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/filesystem`, and `@capacitor/preferences`.
  - Android Manifest configured with `usesCleartextTraffic="true"` and network access for local Wi-Fi sync.
  - Native Android status bar & navigation bar theming (`#0b0e14` obsidian black).
- **APK Media Bundling (100% Offline Out-of-the-Box)**:
  - All 96 existing tracks (~176 MB), `tracks_inventory.json`, `gates.json`, `assignments.json`, and `beat_drops.json` packaged directly into `android/app/src/main/assets/public/media/`.
  - Zero initial setup or Wi-Fi download needed after installing the APK.
- **Native Android Foreground Audio Service & Lock Screen Controls**:
  - Implemented `ShadowAudioService.java` with `FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK` and `PARTIAL_WAKE_LOCK`.
  - Implemented `MediaSessionCompat` and `NotificationCompat.Builder` (MediaStyle) notification.
  - Active lock-screen playback controls: Play/Pause, Next Track, Previous Track, and direct notification click to restore app.
  - Implemented `ShadowAudioPlugin.java` bridge in `MainActivity.java` connecting native media buttons directly to React player handlers.
- **Unified Audio & Storage Resolver**:
  - Created `src/lib/storage/nativeLibrary.ts` with `getAudioUrl`, `loadNativeAssignments`, `saveNativeAssignments`, and `ShadowAudio`.
  - Native assignment persistence backed by Android `SharedPreferences` via `@capacitor/preferences` to eliminate browser cache evictions.
- **Mobile YouTube Search & Download Pipeline Integration**:
  - Configured `getApiBase()` to automatically resolve local PC host IP (`10.87.168.83:3001`) with configurable `slplayer-pc-host` override.
  - Updated `YouTubeSearchDrawer.tsx` error reporting with clear diagnostic feedback for Wi-Fi LAN link.
- **PWA Decommissioning**:
  - Completely deleted legacy Service Worker (`public/sw.js`) and web manifest (`public/manifest.json`).
  - Added legacy SW unregistration logic on boot to clean up obsolete browser cache workers.
  - Switched Vite build output base to `./` relative asset loading for direct WebView execution.
- **Custom Launcher Icon & Visual Branding**:
  - Generated high-resolution Android launcher icons across all screen densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) from the canonical `public/icon-512.png` Solo Leveling crest.
  - Configured dark obsidian launcher background (`#08090B`) matching the app theme.
- **Compact Gate Destination Selector & Clean Typography**:
  - Re-engineered `GateSelectDropdown.tsx` in compact track-list mode to render only the rank badge (`[ S ]`, `[ A ]`, `[ B ]`, `[ C ]`, `[ ?? ]`) and minimal chevron (~32px width) instead of the full gate text.
  - Restored over 200px of horizontal room for track names in `TrackList.tsx`, eliminating truncation on narrow smartphone screens.
- **Camera Cutout & Safe Area Insets**:
  - Added hardware safe-area top padding (`pt-[max(env(safe-area-inset-top,32px),32px)]`) across main HUD, `YouTubeSearchDrawer.tsx`, and `SettingsDrawer.tsx` to prevent collision with punch-hole cameras, clocks, and status bar icons.
  - Locked activity to portrait mode in `AndroidManifest.xml` for consistent mobile ergonomics.

---

## [1.5.0] - 2026-10-15 — Mobile PWA Polish & UI Overhaul
- **Custom Holographic Gate Dropdown**:
  - Replaced native Android OS `<select>` sheet modals with custom `@radix-ui/react-dropdown-menu` (`GateSelectDropdown.tsx`).
  - Added glowing Solo Leveling rank badges (`S-RANK`, `A-RANK`, `B-RANK`, `C-RANK`, `??`) and gate codes (`GT-001` through `GT-006`).
- **Android Status Bar & Safe Area Theming**:
  - Changed manifest `theme_color` to `#0b0e14` and added `viewport-fit=cover` in `__root.tsx` to match obsidian theme.
- **Unicode & Diacritics Normalization**:
  - Fixed corrupted diacritics in `tracks_inventory.json` (`São Paulo`, `Áurea cósmica`, `NO BATIDÃO`, `TE CONOCÍ`, `riserayss • LONOWN — jessie`).
- **Touch Ergonomics**:
  - Expanded touch targets to $\ge 34\text{px}$ with accessible padding and explicit ARIA labels.
- **New Tracks Added**:
  - Added `WE ON GO II`, `Push The Feeling On (Slowed+Reverb)`, `Conflate`, and `São Paulo`.

---

## [1.4.0] - 2026-10-11 — Mobile PWA vs Desktop Separation
- **Mobile Cursor Optimization**:
  - Completely hid the 6-option `CURSOR SYSTEM` selector on mobile devices (`isMobile`) while keeping it interactive on desktop.
- **Battery & Performance Clamping**:
  - Clamped particle counts in `AnimatedBackground.tsx` to 25 on mobile and bypassed CPU-heavy rain/droplet simulations.
  - Bypassed hidden 60fps `<canvas>` / `<video>` PiP render loop on mobile to prevent phone thermal throttling.
- **Header Typography**:
  - Balanced `SystemHeader.tsx` font scaling (`text-sm sm:text-lg lg:text-2xl`) so title cleanly spans 2 lines on smartphone displays.

---

## [1.3.0] - 2026-10-05 — Parallel Offline Caching & Sync HUD
- **Parallel Service Worker Caching**:
  - Rebuilt offline pre-caching with multi-worker concurrent download pools.
- **Offline HUD & Sync Progress**:
  - Created `GlobalOfflineProgress.tsx` to display real-time caching status, percentage, and track counts.
- **Track Duration & Loop Fixes**:
  - Resolved audio loop bugs past `endTime` and fixed offline queue reshuffle logic.

---

## [1.2.0] - 2026-08-05 — Smart Assignment Persistence & Desktop Integration
- **Gate Assignment Smart Merge**:
  - Implemented client-side localStorage fallback merging with backend `assignments.json`.
- **Auto Git Sync**:
  - Backend automatically commits and pushes track downloads and assignment updates to Git repository.
- **Mobile Background Audio**:
  - Implemented MediaSession API metadata and audio session wake handling for basic mobile browser playback.

---

## [1.1.0] - 2026-06-04 — Desktop PyWebView & Window Controls
- **PyWebView Desktop Wrapper**:
  - Integrated `run_pywebview.py` for a frameless, native Windows desktop application.
  - Added custom titlebar controls, minimize/maximize/close actions, and custom exit confirmation modal.
  - Added `pywebview-drag-region` to prevent window dragging issues.
- **Express Backend & Streaming**:
  - Configured Express server (`backend/server.js`) with HTTP 206 Byte-Range partial content streaming for fast seeking.
  - Integrated `yt-dlp.exe` with Node child process spawn for in-app YouTube search and downloads.
  - Integrated `analyze_drops.py` using Python/librosa for automatic beat drop detection.

---

## [1.0.0] - 2026-05-19 — Core Player Architecture & Solo Leveling HUD
- **Solo Leveling Cyberpunk Interface**:
  - High-tech holographic Sci-Fi FUI design system (Orbitron, Rajdhani, Roboto Mono typography).
  - Hexagonal action buttons (`HexButton.tsx`), glowing rank borders, and animated background particles.
- **Monarch DSP Audio Engine**:
  - Web Audio API pipeline with multi-band Equalizer (Sub, Bass, Mid, Presence, Air).
  - Convolution and algorithmic Reverb effects, Bass Boost, and Atmospheric Abyss filtering.
  - Interactive circular portal visualizer (`PortalVisualizer.tsx`) and real-time frequency analyzer.
- **Gate-Based Playlist System**:
  - Categorization of tracks into dungeons/gates: BOSS THEMES (S-Rank), SHADOW HYPE (A-Rank), CHILL VOID (B-Rank), MONARCH'S DOMAIN (S-Rank), DUNGEON RUN (C-Rank), AWAKENING (??).
  - Unassigned tracks panel with quick assignment and drag/transfer capabilities.
