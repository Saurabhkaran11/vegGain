/**
 * Chefs agent — fetches each chef's latest vegetarian videos from YouTube.
 * Mode 1 (default, no key): reads the channel's public Videos page and a channel-filtered search page.
 * Mode 2 (CHEFS_YOUTUBE_API_KEY set): uses the official YouTube Data API v3 uploads playlist.
 * Non-vegetarian titles (meat, fish, egg…) are filtered out using lib/veg-filter.json (the site applies the same rules).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getJSON, getText, pool, UA_BROWSER } from "../_lib/http.mjs";
import { bool, num } from "../_lib/env.mjs";

// Vegetarian rules shared with the site: lib/veg-filter.json (loaded in run()).
let isVeg = () => true;
function makeVegCheck(lists) {
  const words = (a) => new RegExp(`\\b(?:${a.join("|")})\\b`, "i");
  const NON_VEG = words(lists.nonVeg), WEAK = words(lists.ambiguousWeak), STRONG = words(lists.ambiguousStrong);
  const MARKER = words(lists.vegMarkers), STRONG_MARKER = words(lists.strongMarkers);
  return (t) => !NON_VEG.test(t) && (!STRONG.test(t) || STRONG_MARKER.test(t)) && (!WEAK.test(t) || MARKER.test(t));
}
const HEADERS = { "User-Agent": UA_BROWSER, "Accept-Language": "en-US,en;q=0.9", Cookie: "CONSENT=YES+1" };

function initialData(html) {
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  return m ? JSON.parse(m[1]) : null;
}
function walk(o, fn) {
  if (Array.isArray(o)) o.forEach((v) => walk(v, fn));
  else if (o && typeof o === "object") { fn(o); Object.values(o).forEach((v) => walk(v, fn)); }
}
const text = (t) => (t?.simpleText ?? t?.runs?.map((r) => r.text).join("") ?? t?.content ?? "").trim();

function parseVideos(data, channelId) {
  const out = [];
  walk(data, (o) => {
    const v = o.videoRenderer;
    if (v?.videoId) {
      const owner = v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
      if (channelId && owner && owner !== channelId) return;
      out.push({ id: v.videoId, title: text(v.title), published: text(v.publishedTimeText), views: text(v.shortViewCountText || v.viewCountText) });
    }
    const l = o.lockupViewModel;
    if (l?.contentId && l.contentType !== "LOCKUP_CONTENT_TYPE_PLAYLIST") {
      const md = l.metadata?.lockupMetadataViewModel;
      const parts = md?.metadata?.contentMetadataViewModel?.metadataRows?.flatMap((r) => r.metadataParts || []).map((p) => p.text?.content).filter(Boolean) || [];
      out.push({ id: l.contentId, title: md?.title?.content || "", views: parts.find((p) => /view|K|M/.test(p)) || "", published: parts.find((p) => /ago/.test(p)) || "" });
    }
  });
  return out;
}

async function scrapeChef(chef, max) {
  const vids = [];
  let avatar = "";
  if (chef.handle) {
    const html = await getText(`https://www.youtube.com/@${chef.handle}/videos`, { headers: HEADERS });
    avatar = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || "";
    vids.push(...parseVideos(initialData(html), chef.channelId));
  }
  const q = `${chef.name.replace(/\(.*\)/, "")} vegetarian recipe`;
  try {
    const html = await getText(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, { headers: HEADERS });
    let found = parseVideos(initialData(html), chef.channelId || null);
    if (!chef.channelId) {
      // No known channel: keep only results whose uploader name matches the chef.
      const data = initialData(html); const owners = {};
      walk(data, (o) => { const v = o.videoRenderer; if (v?.videoId) owners[v.videoId] = text(v.ownerText); });
      const key = chef.name.split(" ")[0].toLowerCase();
      found = found.filter((v) => (owners[v.id] || "").toLowerCase().includes(key));
    }
    vids.push(...found);
  } catch {}
  return { avatar, vids, source: "youtube-pages" };
}

async function apiChef(chef, key, max) {
  if (!chef.channelId) return scrapeChef(chef, max);
  const uploads = "UU" + chef.channelId.slice(2);
  const d = await getJSON(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploads}&key=${key}`);
  const vids = (d.items || []).map((it) => ({ id: it.snippet.resourceId.videoId, title: it.snippet.title, publishedAt: it.snippet.publishedAt, published: it.snippet.publishedAt?.slice(0, 10) }));
  return { avatar: "", vids, source: "youtube-data-api" };
}

export async function run({ env, root, previous, log }) {
  const chefs = JSON.parse(await readFile(path.join(root, "lib", "chefs.json"), "utf8"));
  isVeg = makeVegCheck(JSON.parse(await readFile(path.join(root, "lib", "veg-filter.json"), "utf8")));
  const max = num(env.CHEFS_MAX_VIDEOS, 12);
  const vegOnly = bool(env.CHEFS_VEG_ONLY, true);
  const key = env.CHEFS_YOUTUBE_API_KEY;
  const warnings = [];
  // Hidden topics: lib/hidden-topics.json plus any extra comma-separated words in CHEFS_EXCLUDE_TERMS.
  let hidden = [];
  try { hidden = JSON.parse(await readFile(path.join(root, "lib", "hidden-topics.json"), "utf8")).terms || []; } catch {}
  const terms = [...hidden, ...String(env.CHEFS_EXCLUDE_TERMS || "").split(",")].map((t) => t.trim()).filter(Boolean);
  const HIDE = terms.length ? new RegExp(`\\b(?:${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i") : null;
  const results = await pool(chefs, num(env.CHEFS_CONCURRENCY, 4), async (chef) => {
    try {
      const r = key ? await apiChef(chef, key, max) : await scrapeChef(chef, max);
      const seen = new Set();
      const videos = r.vids
        .filter((v) => v.id && v.title && !seen.has(v.id) && seen.add(v.id))
        .filter((v) => !vegOnly || isVeg(v.title))
        .filter((v) => !HIDE || !HIDE.test(v.title))
        .slice(0, max)
        .map((v) => ({ ...v, url: `https://www.youtube.com/watch?v=${v.id}`, thumb: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` }));
      return [chef.id, { ok: true, source: r.source, avatar: r.avatar || previous?.chefs?.[chef.id]?.avatar || "", videos }];
    } catch (e) {
      warnings.push(`${chef.name}: ${e.message}`);
      // Keep the previous videos for this chef if the fetch failed.
      return [chef.id, { ...(previous?.chefs?.[chef.id] || { videos: [] }), ok: false, error: e.message }];
    }
  });
  const map = Object.fromEntries(results);
  const total = Object.values(map).reduce((a, c) => a + (c.videos?.length || 0), 0);
  const okCount = Object.values(map).filter((c) => c.ok).length;
  log(`${okCount}/${chefs.length} chefs refreshed`);
  return { data: { mode: key ? "youtube-data-api" : "youtube-pages", chefs: map }, summary: `${total} vegetarian videos from ${okCount}/${chefs.length} chefs`, warnings };
}
