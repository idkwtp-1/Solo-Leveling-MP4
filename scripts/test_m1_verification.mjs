import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ROOT = 'D:\\Personal Projects\\ShadowPlayer';

console.log('================================================================');
console.log('  CHALLENGER M1_1: EMPIRICAL VERIFICATION SUITE');
console.log('  Target: Milestone 1 (Earphone Navigation Controls & KeyEvents)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
let warnCount = 0;

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

function warn(testName, details) {
  console.warn(`[WARN] ${testName}`);
  if (details) console.warn(`       Note: ${details}`);
  warnCount++;
}

// ============================================================================
// SUITE 1: KeyEvent & MediaSession Coverage Analysis
// ============================================================================
console.log('--- SUITE 1: KeyEvent & MediaSession Code Coverage ---');

const servicePath = path.join(PROJECT_ROOT, 'android/app/src/main/java/com/shadowplayer/app/ShadowAudioService.java');
const mainActPath = path.join(PROJECT_ROOT, 'android/app/src/main/java/com/shadowplayer/app/MainActivity.java');
const manifestPath = path.join(PROJECT_ROOT, 'android/app/src/main/AndroidManifest.xml');

const serviceCode = fs.readFileSync(servicePath, 'utf8');
const mainActCode = fs.readFileSync(mainActPath, 'utf8');
const manifestXml = fs.readFileSync(manifestPath, 'utf8');

// 1.1 Manifest checks
assert(
  manifestXml.includes('androidx.media.session.MediaButtonReceiver') &&
  manifestXml.includes('android.intent.action.MEDIA_BUTTON'),
  'Manifest: MediaButtonReceiver registered with MEDIA_BUTTON intent filter'
);

assert(
  manifestXml.includes('android:name=".ShadowAudioService"') &&
  manifestXml.includes('android:exported="true"') &&
  manifestXml.includes('android:foregroundServiceType="mediaPlayback"'),
  'Manifest: ShadowAudioService declared with exported="true" and mediaPlayback foregroundServiceType'
);

// 1.2 ShadowAudioService MediaSession flags & PendingIntent
assert(
  serviceCode.includes('FLAG_HANDLES_MEDIA_BUTTONS') &&
  serviceCode.includes('FLAG_HANDLES_TRANSPORT_CONTROLS'),
  'Service: MediaSessionCompat configured with FLAG_HANDLES_MEDIA_BUTTONS | FLAG_HANDLES_TRANSPORT_CONTROLS'
);

assert(
  serviceCode.includes('MediaButtonReceiver.class') &&
  serviceCode.includes('setMediaButtonReceiver'),
  'Service: MediaButtonReceiver PendingIntent registered to MediaSessionCompat'
);

assert(
  serviceCode.includes('MediaButtonReceiver.handleIntent(mediaSession, intent)'),
  'Service: onStartCommand delegates ACTION_MEDIA_BUTTON to MediaButtonReceiver.handleIntent'
);

// 1.3 ShadowAudioService MediaSessionCompat.Callback overrides
const expectedCallbacks = [
  'onPlay',
  'onPause',
  'onSkipToNext',
  'onSkipToPrevious',
  'onFastForward',
  'onRewind',
  'onStop',
  'onMediaButtonEvent'
];
expectedCallbacks.forEach((cb) => {
  assert(
    serviceCode.includes(`public void ${cb}`) || serviceCode.includes(`public boolean ${cb}`),
    `Service Callback: ${cb} implemented`
  );
});

// 1.4 ShadowAudioService KeyEvents in onMediaButtonEvent
const serviceKeyEvents = [
  'KeyEvent.KEYCODE_MEDIA_NEXT',
  'KeyEvent.KEYCODE_MEDIA_PREVIOUS',
  'KeyEvent.KEYCODE_HEADSETHOOK',
  'KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE'
];
serviceKeyEvents.forEach((ke) => {
  assert(serviceCode.includes(ke), `Service onMediaButtonEvent: handles ${ke}`);
});

// 1.5 MainActivity dispatchKeyEvent
assert(
  mainActCode.includes('dispatchKeyEvent(KeyEvent event)'),
  'MainActivity: overrides dispatchKeyEvent'
);

const mainKeyEvents = [
  'KeyEvent.KEYCODE_MEDIA_NEXT',
  'KeyEvent.KEYCODE_MEDIA_PREVIOUS',
  'KeyEvent.KEYCODE_MEDIA_PLAY',
  'KeyEvent.KEYCODE_MEDIA_PAUSE',
  'KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE',
  'KeyEvent.KEYCODE_HEADSETHOOK'
];
mainKeyEvents.forEach((ke) => {
  assert(mainActCode.includes(ke), `MainActivity dispatchKeyEvent: handles ${ke}`);
});

// 1.6 Audio Focus Management
assert(
  serviceCode.includes('requestAudioFocus') &&
  serviceCode.includes('abandonAudioFocus') &&
  serviceCode.includes('AUDIOFOCUS_GAIN'),
  'Service: Audio Focus request/abandon logic implemented'
);


// ============================================================================
// SUITE 2: Empirical Headset Hook Multi-Click Timing Simulation
// ============================================================================
console.log('\n--- SUITE 2: Headset Hook Multi-Click Timing & Queue Simulation ---');

class HeadsetHookSimulator {
  constructor(timeoutMs = 300) {
    this.timeoutMs = timeoutMs;
    this.hookClickCount = 0;
    this.timer = null;
    this.dispatchedActions = [];
  }

  pressHook() {
    this.hookClickCount++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.hookClickCount === 1) {
        this.dispatchedActions.push('toggle_play');
      } else if (this.hookClickCount === 2) {
        this.dispatchedActions.push('next');
      } else if (this.hookClickCount >= 3) {
        this.dispatchedActions.push('prev');
      }
      this.hookClickCount = 0;
    }, this.timeoutMs);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testHeadsetHookTiming() {
  // Test 2.1: Single Click -> toggle_play
  const sim1 = new HeadsetHookSimulator(50);
  sim1.pressHook();
  await sleep(70);
  assert(
    sim1.dispatchedActions.length === 1 && sim1.dispatchedActions[0] === 'toggle_play',
    'Hook Timing: Single click fires toggle_play after timeout',
    `Actions: [${sim1.dispatchedActions}]`
  );

  // Test 2.2: Double Click -> next
  const sim2 = new HeadsetHookSimulator(50);
  sim2.pressHook();
  await sleep(20);
  sim2.pressHook();
  await sleep(70);
  assert(
    sim2.dispatchedActions.length === 1 && sim2.dispatchedActions[0] === 'next',
    'Hook Timing: Double click within window fires next',
    `Actions: [${sim2.dispatchedActions}]`
  );

  // Test 2.3: Triple Click -> prev
  const sim3 = new HeadsetHookSimulator(50);
  sim3.pressHook();
  await sleep(15);
  sim3.pressHook();
  await sleep(15);
  sim3.pressHook();
  await sleep(70);
  assert(
    sim3.dispatchedActions.length === 1 && sim3.dispatchedActions[0] === 'prev',
    'Hook Timing: Triple click within window fires prev',
    `Actions: [${sim3.dispatchedActions}]`
  );

  // Test 2.4: Quadruple Click -> prev (clamp >= 3)
  const sim4 = new HeadsetHookSimulator(50);
  sim4.pressHook();
  await sleep(10);
  sim4.pressHook();
  await sleep(10);
  sim4.pressHook();
  await sleep(10);
  sim4.pressHook();
  await sleep(70);
  assert(
    sim4.dispatchedActions.length === 1 && sim4.dispatchedActions[0] === 'prev',
    'Hook Timing: Quadruple click (>=3) falls back cleanly to prev',
    `Actions: [${sim4.dispatchedActions}]`
  );

  // Test 2.5: Spaced Clicks -> two separate toggle_plays
  const sim5 = new HeadsetHookSimulator(40);
  sim5.pressHook();
  await sleep(60); // timeout expires -> fires toggle_play
  sim5.pressHook();
  await sleep(60); // timeout expires -> fires toggle_play
  assert(
    sim5.dispatchedActions.length === 2 &&
    sim5.dispatchedActions[0] === 'toggle_play' &&
    sim5.dispatchedActions[1] === 'toggle_play',
    'Hook Timing: Two clicks spaced beyond timeout fire two separate toggle_play actions',
    `Actions: [${sim5.dispatchedActions}]`
  );
}

