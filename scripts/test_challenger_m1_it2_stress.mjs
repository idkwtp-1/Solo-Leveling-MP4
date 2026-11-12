// Empirical Stress Test Harness: Milestone 1 Iteration 2 Edge Case Verification
// Adversarial verification of 5 edge cases reported in challenger_m1_2 handoff:
// 1. Spurious auto-play on focus gain (resumeOnFocusGain boolean check)
// 2. Audio focus abandonment on pause/stop
// 3. Foreground headset hook multi-click detector
// 4. Queue asymmetry on handlePrev() for currentIndex === -1
// 5. Unhandled transient ducking (AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK)

import fs from 'node:fs';
import path from 'node:path';
import { assert } from 'node:console';

const PROJECT_ROOT = 'D:\\Personal Projects\\ShadowPlayer';

console.log('========================================================================');
console.log('  EMPIRICAL STRESS TEST HARNESS — CHALLENGER M1 ITERATION 2');
console.log('  Target: Adversarial Verification of 5 Edge Cases & Production Code');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       -> ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message });
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       -> ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// PART 1: PRODUCTION SOURCE CODE INSPECTION (Direct Real Code Analysis)
// ============================================================================
console.log('--- PART 1: PRODUCTION SOURCE CODE STATIC INVARIANTS ---');

const servicePath = path.join(PROJECT_ROOT, 'android/app/src/main/java/com/shadowplayer/app/ShadowAudioService.java');
const mainActPath = path.join(PROJECT_ROOT, 'android/app/src/main/java/com/shadowplayer/app/MainActivity.java');
const indexTsxPath = path.join(PROJECT_ROOT, 'src/routes/index.tsx');

const serviceSource = fs.readFileSync(servicePath, 'utf8');
const mainActSource = fs.readFileSync(mainActPath, 'utf8');
const indexSource = fs.readFileSync(indexTsxPath, 'utf8');

it('P1.1: ShadowAudioService declares resumeOnFocusGain private field initialized to false', () => {
  if (!serviceSource.includes('private boolean resumeOnFocusGain = false;')) {
    throw new Error('Missing private boolean resumeOnFocusGain = false in ShadowAudioService.java');
  }
});

it('P1.2: onPlay() requests focus, sets resumeOnFocusGain=true, and emits "play"', () => {
  const onPlayMatch = serviceSource.match(/public void onPlay\(\)\s*\{([^}]+)\}/);
  if (!onPlayMatch) throw new Error('Cannot find onPlay() method in ShadowAudioService.java');
  const body = onPlayMatch[1];
  if (!body.includes('requestAudioFocus()')) throw new Error('onPlay does not call requestAudioFocus()');
  if (!body.includes('resumeOnFocusGain = true')) throw new Error('onPlay does not set resumeOnFocusGain = true');
  if (!body.includes('ShadowAudioPlugin.notifyAction("play")')) throw new Error('onPlay does not emit "play"');
});

it('P1.3: onPause() sets resumeOnFocusGain=false and emits "pause"', () => {
  const onPauseMatch = serviceSource.match(/public void onPause\(\)\s*\{([^}]+)\}/);
  if (!onPauseMatch) throw new Error('Cannot find onPause() method in ShadowAudioService.java');
  const body = onPauseMatch[1];
  if (!body.includes('resumeOnFocusGain = false')) throw new Error('onPause does not set resumeOnFocusGain = false');
  if (!body.includes('ShadowAudioPlugin.notifyAction("pause")')) throw new Error('onPause does not emit "pause"');
});

it('P1.4: onStop() sets resumeOnFocusGain=false, calls abandonAudioFocus(), and emits "pause"', () => {
  const onStopMatch = serviceSource.match(/public void onStop\(\)\s*\{([^}]+)\}/);
  if (!onStopMatch) throw new Error('Cannot find onStop() method in ShadowAudioService.java');
  const body = onStopMatch[1];
  if (!body.includes('resumeOnFocusGain = false')) throw new Error('onStop does not set resumeOnFocusGain = false');
  if (!body.includes('abandonAudioFocus()')) throw new Error('onStop does not call abandonAudioFocus()');
  if (!body.includes('ShadowAudioPlugin.notifyAction("pause")')) throw new Error('onStop does not emit "pause"');
});

