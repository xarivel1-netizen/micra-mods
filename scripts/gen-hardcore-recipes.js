// Regenerates the "universe_hardcore" TACZ gun pack: reads TACZ's default recipes,
// replaces ONLY the materials with ultra-hardcore Create-gated ones, keeps result/type.
// Source = extracted default pack in the game dir. Output = repo overlay pack (committed).
//
//   node scripts/gen-hardcore-recipes.js
const fs = require("fs");
const path = require("path");

const APPDATA = process.env.APPDATA || "C:/Users/User/AppData/Roaming";
const SRC = path.join(APPDATA, ".micra", "game", "tacz",
  "tacz_default_gun", "data", "tacz", "recipe");
// Overwrite the recipe files INSIDE the default pack — TACZ ignores a separate
// override pack (issue #267), but reads edited files in tacz_default_gun.
const PACK = path.join(__dirname, "..", "overlay", "tacz", "tacz_default_gun");
const OUT = path.join(PACK, "data", "tacz", "recipe");

// material helpers
const I = (id, count) => ({ item: { item: id }, count });   // by item id
const T = (tag, count) => ({ item: { tag }, count });       // by tag

// Create / Create Aeronautics items used as gates
const ANDESITE = id => I("create:andesite_alloy", id);
const BRASS = c => I("create:brass_sheet", c);
const IRONSHEET = c => I("create:iron_sheet", c);
const MECH = c => I("create:precision_mechanism", c);   // expensive Create item
const TUBE = c => I("create:electron_tube", c);          // expensive Create item
const AERO = c => I("aeroworks:yoke_module", c);         // Create Aeronautics item
const NETHERITE = c => I("minecraft:netherite_ingot", c);
const GLASS = c => T("c:glass_panes", c);
const REDSTONE = c => T("c:dusts/redstone", c);
const GUNPOWDER = c => T("c:gunpowders", c);
const IRON = c => T("c:ingots/iron", c);
const LOGS = c => T("minecraft:logs", c);

// ── Gun tiers ────────────────────────────────────────────────────────────────
const GUN_TIER = {
  pistol:   () => [ANDESITE(8), IRONSHEET(10), BRASS(6), MECH(2)],
  smg:      () => [ANDESITE(12), BRASS(10), MECH(3), TUBE(1)],
  rifle:    () => [BRASS(16), ANDESITE(14), MECH(5), TUBE(2)],
  shotgun:  () => [BRASS(12), IRONSHEET(14), MECH(4), TUBE(1)],
  sniper:   () => [BRASS(20), MECH(7), TUBE(3), AERO(1)],
  mg:       () => [BRASS(24), MECH(10), TUBE(4), AERO(2)],
  launcher: () => [BRASS(16), MECH(8), TUBE(4), AERO(2), NETHERITE(2)],
};
const GUN_CLASS = {
  pistol: ["glock_17","m1911","cz75","p320","m9a4","hk_mk23","b93r","rhino357","taurus500","deagle","deagle_golden","timeless50"],
  smg: ["hk_mp5a5","ump45","uzi","vector45","p90"],
  shotgun: ["aa12","m1014","m870","spas_12","db_long","db_short"],
  sniper: ["ai_awp","kar98","m107","m95","m700","lonetrail","springfield1873","sks_tactical","spr15hb"],
  mg: ["m249","rpk","minigun","fn_evolys"],
  launcher: ["rpg7","m320"],
  // everything else → rifle
};
function gunTier(id) {
  for (const [cls, ids] of Object.entries(GUN_CLASS)) if (ids.includes(id)) return cls;
  return "rifle";
}

// ── Ammo tiers (kept craftable in bulk; guns are the precision gate) ──────────
const AMMO_TIER = {
  small:   () => [BRASS(4), GUNPOWDER(4)],
  medium:  () => [BRASS(6), GUNPOWDER(6), ANDESITE(2)],
  large:   () => [BRASS(8), GUNPOWDER(8), ANDESITE(3)],
  magnum:  () => [BRASS(10), GUNPOWDER(10), ANDESITE(4)],
  shell:   () => [IRONSHEET(6), GUNPOWDER(6)],
  special: () => [BRASS(12), GUNPOWDER(16), TUBE(1), MECH(1)],
};
const AMMO_CLASS = {
  small: ["9mm","45acp","22wmr","57x28","46x30","762x25"],
  medium: ["556x45","762x39","545x39","68x51fury","58x42"],
  large: ["762x54","792x57","308","30_06","45_70"],
  magnum: ["50ae","500mag","357mag","50bmg","338"],
  shell: ["12g"],
  special: ["40mm","rpg_rocket"],
};
function ammoTier(id) {
  for (const [cls, ids] of Object.entries(AMMO_CLASS)) if (ids.includes(id)) return cls;
  return "medium";
}

// ── Attachment materials by name prefix ──────────────────────────────────────
function attachMats(id) {
  if (id.startsWith("scope_") || id.startsWith("sight_")) return [GLASS(4), BRASS(4), TUBE(1)];
  if (id.startsWith("laser_")) return [TUBE(1), BRASS(3), REDSTONE(8)];
  if (id.startsWith("muzzle_silencer_")) return [IRONSHEET(6), ANDESITE(4), BRASS(2)];
  if (id.startsWith("muzzle_")) return [IRONSHEET(6), ANDESITE(3)];
  if (id.startsWith("grip_")) return [ANDESITE(4), BRASS(2)];
  if (id.includes("stock")) return [ANDESITE(4), IRONSHEET(4), LOGS(4)];
  if (id.includes("mag")) return [BRASS(4), IRONSHEET(4)];
  if (id.startsWith("bayonet_")) return [IRONSHEET(6), IRON(4)];
  if (id.startsWith("ammo_mod_")) return [BRASS(4), GUNPOWDER(6)];
  return [ANDESITE(4), BRASS(3)]; // fallback
}

const MULT = 4; // global difficulty multiplier applied to every material count

function emit(cat, matFn) {
  const inDir = path.join(SRC, cat);
  const outDir = path.join(OUT, cat);
  fs.mkdirSync(outDir, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(inDir).filter(f => f.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "");
    const recipe = JSON.parse(fs.readFileSync(path.join(inDir, f), "utf8"));
    recipe.materials = matFn(id).map(m => ({ ...m, count: m.count * MULT })); // swap + scale
    fs.writeFileSync(path.join(outDir, f), JSON.stringify(recipe, null, 2) + "\n");
    n++;
  }
  return n;
}

fs.mkdirSync(OUT, { recursive: true });

const g = emit("gun", id => GUN_TIER[gunTier(id)]());
const a = emit("ammo", id => AMMO_TIER[ammoTier(id)]());
const at = emit("attachments", attachMats);
console.log(`hardcore recipes: guns=${g} ammo=${a} attachments=${at}`);