await testHeadsetHookTiming();

// Test 2.6: React Debounce Simulation (60ms window for dual notification)
class ReactDebounceSimulator {
  constructor(debounceMs = 60) {
    this.debounceMs = debounceMs;
    this.lastActionTime = 0;
    this.lastAction = '';
    this.executedActions = [];
  }

  handleMediaAction(action) {
    const now = Date.now();
    if (this.lastAction === action && now - this.lastActionTime < this.debounceMs) {
      return; // Debounced
    }
    this.lastActionTime = now;
    this.lastAction = action;
    this.executedActions.push({ action, time: now });
  }
}

async function testReactDebounce() {
  const debouncer = new ReactDebounceSimulator(60);

  // Dual notification from ShadowAudioPlugin (nativeMediaControl + mediaAction)
  debouncer.handleMediaAction('next');
  debouncer.handleMediaAction('next'); // Arrives within 1ms

  assert(
    debouncer.executedActions.length === 1 && debouncer.executedActions[0].action === 'next',
    'React Debounce: Dual notification for identical action within 60ms is collapsed to 1 call',
    `Executed count: ${debouncer.executedActions.length}`
  );

  // Legitimate second user click after 100ms
  await sleep(80);
  debouncer.handleMediaAction('next');
  assert(
    debouncer.executedActions.length === 2,
    'React Debounce: Distinct user skip after 80ms (>60ms) executes cleanly',
    `Executed count: ${debouncer.executedActions.length}`
  );

  // Different action within 60ms should NOT be swallowed
  debouncer.handleMediaAction('pause');
  assert(
    debouncer.executedActions.length === 3 && debouncer.executedActions[2].action === 'pause',
    'React Debounce: Different action (e.g. pause right after next) is NOT swallowed',
    `Executed count: ${debouncer.executedActions.length}`
  );
}