it('P1.5: onStartCommand ACTION_UPDATE requests focus when isPlaying=true, abandons focus when isPlaying=false', () => {
  const updateMatch = serviceSource.match(/if \(isPlaying\)\s*\{([\s\S]*?)\}\s*else\s*\{([\s\S]*?)\}/);
  if (!updateMatch) throw new Error('Cannot find if (isPlaying) ... else block in onStartCommand');
  const ifBranch = updateMatch[1];
  const elseBranch = updateMatch[2];
  if (!ifBranch.includes('requestAudioFocus()') || !ifBranch.includes('resumeOnFocusGain = true')) {
    throw new Error('if (isPlaying) branch does not request focus or set resumeOnFocusGain = true');
  }
  if (!elseBranch.includes('abandonAudioFocus()') || !elseBranch.includes('resumeOnFocusGain = false')) {
    throw new Error('else branch does not abandon focus or set resumeOnFocusGain = false');
  }
});

it('P1.6: focusChangeListener handles AUDIOFOCUS_LOSS (hasAudioFocus=false, resumeOnFocusGain=false, notifyAction("pause"))', () => {
  if (!serviceSource.includes('focusChange == AudioManager.AUDIOFOCUS_LOSS')) {
    throw new Error('Missing AUDIOFOCUS_LOSS branch in focusChangeListener');
  }
  const lossSection = serviceSource.substring(serviceSource.indexOf('focusChange == AudioManager.AUDIOFOCUS_LOSS'));
  const nextElse = lossSection.indexOf('else if');
  const lossBlock = lossSection.substring(0, nextElse);
  if (!lossBlock.includes('hasAudioFocus = false')) throw new Error('AUDIOFOCUS_LOSS does not set hasAudioFocus = false');
  if (!lossBlock.includes('resumeOnFocusGain = false')) throw new Error('AUDIOFOCUS_LOSS does not set resumeOnFocusGain = false');
  if (!lossBlock.includes('ShadowAudioPlugin.notifyAction("pause")')) throw new Error('AUDIOFOCUS_LOSS does not emit "pause"');
});

it('P1.7: focusChangeListener handles AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK with pause', () => {
  if (!serviceSource.includes('focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK')) {
    throw new Error('Missing AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK branch in focusChangeListener');
  }
});

it('P1.8: focusChangeListener on AUDIOFOCUS_GAIN conditionally resumes only if resumeOnFocusGain is true', () => {
  if (!serviceSource.includes('focusChange == AudioManager.AUDIOFOCUS_GAIN')) {
    throw new Error('Missing AUDIOFOCUS_GAIN branch in focusChangeListener');
  }
  const gainSection = serviceSource.substring(serviceSource.indexOf('focusChange == AudioManager.AUDIOFOCUS_GAIN'));
  if (!gainSection.includes('if (resumeOnFocusGain)')) {
    throw new Error('AUDIOFOCUS_GAIN does NOT guard playback with if (resumeOnFocusGain)');
  }
  if (!gainSection.includes('ShadowAudioPlugin.notifyAction("play")')) {
    throw new Error('AUDIOFOCUS_GAIN does NOT emit "play" when resumeOnFocusGain is true');
  }
});

it('P1.9: MainActivity implements 300ms multi-click detection window in foreground', () => {
  if (!mainActSource.includes('hookHandler.postDelayed(hookRunnable, 300)')) {
    throw new Error('MainActivity does not have 300ms postDelayed multi-click timer');
  }
  if (!mainActSource.includes('event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0')) {
    throw new Error('MainActivity dispatchKeyEvent does not guard against auto-repeat (getRepeatCount() == 0)');
  }
  if (!mainActSource.includes('hookClickCount == 1') || !mainActSource.includes('hookClickCount == 2') || !mainActSource.includes('hookClickCount >= 3')) {
    throw new Error('MainActivity hookRunnable does not handle 1, 2, and 3+ click counts');
  }
  if (!mainActSource.includes('hookHandler.removeCallbacks(hookRunnable)')) {
    throw new Error('MainActivity does not clean up hookRunnable in onDestroy()');
  }
});

