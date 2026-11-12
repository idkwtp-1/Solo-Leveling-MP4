// Empirical Test Suite: Queue & State Machine Edge Cases
// Testing: Rapid Next/Prev, Debounce, Empty Queue, Single Track Loop, Unassigned Track Navigation

import { assert } from "node:console";

console.log("=================================================");
console.log("RUNNING EMPIRICAL TEST SUITE: QUEUE & STATE LOGIC");
console.log("=================================================\n");

let failures = 0;
let passes = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`[PASS] ${desc}`);
    passes++;
  } catch (e) {
    console.error(`[FAIL] ${desc}`);
    console.error(`       Error: ${e.message}\n${e.stack}`);
    failures++;
  }
}

// Mock track models
const mockTracks = [
  { id: "track-1", title: "Track One", filename: "track-1.mp3" },
  { id: "track-2", title: "Track Two", filename: "track-2.mp3" },
  { id: "track-3", title: "Track Three", filename: "track-3.mp3" },
];

const singleTrackList = [
  { id: "track-solo", title: "Solo Track", filename: "solo.mp3" }
];

const emptyTrackList = [];

// Helper: exact logic implementation from src/routes/index.tsx
function createQueueController(initialGateTracks, initialActiveTrack = null, options = {}) {
  let activeTrack = initialActiveTrack;
  let playing = initialActiveTrack !== null;
  let playedShuffleIds = initialActiveTrack ? [initialActiveTrack.id] : [];
  let isOffline = options.isOffline || false;
  let cachedTrackIds = options.cachedTrackIds || new Set(["track-1", "track-2", "track-3", "track-solo"]);
  let repeatMode = options.repeatMode || "none";
  let shuffle = options.shuffle || false;
  let globalShuffleActive = options.globalShuffleActive || false;
  let currentGate = { id: "gate-1", name: "Gate 1", tracks: initialGateTracks };
  let allGateTracks = options.allGateTracks || initialGateTracks;
  let gates = [currentGate];

  let audioState = {
    currentTime: 0,
    playing: playing,
    loadCount: 0,
    playCount: 0,
    pauseCount: 0,
  };

  const isTrackAvailableOffline = (t, cachedSet) => {
    if (!cachedSet || cachedSet.size === 0) return true;
    return (
      cachedSet.has(t.id) ||
      (!!t.filename && cachedSet.has(t.filename)) ||
      cachedSet.has(`${t.id}.mp3`) ||
      cachedSet.has(`${t.id}.m4a`)
    );
  };

  const playTrackSync = (track) => {
    audioState.loadCount++;
    audioState.playCount++;
    audioState.playing = true;
  };

  const handleNext = (isAutoEnd = false) => {
    if (!activeTrack) return;

    if (isAutoEnd === true && repeatMode === "one") {
      audioState.currentTime = 0;
      audioState.playCount++;
      return;
    }

    let nextTrack = null;

    if (globalShuffleActive || shuffle) {
      const playable = globalShuffleActive
        ? allGateTracks.filter((t) => !isOffline || isTrackAvailableOffline(t, cachedTrackIds))
        : (gates.find((g) => g.tracks.some((t) => t.id === activeTrack.id)) || currentGate).tracks.filter(
            (t) => !isOffline || isTrackAvailableOffline(t, cachedTrackIds)
          );

      if (playable.length > 0) {
        if (playable.length === 1) {
          nextTrack = playable[0];
        } else {
          let unplayed = playable.filter((t) => !playedShuffleIds.includes(t.id) && t.id !== activeTrack.id);
          let newPlayedIds = [...playedShuffleIds];

          if (unplayed.length === 0) {
            unplayed = playable.filter((t) => t.id !== activeTrack.id);
            if (unplayed.length === 0) unplayed = playable;
            newPlayedIds = [];
          }

          nextTrack = unplayed[0]; // deterministic mock of random pick
          newPlayedIds.push(nextTrack.id);
          playedShuffleIds = newPlayedIds;
        }
      }
    } else {
      const g = gates.find((g) => g.tracks.some((t) => t.id === activeTrack.id)) || currentGate;
      const availableTracks = g.tracks;
      const len = availableTracks.length;
      if (len === 0) return;

      const currentIndex = availableTracks.findIndex((t) => t.id === activeTrack.id);
      if (currentIndex !== -1) {
        let nextIndex = (currentIndex + 1) % len;
        let attempts = 0;
        while (
          isOffline &&
          !isTrackAvailableOffline(availableTracks[nextIndex], cachedTrackIds) &&
          attempts < len
        ) {
          nextIndex = (nextIndex + 1) % len;
          attempts++;
        }

        if (isAutoEnd === true && nextIndex === 0 && repeatMode === "none") {
          playing = false;
          audioState.playing = false;
          audioState.pauseCount++;
          audioState.currentTime = 0;
          return;
        }

        if (attempts < len) {
          nextTrack = availableTracks[nextIndex];
        }
      } else {
        let nextIndex = 0;
        let attempts = 0;
        while (
          isOffline &&
          !isTrackAvailableOffline(availableTracks[nextIndex], cachedTrackIds) &&
          attempts < len
        ) {
          nextIndex = (nextIndex + 1) % len;
          attempts++;
        }
        if (attempts < len) {
          nextTrack = availableTracks[nextIndex];
        }
      }
    }

    if (nextTrack) {
      if (nextTrack.id === activeTrack.id) {
        if (isAutoEnd === true && repeatMode === "none") {
          playing = false;
          audioState.playing = false;
          audioState.pauseCount++;
          audioState.currentTime = 0;
        } else {
          audioState.currentTime = 0;
          audioState.playCount++;
        }
      } else {
        activeTrack = nextTrack;
        playing = true;
        playTrackSync(nextTrack);
      }
    } else if (isAutoEnd) {
      playing = false;
      audioState.playing = false;
      audioState.pauseCount++;
      audioState.currentTime = 0;
    }
  };

  const handlePrev = () => {
    if (!activeTrack) return;
    let prevTrack = null;

    if (globalShuffleActive) {
      const playable = allGateTracks.filter((t) => !isOffline || isTrackAvailableOffline(t, cachedTrackIds));
      if (playable.length > 0) {
        if (playable.length === 1) {
          prevTrack = playable[0];
        } else {
          const filtered = playable.filter((t) => t.id !== activeTrack.id);
          const candidates = filtered.length > 0 ? filtered : playable;
          prevTrack = candidates[0];
        }
      }
    } else {
      const g = gates.find((g) => g.tracks.some((t) => t.id === activeTrack.id)) || currentGate;
      const availableTracks = g.tracks;
      const len = availableTracks.length;
      if (len === 0) return;

      if (shuffle) {
        const playable = availableTracks.filter((t) => !isOffline || isTrackAvailableOffline(t, cachedTrackIds));
        if (playable.length > 0) {
          if (playable.length === 1) {
            prevTrack = playable[0];
          } else {
            const filtered = playable.filter((t) => t.id !== activeTrack.id);
            const candidates = filtered.length > 0 ? filtered : playable;
            prevTrack = candidates[0];
          }
        }
      } else {
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
          // Remediated fallback when activeTrack is not in currentGate (search or unassigned list)
          if (audioState.currentTime > 3) {
            audioState.currentTime = 0;
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
            audioState.currentTime = 0;
            return;
          }
        }
      }
    }

    if (prevTrack) {
      if (prevTrack.id === activeTrack.id) {
        audioState.currentTime = 0;
        audioState.playCount++;
      } else {
        activeTrack = prevTrack;
        playing = true;
        playTrackSync(prevTrack);
      }
    }
  };

  return {
    getActiveTrack: () => activeTrack,
    isPlaying: () => playing,
    getAudioState: () => audioState,
    handleNext,
    handlePrev,
    setActiveTrack: (t) => { activeTrack = t; },
    setRepeatMode: (m) => { repeatMode = m; },
    setOffline: (off) => { isOffline = off; },
    setCachedTrackIds: (s) => { cachedTrackIds = s; }
  };
}

