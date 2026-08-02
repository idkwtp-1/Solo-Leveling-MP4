import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execFile, spawn, exec, execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup: allow localhost, 127.0.0.1, and private local network range origins
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        const isLocal =
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.startsWith("192.168.") ||
          hostname.startsWith("10.") ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

        if (isLocal) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      } catch (err) {
        callback(new Error("Invalid origin URL"));
      }
    },
  }),
);

// Express rate limiter to prevent flooding or asset scraping
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // Increased limit because local polling triggers it quickly
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 3.2 Dynamic Inventory Layer — loaded from tracks_inventory.json
const INVENTORY_PATH = path.join(__dirname, "media", "tracks_inventory.json");
let TRACK_INVENTORY = {
  "tiki-tiki-slowed": {
    filename: "tiki_tiki_slowed.mp3",
    title: "TIKI TIKI (Slowed)",
  },
  "veki-veki-slowed": {
    filename: "veki_veki_ultra_slowed.mp3",
    title: "VEKI VEKI (Ultra Slowed)",
  },
  "worry-slowed": {
    filename: "worry_ultra_slowed.mp3",
    title: "worry (ultra slowed)",
  },
  "babydoll-perfect-girl": {
    filename: "babydoll_the_perfect_girl.mp3",
    title: "Babydoll X The Perfect Girl (Full Version)",
  },
  "one-of-the-girls-mashup": {
    filename: "one_of_the_girls_good_for_you.mp3",
    title: "One Of The Girls X Good For You (Mashup)",
  },
};

function loadInventory() {
  if (fs.existsSync(INVENTORY_PATH)) {
    try {
      const tracksList = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));
      if (Array.isArray(tracksList) && tracksList.length > 0) {
        const newInventory = {};
        tracksList.forEach((track) => {
          newInventory[track.id] = {
            filename: track.filename,
            title: track.title,
            duration: track.duration,
            endTime: track.endTime,
          };
        });
        TRACK_INVENTORY = newInventory;
      }
    } catch (err) {
      console.error(
        "[SLPlayer Backend] Error reading tracks_inventory.json:",
        err,
      );
    }
  }
}
loadInventory();

const ASSIGNMENTS_PATH = path.join(__dirname, "media", "assignments.json");
const DEFAULT_ASSIGNMENTS = {
  "tiki-tiki-slowed": "monarch",
  "veki-veki-slowed": "boss",
  "worry-slowed": "boss",
  "babydoll-perfect-girl": "monarch",
  "one-of-the-girls-mashup": "monarch",
};

function loadAssignments() {
  if (fs.existsSync(ASSIGNMENTS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(ASSIGNMENTS_PATH, "utf-8"));
    } catch (err) {
      console.error("[SLPlayer Backend] Error reading assignments.json:", err);
    }
  }
  try {
    fs.writeFileSync(
      ASSIGNMENTS_PATH,
      JSON.stringify(DEFAULT_ASSIGNMENTS, null, 2),
    );
  } catch (err) {
    console.error("[SLPlayer Backend] Error writing default assignments:", err);
  }
  return DEFAULT_ASSIGNMENTS;
}

const GATES_PATH = path.join(__dirname, "media", "gates.json");
const DEFAULT_GATES = [
  {
    id: "boss",
    name: "BOSS THEMES",
    rank: "S-RANK",
    code: "GT-001",
    tracks: [],
  },
  {
    id: "hype",
    name: "SHADOW HYPE",
    rank: "A-RANK",
    code: "GT-002",
    tracks: [],
  },
  {
    id: "chill",
    name: "CHILL VOID",
    rank: "B-RANK",
    code: "GT-003",
    tracks: [],
  },
  {
    id: "monarch",
    name: "MONARCH'S DOMAIN",
    rank: "S-RANK",
    code: "GT-004",
    tracks: [],
  },
  {
    id: "dungeon",
    name: "DUNGEON RUN",
    rank: "C-RANK",
    code: "GT-005",
    tracks: [],
  },
  { id: "awaken", name: "AWAKENING", rank: "??", code: "GT-006", tracks: [] },
];