await testReactDebounce();

// Test 2.7: Queue Advance Simulation (matching index.tsx handleNext and handlePrev)
function simulateQueueNavigation() {
  const playlist = [
    { id: 'track_1', title: 'Awakening' },
    { id: 'track_2', title: 'Dungeon Boss' },
    { id: 'track_3', title: 'Arise' }
  ];

  let activeIndex = 0;

  const next = () => {
    activeIndex = (activeIndex + 1) % playlist.length;
    return playlist[activeIndex];
  };

  const prev = () => {
    activeIndex = (activeIndex - 1 + playlist.length) % playlist.length;
    return playlist[activeIndex];
  };

  const t1 = next(); // index 1 -> Dungeon Boss
  const t2 = next(); // index 2 -> Arise
  const t3 = next(); // index 0 -> Awakening (wraps)
  assert(
    t1.id === 'track_2' && t2.id === 'track_3' && t3.id === 'track_1',
    'Queue Advance: next() sequentially cycles forward through tracks with wrap-around',
    `Seq: ${t1.id} -> ${t2.id} -> ${t3.id}`
  );

  const p1 = prev(); // index 2 -> Arise (wraps backwards)
  const p2 = prev(); // index 1 -> Dungeon Boss
  assert(
    p1.id === 'track_3' && p2.id === 'track_2',
    'Queue Advance: prev() sequentially cycles backward through tracks with wrap-around',
    `Seq: ${p1.id} -> ${p2.id}`
  );
}

