import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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
  max: 300, // limit each IP to 300 requests per windowMs
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
      console.error("[SLPlayer Backend] Error reading tracks_inventory.json:", err);
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

// Gates are empty shells — tracks are assigned dynamically via the frontend
const GATES_DATA = [
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

// Gate endpoints
app.get("/api/gates", (req, res) => {
  res.json(GATES_DATA);
});

app.get("/api/gates/:gateId", (req, res) => {
  const gate = GATES_DATA.find((g) => g.id === req.params.gateId);
  if (!gate) {
    return res.status(404).json({ error: "Gate not found" });
  }
  res.json(gate);
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
app.use("/Solo-Leveling-MP4/media", express.static(path.join(__dirname, "media")));
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
