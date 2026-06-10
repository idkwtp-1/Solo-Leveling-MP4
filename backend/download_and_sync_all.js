import { execFileSync, execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ytdlpPath = path.join(__dirname, "yt-dlp.exe");
const mediaDir = path.join(__dirname, "media");
const inventoryPath = path.join(mediaDir, "tracks_inventory.json");

// Refresh PATH environment variables in node so child processes can locate newly installed Gyan.FFmpeg
try {
  const freshPath = execSync(
    'powershell "[System.Environment]::GetEnvironmentVariable(\'Path\',\'Machine\') + \';\' + [System.Environment]::GetEnvironmentVariable(\'Path\',\'User\')"'
  )
    .toString()
    .trim();
  process.env.PATH = freshPath;
} catch (err) {
  console.error("Failed to refresh PATH environment variable:", err.message);
}

const urls = [
  "https://youtu.be/BoLQdlfV_XA?si=XuKhRnJFf152PBBO",
  "https://youtu.be/TdrL3QxjyVw?si=jc5WObtVvOabMRPt",
  "https://youtu.be/MiAoetOXKcY?si=1hF56Lf81cuy0o2F"
];

function formatDuration(secStr) {
  const seconds = parseInt(secStr, 10);
  if (isNaN(seconds)) return "??";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function main() {
  console.log(`Starting download of ${urls.length} YouTube tracks...`);

  // Load existing inventory
  let inventory = [];
  if (fs.existsSync(inventoryPath)) {
    try {
      inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));
    } catch (e) {
      console.error("Failed to parse existing inventory:", e.message);
    }
  }

  const existingIds = new Set(inventory.map((t) => t.id));

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] Processing: ${url}`);

    try {
      // Run yt-dlp to download and print metadata (title, duration in seconds, downloaded filename)
      const output = execFileSync(
        ytdlpPath,
        [
          "-f",
          "ba[ext=m4a]/ba",
          "--restrict-filenames",
          "--no-simulate",
          "--no-post-overwrites",
          "-o",
          path.join(mediaDir, "%(title)s.%(ext)s"),
          "--print",
          "%(title)s",
          "--print",
          "%(duration)s",
          "--print",
          "%(filename)s",
          url,
        ],
        { encoding: "utf-8" }
      );

      const lines = output.trim().split("\n").filter((l) => l.trim() !== "");
      // Filter out warnings/extra logs if present
      const cleanLines = lines.filter((l) => !l.startsWith("WARNING:") && !l.includes("supported JavaScript runtime"));

      if (cleanLines.length < 3) {
        console.error(`Unexpected yt-dlp output format. Output was:\n${output}`);
        continue;
      }

      const title = cleanLines[0].trim();
      const durationSecs = cleanLines[1].trim();
      const absoluteFilePath = cleanLines[2].trim();
      const relativeFileName = path.basename(absoluteFilePath);

      // Generate sanitized track ID
      const baseName = path.basename(relativeFileName, path.extname(relativeFileName));
      const trackId = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      console.log(`Downloaded: ${relativeFileName}`);
      console.log(`Title: ${title}`);
      console.log(`Duration: ${formatDuration(durationSecs)} (${durationSecs}s)`);
      console.log(`Track ID: ${trackId}`);

      // Add to inventory if not already present
      if (!existingIds.has(trackId)) {
        inventory.push({
          id: trackId,
          filename: relativeFileName,
          title: title,
          duration: formatDuration(durationSecs),
        });
        existingIds.add(trackId);
        
        // Write incrementally to prevent data loss
        fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
        console.log(`Added track to inventory: ${trackId}`);
      } else {
        console.log(`Track ${trackId} already exists in inventory, skipping registration.`);
      }

    } catch (err) {
      console.error(`Failed to process URL: ${url}`, err.message);
    }
  }

  console.log("\nAll YouTube downloads and inventory registration completed!");

  // Now trigger the python analysis script to calculate beat drops
  console.log("Starting beat drop analysis on new tracks...");
  try {
    const analysisOutput = execFileSync(
      "python",
      [path.join(__dirname, "analyze_drops.py")],
      { stdio: "inherit", env: process.env }
    );
    console.log("Analysis completed successfully!");
  } catch (err) {
    console.error("Beat drop analysis failed:", err.message);
  }
}

main();