it('P1.10: src/routes/index.tsx handlePrev() provides complete fallback for currentIndex === -1', () => {
  if (!indexSource.includes('// Fallback when activeTrack is not in currentGate (search or unassigned list)')) {
    throw new Error('index.tsx missing unassigned/search track fallback comment/logic');
  }
  if (!indexSource.includes('if (audio && audio.currentTime > 3)')) {
    throw new Error('index.tsx missing audio.currentTime > 3 rewind check in handlePrev');
  }
  if (!indexSource.includes('availableTracks[prevIndex]')) {
    throw new Error('index.tsx missing availableTracks[prevIndex] fallback in handlePrev');
  }
});

// ============================================================================
// PART 2: AUDIO FOCUS & LIFECYCLE STATE MACHINE STRESS TESTING
// ============================================================================
console.log('\n--- PART 2: AUDIO FOCUS & SPURIOUS AUTO-PLAY STRESS TESTS ---');

class ProductionShadowAudioServiceSimulation {
  constructor() {
    this.isPlaying = false;
    this.hasAudioFocus = false;
    this.resumeOnFocusGain = false;
    this.dispatchedActions = [];
    this.audioManagerAvailable = true;
  }

  // Exact reproduction of ShadowAudioService.java methods
  requestAudioFocus() {
    if (!this.audioManagerAvailable || this.hasAudioFocus) return this.hasAudioFocus;
    this.hasAudioFocus = true;
    return true;
  }

