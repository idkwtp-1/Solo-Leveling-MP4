import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SILENT_MP3_URL =
  "https://raw.githubusercontent.com/anars/blank-audio/master/5-seconds-of-silence.mp3";

const mediaDir = path.join(__dirname, "backend", "media");
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

const tracks = [
  "monarchs_approach.mp3",
  "iron_body.mp3",
  "arise.mp3",
  "rulers_hand.mp3",
  "blood_red_commander.mp3",
  "antares_descent.mp3",
  "dagger_protocol.mp3",
  "shadow_extraction.mp3",
  "berus_oath.mp3",
  "chained_phantom.mp3",
  "after_the_raid.mp3",
  "moonlit_safezone.mp3",
  "quiet_mana.mp3",
  "throne_of_ashes.mp3",
  "frost_emperor.mp3",
  "destroyers_waltz.mp3",
  "entry_gate.mp3",
  "mob_sweep.mp3",
  "mini_boss.mp3",
  "loot_table.mp3",
  "reawakened.mp3",
  "double_dungeon.mp3",
  "player.mp3",
];

async function main() {
  console.log("Downloading base silent MP3...");
  const res = await fetch(SILENT_MP3_URL);
  if (!res.ok) throw new Error(`Failed to fetch blank MP3: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  const data = Buffer.from(buffer);

  console.log("Duplicating silent MP3 for tracks...");
  for (const track of tracks) {
    const dest = path.join(mediaDir, track);
    fs.writeFileSync(dest, data);
    console.log(`Created: ${track}`);
  }
  console.log("Media library initialized!");
}

main().catch((err) => {
  console.error("Error initializing media:", err);
  process.exit(1);
});
