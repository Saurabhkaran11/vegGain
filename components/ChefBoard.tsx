"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SLOTS, type Slot } from "@/lib/meals";
import { TOPICS, TOPIC_LABEL, ageHours, recipeTopics, videoTopics, viewCount, type TopicId } from "@/lib/chef-topics";
import { photoSrc } from "@/lib/photos";
import { ChefAvatar } from "./ChefAvatar";
import { read, write } from "./PlannerProvider";

export type BoardVideo = { id: string; title: string; url: string; views: string; published: string };
export type BoardChef = {
  id: string; name: string; group: "indian" | "world" | "vegan"; label: string; bio: string; avatar: string; channel: string;
  videos: BoardVideo[]; recipes: string[];
};
export type BoardRecipe = { name: string; slot: Slot; p: number; kcal: number };

type Group = "all" | BoardChef["group"];
type Show = "both" | "videos" | "recipes";
type Layout = "columns" | "rows";
type Sort = "latest" | "views";
type Prefs = { group: Group; show: Show; layout: Layout | null; per: number; sort: Sort; topic: "all" | TopicId; picked: string[] };

const DEFAULT: Prefs = { group: "all", show: "both", layout: null, per: 4, sort: "latest", topic: "all", picked: [] };
const GROUPS: [Group, string][] = [["all", "All chefs"], ["indian", "Indian"], ["world", "World"], ["vegan", "Plant-based"]];
const SHOWS: [Show, string][] = [["both", "Videos + recipes"], ["videos", "Videos"], ["recipes", "Recipes"]];
const PER: [number, string][] = [[4, "4 each"], [8, "8 each"], [12, "12 each"], [999, "All"]];
const TOPIC_IDS: TopicId[] = [...TOPICS.map((t) => t.id), "other"];
const short = (name: string) => name.replace(/\s*\(.*\)/, "").replace(/’s Kitchen$/, "’s").trim();
const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const ytSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

function clean(p: Partial<Prefs> | null): Partial<Prefs> {
  if (!p || typeof p !== "object") return {};
  const out: Partial<Prefs> = {};
  if (GROUPS.some(([g]) => g === p.group)) out.group = p.group;
  if (SHOWS.some(([s]) => s === p.show)) out.show = p.show;
  if (p.layout === "columns" || p.layout === "rows") out.layout = p.layout;
  if (PER.some(([n]) => n === p.per)) out.per = p.per;
  if (p.sort === "latest" || p.sort === "views") out.sort = p.sort;
  if (p.topic === "all" || TOPIC_IDS.includes(p.topic as TopicId)) out.topic = p.topic;
  if (Array.isArray(p.picked)) out.picked = p.picked.filter((x) => typeof x === "string");
  return out;
}

