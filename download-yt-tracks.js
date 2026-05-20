import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ytdlpPath = path.join(__dirname, "backend", "yt-dlp.exe");
const mediaDir = path.join(__dirname, "backend", "media");

const tracks = [
  {
    name: "veki_veki_ultra_slowed.m4a",
    url: "https://youtu.be/96v4aaz6hqg?si=EQhIRf-eT4fgjH0p",
  },
  {
    name: "worry_ultra_slowed.m4a",
    url: "https://www.youtube.com/watch?v=S9jWjyiygqs",
  },
  {
    name: "babydoll_the_perfect_girl.m4a",
    url: "https://youtu.be/ccwAbK9VTOc?si=PdFoBhce1u7_Zi24",
  },
  {
    name: "one_of_the_girls_good_for_you.m4a",
    url: "https://youtu.be/_hYsJ8I5kjw?si=yzNu2v_puSitq-v_",
  },
];

async function main() {
  for (const track of tracks) {
    const dest = path.join(mediaDir, track.name);
    console.log(`Downloading: ${track.name} from ${track.url}...`);
    try {
      execFileSync(ytdlpPath, ["-f", "ba[ext=m4a]/ba", "-o", dest, track.url], {
        stdio: "inherit",
      });
      console.log(`Successfully downloaded: ${track.name}\n`);
    } catch (err) {
      console.error(`Failed downloading: ${track.name}`, err.message);
    }
  }
  console.log("All YouTube downloads completed!");
}

main();
