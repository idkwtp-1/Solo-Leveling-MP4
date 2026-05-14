import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36";

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap";

const outputDir = path.join(__dirname, "public", "fonts");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
  console.log(`Downloaded: ${path.basename(dest)}`);
}

async function main() {
  console.log("Fetching Google Fonts CSS...");
  const res = await fetch(CSS_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Failed to fetch CSS: ${res.statusText}`);
  const cssText = await res.text();
  console.log("CSS fetched.");

  // Parse CSS to find src: url(...) and its font-family, font-weight, etc.
  const rules = cssText.split("}");

  let fontIndex = 0;
  for (const rule of rules) {
    if (!rule.includes("@font-face")) continue;

    // Extract font-family
    const familyMatch = rule.match(/font-family:\s*['"]?([^'"]+)['"]?/i);
    const weightMatch = rule.match(/font-weight:\s*(\d+)/i);
    const urlMatch = rule.match(/src:\s*url\(([^)]+)\)/i);

    if (familyMatch && weightMatch && urlMatch) {
      const family = familyMatch[1].replace(/\s+/g, "");
      const weight = weightMatch[1];
      const url = urlMatch[1];

      const fileName = `${family.toLowerCase()}-${weight}.woff2`;
      const filePath = path.join(outputDir, fileName);

      console.log(`Downloading ${family} (${weight}) from ${url}...`);
      await downloadFile(url, filePath);
    }
  }

  console.log("All fonts downloaded successfully!");
}

main().catch((err) => {
  console.error("Error downloading fonts:", err);
  process.exit(1);
});
