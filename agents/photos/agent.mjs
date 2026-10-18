/**
 * Photos agent — keeps every recipe photo present and its credit current.
 * 1. Re-checks each credited Wikimedia Commons file (still online? license/author changed?).
 * 2. For any recipe without public/meals/<id>.webp, searches Wikimedia Commons for its name,
 *    downloads the best CC-licensed match, crops it to 800×600 WebP and records the credit.
 */
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { getJSON, getText, UA_BOT } from "../_lib/http.mjs";
import { bool, num } from "../_lib/env.mjs";
import { pool } from "../_lib/http.mjs";

const API = "https://commons.wikimedia.org/w/api.php";
// Never use photos whose title names meat, fish or eggs (this is a vegetarian site).
const NON_VEG = /\b(chicken|mutton|lamb|goat|beef|pork|bacon|ham|fish|salmon|tuna|prawns?|shrimps?|crabs?|lobster|squid|eggs?|omelet+e?|meat\w*|sausages?|turkey|duck|seafood|steak|abalone|larb gai|carne|pollo|pastor|carnitas|chorizo|cerdo|barbacoa|asada|mu|moo|gai|nuea|pla|goong|bulgogi|galbi|dwaeji|butadon|tonkotsu|ilish|hilsa|machh|machha|maach|maachh|mach|macher|shakshuka|bhetki|rui|katla|biryani|sashimi|nigiri|tandoori|nogada|picadillo|tuna|unagi|ebi|kebab|tikka masala chicken)\b/i;
// Also catch meat/fish words inside longer words ("tunafish", "porkbelly", "chickenwings").
const NON_VEG_ANY = /(chicken|tuna|fish|pork|beef|mutton|prawn|shrimp|salmon|bacon|sausage|sashimi|anchov|seafood|egg(?!plant)|kimizu|mayonnaise|aioli)/i;
const OK_LICENSE = /^(cc0|public domain|cc by(-sa)? [\d.]+)/i;
const strip = (s = "") => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

async function recipeIdsAndNames(root) {
  const src = await readFile(path.join(root, "lib", "meals.ts"), "utf8");
  return [...src.matchAll(/^\{id:'([a-z0-9]+)',slot:'[a-z]+',tags:\[[^\]]*\],name:'([^']+)'/gm)].map((m) => ({ id: m[1], name: m[2] }));
}

