// Regenerates mods/manifest.json from the .jar files in mods/.
// No dependencies — run:  node scripts/gen-manifest.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const modsDir = path.join(__dirname, "..", "mods");
const out = path.join(modsDir, "manifest.json");

const jars = fs
  .readdirSync(modsDir)
  .filter((f) => f.toLowerCase().endsWith(".jar"))
  .sort((a, b) => a.localeCompare(b));

const mods = jars.map((name) => {
  const buf = fs.readFileSync(path.join(modsDir, name));
  return {
    name,
    sha1: crypto.createHash("sha1").update(buf).digest("hex"),
    size: buf.length,
  };
});

fs.writeFileSync(out, JSON.stringify({ mods }, null, 2) + "\n");
console.log(`manifest.json: ${mods.length} mod(s)`);