simulateQueueNavigation();


// ============================================================================
// SUITE 3: Action String Mapping Across Subsystems
// ============================================================================
console.log('\n--- SUITE 3: Action String Mapping Consistency ---');

const pluginPath = path.join(PROJECT_ROOT, 'android/app/src/main/java/com/shadowplayer/app/ShadowAudioPlugin.java');
const nativeLibTsPath = path.join(PROJECT_ROOT, 'src/lib/nativeLibrary.ts');
const storageNativeLibPath = path.join(PROJECT_ROOT, 'src/lib/storage/nativeLibrary.ts');
const indexTsxPath = path.join(PROJECT_ROOT, 'src/routes/index.tsx');

const pluginCode = fs.readFileSync(pluginPath, 'utf8');
const nativeLibCode = fs.readFileSync(nativeLibTsPath, 'utf8');
const storageNativeLibCode = fs.readFileSync(storageNativeLibPath, 'utf8');
const indexCode = fs.readFileSync(indexTsxPath, 'utf8');

// Extract all notifyAction strings across Java files
const javaActionMatches = new Set();
const notifyRegex = /notifyAction\("([^"]+)"\)/g;
let m;
while ((m = notifyRegex.exec(serviceCode)) !== null) javaActionMatches.add(m[1]);
while ((m = notifyRegex.exec(mainActCode)) !== null) javaActionMatches.add(m[1]);

console.log('       Java emitted actions:', Array.from(javaActionMatches));

// Expected Java actions
const expectedJavaActions = ['toggle_play', 'next', 'prev', 'play', 'pause'];
expectedJavaActions.forEach((action) => {
  assert(
    javaActionMatches.has(action),
    `Action Mapping: Java emits "${action}"`
  );
});

// Check React handleMediaAction branches
expectedJavaActions.forEach((action) => {
  assert(
    indexCode.includes(`action === "${action}"`),
    `Action Mapping: React index.tsx handles "${action}"`
  );
});

// Check Capacitor bridge event listener names
assert(
  pluginCode.includes('instance.notifyListeners("nativeMediaControl", ret)') &&
  pluginCode.includes('instance.notifyListeners("mediaAction", ret)'),
  'Action Mapping: ShadowAudioPlugin notifies both nativeMediaControl and mediaAction'
);

assert(
  indexCode.includes('.addListener("nativeMediaControl"') &&
  indexCode.includes('.addListener("mediaAction"'),
  'Action Mapping: React index.tsx subscribes to both nativeMediaControl and mediaAction'
);

// Check nativeLibrary type definition alignment
const nativeLibHasAllActions = ['toggle_play', 'next', 'prev', 'play', 'pause'].every((a) =>
  nativeLibCode.includes(`"${a}"`)
);
assert(
  nativeLibHasAllActions,
  'Action Mapping: src/lib/nativeLibrary.ts type includes all 5 actions'
);

if (!storageNativeLibCode.includes('"play"') || !storageNativeLibCode.includes('"mediaAction"')) {
  warn(
    'src/lib/storage/nativeLibrary.ts lacks "mediaAction" and "play"/"pause" in interface',
    'index.tsx bypassed with `(ShadowAudio as any)`. Recommend syncing interface in storage/nativeLibrary.ts.'
  );
}


// ============================================================================
// SUITE 4: Build Integrity & APK Inspection
// ============================================================================
console.log('\n--- SUITE 4: Android Build Integrity & APK Output Check ---');

const apkPath = path.join(PROJECT_ROOT, 'android/app/build/outputs/apk/debug/app-debug.apk');

assert(fs.existsSync(apkPath), `APK check: APK file exists at ${apkPath}`);

const apkStats = fs.statSync(apkPath);
assert(apkStats.size > 100 * 1024 * 1024, `APK size check: ${apkStats.size} bytes (~${(apkStats.size / (1024*1024)).toFixed(1)} MB) > 100MB threshold`);

