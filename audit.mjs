import fs from "fs";
import path from "path";

const SRC_DIR = "./src";
const BACKEND_DIR = "./backend";

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (
        file.endsWith(".ts") ||
        file.endsWith(".tsx") ||
        file.endsWith(".js")
      ) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const files = [...getAllFiles(SRC_DIR), ...getAllFiles(BACKEND_DIR)];
const report = [];

const allContent = new Map();
files.forEach((f) => {
  allContent.set(f, fs.readFileSync(f, "utf8"));
});

// 1. Unused Imports & Exports
// For exports, collect all named exports and default exports, then search all OTHER files for them.
const exportsMap = new Map(); // exportName -> [filePaths]

files.forEach((f) => {
  const content = allContent.get(f);
  // Find exports
  const namedExports = [
    ...content.matchAll(
      /export\s+(?:const|function|class|interface|type)\s+([A-Za-z0-9_]+)/g,
    ),
  ].map((m) => m[1]);
  namedExports.forEach((ex) => {
    if (!exportsMap.has(ex)) exportsMap.set(ex, []);
    exportsMap.get(ex).push(f);
  });
});

const fileKeys = Array.from(allContent.keys());

exportsMap.forEach((filePaths, ex) => {
  if (
    ["App", "main", "AnimatedBackground", "ShadowPlayerPage", "index"].includes(
      ex,
    )
  )
    return; // Common entries
  let isUsed = false;
  for (const f of fileKeys) {
    if (filePaths.includes(f)) continue; // skip the file it was defined in
    const content = allContent.get(f);
    if (new RegExp(`\\b${ex}\\b`).test(content)) {
      isUsed = true;
      break;
    }
  }
  if (!isUsed) {
    filePaths.forEach((f) => {
      // ignore UI components from shadcn as they are often unused but part of the library
      if (!f.includes("UI") && !f.includes("ui")) {
        report.push(
          `[3. Dead functions and classes] File: ${f} | Line(s): ?\nIssue: Exported entity '${ex}' is never imported or referenced in other files.\nRisk if removed: Medium (needs review — dynamic reference possible)`,
        );
      }
    });
  }
});

// For each file, check for console.log, empty catch, unused imports (heuristic)
files.forEach((f) => {
  const content = allContent.get(f);
  const lines = content.split("\n");

  // Find unused imports inside the same file
  const imports = [...content.matchAll(/import\s+{([^}]+)}\s+from/g)];
  imports.forEach((m) => {
    const importNames = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    importNames.forEach((imp) => {
      // Remove alias if present e.g. "import { a as b }"
      const actualName = imp.includes(" as ")
        ? imp.split(" as ")[1].trim()
        : imp;

      const regex = new RegExp(`\\b${actualName}\\b`, "g");
      const matches = content.match(regex);
      // It will match at least once in the import statement itself
      if (matches && matches.length === 1) {
        // Find line
        const lineNum = lines.findIndex((l) => l.includes(actualName)) + 1;
        report.push(
          `[1. Unused imports] File: ${f} | Line(s): ${lineNum}\nIssue: Import '${actualName}' is never referenced in this file.\nRisk if removed: Low`,
        );
      }
    });
  });

  // Check leftovers
  lines.forEach((line, i) => {
    const ln = i + 1;
    if (line.includes("console.log")) {
      report.push(
        `[6. Leftover artifacts] File: ${f} | Line(s): ${ln}\nIssue: console.log statement found.\nRisk if removed: Low`,
      );
    }
    if (
      line.includes("catch (e) {}") ||
      line.includes("catch {}") ||
      line.includes("catch(e){}")
    ) {
      report.push(
        `[6. Leftover artifacts] File: ${f} | Line(s): ${ln}\nIssue: Empty catch block with no error handling.\nRisk if removed: Low`,
      );
    }
    if (line.match(/function\s*\w*\s*\([^)]*\)\s*\{\s*\}/)) {
      report.push(
        `[6. Leftover artifacts] File: ${f} | Line(s): ${ln}\nIssue: Empty function found.\nRisk if removed: Low`,
      );
    }
    // commented code heuristic
    if (line.match(/^\s*\/\/\s+(const|let|var|function|if|for|while)\b/)) {
      report.push(
        `[4. Commented-out code blocks] File: ${f} | Line(s): ${ln}\nIssue: Commented-out code logic found.\nRisk if removed: None`,
      );
    }
  });

  // multi-line comments
  const multiLineComments = [...content.matchAll(/\/\*[\s\S]*?\*\//g)];
  multiLineComments.forEach((m) => {
    const comment = m[0];
    if (
      comment.includes("const ") ||
      comment.includes("function ") ||
      comment.includes("import ") ||
      comment.includes("let ")
    ) {
      const lineNum = content.substring(0, m.index).split("\n").length;
      report.push(
        `[4. Commented-out code blocks] File: ${f} | Line(s): ${lineNum}\nIssue: Multi-line commented code block.\nRisk if removed: None`,
      );
    }
  });
});

fs.writeFileSync("audit_report_raw.txt", report.join("\n\n"));
console.log(`Found ${report.length} potential issues.`);