async function search(name, override, reject = [], used = new Set()) {
  const q = override || name.replace(/\s*\+.*$/, "").replace(/\(.*?\)/g, "").trim();
  const params = new URLSearchParams({ action: "query", format: "json", generator: "search", gsrsearch: `${q} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "8", prop: "imageinfo", iiprop: "url|extmetadata|mime|size", iiurlwidth: "1024" });
  const d = await getJSON(`${API}?${params}`, { headers: { "User-Agent": UA_BOT } });
  const pages = Object.values(d.query?.pages || {}).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const ii = p.imageinfo?.[0]; const md = ii?.extmetadata || {};
    const lic = strip(md.LicenseShortName?.value);
    const t = p.title.replace(/^File:/, "");
    if (used.has(t.replace(/\.\w+$/, ""))) continue; // already used for another recipe
    if (!ii || !/jpeg|png|webp/.test(ii.mime) || ii.width < 500 || !OK_LICENSE.test(lic) || NON_VEG.test(t) || NON_VEG_ANY.test(t) || reject.some((x) => t.startsWith(x))) continue;
    return { title: p.title.replace(/^File:/, "").replace(/\.\w+$/, ""), thumb: ii.thumburl, author: strip(md.Artist?.value).slice(0, 80) || "Unknown", license: lic, licenseUrl: strip(md.LicenseUrl?.value), source: "Wikimedia Commons", page: ii.descriptionurl };
  }
  return null;
}

export async function run({ env, root, log }) {
  const creditsFile = path.join(root, "lib", "photo-credits.json");
  const credits = JSON.parse(await readFile(creditsFile, "utf8"));
  const recipes = await recipeIdsAndNames(root);
  const warnings = [];
  let verified = 0, changed = 0, added = 0, missingOnline = 0;

  // 1) verify Commons credits in batches of 40
  if (bool(env.PHOTOS_VERIFY_CREDITS, true)) {
    const commons = Object.entries(credits).filter(([, c]) => c.source === "Wikimedia Commons" && c.page);
    for (let i = 0; i < commons.length; i += 40) {
      const batch = commons.slice(i, i + 40);
      const titles = batch.map(([, c]) => "File:" + decodeURIComponent(c.page.split("/File:")[1] || "").replace(/_/g, " "));
      const params = new URLSearchParams({ action: "query", format: "json", titles: titles.join("|"), prop: "imageinfo", iiprop: "extmetadata" });
      const d = await getJSON(`${API}?${params}`, { headers: { "User-Agent": UA_BOT } });
      const norm = Object.fromEntries((d.query?.normalized || []).map((n) => [n.from, n.to]));
      const byTitle = Object.fromEntries(Object.values(d.query?.pages || {}).map((p) => [p.title, p]));
      batch.forEach(([id, c], k) => {
        const p = byTitle[norm[titles[k]] || titles[k]];
        if (!p || p.missing !== undefined) { missingOnline++; warnings.push(`${id}: source file no longer on Commons (local copy kept)`); return; }
        const md = p.imageinfo?.[0]?.extmetadata || {};
        const lic = strip(md.LicenseShortName?.value), author = strip(md.Artist?.value).slice(0, 80);
        verified++;
        if ((lic && lic !== c.license) || (author && author !== c.author)) { credits[id] = { ...c, license: lic || c.license, author: author || c.author }; changed++; }
      });
    }
  }

  // 2) fetch photos for recipes that have none
  const exists = async (f) => access(f).then(() => true, () => false);
  const missing = [];
  for (const r of recipes) if (!credits[r.id] || !(await exists(path.join(root, "public", "meals", `${r.id}.webp`)))) missing.push(r);
  if (missing.length) {
    let sharp;
    try { sharp = (await import("sharp")).default; } catch { warnings.push("sharp not installed; cannot crop new photos"); }
    let overrides = {}, reject = [];
    try { overrides = JSON.parse(await readFile(path.join(root, "lib", "photo-queries.json"), "utf8")); } catch {}
    try { reject = JSON.parse(await readFile(path.join(root, "lib", "photo-reject.json"), "utf8")); } catch {}
    const todo = sharp ? missing.slice(0, num(env.PHOTOS_MAX_NEW, 60)) : [];
    const used = new Set(Object.values(credits).map((c) => c.title));
    let saving = Promise.resolve();
    const save = () => (saving = saving.then(() => writeFile(creditsFile, JSON.stringify(credits, null, 1)))); // save after each photo
    await pool(todo, num(env.PHOTOS_CONCURRENCY, 2), async (r) => {
      try {
        const hit = await search(r.name, overrides[r.id], reject, used);
        if (!hit) { warnings.push(`${r.id}: no CC-licensed photo found for “${overrides[r.id] || r.name}”`); return; }
        let res;
        for (let a = 0; a < 4; a++) {
          res = await fetch(hit.thumb, { headers: { "User-Agent": UA_BOT }, signal: AbortSignal.timeout(30000) });
          if (res.status !== 429) break;
          await new Promise((w) => setTimeout(w, 3000 * (a + 1))); // Wikimedia asks clients to slow down
        }
        if (!res.ok) throw new Error(`image HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await sharp(buf).rotate().resize(800, 600, { fit: "cover" }).webp({ quality: 78 }).toFile(path.join(root, "public", "meals", `${r.id}.webp`));
        const { thumb, ...credit } = hit;
        credits[r.id] = credit; added++; used.add(credit.title);
        await save();
        log(`added photo for ${r.id} (${hit.title})`);
      } catch (e) { warnings.push(`${r.id}: ${e.message}`); }
    });
    await saving;
  }
  if (changed || added) await writeFile(creditsFile, JSON.stringify(credits, null, 1));
  const summary = `${verified} credits verified, ${changed} updated, ${added} new photos, ${missing.length - added} still missing`;
  return { data: { verified, changed, added, missingOnline, stillMissing: missing.filter((r) => !credits[r.id]).map((r) => r.id) }, summary, warnings };
}
