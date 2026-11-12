// scripts/test_m1_adversarial_it2.mjs
// Adversarial Stress Harness for Milestone 1 Iteration 2 Remediation
// Author: Challenger M1 It2 1 (Empirical Remediation Challenger)

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ROOT = 'D:\\Personal Projects\\ShadowPlayer';

console.log('========================================================================');
console.log('  CHALLENGER M1 IT2: ADVERSARIAL EMPIRICAL VERIFICATION HARNESS');
console.log('  Stress-testing: Headset hook timing, key repeat suppression,');
console.log('                  queue fallback, focus state machine, APK binary');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    if (details) console.log(`       Evidence: ${details}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       Details: ${details}`);
    failCount++;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// PART 1: MainActivity Multi-Click Headset Hook Simulation
// ============================================================================
console.log('--- 1. FOREGROUND HEADSET HOOK MULTI-CLICK TIMING & REPEAT SUPPRESSION ---');

class MainActivityDispatcher {
  constructor(timeoutMs = 300) {
    this.timeoutMs = timeoutMs;
    this.hookClickCount = 0;
    this.hookTimer = null;
    this.dispatchedActions = [];
    this.isDestroyed = false;
  }

  // Exact reproduction of MainActivity.java Runnable
  hookRunnable() {
    if (this.isDestroyed) return;
    if (this.hookClickCount === 1) {
      this.dispatchedActions.push('toggle_play');
    } else if (this.hookClickCount === 2) {
      this.dispatchedActions.push('next');
    } else if (this.hookClickCount >= 3) {
      this.dispatchedActions.push('prev');
    }
    this.hookClickCount = 0;
  }

  // Exact reproduction of MainActivity.java dispatchKeyEvent
  dispatchKeyEvent(event) {
    const { keyCode, action, repeatCount } = event;
    const ACTION_DOWN = 0;
    const ACTION_UP = 1;
    const KEYCODE_MEDIA_NEXT = 87;
    const KEYCODE_MEDIA_PREVIOUS = 88;
    const KEYCODE_MEDIA_PLAY = 126;
    const KEYCODE_MEDIA_PAUSE = 127;
    const KEYCODE_MEDIA_PLAY_PAUSE = 85;
    const KEYCODE_HEADSETHOOK = 79;

    const isMediaKey = (
      keyCode === KEYCODE_MEDIA_NEXT ||
      keyCode === KEYCODE_MEDIA_PREVIOUS ||
      keyCode === KEYCODE_MEDIA_PLAY ||
      keyCode === KEYCODE_MEDIA_PAUSE ||
      keyCode === KEYCODE_MEDIA_PLAY_PAUSE ||
      keyCode === KEYCODE_HEADSETHOOK
    );

    if (isMediaKey) {
      if (action === ACTION_DOWN && repeatCount === 0) {
        if (keyCode === KEYCODE_MEDIA_NEXT) {
          this.dispatchedActions.push('next');
        } else if (keyCode === KEYCODE_MEDIA_PREVIOUS) {
          this.dispatchedActions.push('prev');
        } else if (keyCode === KEYCODE_MEDIA_PLAY) {
          this.dispatchedActions.push('play');
        } else if (keyCode === KEYCODE_MEDIA_PAUSE) {
          this.dispatchedActions.push('pause');
        } else if (keyCode === KEYCODE_MEDIA_PLAY_PAUSE || keyCode === KEYCODE_HEADSETHOOK) {
          this.hookClickCount++;
          if (this.hookTimer) clearTimeout(this.hookTimer);
          this.hookTimer = setTimeout(() => this.hookRunnable(), this.timeoutMs);
        }
      }
      return true; // Intercepted
    }

    return false; // Delegated to super
  }

  onDestroy() {
    if (this.hookTimer) {
      clearTimeout(this.hookTimer);
      this.hookTimer = null;
    }
    this.isDestroyed = true;
  }
}

// 1.1 Single Click Hook
{
  const act = new MainActivityDispatcher(60);
  const handled = act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 }); // ACTION_DOWN
  act.dispatchKeyEvent({ keyCode: 79, action: 1, repeatCount: 0 }); // ACTION_UP
  assert(handled === true, 'HeadsetHook Single: dispatchKeyEvent returns true');
  assert(act.dispatchedActions.length === 0, 'HeadsetHook Single: No immediate action before timeout');
  await sleep(80);
  assert(
    act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'toggle_play',
    'HeadsetHook Single: Emits "toggle_play" after window expires',
    `Actions: [${act.dispatchedActions}]`
  );
}