function loadGates() {
  if (fs.existsSync(GATES_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(GATES_PATH, "utf-8"));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.error("[SLPlayer Backend] Error reading gates.json:", err);
    }
  }
  return DEFAULT_GATES;
}

function saveGates(gates) {
  try {
    fs.writeFileSync(GATES_PATH, JSON.stringify(gates, null, 2));
  } catch (err) {
    console.error("[SLPlayer Backend] Error writing gates.json:", err);
  }
}

// Gate endpoints
app.get("/api/gates", (req, res) => {
  res.json(loadGates());
});

app.post("/api/gates", express.json(), (req, res) => {
  const { name, rank } = req.body;
  if (!name) return res.status(400).json({ error: "Missing gate name" });

  const gates = loadGates();
  const newId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (gates.some((g) => g.id === newId)) {
    return res.status(400).json({ error: "Gate with this name already exists" });
  }

  const newGate = {
    id: newId,
    name: name.toUpperCase(),
    rank: (rank || "S-RANK").toUpperCase(),
    code: `GT-${String(gates.length + 1).padStart(3, "0")}`,
    tracks: [],
  };

  gates.push(newGate);
  saveGates(gates);
  res.json(gates);
});

app.delete("/api/gates/:gateId", (req, res) => {
  const { gateId } = req.params;
  let gates = loadGates();
  gates = gates.filter((g) => g.id !== gateId);
  saveGates(gates);

  // Unassign tracks from deleted gate
  const assignments = loadAssignments();
  let modified = false;
  Object.keys(assignments).forEach((trackId) => {
    if (assignments[trackId] === gateId) {
      delete assignments[trackId];
      modified = true;
    }
  });
  if (modified) {
    try {
      fs.writeFileSync(ASSIGNMENTS_PATH, JSON.stringify(assignments, null, 2));
    } catch (err) {
      console.error("[SLPlayer Backend] Failed to update assignments on gate delete:", err);
    }
  }

  res.json(gates);
});

app.get("/api/gates/:gateId", (req, res) => {
  const gates = loadGates();
  const gate = gates.find((g) => g.id === req.params.gateId);
  if (!gate) {
    return res.status(404).json({ error: "Gate not found" });
  }
  res.json(gate);
});

// YouTube Search & Download State
const ytdlpPath = path.join(__dirname, "yt-dlp.exe");
const mediaDir = path.join(__dirname, "media");
const activeDownloads = {};

function formatDuration(secStr) {
  const seconds = parseInt(secStr, 10);
  if (isNaN(seconds)) return "??";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Refresh PATH environment variables in node so child processes can locate Gyan.FFmpeg (just like in download_and_sync_all.js)
try {
  const freshPath = execSync(
    "powershell \"[System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')\"",
  )
    .toString()
    .trim();
  process.env.PATH = freshPath;
} catch (err) {
  console.error("[SLPlayer Backend] Failed to refresh PATH environment variable:", err.message);
}

// 1. YouTube Search
app.get("/api/youtube/search", (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  execFile(
    ytdlpPath,
    [`ytsearch20:${query}`, "--dump-json", "--flat-playlist"],
    {
      maxBuffer: 1024 * 1024 * 10,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error("[SLPlayer Backend] yt-dlp search error:", error);
        return res.status(500).json({ error: "Failed to search YouTube" });
      }

      const results = [];
      const lines = stdout.trim().split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line);
          const duration = item.duration ? Math.floor(item.duration) : 0;
          const mins = Math.floor(duration / 60);
          const secs = duration % 60;
          const durationStr = `${mins}:${String(secs).padStart(2, "0")}`;

          results.push({
            id: item.id,
            title: item.title,
            channel: item.channel || item.uploader || "Unknown",
            duration: durationStr,
            durationSeconds: duration,
            thumbnail: item.thumbnails && item.thumbnails.length > 0
              ? item.thumbnails[item.thumbnails.length - 1].url
              : null,
            url: `https://www.youtube.com/watch?v=${item.id}`
          });
        } catch (e) {
          // ignore parsing error
        }
      }
      res.json(results);
    }
  );
});