export function ChefBoard({ chefs, recipes }: { chefs: BoardChef[]; recipes: Record<string, BoardRecipe> }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [showEmpty, setShowEmpty] = useState(false);
  const [focusId, setFocusId] = useState("");
  const lanesRef = useRef<HTMLDivElement>(null);

  // Saved view settings (this browser only). On a full page load the page's inline script has already applied the
  // layout before paint; a layout effect does the same when arriving from another page of the app.
  useLayoutEffect(() => {
    const saved = clean(read<Partial<Prefs> | null>("chefboard", null));
    const attr = document.documentElement.dataset.cbLayout;
    const layout: Layout = saved.layout ?? (attr === "columns" || attr === "rows" ? attr : window.matchMedia("(min-width: 900px)").matches ? "columns" : "rows");
    document.documentElement.dataset.cbLayout = layout;
    // Arriving from a chef's page ("See next to other chefs"): show that chef's group and point to their column.
    const from = new URLSearchParams(window.location.search).get("chef");
    const chef = chefs.find((c) => c.id === from);
    setPrefs((p) => ({ ...p, ...saved, layout, ...(chef ? { group: chef.group, picked: [], topic: "all" as const } : {}) }));
    if (chef) setFocusId(chef.id);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`lane-${focusId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    const t = setTimeout(() => setFocusId(""), 2600);
    return () => clearTimeout(t);
  }, [focusId]);
  useEffect(() => {
    if (!loaded) return;
    write("chefboard", prefs);
    if (prefs.layout) document.documentElement.dataset.cbLayout = prefs.layout;
  }, [prefs, loaded]);
  const set = (patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch }));

  const vTopics = useMemo(() => new Map(chefs.flatMap((c) => c.videos.map((v) => [v.id, videoTopics(v.title)] as const))), [chefs]);
  const rTopics = useMemo(() => new Map(Object.entries(recipes).map(([id, r]) => [id, recipeTopics(r.name, r.slot)] as const)), [recipes]);

  const q = query.trim().toLowerCase();
  const inGroup = useMemo(() => chefs.filter((c) => prefs.group === "all" || c.group === prefs.group), [chefs, prefs.group]);
  const picked = useMemo(() => prefs.picked.filter((id) => inGroup.some((c) => c.id === id)), [prefs.picked, inGroup]);
  const visible = useMemo(() => (picked.length ? inGroup.filter((c) => picked.includes(c.id)) : inGroup), [picked, inGroup]);

  // Everything that matches the search and the Show setting, before the topic filter (used for the topic counts).
  const base = useMemo(() => visible.map((c) => {
    const vids = prefs.show === "recipes" ? [] : c.videos.filter((v) => !q || v.title.toLowerCase().includes(q));
    const recs = prefs.show === "videos" ? [] : c.recipes.filter((id) => recipes[id] && (!q || recipes[id].name.toLowerCase().includes(q)));
    return { c, vids, recs };
  }), [visible, prefs.show, q, recipes]);

  const counts = useMemo(() => {
    const n = new Map<"all" | TopicId, number>([["all", 0]]);
    const seenR = new Set<string>();
    for (const { vids, recs } of base) {
      for (const v of vids) { n.set("all", n.get("all")! + 1); for (const t of vTopics.get(v.id) ?? []) n.set(t, (n.get(t) ?? 0) + 1); }
      for (const id of recs) {
        if (seenR.has(id)) continue;
        seenR.add(id);
        n.set("all", n.get("all")! + 1);
        for (const t of rTopics.get(id) ?? []) n.set(t, (n.get(t) ?? 0) + 1);
      }
    }
    return n;
  }, [base, vTopics, rTopics]);

  const lanes = base.map(({ c, vids, recs }) => {
    const t = prefs.topic;
    let v = t === "all" ? vids : vids.filter((x) => vTopics.get(x.id)?.includes(t));
    v = [...v].sort((a, b) => (prefs.sort === "views" ? viewCount(b.views) - viewCount(a.views) : ageHours(a.published) - ageHours(b.published)));
    const r = (t === "all" ? recs : recs.filter((id) => rTopics.get(id)?.includes(t))).sort((a, b) => recipes[b].p - recipes[a].p);
    return { c, v, r };
  });
  const filtered = q !== "" || prefs.topic !== "all";
  const withContent = lanes.filter((l) => l.v.length + l.r.length > 0);
  const shown = filtered && !showEmpty ? withContent : lanes;
  const hiddenCount = lanes.length - shown.length;
  const totalV = shown.reduce((a, l) => a + l.v.length, 0);
  const totalR = new Set(shown.flatMap((l) => l.r)).size;
  const what = [prefs.topic !== "all" && TOPIC_LABEL[prefs.topic], q && `“${query.trim()}”`].filter(Boolean).join(" · ");

  const scrollLanes = (dir: 1 | -1) => {
    const el = lanesRef.current;
    const lane = el?.querySelector<HTMLElement>(".cb-lane");
    if (el && lane) el.scrollBy({ left: dir * (lane.offsetWidth + 14), behavior: "smooth" });
  };
  const togglePick = (id: string) => set({ picked: prefs.picked.includes(id) ? prefs.picked.filter((x) => x !== id) : [...prefs.picked, id] });
  const reset = () => { setQuery(""); setShowEmpty(false); set({ topic: "all", picked: [], group: "all" }); };

  return (
    <div className="cb">
      <div className="panel cb-tools">
        <div className="cb-row">
          <label className="cb-search">
            <span className="sr-only">Search every chef’s videos and recipes</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all chefs: paneer, dosa, kimchi, dal…" />
          </label>
          <div className="seg" role="group" aria-label="Chef group">
            {GROUPS.map(([g, label]) => (
              <button key={g} type="button" className="chip" aria-pressed={prefs.group === g} onClick={() => set({ group: g })}>{label}</button>
            ))}
          </div>
        </div>

        <div className="cb-topics" role="group" aria-label="Topic">
          {(["all", ...TOPIC_IDS] as const).map((t) => {
            const n = counts.get(t) ?? 0;
            if (t !== "all" && n === 0 && prefs.topic !== t) return null;
            return (
              <button key={t} type="button" className="chip" aria-pressed={prefs.topic === t} onClick={() => set({ topic: t })}>
                {t === "all" ? "All topics" : TOPIC_LABEL[t]} <small>{n}</small>
              </button>
            );
          })}
        </div>

        <div className="cb-row cb-view">
          <div className="seg" role="group" aria-label="Show">
            {SHOWS.map(([s, label]) => (
              <button key={s} type="button" className="chip" aria-pressed={prefs.show === s} onClick={() => set({ show: s })}>{label}</button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Layout">
            <button type="button" className="chip" aria-pressed={prefs.layout === "columns"} onClick={() => set({ layout: "columns" })}>▥ Side by side</button>
            <button type="button" className="chip" aria-pressed={prefs.layout === "rows"} onClick={() => set({ layout: "rows" })}>☰ Rows</button>
          </div>
          <label className="cb-sel">Per chef
            <span className="selwrap">
              <select value={prefs.per} onChange={(e) => set({ per: Number(e.target.value) })}>
                {PER.map(([n, label]) => <option key={n} value={n}>{label}</option>)}
              </select>
            </span>
          </label>
          {prefs.show !== "recipes" && (
            <label className="cb-sel">Videos
              <span className="selwrap">
                <select value={prefs.sort} onChange={(e) => set({ sort: e.target.value as Sort })}>
                  <option value="latest">Newest first</option>
                  <option value="views">Most viewed</option>
                </select>
              </span>
            </label>
          )}
        </div>

        <div className="cb-pick" role="group" aria-label="Pick chefs to compare">
          <span className="eyebrow">Compare</span>
          {inGroup.map((c) => (
            <button key={c.id} type="button" className="cb-chefchip" aria-pressed={picked.includes(c.id)} onClick={() => togglePick(c.id)} title={c.name}>
              <ChefAvatar chef={c} src={c.avatar} size={24} />
              {short(c.name)}
            </button>
          ))}
          {picked.length > 0 && <button type="button" className="linkish cb-clear" onClick={() => set({ picked: [] })}>Show all {inGroup.length}</button>}
        </div>
      </div>

      <div className="cb-status">
        <p aria-live="polite">
          <b>{shown.length}</b> {shown.length === 1 ? "chef" : "chefs"} · <b>{totalV}</b> videos · <b>{totalR}</b> recipes{what && <> for {what}</>}
          {hiddenCount > 0 && (
            <> · {hiddenCount} with no match <button type="button" className="linkish" onClick={() => setShowEmpty(true)}>show them</button></>
          )}
        </p>
        <div className="cb-arrows">
          <button type="button" className="chip" onClick={() => scrollLanes(-1)} aria-label="Scroll to earlier chefs">‹</button>
          <button type="button" className="chip" onClick={() => scrollLanes(1)} aria-label="Scroll to more chefs">›</button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="panel cb-none">
          <p>No chef has {what ? <>anything for {what}</> : "anything here"} yet.</p>
          <div className="actions">
            {q && <a className="btn yt" href={ytSearch(`${query.trim()} vegetarian recipe`)} target="_blank" rel="noopener noreferrer">▶ Search YouTube for “{query.trim()}”</a>}
            <button type="button" className="btn ghost" onClick={reset}>Clear filters</button>
          </div>
        </div>
      ) : (
        <div className="cb-lanes" ref={lanesRef} tabIndex={0} aria-label="Chefs side by side. Scroll sideways to see more chefs.">
          {shown.map(({ c, v, r }) => (
            <section key={c.id} id={`lane-${c.id}`} className={`panel cb-lane${focusId === c.id ? " is-focus" : ""}`} aria-labelledby={`cb-${c.id}`} data-group={c.group}>
              <div className="cb-head">
                <ChefAvatar chef={c} src={c.avatar} size={44} />
                <div className="cb-who">
                  <h3 id={`cb-${c.id}`}><Link href={`/chefs/${c.id}`}>{c.name}</Link></h3>
                  <small>{c.label}</small>
                </div>
                <a className="cb-yt" href={c.channel} target="_blank" rel="noopener noreferrer" aria-label={`${c.name} on YouTube`} title="YouTube channel">▶</a>
              </div>
              <p className="cb-bio">{c.bio}</p>
              <div className="cb-body">
                {prefs.show !== "recipes" && (
                  <div className="cb-part">
                    <h4>Videos <span>{v.length}</span></h4>
                    {v.length ? (
                      <ul className="cb-items">
                        {v.slice(0, prefs.per).map((x) => (
                          <li key={x.id}>
                            <a className="cb-video" href={x.url} target="_blank" rel="noopener noreferrer">
                              <span className="cb-thumb"><img src={thumb(x.id)} alt="" width={320} height={180} loading="lazy" referrerPolicy="no-referrer" /><i aria-hidden="true">▶</i></span>
                              <span className="cb-txt"><b>{x.title}</b><small>{[x.views && `${x.views} views`, x.published].filter(Boolean).join(" · ")}</small></span>
                            </a>
                          </li>
                        ))}
                        {v.length > prefs.per && <li className="cb-more"><Link href={`/chefs/${c.id}#latest`}>+ {v.length - prefs.per} more videos</Link></li>}
                      </ul>
                    ) : (
                      <p className="cb-empty">
                        {c.videos.length ? `Nothing on ${what || "this"} in their latest uploads.` : "No new vegetarian videos in the latest fetch."}{" "}
                        <a href={ytSearch(`${short(c.name)} ${q || (prefs.topic !== "all" && prefs.topic !== "other" ? TOPIC_LABEL[prefs.topic] : "")} vegetarian recipe`)} target="_blank" rel="noopener noreferrer">Search YouTube ↗</a>
                      </p>
                    )}
                  </div>
                )}
                {prefs.show !== "videos" && (
                  <div className="cb-part">
                    <h4>VegGain recipes <span>{r.length}</span></h4>
                    {r.length ? (
                      <ul className="cb-items">
                        {r.slice(0, prefs.per).map((id) => {
                          const m = recipes[id];
                          return (
                            <li key={id}>
                              <Link className="cb-recipe" href={`/menu/${id}`}>
                                <span className="cb-photo"><img src={photoSrc(id)} alt="" width={160} height={120} loading="lazy" /></span>
                                <span className="cb-txt"><b>{m.name}</b><small>{m.p} g protein · {m.kcal} kcal · {SLOTS[m.slot]}</small></span>
                              </Link>
                            </li>
                          );
                        })}
                        {r.length > prefs.per && <li className="cb-more"><Link href={`/chefs/${c.id}#recipes`}>+ {r.length - prefs.per} more recipes</Link></li>}
                      </ul>
                    ) : (
                      <p className="cb-empty">No VegGain recipes {what ? <>for {what} </> : ""}in this chef’s cuisine yet.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="cb-foot"><Link href={`/chefs/${c.id}`}>All videos and recipes →</Link></div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