// 1.2 Double Click Hook -> Next
{
  const act = new MainActivityDispatcher(60);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 }); // Click 1 DOWN
  act.dispatchKeyEvent({ keyCode: 79, action: 1, repeatCount: 0 }); // Click 1 UP
  await sleep(20);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 }); // Click 2 DOWN
  act.dispatchKeyEvent({ keyCode: 79, action: 1, repeatCount: 0 }); // Click 2 UP
  await sleep(80);
  assert(
    act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'next',
    'HeadsetHook Double: Emits "next" (and NO toggle_play)',
    `Actions: [${act.dispatchedActions}]`
  );
}

// 1.3 Triple Click Hook -> Prev
{
  const act = new MainActivityDispatcher(60);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 });
  await sleep(15);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 });
  await sleep(15);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 });
  await sleep(80);
  assert(
    act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'prev',
    'HeadsetHook Triple: Emits "prev" (and NO toggle_play/next)',
    `Actions: [${act.dispatchedActions}]`
  );
}

// 1.4 Quadruple Click Hook -> Prev (clamp >= 3)
{
  const act = new MainActivityDispatcher(60);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 });
  await sleep(10);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 });
  await sleep(10);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 });
  await sleep(10);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 });
  await sleep(80);
  assert(
    act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'prev',
    'HeadsetHook Quadruple: Emits "prev" without error',
    `Actions: [${act.dispatchedActions}]`
  );
}

// 1.5 KEYCODE_MEDIA_PLAY_PAUSE behaves identically to HEADSETHOOK
{
  const act = new MainActivityDispatcher(60);
  act.dispatchKeyEvent({ keyCode: 85, action: 0, repeatCount: 0 }); // Double click on PLAY_PAUSE
  await sleep(20);
  act.dispatchKeyEvent({ keyCode: 85, action: 0, repeatCount: 0 });
  await sleep(80);
  assert(
    act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'next',
    'MEDIA_PLAY_PAUSE (85) Double: Routes through multi-click handler to "next"',
    `Actions: [${act.dispatchedActions}]`
  );
}

// 1.6 Key Repeat Suppression: Long Press on KEYCODE_HEADSETHOOK
{
  const act = new MainActivityDispatcher(60);
  // User holds down headset hook button for 500ms (Android fires repeat events)
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 }); // Initial press
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 1 }); // Repeat 1
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 2 }); // Repeat 2
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 3 }); // Repeat 3
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 4 }); // Repeat 4
  await sleep(80);
  act.dispatchKeyEvent({ keyCode: 79, action: 1, repeatCount: 0 }); // Release
  assert(
    act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'toggle_play',
    'Repeat Suppression: Holding headset hook does NOT trigger runaway multi-click (count remains 1)',
    `Actions: [${act.dispatchedActions}]`
  );
}

// 1.7 Key Repeat Suppression: Long Press on KEYCODE_MEDIA_NEXT
{
  const act = new MainActivityDispatcher(60);
  // Holding NEXT button sends 1 initial down and 10 repeats
  act.dispatchKeyEvent({ keyCode: 87, action: 0, repeatCount: 0 });
  for (let r = 1; r <= 10; r++) {
    const handled = act.dispatchKeyEvent({ keyCode: 87, action: 0, repeatCount: r });
    assert(handled === true, `Repeat ${r} of NEXT: returns true (intercepted)`);
  }
  act.dispatchKeyEvent({ keyCode: 87, action: 1, repeatCount: 0 });
  assert(
    act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'next',
    'Repeat Suppression: Holding KEYCODE_MEDIA_NEXT triggers exactly 1 "next" action, not 11',
    `Action count: ${act.dispatchedActions.length}`
  );
}

// 1.8 Unhandled Key Pass-Through
{
  const act = new MainActivityDispatcher(60);
  const KEYCODE_VOLUME_UP = 24;
  const handled = act.dispatchKeyEvent({ keyCode: KEYCODE_VOLUME_UP, action: 0, repeatCount: 0 });
  assert(
    handled === false,
    'Unhandled Key: Non-media key (e.g. VOLUME_UP) delegates to super (returns false)'
  );
}

