# QA_HANDOFF_PART1

## Environment Status & Access Method
- **Status:** Running locally via Vite dev server (port 8081) and Node/Express backend for API.
- **Access Method:** `http://localhost:8081` (Client), `http://localhost:3000` (Backend API). Desktop application launched via `ShadowPlayer.vbs`.
- **Data Layer:** Local file system (`backend/media/tracks_inventory.json` and downloaded `.mp3` files). No traditional database.
- **External Dependencies:** `yt-dlp` (for YouTube downloading), standard React ecosystem dependencies (Vite, Tailwind, Framer Motion), Web Audio API.

## Core Category Applicability
1. **UI & Visual:** APPLY - React frontend with custom aesthetic (Shadow Player).
2. **Functionality & Designed Behavior:** APPLY - Core audio player, settings, queues.
3. **Accessibility:** APPLY - Keyboard nav, screen reader support.
4. **Backend & API:** APPLY - Node/Express backend serving local media and proxying downloads.
5. **Data Validation:** APPLY - YouTube search input validation.
6. **Database & Persistence:** APPLY - Local JSON inventory and filesystem operations.
7. **Security:** APPLY - Command injection risks with `yt-dlp` inputs, path traversal risks for local media.
8. **Error Handling:** APPLY - Network failures, download failures, API timeouts.
9. **Performance:** APPLY - Audio DSP nodes, Framer Motion animations, canvas effects.
10. **Business Logic & Application Correctness:** APPLY - Track queuing, looping, playlist management.
11. **Cross-Client Consistency:** N/A - Single-user local desktop application.
12. **Console & Log Audit:** APPLY - Tracking silent errors and debug leftovers.

## Specialized Module Applicability
- **Module A: External API & Third-Party Services:** APPLY - Interacts with YouTube (via yt-dlp) for search and downloads.
- **Module B: Media, File Handling & Downloads:** APPLY - Core function is downloading and playing media files.
- **Module C: Real-Time, Hardware & Device Features:** N/A - No webcam/mic/GPU specific features beyond standard Web Audio.
- **Module D: Local Persistence & Offline Behavior:** APPLY - Reads/writes to local filesystem.
- **Module E: Computed Values, Formulas & Gamification:** N/A - No scores, budgets, or gamification.
- **Module F: Filtering, Search & Sort Systems:** APPLY - YouTube search drawer.
- **Module G: Video & Audio Playback:** APPLY - Custom HTML5 Audio + Web Audio API player.
- **Module H: Cloud Sync & Multi-Device:** N/A - Local only.
- **Module I: Local Network & Cross-Device Transfer:** N/A - Local only.

## Full Numbered Test Plan (Combined QA & AI Slop Audit)

### Phase 1: Static Code Audit & "AI Slop" Review (Pre-UI)
1. **Code Smells & Formatting (Slop #1):** Audit `index.tsx`, `server.js`, and components for inconsistent naming, leftover debug logs, generic comments, and mixed formatting.
2. **Duplication & Local Health (Slop #4):** Identify near-duplicate functions, magic numbers, or deeply nested conditionals.
3. **Architecture (Slop #5):** Review `index.tsx` (currently ~1900 lines) for God-file anti-patterns and mixed concerns.
4. **Dependency Bloat (Slop #8):** Review `package.json` for unused, outdated, or hallucinated packages.
5. **Documentation (Slop #11):** Review README (or `plan.md`) for setup accuracy.

### Phase 2: Category 1-6 & Modules A, B, D (Batch 1 functional)
6. **UI & Visual (Cat 1 + Slop #2, #3):** Verify Shadow Player aesthetic (Neon blue/purple, strict fonts, no generic slop UI). Check all buttons, states, and mobile responsiveness. Check copy for AI buzzwords.
7. **Element Inventory (Cat 2):** Test every button (Play/Pause, Prev/Next, Shuffle, Repeat, DSP sliders, Search toggles, Download buttons).
8. **Audio Playback (Module G):** Verify play, pause, volume, DSP engine, EQ sliders, track looping, and transition.
9. **Media & Downloads (Module B):** Trigger YouTube downloads, verify progress bar, speed, ETA, and final MP3 integrity.
10. **Backend & API (Cat 4 + Slop #7):** Test `/api/youtube/search` and `/api/youtube/download`. Test with invalid URLs. Check rate limiting behavior. Verify no silent failures.
11. **Persistence (Cat 6, Module D):** Verify downloaded tracks are appended to `tracks_inventory.json` and persist across restarts.
12. **Accessibility (Cat 3 + Slop #10):** Verify keyboard navigation for the audio player and search drawer. Check alt text and ARIA.
13. **Data Validation (Cat 5):** Submit empty/malformed queries to search drawer.

### Phase 3: Category 7-12 & Module F (Batch 2 functional & Security)
14. **Security - Injection & Secrets (Cat 7 + Slop #9):** Attempt command injection through the YouTube search input (e.g., passing `& rm -rf` style payloads to `yt-dlp`). Check for hardcoded API keys.
15. **Security - Path Traversal (Cat 7):** Attempt to read files outside `backend/media` via API requests.
16. **Error Handling (Cat 8):** Block network mid-download. Provide invalid video IDs. Verify UI shows graceful errors without crashing (Regression check for recent CatchBoundary crash).
17. **Performance (Cat 9 + Slop #6):** Check for memory leaks in the 2s polling interval for downloads. Verify Web Audio API doesn't cause main thread blocking.
18. **Business Logic (Cat 10 + Slop #12):** Verify queue logic (Shuffle, Repeat 1, Repeat All). Verify track trimming logic (using `duration` to calculate `endTime`).
19. **Search System (Module F):** Test exact matches, partial matches, and empty states in YouTube Search Drawer.
20. **Console Audit (Cat 12):** Monitor browser console and node terminal for unexpected errors throughout testing.

## Blockers / Notes for Next Session
- `index.tsx` is very large (~1900 lines) which may flag as an "AI Slop" architecture issue (God file). Refactoring might be suggested but shouldn't break existing functionality.
- The `isLocalApp` ReferenceError crash was recently fixed. Regression test the initial load sequence thoroughly.