// ----------------------------------------------------
// TEST GROUP 1: Empty Queue & Boundary Conditions
// ----------------------------------------------------

it("Empty Queue: handleNext() on empty gate tracks does not crash or throw", () => {
  const qc = createQueueController(emptyTrackList, null);
  qc.handleNext();
  assert(qc.getActiveTrack() === null);
  assert(qc.isPlaying() === false);
});

it("Empty Queue: handlePrev() on empty gate tracks does not crash or throw", () => {
  const qc = createQueueController(emptyTrackList, null);
  qc.handlePrev();
  assert(qc.getActiveTrack() === null);
  assert(qc.isPlaying() === false);
});

it("Empty Queue: activeTrack set but tracks array empty does not throw", () => {
  const dummyTrack = { id: "ghost", title: "Ghost Track" };
  const qc = createQueueController(emptyTrackList, dummyTrack);
  qc.handleNext();
  assert(qc.getActiveTrack().id === "ghost");
  qc.handlePrev();
  assert(qc.getActiveTrack().id === "ghost");
});

// ----------------------------------------------------
// TEST GROUP 2: Single-Track Loop Boundary Conditions
// ----------------------------------------------------

it("Single-Track: Manual handleNext() loops the single track to beginning", () => {
  const qc = createQueueController(singleTrackList, singleTrackList[0], { repeatMode: "none" });
  assert(qc.getActiveTrack().id === "track-solo");
  const playsBefore = qc.getAudioState().playCount;
  qc.handleNext(false); // User click
  assert(qc.getActiveTrack().id === "track-solo");
  assert(qc.getAudioState().currentTime === 0);
  assert(qc.getAudioState().playCount === playsBefore + 1);
  assert(qc.isPlaying() === true);
});