// 1.9 Component Destruction Callback Cleanup
{
  const act = new MainActivityDispatcher(60);
  act.dispatchKeyEvent({ keyCode: 79, action: 0, repeatCount: 0 }); // Click queued
  act.onDestroy(); // Activity destroyed at t=10ms
  await sleep(80);
  assert(
    act.dispatchedActions.length === 0,
    'Lifecycle Cleanup: onDestroy removes pending hookHandler callback, emitting nothing',
    `Action count: ${act.dispatchedActions.length}`
  );
}


// ============================================================================
// PART 2: Queue Fallback Logic in src/routes/index.tsx (handlePrev & handleNext)
// ============================================================================
console.log('\n--- 2. QUEUE FALLBACK LOGIC IN src/routes/index.tsx ---');

class PlayerQueueModel {
  constructor(options = {}) {
    this.gates = options.gates || [
      {
        id: 'gate-e',
        name: 'E-Rank Gate',
        tracks: [
          { id: 'track-1', title: 'Awakening' },
          { id: 'track-2', title: 'Dungeon Boss' },
          { id: 'track-3', title: 'Arise' }
        ]
      }
    ];
    this.activeGate = this.gates[0];
    this.activeTrack = options.activeTrack || this.activeGate.tracks[0];
    this.isOffline = options.isOffline || false;
    this.cachedTrackIds = options.cachedTrackIds || new Set(['track-1', 'track-2', 'track-3']);
    this.globalShuffleActive = options.globalShuffleActive || false;
    this.shuffle = options.shuffle || false;
    this.repeatMode = options.repeatMode || 'none';
    this.audioCurrentTime = options.currentTime || 0;
    this.playing = options.playing !== undefined ? options.playing : true;
    this.replayCount = 0;
  }

  isTrackAvailableOffline(track) {
    if (!this.cachedTrackIds) return false;
    return this.cachedTrackIds.has(track.id);
  }

  // Exact reproduction of src/routes/index.tsx handlePrev()
  handlePrev() {
    if (!this.activeTrack) return;
    let prevTrack = null;

    if (this.globalShuffleActive) {
      const allGateTracks = this.gates.flatMap((g) => g.tracks);
      const playable = allGateTracks.filter(
        (t) => !this.isOffline || this.isTrackAvailableOffline(t)
      );
      if (playable.length > 0) {
        if (playable.length === 1) {
          prevTrack = playable[0];
        } else {
          const filtered = playable.filter((t) => t.id !== this.activeTrack.id);
          const candidates = filtered.length > 0 ? filtered : playable;
          prevTrack = candidates[0]; // deterministic mock
        }
      }
    } else {
      const currentGate =
        this.gates.find((g) => g.tracks.some((t) => t.id === this.activeTrack.id)) ||
        this.activeGate;
      const availableTracks = currentGate.tracks;
      const len = availableTracks.length;
      if (len === 0) {
        this.audioCurrentTime = 0;
        return;
      }

      if (this.shuffle) {
        const playable = availableTracks.filter(
          (t) => !this.isOffline || this.isTrackAvailableOffline(t)
        );
        if (playable.length > 0) {
          if (playable.length === 1) {
            prevTrack = playable[0];
          } else {
            const filtered = playable.filter((t) => t.id !== this.activeTrack.id);
            const candidates = filtered.length > 0 ? filtered : playable;
            prevTrack = candidates[0];
          }
        }
      } else {
        const currentIndex = availableTracks.findIndex((t) => t.id === this.activeTrack.id);
        if (currentIndex !== -1) {
          let prevIndex = (currentIndex - 1 + len) % len;
          let attempts = 0;
          while (
            this.isOffline &&
            !this.isTrackAvailableOffline(availableTracks[prevIndex]) &&
            attempts < len
          ) {
            prevIndex = (prevIndex - 1 + len) % len;
            attempts++;
          }
          if (attempts < len) {
            prevTrack = availableTracks[prevIndex];
          }
        } else {
          // Fallback when activeTrack is not in currentGate (search or unassigned list)
          if (this.audioCurrentTime > 3) {
            this.audioCurrentTime = 0;
            return;
          } else if (len > 0) {
            let prevIndex = len - 1;
            let attempts = 0;
            while (
              this.isOffline &&
              !this.isTrackAvailableOffline(availableTracks[prevIndex]) &&
              attempts < len
            ) {
              prevIndex = (prevIndex - 1 + len) % len;
              attempts++;
            }
            if (attempts < len) {
              prevTrack = availableTracks[prevIndex];
            } else {
              prevTrack = availableTracks[0];
            }
          } else {
            this.audioCurrentTime = 0;
            return;
          }
        }
      }
    }

    if (prevTrack) {
      if (prevTrack.id === this.activeTrack.id) {
        this.audioCurrentTime = 0;
        this.replayCount++;
      } else {
        this.activeTrack = prevTrack;
        this.playing = true;
      }
    } else {
      this.audioCurrentTime = 0;
    }
  }
}