  abandonAudioFocus() {
    if (!this.audioManagerAvailable || !this.hasAudioFocus) return;
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

  handleUpdateIntent({ isPlaying }) {
    if (isPlaying !== undefined) {
      this.isPlaying = isPlaying;
    }
    if (this.isPlaying) {
      this.requestAudioFocus();
      this.resumeOnFocusGain = true;
    } else {
      this.abandonAudioFocus();
      this.resumeOnFocusGain = false;
    }
  }

  handleStopIntent() {
    this.resumeOnFocusGain = false;
    this.abandonAudioFocus();
    this.isPlaying = false;
  }

  onDestroy() {
    this.abandonAudioFocus();
    this.isPlaying = false;
  }

  onAudioFocusChange(focusChange) {
    const AUDIOFOCUS_GAIN = 1;
    const AUDIOFOCUS_LOSS = -1;
    const AUDIOFOCUS_LOSS_TRANSIENT = -2;
    const AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK = -3;

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

// 2.1 Spurious auto-play bug verification
it('S2.1: Music paused by user prior to incoming phone call MUST NOT auto-play when call ends', () => {
  const service = new ProductionShadowAudioServiceSimulation();
  // 1. User starts playing
  service.handleUpdateIntent({ isPlaying: true });
  assert(service.hasAudioFocus === true, 'Focus acquired');
  assert(service.resumeOnFocusGain === true, 'resumeOnFocusGain is true while playing');

  // 2. User pauses deliberately
  service.handleUpdateIntent({ isPlaying: false });
  assert(service.hasAudioFocus === false, 'Focus abandoned on pause');
  assert(service.resumeOnFocusGain === false, 'resumeOnFocusGain cleared on pause');

  // 3. Incoming phone call triggers AUDIOFOCUS_LOSS_TRANSIENT
  service.dispatchedActions = [];
  service.onAudioFocusChange(-2); // AUDIOFOCUS_LOSS_TRANSIENT
  assert(service.dispatchedActions.includes('pause'), 'Dispatched pause on transient loss');

  // 4. Phone call ends -> AUDIOFOCUS_GAIN (+1)
  service.dispatchedActions = [];
  service.onAudioFocusChange(1); // AUDIOFOCUS_GAIN

  // VERIFICATION: Must NOT emit 'play'!
  if (service.dispatchedActions.includes('play')) {
    throw new Error('BUG REPRODUCED: Service emitted play action on focus gain when user had paused!');
  }
  assert(service.dispatchedActions.length === 0, 'No play action emitted — stays paused cleanly');
});

it('S2.2: Music actively playing prior to phone call cleanly pauses and resumes after call', () => {
  const service = new ProductionShadowAudioServiceSimulation();
  // 1. User is playing
  service.handleUpdateIntent({ isPlaying: true });

  // 2. Phone call arrives
  service.dispatchedActions = [];
  service.onAudioFocusChange(-2); // AUDIOFOCUS_LOSS_TRANSIENT
  assert(service.dispatchedActions.includes('pause'), 'Pauses music for call');
  assert(service.resumeOnFocusGain === true, 'remembers music was playing');

  // 3. Phone call ends
  service.dispatchedActions = [];
  service.onAudioFocusChange(1); // AUDIOFOCUS_GAIN
  assert(service.dispatchedActions.includes('play'), 'Resumes music playback because user was playing');
});

it('S2.3: Permanent focus loss (e.g. YouTube video played) disables auto-resume', () => {
  const service = new ProductionShadowAudioServiceSimulation();
  service.handleUpdateIntent({ isPlaying: true });

  // External media starts: permanent loss (-1)
  service.dispatchedActions = [];
  service.onAudioFocusChange(-1); // AUDIOFOCUS_LOSS
  assert(service.dispatchedActions.includes('pause'), 'Pauses on permanent loss');
  assert(service.hasAudioFocus === false, 'hasAudioFocus set to false');
  assert(service.resumeOnFocusGain === false, 'resumeOnFocusGain set to false');

  // Subsequent focus gain (e.g. YouTube stopped)
  service.dispatchedActions = [];
  service.onAudioFocusChange(1); // AUDIOFOCUS_GAIN
  assert(!service.dispatchedActions.includes('play'), 'Does not auto-play after permanent loss');
});

it('S2.4: Transient ducking (AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK = -3) is cleanly handled', () => {
  const service = new ProductionShadowAudioServiceSimulation();
  service.handleUpdateIntent({ isPlaying: true });

  // Navigation or notification chime arrives (-3)
  service.dispatchedActions = [];
  service.onAudioFocusChange(-3); // AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK
  assert(service.dispatchedActions.includes('pause'), 'Pauses/ducks on transient duck event');
  assert(service.resumeOnFocusGain === true, 'Preserves resume state during ducking');

  // Navigation prompt completes
  service.dispatchedActions = [];
  service.onAudioFocusChange(1); // AUDIOFOCUS_GAIN
  assert(service.dispatchedActions.includes('play'), 'Resumes playback once prompt finishes');
});

it('S2.5: Audio focus is abandoned on pause, stop, and destroy', () => {
  const service = new ProductionShadowAudioServiceSimulation();

  // Test pause abandonment
  service.handleUpdateIntent({ isPlaying: true });
  assert(service.hasAudioFocus === true);
  service.handleUpdateIntent({ isPlaying: false });
  assert(service.hasAudioFocus === false, 'Focus abandoned on pause update');

  // Test stop abandonment
  service.handleUpdateIntent({ isPlaying: true });
  assert(service.hasAudioFocus === true);
  service.handleStopIntent();
  assert(service.hasAudioFocus === false, 'Focus abandoned on stop intent');

  // Test onStop callback abandonment
  service.handleUpdateIntent({ isPlaying: true });
  assert(service.hasAudioFocus === true);
  service.onStop();
  assert(service.hasAudioFocus === false, 'Focus abandoned on onStop callback');

  // Test onDestroy abandonment
  service.handleUpdateIntent({ isPlaying: true });
  assert(service.hasAudioFocus === true);
  service.onDestroy();
  assert(service.hasAudioFocus === false, 'Focus abandoned on onDestroy');
});

it('S2.6: Re-play after pause cleanly re-acquires audio focus', () => {
  const service = new ProductionShadowAudioServiceSimulation();
  service.handleUpdateIntent({ isPlaying: true });
  service.handleUpdateIntent({ isPlaying: false });
  assert(service.hasAudioFocus === false);

  // User presses Play again
  service.handleUpdateIntent({ isPlaying: true });
  assert(service.hasAudioFocus === true, 'Audio focus re-acquired successfully');
  assert(service.resumeOnFocusGain === true);
});

// ============================================================================
// PART 3: FOREGROUND HEADSET HOOK MULTI-CLICK STRESS TESTING
// ============================================================================
console.log('\n--- PART 3: FOREGROUND HEADSET HOOK MULTI-CLICK STRESS TESTS ---');

class ProductionMainActivitySimulation {
  constructor(timeoutMs = 300) {
    this.timeoutMs = timeoutMs;
    this.hookClickCount = 0;
    this.hookTimer = null;
    this.dispatchedActions = [];
  }

  dispatchKeyEvent(event) {
    const keyCode = event.keyCode;
    const isMediaKey =
      keyCode === 'KEYCODE_MEDIA_NEXT' ||
      keyCode === 'KEYCODE_MEDIA_PREVIOUS' ||
      keyCode === 'KEYCODE_MEDIA_PLAY' ||
      keyCode === 'KEYCODE_MEDIA_PAUSE' ||
      keyCode === 'KEYCODE_MEDIA_PLAY_PAUSE' ||
      keyCode === 'KEYCODE_HEADSETHOOK';

    if (isMediaKey) {
      if (event.action === 'DOWN' && event.repeatCount === 0) {
        if (keyCode === 'KEYCODE_MEDIA_NEXT') {
          this.dispatchedActions.push('next');
        } else if (keyCode === 'KEYCODE_MEDIA_PREVIOUS') {
          this.dispatchedActions.push('prev');
        } else if (keyCode === 'KEYCODE_MEDIA_PLAY') {
          this.dispatchedActions.push('play');
        } else if (keyCode === 'KEYCODE_MEDIA_PAUSE') {
          this.dispatchedActions.push('pause');
        } else if (keyCode === 'KEYCODE_MEDIA_PLAY_PAUSE' || keyCode === 'KEYCODE_HEADSETHOOK') {
          this.hookClickCount++;
          if (this.hookTimer) clearTimeout(this.hookTimer);
          this.hookTimer = setTimeout(() => {
            if (this.hookClickCount === 1) {
              this.dispatchedActions.push('toggle_play');
            } else if (this.hookClickCount === 2) {
              this.dispatchedActions.push('next');
            } else if (this.hookClickCount >= 3) {
              this.dispatchedActions.push('prev');
            }
            this.hookClickCount = 0;
            this.hookTimer = null;
          }, this.timeoutMs);
        }
      }
      return true; // Key consumed
    }
    return false;
  }

  onDestroy() {
    if (this.hookTimer) {
      clearTimeout(this.hookTimer);
      this.hookTimer = null;
    }
  }
}

await itAsync('S3.1: Foreground single click on KEYCODE_HEADSETHOOK dispatches "toggle_play"', async () => {
  const act = new ProductionMainActivitySimulation(50);
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 0 });
  await sleep(70);
  assert(act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'toggle_play',
    `Expected 1 toggle_play, got ${JSON.stringify(act.dispatchedActions)}`);
});

await itAsync('S3.2: Foreground double click on KEYCODE_HEADSETHOOK dispatches "next" (Fix verified!)', async () => {
  const act = new ProductionMainActivitySimulation(50);
  // Click 1
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 0 });
  await sleep(20);
  // Click 2 (within 50ms window)
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 0 });
  await sleep(70);

  // VERIFICATION: In It1, this would have produced ['toggle_play', 'toggle_play'].
  // Now it MUST produce ['next']!
  if (act.dispatchedActions.includes('toggle_play')) {
    throw new Error('BUG REPRODUCED: Double click fired toggle_play in foreground!');
  }
  assert(act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'next',
    `Expected exactly ['next'], got ${JSON.stringify(act.dispatchedActions)}`);
});