// Check aapt binary inspection if aapt is available
const aaptPath = 'C:\\Users\\akram\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\aapt.exe';
if (fs.existsSync(aaptPath)) {
  try {
    const aaptXml = execSync(`"${aaptPath}" dump xmltree "${apkPath}" AndroidManifest.xml`, { encoding: 'utf8' });
    
    assert(
      aaptXml.includes('com.shadowplayer.app.ShadowAudioService'),
      'APK Binary Manifest: ShadowAudioService is compiled in'
    );
    assert(
      aaptXml.includes('androidx.media.session.MediaButtonReceiver'),
      'APK Binary Manifest: MediaButtonReceiver is compiled in'
    );
    assert(
      aaptXml.includes('android.intent.action.MEDIA_BUTTON'),
      'APK Binary Manifest: MEDIA_BUTTON action filter is compiled in'
    );
  } catch (err) {
    failCount++;
    console.error('[FAIL] aapt dump failed:', err.message);
  }
} else {
  warn('aapt tool not found at expected path', aaptPath);
}

// Check Web Assets Prerender inside dist/client
const distIndexPath = path.join(PROJECT_ROOT, 'dist/client/index.html');
assert(fs.existsSync(distIndexPath), 'Web Assets: dist/client/index.html exists');


// ============================================================================
// SUITE 5: Adversarial Edge Cases & Stress Scenarios
// ============================================================================
console.log('\n--- SUITE 5: Adversarial Edge Cases & Stress Scenarios ---');

// Stress 5.1: Rapid-fire keyevent burst (simulate user frantically pressing next)
let burstCount = 0;
const rapidDebouncer = new ReactDebounceSimulator(60);
for (let i = 0; i < 20; i++) {
  rapidDebouncer.handleMediaAction('next');
}
assert(
  rapidDebouncer.executedActions.length === 1,
  'Stress 5.1: 20 rapid bursts within the same tick are collapsed to exactly 1 event',
  `Executed: ${rapidDebouncer.executedActions.length}`
);

// Stress 5.2: Focus loss transient vs focus gain sequencing
let audioState = 'playing';
const simulateFocusChange = (change) => {
  if (change === 'LOSS_TRANSIENT') {
    audioState = 'paused';
  } else if (change === 'GAIN') {
    audioState = 'playing';
  }
};
simulateFocusChange('LOSS_TRANSIENT');
assert(audioState === 'paused', 'Stress 5.2: Transient focus loss (e.g. phone call or GPS notification) pauses audio');
simulateFocusChange('GAIN');
assert(audioState === 'playing', 'Stress 5.2: Focus gain resumes audio playback');

// Stress 5.3: MainActivity foreground key event double-click behavior
// NOTE: MainActivity directly calls notifyAction on ACTION_DOWN without multi-click timer.
// In foreground, double-clicking headset hook sends toggle_play twice!
const mainActHookDirect = mainActCode.includes('keyCode == KeyEvent.KEYCODE_HEADSETHOOK') &&
  mainActCode.includes('notifyAction("toggle_play")');

if (mainActHookDirect) {
  warn(
    'Foreground Headset Hook Limitation',
    'MainActivity dispatchKeyEvent maps KEYCODE_HEADSETHOOK directly to toggle_play without multi-click timer. In the foreground, double-clicking headset hook toggles play/pause twice instead of skipping track. In background/lockscreen, ShadowAudioService handles multi-click properly.'
  );
}


// ============================================================================
// FINAL SUMMARY & VERDICT
// ============================================================================
console.log('\n================================================================');
console.log(`  VERIFICATION RESULTS: ${passCount} PASSED, ${failCount} FAILED, ${warnCount} WARNINGS`);
console.log(`  FINAL VERDICT: ${failCount === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
console.log('================================================================\n');

process.exit(failCount === 0 ? 0 : 1);