// 2.1 Standard sequential prev
{
  const q = new PlayerQueueModel();
  q.activeTrack = q.gates[0].tracks[1]; // track-2
  q.handlePrev();
  assert(
    q.activeTrack.id === 'track-1',
    'Queue Prev: Navigates backwards from track-2 to track-1'
  );
  q.handlePrev();
  assert(
    q.activeTrack.id === 'track-3',
    'Queue Prev Wrap: From track-1 wraps around to track-3 (len-1)'
  );
}

// 2.2 Unassigned track (currentIndex === -1) with audio.currentTime > 3
{
  const unassignedTrack = { id: 'search-unassigned-99', title: 'Solo Leveling OST' };
  const q = new PlayerQueueModel({
    activeTrack: unassignedTrack,
    currentTime: 15.5 // 15.5 seconds into playback
  });

  q.handlePrev();
  assert(
    q.activeTrack.id === 'search-unassigned-99' && q.audioCurrentTime === 0,
    'Queue Fallback (currentTime > 3): Rewinds current unassigned track to 0 without switching track',
    `Track: ${q.activeTrack.id}, Time: ${q.audioCurrentTime}`
  );
}

// 2.3 Unassigned track (currentIndex === -1) with audio.currentTime <= 3
{
  const unassignedTrack = { id: 'search-unassigned-99', title: 'Solo Leveling OST' };
  const q = new PlayerQueueModel({
    activeTrack: unassignedTrack,
    currentTime: 1.5 // only 1.5 seconds into playback
  });

  q.handlePrev();
  assert(
    q.activeTrack.id === 'track-3',
    'Queue Fallback (currentTime <= 3): Falls back to end of gate queue (track-3)',
    `Track: ${q.activeTrack.id}`
  );
}

// 2.4 Empty gate playlist (len === 0)
{
  const unassignedTrack = { id: 'search-unassigned-99', title: 'Solo Leveling OST' };
  const q = new PlayerQueueModel({
    gates: [{ id: 'empty-gate', name: 'Empty', tracks: [] }],
    activeTrack: unassignedTrack,
    currentTime: 2.0
  });

  q.handlePrev();
  assert(
    q.audioCurrentTime === 0,
    'Queue Fallback (Empty Gate): Safely resets currentTime to 0 without exception or no-op crash',
    `Time: ${q.audioCurrentTime}`
  );
}

// 2.5 Single track gate loop
{
  const soloTrack = { id: 'solo-1', title: 'Solo' };
  const q = new PlayerQueueModel({
    gates: [{ id: 'gate-solo', name: 'Solo Gate', tracks: [soloTrack] }],
    activeTrack: soloTrack,
    currentTime: 45
  });

  q.handlePrev();
  assert(
    q.activeTrack.id === 'solo-1' && q.audioCurrentTime === 0 && q.replayCount === 1,
    'Queue Fallback (Single Track): Replays current track from 0',
    `Replay count: ${q.replayCount}`
  );
}

