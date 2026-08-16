// Builds overlay-manifest.json: every file under overlay/ with its sha1 and
// game-relative path. The launcher downloads overlay/<path> -> game/<path>,
// skipping files whose sha1 already matches.
//   node scripts/gen-overlay-manifest.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..", "overlay");
const files = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else {
      const rel = path.relative(ROOT, full).split(path.sep).join("/");
      const sha1 = crypto.createHash("sha1").update(fs.readFileSync(full)).digest("hex");
      files.push({ path: rel, sha1 });
    }
  }
}

if (fs.existsSync(ROOT)) walk(ROOT);
files.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(
  path.join(__dirname, "..", "overlay-manifest.json"),
  JSON.stringify({ files }, null, 2) + "\n");
console.log(`overlay-manifest: ${files.length} file(s)`);