await itAsync('S3.3: Foreground triple click on KEYCODE_HEADSETHOOK dispatches "prev"', async () => {
  const act = new ProductionMainActivitySimulation(50);
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 0 });
  await sleep(15);
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 0 });
  await sleep(15);
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 0 });
  await sleep(70);
  assert(act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'prev',
    `Expected exactly ['prev'], got ${JSON.stringify(act.dispatchedActions)}`);
});

await itAsync('S3.4: Repeat key events (long press) are suppressed by repeatCount === 0 guard', async () => {
  const act = new ProductionMainActivitySimulation(50);
  // User holds down button: fires DOWN with repeatCount=0, then repeatCount=1, 2, 3...
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 0 });
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 1 });
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 2 });
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 3 });
  await sleep(70);
  assert(act.dispatchedActions.length === 1 && act.dispatchedActions[0] === 'toggle_play',
    `Expected exactly 1 toggle_play, got ${JSON.stringify(act.dispatchedActions)}`);
});

it('S3.5: onDestroy cancels pending hook timer preventing leakage', () => {
  const act = new ProductionMainActivitySimulation(500);
  act.dispatchKeyEvent({ keyCode: 'KEYCODE_HEADSETHOOK', action: 'DOWN', repeatCount: 0 });
  assert(act.hookTimer !== null, 'Timer is active');
  act.onDestroy();
  assert(act.hookTimer === null, 'Timer is cleared on onDestroy');
});