// 2.6 Offline mode filtering in handlePrev()
{
  const t1 = { id: 'track-1', title: 'T1' };
  const t2 = { id: 'track-2', title: 'T2' };
  const t3 = { id: 'track-3', title: 'T3' };
  const q = new PlayerQueueModel({
    gates: [{ id: 'gate-1', name: 'G1', tracks: [t1, t2, t3] }],
    activeTrack: t3,
    isOffline: true,
    cachedTrackIds: new Set(['track-1']) // only track-1 is downloaded
  });

  // From track-3, track-2 is offline, should skip to track-1
  q.handlePrev();
  assert(
    q.activeTrack.id === 'track-1',
    'Queue Prev Offline: Skips offline-unavailable track-2 and selects cached track-1',
    `Active: ${q.activeTrack.id}`
  );
}


// ============================================================================
// PART 3: ShadowAudioService Audio Focus State Machine Simulation
// ============================================================================
console.log('\n--- 3. AUDIO FOCUS LIFECYCLE & ANTI-DEADLOCK STATE MACHINE ---');

class ShadowAudioServiceModel {
  constructor() {
    this.isPlaying = false;
    this.hasAudioFocus = false;
    this.resumeOnFocusGain = false;
    this.dispatchedActions = [];
  }

  requestAudioFocus() {
    this.hasAudioFocus = true;
    return true;
  }

  abandonAudioFocus() {
    this.hasAudioFocus = false;
  }

  onPlay() {
    this.requestAudioFocus();
    this.resumeOnFocusGain = true;
    this.dispatchedActions.push('play');
  }

  onPause() {
    this.resumeOnFocusGain = false;
    this.dispatchedActions.push('pause');
  }

  onStop() {
    this.resumeOnFocusGain = false;
    this.abandonAudioFocus();
    this.dispatchedActions.push('pause');
  }

  onUpdate(isPlaying) {
    this.isPlaying = isPlaying;
    if (this.isPlaying) {
      this.requestAudioFocus();
      this.resumeOnFocusGain = true;
    } else {
      this.abandonAudioFocus();
      this.resumeOnFocusGain = false;
    }
  }

  onAudioFocusChange(focusChange) {
    const AUDIOFOCUS_LOSS = -1;
    const AUDIOFOCUS_LOSS_TRANSIENT = -2;
    const AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK = -3;
    const AUDIOFOCUS_GAIN = 1;

    if (focusChange === AUDIOFOCUS_LOSS) {
      this.hasAudioFocus = false;
      this.resumeOnFocusGain = false;
      this.dispatchedActions.push('pause');
    } else if (focusChange === AUDIOFOCUS_LOSS_TRANSIENT) {
      this.dispatchedActions.push('pause');
    } else if (focusChange === AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
      this.dispatchedActions.push('pause');
    } else if (focusChange === AUDIOFOCUS_GAIN) {
      this.hasAudioFocus = true;
      if (this.resumeOnFocusGain) {
        this.dispatchedActions.push('play');
      }
    }
  }
}

// 3.1 Focus Loss Permanent
{
  const svc = new ShadowAudioServiceModel();
  svc.onPlay(); // playing
  assert(svc.hasAudioFocus === true && svc.resumeOnFocusGain === true, 'Focus: onPlay sets hasAudioFocus and resumeOnFocusGain');

  svc.onAudioFocusChange(-1); // AUDIOFOCUS_LOSS
  assert(
    svc.hasAudioFocus === false && svc.resumeOnFocusGain === false,
    'Focus Permanent Loss: Clears hasAudioFocus and resumeOnFocusGain'
  );

  // Subsequent spurious GAIN should NOT auto-resume
  svc.onAudioFocusChange(1); // AUDIOFOCUS_GAIN
  const playCountAfterGain = svc.dispatchedActions.filter(a => a === 'play').length;
  assert(
    playCountAfterGain === 1,
    'Focus Permanent Loss: Spurious AUDIOFOCUS_GAIN does NOT auto-play after permanent loss',
    `Play actions: ${playCountAfterGain}`
  );
}

// 3.2 Transient Focus Loss & Recovery (e.g. Navigation prompt or incoming ring)
{
  const svc = new ShadowAudioServiceModel();
  svc.onPlay();
  svc.onAudioFocusChange(-2); // AUDIOFOCUS_LOSS_TRANSIENT
  assert(
    svc.resumeOnFocusGain === true && svc.dispatchedActions[svc.dispatchedActions.length - 1] === 'pause',
    'Focus Transient: Pauses music but keeps resumeOnFocusGain=true'
  );

  svc.onAudioFocusChange(1); // AUDIOFOCUS_GAIN
  assert(
    svc.dispatchedActions[svc.dispatchedActions.length - 1] === 'play',
    'Focus Transient Recovery: Resumes playback on AUDIOFOCUS_GAIN'
  );
}