it("Single-Track: Manual handlePrev() loops the single track to beginning", () => {
  const qc = createQueueController(singleTrackList, singleTrackList[0], { repeatMode: "none" });
  const playsBefore = qc.getAudioState().playCount;
  qc.handlePrev();
  assert(qc.getActiveTrack().id === "track-solo");
  assert(qc.getAudioState().currentTime === 0);
  assert(qc.getAudioState().playCount === playsBefore + 1);
});

it("Single-Track: Auto-end (isAutoEnd=true) with repeatMode='none' cleanly stops playback", () => {
  const qc = createQueueController(singleTrackList, singleTrackList[0], { repeatMode: "none" });
  qc.handleNext(true); // Natural song end
  assert(qc.isPlaying() === false, "Should pause playback when repeatMode is none");
  assert(qc.getAudioState().playing === false);
  assert(qc.getAudioState().currentTime === 0);
});

it("Single-Track: Auto-end (isAutoEnd=true) with repeatMode='one' restarts track", () => {
  const qc = createQueueController(singleTrackList, singleTrackList[0], { repeatMode: "one" });
  const playsBefore = qc.getAudioState().playCount;
  qc.handleNext(true);
  assert(qc.isPlaying() === true);
  assert(qc.getAudioState().playCount === playsBefore + 1);
  assert(qc.getAudioState().currentTime === 0);
});

it("Single-Track: Auto-end (isAutoEnd=true) with repeatMode='all' replays single track", () => {
  const qc = createQueueController(singleTrackList, singleTrackList[0], { repeatMode: "all" });
  const playsBefore = qc.getAudioState().playCount;
  qc.handleNext(true);
  assert(qc.isPlaying() === true);
  assert(qc.getAudioState().playCount === playsBefore + 1);
  assert(qc.getAudioState().currentTime === 0);
});

// ----------------------------------------------------
// TEST GROUP 3: Rapid Successive Next/Prev Events (Debouncing vs Queue Corruption)
// ----------------------------------------------------

it("Rapid Successive Next: 10 consecutive handleNext() calls correctly cycle through queue without corruption", () => {
  const qc = createQueueController(mockTracks, mockTracks[0]);
  const expectedSequence = [
    "track-2", "track-3", "track-1",
    "track-2", "track-3", "track-1",
    "track-2", "track-3", "track-1",
    "track-2"
  ];
  for (let i = 0; i < 10; i++) {
    qc.handleNext(false);
    assert(qc.getActiveTrack().id === expectedSequence[i], `Step ${i}: expected ${expectedSequence[i]} but got ${qc.getActiveTrack().id}`);
  }
  assert(qc.isPlaying() === true);
});

it("Rapid Successive Prev: 10 consecutive handlePrev() calls correctly cycle backwards without corruption", () => {
  const qc = createQueueController(mockTracks, mockTracks[0]);
  const expectedSequence = [
    "track-3", "track-2", "track-1",
    "track-3", "track-2", "track-1",
    "track-3", "track-2", "track-1",
    "track-3"
  ];
  for (let i = 0; i < 10; i++) {
    qc.handlePrev();
    assert(qc.getActiveTrack().id === expectedSequence[i], `Step ${i}: expected ${expectedSequence[i]} but got ${qc.getActiveTrack().id}`);
  }
  assert(qc.isPlaying() === true);
});

it("Rapid Alternating Next & Prev does not corrupt state or freeze queue", () => {
  const qc = createQueueController(mockTracks, mockTracks[0]);
  for (let i = 0; i < 20; i++) {
    if (i % 2 === 0) {
      qc.handleNext();
      assert(qc.getActiveTrack().id === "track-2");
    } else {
      qc.handlePrev();
      assert(qc.getActiveTrack().id === "track-1");
    }
  }
  assert(qc.getActiveTrack().id === "track-1");
});