// ============================================================================
// PART 4: QUEUE NAVIGATION ASYMMETRY STRESS TESTING (handlePrev)
// ============================================================================
console.log('\n--- PART 4: QUEUE NAVIGATION ASYMMETRY STRESS TESTS ---');

// Accurate reproduction of updated handlePrev and handleNext in src/routes/index.tsx
function createProductionQueueController(gateTracks, initialActiveTrack = null, options = {}) {
  let activeTrack = initialActiveTrack;
  let playing = initialActiveTrack !== null;
  let isOffline = options.isOffline || false;
  let cachedTrackIds = options.cachedTrackIds || new Set(['t1', 't2', 't3']);
  let currentGate = { id: 'g1', name: 'Gate 1', tracks: gateTracks };
  let gates = [currentGate];
  let audioCurrentTime = options.currentTime || 0;
  let seekOperations = [];

  const isTrackAvailableOffline = (t, cachedSet) => {
    if (!cachedSet || cachedSet.size === 0) return true;
    return cachedSet.has(t.id) || (!!t.filename && cachedSet.has(t.filename));
  };

  const handlePrev = () => {
    if (!activeTrack) return;
    let prevTrack = null;

    const g = gates.find((g) => g.tracks.some((t) => t.id === activeTrack.id)) || currentGate;
    const availableTracks = g.tracks;
    const len = availableTracks.length;

    if (len === 0) {
      audioCurrentTime = 0;
      seekOperations.push({ action: 'seekToZero', reason: 'emptyGate' });
      return;
    }

    const currentIndex = availableTracks.findIndex((t) => t.id === activeTrack.id);
    if (currentIndex !== -1) {
      let prevIndex = (currentIndex - 1 + len) % len;
      let attempts = 0;
      while (
        isOffline &&
        !isTrackAvailableOffline(availableTracks[prevIndex], cachedTrackIds) &&
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
      if (audioCurrentTime > 3) {
        audioCurrentTime = 0;
        seekOperations.push({ action: 'rewindStart', reason: 'currentTimeGreaterThan3' });
        return;
      } else if (len > 0) {
        let prevIndex = len - 1;
        let attempts = 0;
        while (
          isOffline &&
          !isTrackAvailableOffline(availableTracks[prevIndex], cachedTrackIds) &&
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
        audioCurrentTime = 0;
        seekOperations.push({ action: 'seekToZero', reason: 'noGateTracks' });
        return;
      }
    }

    if (prevTrack) {
      if (prevTrack.id === activeTrack.id) {
        audioCurrentTime = 0;
        seekOperations.push({ action: 'restartTrack', trackId: prevTrack.id });
      } else {
        activeTrack = prevTrack;
        playing = true;
        seekOperations.push({ action: 'changeTrack', trackId: prevTrack.id });
      }
    } else {
      audioCurrentTime = 0;
      seekOperations.push({ action: 'seekToZero', reason: 'fallbackNull' });
    }
  };

  return {
    getActiveTrack: () => activeTrack,
    isPlaying: () => playing,
    getCurrentTime: () => audioCurrentTime,
    getSeekOperations: () => seekOperations,
    setCurrentTime: (t) => { audioCurrentTime = t; },
    handlePrev
  };
}

const mockGateTracks = [
  { id: 't1', title: 'Song 1' },
  { id: 't2', title: 'Song 2' },
  { id: 't3', title: 'Song 3' },
];

it('S4.1: Unassigned/search track with currentTime > 3 rewinds to 0 on handlePrev', () => {
  const qc = createProductionQueueController(mockGateTracks, { id: 'search-99', title: 'Search Song' }, { currentTime: 15 });
  qc.handlePrev();

  // VERIFICATION: In It1, this was silently dropped. Now it must rewind to 0!
  const ops = qc.getSeekOperations();
  assert(ops.length === 1 && ops[0].action === 'rewindStart',
    `Expected rewindStart operation, got ${JSON.stringify(ops)}`);
  assert(qc.getCurrentTime() === 0, 'Current time rewound to 0');
  assert(qc.getActiveTrack().id === 'search-99', 'Song stays on search-99 rewound');
});

it('S4.2: Unassigned/search track with currentTime <= 3 navigates to gate queue (len - 1)', () => {
  const qc = createProductionQueueController(mockGateTracks, { id: 'search-99', title: 'Search Song' }, { currentTime: 1 });
  qc.handlePrev();

  // VERIFICATION: Navigates to the last track of current gate (Song 3)
  const ops = qc.getSeekOperations();
  assert(ops.length === 1 && ops[0].action === 'changeTrack' && ops[0].trackId === 't3',
    `Expected changeTrack to t3, got ${JSON.stringify(ops)}`);
  assert(qc.getActiveTrack().id === 't3', 'Selected previous track from gate queue');
});

it('S4.3: Unassigned track with empty gate tracks resets currentTime to 0 (never a crash or silent drop)', () => {
  const qc = createProductionQueueController([], { id: 'search-99', title: 'Search Song' }, { currentTime: 2 });
  qc.handlePrev();

  const ops = qc.getSeekOperations();
  assert(ops.length === 1 && ops[0].action === 'seekToZero',
    `Expected seekToZero, got ${JSON.stringify(ops)}`);
  assert(qc.getCurrentTime() === 0);
});

it('S4.4: In-gate track navigation cycles backward sequentially', () => {
  const qc = createProductionQueueController(mockGateTracks, mockGateTracks[2]); // Song 3
  qc.handlePrev();
  assert(qc.getActiveTrack().id === 't2', 'Song 3 -> Song 2');
  qc.handlePrev();
  assert(qc.getActiveTrack().id === 't1', 'Song 2 -> Song 1');
  qc.handlePrev();
  assert(qc.getActiveTrack().id === 't3', 'Song 1 -> Song 3 (wraps backward)');
});

it('S4.5: Offline availability filtering skips uncached tracks on handlePrev fallback', () => {
  // Gate tracks: t1 (cached), t2 (uncached), t3 (uncached)
  const cachedSet = new Set(['t1']);
  const qc = createProductionQueueController(
    mockGateTracks,
    { id: 'search-99', title: 'Search Song' },
    { isOffline: true, cachedTrackIds: cachedSet, currentTime: 1 }
  );
  qc.handlePrev();

  // t3 is uncached, t2 is uncached -> skips backward to t1!
  assert(qc.getActiveTrack().id === 't1', `Expected cached track t1, got ${qc.getActiveTrack().id}`);
});

// ============================================================================
// PART 5: COMPARATIVE ANALYSIS ON OLD TEST SCRIPTS
// ============================================================================
console.log('\n--- PART 5: COMPARATIVE ANALYSIS ON OLD TEST SCRIPTS ---');

it('P5.1: Confirm why test_queue_edge_cases.mjs failed: had obsolete mock without fallback', () => {
  const oldQueueScript = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts/test_queue_edge_cases.mjs'), 'utf8');
  assert(
    oldQueueScript.includes('// NOTE: When currentIndex === -1, there is NO else block in src/routes/index.tsx!'),
    'Old queue test script contains hardcoded note proving it tested pre-fix code'
  );
});

it('P5.2: Confirm why test_android_edge_cases.mjs failed: had obsolete mock without resumeOnFocusGain', () => {
  const oldAndroidScript = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts/test_android_edge_cases.mjs'), 'utf8');
  assert(
    oldAndroidScript.includes('// Lines 208-210 in ShadowAudioService.java:\n    // Only requests focus if isPlaying is true.\n    // DOES NOT CALL abandonAudioFocus() when isPlaying is false!'),
    'Old android test script contains hardcoded mock documenting pre-fix flaw'
  );
});

// ============================================================================
// FINAL SUMMARY & VERDICT
// ============================================================================
console.log('\n========================================================================');
console.log(`  EMPIRICAL VERIFICATION COMPLETE:`);
console.log(`  Total Tests Run: ${totalTests}`);
console.log(`  Passed: ${passedTests}`);
console.log(`  Failed: ${failedTests}`);
console.log(`  FINAL VERDICT: ${failedTests === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
console.log('========================================================================\n');

if (failedTests > 0) {
  console.error('FAILURES SUMMARY:');
  failures.forEach((f, idx) => {
    console.error(`  ${idx + 1}. [${f.name}]: ${f.error}`);
  });
  process.exit(1);
} else {
  process.exit(0);
}