// 3.3 User Manual Pause Prevents Auto-Resume on Focus Gain
{
  const svc = new ShadowAudioServiceModel();
  svc.onPlay();
  svc.onPause(); // User manually paused!
  assert(svc.resumeOnFocusGain === false, 'User Pause: Clears resumeOnFocusGain');

  svc.onAudioFocusChange(1); // Call ends or notification clears
  assert(
    svc.dispatchedActions[svc.dispatchedActions.length - 1] === 'pause',
    'No Spurious Auto-Resume: AUDIOFOCUS_GAIN does not play music if user explicitly paused'
  );
}


// ============================================================================
// PART 4: Binary APK Inspection & Production File Integrity
// ============================================================================
console.log('\n--- 4. BINARY APK ARTIFACT & ASSET INSPECTION ---');

const apkPath = path.join(PROJECT_ROOT, 'android/app/build/outputs/apk/debug/app-debug.apk');

assert(fs.existsSync(apkPath), `APK Exists: ${apkPath}`);
const apkStats = fs.statSync(apkPath);
assert(
  apkStats.size > 180 * 1024 * 1024,
  `APK Size: ${apkStats.size} bytes (~${(apkStats.size / (1024*1024)).toFixed(1)} MB) conforms to bundled audio requirements (>180 MB)`
);

// Verify Android Manifest in source matches APK build requirements
const manifestPath = path.join(PROJECT_ROOT, 'android/app/src/main/AndroidManifest.xml');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

assert(
  manifestContent.includes('androidx.media.session.MediaButtonReceiver'),
  'Manifest: MediaButtonReceiver declared'
);
assert(
  manifestContent.includes('android.intent.action.MEDIA_BUTTON'),
  'Manifest: MEDIA_BUTTON intent filter configured'
);
assert(
  manifestContent.includes('android:foregroundServiceType="mediaPlayback"'),
  'Manifest: mediaPlayback foregroundServiceType configured'
);

// Verify MainActivity.java contains the exact remediated multi-click handler
const mainActPath = path.join(PROJECT_ROOT, 'android/app/src/main/java/com/shadowplayer/app/MainActivity.java');
const mainActContent = fs.readFileSync(mainActPath, 'utf8');

assert(
  mainActContent.includes('private final Handler hookHandler = new Handler(Looper.getMainLooper());'),
  'MainActivity.java: hookHandler initialized with MainLooper'
);
assert(
  mainActContent.includes('hookHandler.postDelayed(hookRunnable, 300);'),
  'MainActivity.java: 300ms multi-click detection window postDelayed'
);
assert(
  mainActContent.includes('event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0'),
  'MainActivity.java: getRepeatCount() == 0 repeat suppression guard present'
);
assert(
  mainActContent.includes('hookHandler.removeCallbacks(hookRunnable);'),
  'MainActivity.java: hookHandler.removeCallbacks in onDestroy'
);

// Verify src/routes/index.tsx contains handlePrev fallback
const indexTsxPath = path.join(PROJECT_ROOT, 'src/routes/index.tsx');
const indexContent = fs.readFileSync(indexTsxPath, 'utf8');

assert(
  indexContent.includes('// Fallback when activeTrack is not in currentGate (search or unassigned list)'),
  'index.tsx: handlePrev includes comment & implementation for search/unassigned fallback'
);
assert(
  indexContent.includes('if (audio && audio.currentTime > 3)'),
  'index.tsx: handlePrev includes audio.currentTime > 3 rewind fallback'
);
assert(
  indexContent.includes('prevTrack = availableTracks[prevIndex];') &&
  indexContent.includes('prevTrack = availableTracks[0];'),
  'index.tsx: handlePrev includes gate track fallback for unassigned tracks'
);


// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n========================================================================');
console.log(`  EMPIRICAL CHALLENGER VERIFICATION: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`  FINAL VERDICT: ${failCount === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
console.log('========================================================================\n');

process.exit(failCount === 0 ? 0 : 1);