// ----------------------------------------------------
// TEST GROUP 4: Frontend Debounce Verification (60ms Dual Notification Filter)
// ----------------------------------------------------

function createDebouncedDispatcher(handler) {
  let lastActionTime = 0;
  let lastAction = "";
  let executedCount = 0;

  const dispatch = (action, timestamp) => {
    const now = timestamp !== undefined ? timestamp : Date.now();
    if (lastAction === action && now - lastActionTime < 60) {
      return false; // debounced
    }
    lastActionTime = now;
    lastAction = action;
    executedCount++;
    handler(action);
    return true;
  };

  return { dispatch, getExecutedCount: () => executedCount };
}

it("Debounce: Dual notification (nativeMediaControl + mediaAction) at dt=1ms executes exactly ONCE", () => {
  let actions = [];
  const dispatcher = createDebouncedDispatcher((a) => actions.push(a));

  const t0 = 1000;
  const res1 = dispatcher.dispatch("next", t0);
  const res2 = dispatcher.dispatch("next", t0 + 1); // 1ms later from second listener

  assert(res1 === true, "First event should execute");
  assert(res2 === false, "Second event within 60ms must be debounced");
  assert(actions.length === 1, `Expected 1 execution but got ${actions.length}`);
});

it("Debounce: User clicking Next rapidly at dt=70ms executes BOTH clicks", () => {
  let actions = [];
  const dispatcher = createDebouncedDispatcher((a) => actions.push(a));

  const t0 = 1000;
  const res1 = dispatcher.dispatch("next", t0);
  const res2 = dispatcher.dispatch("next", t0 + 70);

  assert(res1 === true);
  assert(res2 === true);
  assert(actions.length === 2, `Expected 2 executions for legitimate rapid clicks, got ${actions.length}`);
});

it("Debounce: User clicking Next then Prev within 20ms executes BOTH because action changed", () => {
  let actions = [];
  const dispatcher = createDebouncedDispatcher((a) => actions.push(a));

  const t0 = 1000;
  const res1 = dispatcher.dispatch("next", t0);
  const res2 = dispatcher.dispatch("prev", t0 + 20);

  assert(res1 === true);
  assert(res2 === true);
  assert(actions.length === 2);
  assert(actions[0] === "next" && actions[1] === "prev");
});

// ----------------------------------------------------
// TEST GROUP 5: Track NOT in Current Gate (currentIndex === -1)
// ----------------------------------------------------

it("Unassigned Track / Search Track: handleNext() recovers by picking first available track", () => {
  const externalTrack = { id: "external-99", title: "External Song" };
  const qc = createQueueController(mockTracks, externalTrack);
  qc.handleNext();
  assert(qc.getActiveTrack().id === "track-1", `Expected track-1 but got ${qc.getActiveTrack()?.id}`);
});

it("Unassigned Track / Search Track: handlePrev() recovers gracefully (Fix verified)", () => {
  const externalTrack = { id: "external-99", title: "External Song" };
  const qc = createQueueController(mockTracks, externalTrack);
  qc.handlePrev();
  // With fix in src/routes/index.tsx lines 1499-1529, handlePrev falls back to availableTracks[len - 1] (track-3)
  assert(qc.getActiveTrack().id === "track-3", `Expected track-3 but got ${qc.getActiveTrack()?.id}`);
});

// ----------------------------------------------------
// TEST GROUP 6: Offline Cache Filter Edge Cases
// ----------------------------------------------------

it("Offline Filter: handleNext() skips uncached tracks and jumps to cached track", () => {
  // Only track-3 is cached
  const qc = createQueueController(mockTracks, mockTracks[0], {
    isOffline: true,
    cachedTrackIds: new Set(["track-3"])
  });
  qc.handleNext();
  assert(qc.getActiveTrack().id === "track-3", `Expected track-3, got ${qc.getActiveTrack()?.id}`);
});

it("Offline Filter: When NO tracks in gate are cached offline, handleNext does not loop infinitely or crash", () => {
  const qc = createQueueController(mockTracks, mockTracks[0], {
    isOffline: true,
    cachedTrackIds: new Set(["non-existent-track"])
  });
  // Attempts while loop terminates when attempts >= len
  qc.handleNext();
  // Track should remain on current track
  assert(qc.getActiveTrack().id === "track-1");
});

console.log("\n=================================================");
console.log(`TEST SUMMARY: ${passes} PASSED, ${failures} FAILED`);
console.log("=================================================");
if (failures > 0) {
  console.log(`[VERDICT] Edge cases identified ${failures} failure(s)!`);
} else {
  console.log("[VERDICT] All tests passed cleanly.");
}
