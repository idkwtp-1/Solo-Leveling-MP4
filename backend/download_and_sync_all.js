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
  "https://youtu.be/1pOOeRCnj3w?si=gown1FHtVO5cLVgC",
  "https://youtu.be/qlzcHe_gusE?si=ENC5EhWlKBpGvqNe",
  "https://youtu.be/-TWcj4LkC5Q?si=KlekcxI5Pt2qy-vb",
  "https://youtu.be/ITr1zvto4EU?si=bKBxkyDprLc3hWuH",
  "https://youtu.be/tzyaDFAbwp0?si=yq_3zA9mjnxzZS4t",
  "https://youtu.be/Pt66SxDoReI?si=7uUVHBKQODgcXbgT",
  "https://youtu.be/Ch_nI3-N7WE?si=XPJXTM_HRIdqtzi8",
  "https://youtu.be/wIz63uKm0kc?si=4ELj5HS0B51lcbgW",
  "https://youtu.be/l9-TwxQWbo8?si=KdUzBEgNbFqGNO5h",
  "https://youtu.be/z8gM_KvSg24?si=E4-hbQIrx4xRhxwz",
  "https://youtu.be/7QQ4ZrLY_JU?si=yAezovYwI2KphqOm",
  "https://youtu.be/RzRxVRmsrGo?si=iIA7l935bMGaTs25",
  "https://youtu.be/Hw5vNpf1GMU?si=RdlXnZR6pp6i5ilF",
  "https://youtu.be/_EH6bbGu6Lw?si=CCYE9ZhBjeRBjr2J",
  "https://youtu.be/KgayxOF4Y7E?si=V0q2poV_xFKBjlal",
  "https://youtu.be/BYPyuff25eM?si=qh5R-50Jp4Tv5qpf",
  "https://youtu.be/Yjt0nlxZP5w?si=-rKr51veV6KWiQ85",
  "https://youtu.be/LgP49mjClmM?si=NgDYWugHxX6bKUtN",
  "https://youtu.be/-nBVJNB628g?si=3vAILVsHlBFOYfxY",
  "https://youtu.be/0gC8dvC7YHU?si=_C87OtDB9igr5qGn",
  "https://youtu.be/T60FN13-xBE?si=6ok5FN8xNNyO4ZsF",
  "https://youtu.be/FwVwBGWQY78?si=gjl0m5KrQuWZtFQ4",
  "https://youtu.be/MWsuHKUgZ98?si=_Ht8cd5V4l6sX1ym",
  "https://youtu.be/Ral6kFSx7ZY?si=b2ZGokL8150YsTei",
  "https://youtu.be/qai2Qx_vduA?si=cEccqRSz5pawgFG6",
  "https://youtu.be/MlXekIvsQuQ?si=Sefyy3-NvCFnOwwD",
  "https://youtu.be/_JdQfUxT-N0?si=6ELXxLbE1n2KM9-l",
  "https://youtu.be/ArprzwopyqQ?si=mbnTEyHaoDhUWlLj",
  "https://youtu.be/QWkI-XE1ITE?si=g-fC5rHDqAz-jpIJ",
  "https://youtu.be/XHbsbx-c2-k?si=3gbtkErrpODtf7Nq",
  "https://youtu.be/FYl-cGhSoA0?si=q5VTJIWFPCIYn-jO",
  "https://youtu.be/MmpVAy35W0k?si=olJmwj7K4XyHw-qQ",
  "https://youtu.be/_BvCYru_HN8?si=stjaOl9zWhRiNlAK",
  "https://youtu.be/PQHY7ENhl9M?si=TIj1xjlYP690ekya",
  "https://youtu.be/LczXZzj5DBw?si=mL6CEeNNbsZhDtKi",
  "https://youtu.be/MeamyO9UxPk?si=xV7RGczUX9QsjJlL",
  "https://youtu.be/k26jZ8hOPZ4?si=LH_yaR5CgUCgThLN",
  "https://youtu.be/tcgNkHo5RMQ?si=mKwycUEJV0navB1R",
  "https://youtu.be/XhX3B4g0KAA?si=yKX41oHoPeia27So",
  "https://youtu.be/8y0asLhCM14?si=7VYbNwE53txPN4pZ",
  "https://youtu.be/lxERoiGTj7c?si=vBBDL7kOhpAzxapJ",
  "https://youtu.be/UrTd4Skw83g?si=2paYXf-F7WKh43jR",
  "https://youtu.be/UQ32RS8JYck?si=8UcL_tKHrhNOlbO-",
  "https://youtu.be/CtJTUHr2R3g?si=ZUDAPWxBT2oQGK7H",
  "https://youtu.be/n82wMjalo1U?si=p4qvY5gyeBUHSV1U",
  "https://youtu.be/cUwnLvgdo5g?si=mk3JgcvUmTO5j4WA",
  "https://youtu.be/vnthp1ZgWiU?si=MSroztpoJGp1Oxgg",
  "https://youtu.be/PaJjpOmE-7k?si=39wBp_l7P_90cCtF",
  "https://youtu.be/xFyihUstuNQ?si=mcbshILFT575vR",
  "https://youtu.be/WoxAycq2oSY?si=EPvfUerMrm7Dae_B",
  "https://youtu.be/Gb31AKjmKos?si=SJi6BnqnStTMkdBb",
  "https://youtu.be/V7KrvXTlj_Y?si=BaqeHqBX9QXybtA2"
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