// 2. Active downloads list/status
app.get("/api/youtube/downloads", (req, res) => {
  res.json(Object.values(activeDownloads));
});

// Helper function to auto Git Sync
function runGitSync(title) {
  console.log(`[SLPlayer Backend] Starting Git Sync for track: ${title}`);
  const gitDir = path.join(__dirname, "..");
  exec('git add -A && git commit -m "feat: add track ' + title.replace(/"/g, '\\"') + '" && git push', { cwd: gitDir }, (error, stdout, stderr) => {
    if (error) {
      console.error("[SLPlayer Backend] Git Sync failed:", error);
    } else {
      console.log("[SLPlayer Backend] Git Sync completed successfully!");
    }
  });
}

// 3. YouTube Download
app.post("/api/youtube/download", express.json(), (req, res) => {
  const { videoId, title: requestedTitle } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId" });
  }

  if (activeDownloads[videoId]) {
    return res.json({ message: "Download already in progress or completed", status: activeDownloads[videoId] });
  }

  const titlePlaceholder = requestedTitle || videoId;
  activeDownloads[videoId] = {
    videoId,
    title: titlePlaceholder,
    status: "queued",
    progress: 0,
  };

  res.json({ message: "Download started", status: activeDownloads[videoId] });

  // Run in background
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const args = [
    "-f",
    "ba[ext=m4a]/ba",
    "--restrict-filenames",
    "--no-simulate",
    "--no-post-overwrites",
    "-o",
    path.join(mediaDir, "%(title)s.%(ext)s"),
    "--print",
    "METADATA_TITLE:%(title)s",
    "--print",
    "METADATA_DURATION:%(duration)s",
    "--print",
    "METADATA_FILENAME:%(filename)s",
    url,
  ];

  activeDownloads[videoId].status = "downloading";
  console.log(`[SLPlayer Backend] Starting download of ${url}`);

  let child;
  try {
    child = spawn(ytdlpPath, args, {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    });
  } catch (err) {
    console.error("[SLPlayer Backend] Synchronous spawn error:", err);
    activeDownloads[videoId].status = "failed";
    activeDownloads[videoId].error = "Failed to launch yt-dlp";
    return;
  }

  let stdoutData = "";
  let stderrData = "";

  child.on("error", (err) => {
    console.error("[SLPlayer Backend] yt-dlp spawn error event:", err);
    activeDownloads[videoId].status = "failed";
    activeDownloads[videoId].error = "yt-dlp process error";
  });

  child.stdout.on("data", (data) => {
    const str = data.toString();
    stdoutData += str;

    // Parse progress percentage, speed, and ETA
    // Example: [download]  15.2% of  8.52MiB at    1.50MiB/s ETA 00:04
    const progressMatch = str.match(/\[download\]\s+([\d.]+)%(?:.*?at\s+([^\s]+)\s+ETA\s+([^\s]+))?/);
    if (progressMatch) {
      const percentage = parseFloat(progressMatch[1]);
      if (!isNaN(percentage)) {
        activeDownloads[videoId].progress = percentage;
        activeDownloads[videoId].status = "downloading";
        if (progressMatch[2] && progressMatch[3]) {
          activeDownloads[videoId].speed = progressMatch[2];
          activeDownloads[videoId].eta = progressMatch[3];
        }
      }
    }
  });

  child.stderr.on("data", (data) => {
    stderrData += data.toString();
  });

  child.on("close", (code) => {
    if (code !== 0) {
      console.error(`[SLPlayer Backend] yt-dlp failed with code ${code}. Stderr: ${stderrData}`);
      activeDownloads[videoId].status = "failed";
      activeDownloads[videoId].error = "yt-dlp failed to download audio";
      return;
    }

    // Process output metadata
    let title = "";
    let durationSecs = "";
    let absoluteFilePath = "";

    const lines = stdoutData.split("\n").map(l => l.trim());
    for (const line of lines) {
      if (line.startsWith("METADATA_TITLE:")) {
        title = line.substring("METADATA_TITLE:".length);
      } else if (line.startsWith("METADATA_DURATION:")) {
        durationSecs = line.substring("METADATA_DURATION:".length);
      } else if (line.startsWith("METADATA_FILENAME:")) {
        absoluteFilePath = line.substring("METADATA_FILENAME:".length);
      }
    }

    if (!title || !durationSecs || !absoluteFilePath) {
      console.error("[SLPlayer Backend] Unexpected output format from download:", stdoutData);
      activeDownloads[videoId].status = "failed";
      activeDownloads[videoId].error = "Could not parse download details";
      return;
    }

    const relativeFileName = path.basename(absoluteFilePath);

    const baseName = path.basename(relativeFileName, path.extname(relativeFileName));
    const trackId = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    activeDownloads[videoId].title = title;
    activeDownloads[videoId].status = "analyzing";
    activeDownloads[videoId].progress = 100;

    // Read and update registry
    let inventory = [];
    if (fs.existsSync(INVENTORY_PATH)) {
      try {
        inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));
      } catch (e) {
        console.error("[SLPlayer Backend] Failed to read inventory:", e);
      }
    }

    const existingIds = new Set(inventory.map((t) => t.id));
    if (!existingIds.has(trackId)) {
      const durSecs = parseInt(durationSecs, 10);
      inventory.push({
        id: trackId,
        filename: relativeFileName,
        title: title,
        duration: formatDuration(durationSecs),
        ...(isNaN(durSecs) ? {} : { endTime: durSecs }),
      });
      try {
        fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2));
      } catch (e) {
        console.error("[SLPlayer Backend] Failed to write inventory:", e);
      }
    }

    // Trigger beat drop analysis
    console.log(`[SLPlayer Backend] Running beat drop analysis for ${trackId}`);
    execFile("python", [path.join(__dirname, "analyze_drops.py")], (err, stdout, stderr) => {
      if (err) {
        console.error("[SLPlayer Backend] Beat drop analysis failed:", err);
      } else {
        console.log("[SLPlayer Backend] Beat drop analysis complete");
      }

      activeDownloads[videoId].status = "completed";

      // Trigger automatic Git Sync!
      runGitSync(title);
    });
  });
});

// Assignments endpoints
app.get("/api/assignments", (req, res) => {
  const data = loadAssignments();
  res.json(data);
});

app.post("/api/assignments", express.json(), (req, res) => {
  const { trackId, gateId } = req.body;
  const assignments = loadAssignments();
  if (trackId) {
    if (gateId) {
      assignments[trackId] = gateId;
    } else {
      delete assignments[trackId];
    }
  }
  try {
    fs.writeFileSync(ASSIGNMENTS_PATH, JSON.stringify(assignments, null, 2));
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: "Failed to save assignments" });
  }
});

// Endpoint to fetch dynamic track list for frontend
app.get("/api/tracks", (req, res) => {
  loadInventory(); // reload inventory in case it was updated by download script
  if (fs.existsSync(INVENTORY_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));
      res.json(data);
      return;
    } catch (err) {
      console.error("[SLPlayer Backend] Failed to read tracks_inventory:", err);
    }
  }

  // Fallback to memory inventory
  const fallbackList = Object.entries(TRACK_INVENTORY).map(([id, t]) => ({
    id,
    index: "??",
    title: t.title,
    duration: "??",
  }));
  res.json(fallbackList);
});

// Endpoint to delete a track (physical file, inventory, assignments)
app.delete("/api/tracks/:trackId", (req, res) => {
  const { trackId } = req.params;
  let inventory = [];
  if (fs.existsSync(INVENTORY_PATH)) {
    try {
      inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));
    } catch (err) {
      console.error("[SLPlayer Backend] Failed to read inventory for delete:", err);
    }
  }

  const trackToDelete = inventory.find((t) => t.id === trackId);
  if (trackToDelete && trackToDelete.filename) {
    const audioFilePath = path.join(mediaDir, trackToDelete.filename);
    if (fs.existsSync(audioFilePath)) {
      try {
        fs.unlinkSync(audioFilePath);
        console.log(`[SLPlayer Backend] Deleted file: ${audioFilePath}`);
      } catch (err) {
        console.error(`[SLPlayer Backend] Error deleting file ${audioFilePath}:`, err);
      }
    }
  }

  // Update inventory
  inventory = inventory.filter((t) => t.id !== trackId);
  try {
    fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2));
  } catch (err) {
    console.error("[SLPlayer Backend] Error saving inventory after delete:", err);
  }

  // Update assignments
  const assignments = loadAssignments();
  if (assignments[trackId]) {
    delete assignments[trackId];
    try {
      fs.writeFileSync(ASSIGNMENTS_PATH, JSON.stringify(assignments, null, 2));
    } catch (err) {
      console.error("[SLPlayer Backend] Error saving assignments after track delete:", err);
    }
  }

  loadInventory();
  res.json({ message: "Track deleted successfully", trackId });
});

app.get("/api/drops", (req, res) => {
  const dropsPath = path.join(__dirname, "media", "beat_drops.json");
  if (fs.existsSync(dropsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dropsPath, "utf-8"));
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to parse beat drops" });
    }
  } else {
    res.json({}); // Return empty if not analyzed yet
  }
});

// 3.1 Media Route with HTTP 206 Byte-Range partial content streamer
app.get("/api/stream/:trackId", (req, res) => {
  const trackId = req.params.trackId;
  const forceFull = req.query.full === "true";
  const track = Object.prototype.hasOwnProperty.call(TRACK_INVENTORY, trackId)
    ? TRACK_INVENTORY[trackId]
    : undefined;

  if (!track) {
    console.error(
      `[SLPlayer Backend] Error: Track ID "${trackId}" not found in inventory.`,
    );
    return res.status(404).json({ error: "Track not found in registry" });
  }

  // Support multiple audio containers without transcoding (MP3, M4A, WebM)
  const baseName = track.filename.substring(0, track.filename.lastIndexOf("."));
  const extensions = [".mp3", ".m4a", ".webm"];
  let filePath = "";
  let contentType = "audio/mpeg";

  for (const ext of extensions) {
    const testPath = path.join(__dirname, "media", baseName + ext);
    if (fs.existsSync(testPath)) {
      filePath = testPath;
      if (ext === ".m4a") contentType = "audio/mp4";
      else if (ext === ".webm") contentType = "audio/webm";
      else contentType = "audio/mpeg";
      break;
    }
  }

  if (!filePath) {
    console.error(
      `[SLPlayer Backend] Error: Audio file for "${track.filename}" not found in storage.`,
    );
    return res.status(404).json({ error: "Audio file not found in storage" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range && !forceFull) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Serve media folder statically (supporting both relative/local and base-url prefixed requests)
app.use(
  "/Solo-Leveling-MP4/media",
  express.static(path.join(__dirname, "media")),
);
app.use("/media", express.static(path.join(__dirname, "media")));

// Serve static assets from frontend build folder (supporting both / and base-url prefixed requests)
const clientPath = path.join(__dirname, "../dist/client");
app.use("/Solo-Leveling-MP4", express.static(clientPath));
app.use(express.static(clientPath));

// Catch-all route to serve the React app (index.html)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`[SLPlayer Backend] Running on http://localhost:${PORT}`);
});
