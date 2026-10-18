"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChefSummary, RecipeLite } from "@/lib/chef-data";
import { SLOTS, SLOT_ORDER } from "@/lib/meal-meta";
import { TOPICS, TOPIC_LABEL, ageHours, recipeTopics, videoTopics, viewCount, type TopicId } from "@/lib/chef-topics";
import { thumbSrc } from "@/lib/photo-src";
import { ChefAvatar } from "./ChefAvatar";
import { MAX_COMPARE, useCompare } from "./ChefCompareState";

type Show = "both" | "videos" | "recipes";
const plain = (n: string) => n.replace(/\s*\(.*\)/, "").trim();

/** 2–4 chefs in aligned columns: a summary row, then every video, then recipes lined up by meal type. */
export function ChefCompare({ chefs, recipes }: { chefs: ChefSummary[]; recipes: Record<string, RecipeLite> }) {
  const { ids, save } = useCompare();
  const [fromUrl, setFromUrl] = useState(false);
  const [show, setShow] = useState<Show>("both");
  const [topic, setTopic] = useState<"all" | TopicId>("all");
  const [sort, setSort] = useState<"latest" | "views">("latest");

  // A shared link (?ids=a,b,c) wins over what this browser had saved.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("ids");
    const list = (q ?? "").split(",").filter((id) => chefs.some((c) => c.id === id));
    if (list.length) save(list);
    setFromUrl(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!fromUrl) return;
    const url = ids.length ? `/chefs/compare?ids=${ids.join(",")}` : "/chefs/compare";
    window.history.replaceState(null, "", url);
  }, [ids, fromUrl]);

  const picked = ids.map((id) => chefs.find((c) => c.id === id)).filter((c): c is ChefSummary => !!c);
  const others = chefs.filter((c) => !ids.includes(c.id));
  const vTop = useMemo(() => new Map(chefs.flatMap((c) => c.videos.map((v) => [v.id, videoTopics(v.title)] as const))), [chefs]);
  const rTop = useMemo(() => new Map(Object.entries(recipes).map(([id, r]) => [id, recipeTopics(r.name, r.slot)] as const)), [recipes]);

  const cols = picked.map((c) => {
    const vids = c.videos.filter((v) => topic === "all" || vTop.get(v.id)?.includes(topic))
      .sort((a, b) => (sort === "views" ? viewCount(b.views) - viewCount(a.views) : ageHours(a.published) - ageHours(b.published)));
    const recs = c.recipes.filter((id) => recipes[id] && (topic === "all" || rTop.get(id)?.includes(topic)));
    const tops = new Map<TopicId, number>();
    for (const v of c.videos) for (const t of vTop.get(v.id) ?? []) if (t !== "other") tops.set(t, (tops.get(t) ?? 0) + 1);
    const avgP = c.recipes.length ? Math.round(c.recipes.reduce((a, id) => a + (recipes[id]?.p ?? 0), 0) / c.recipes.length) : 0;
    return { c, vids, recs, avgP, tops: [...tops].sort((a, b) => b[1] - a[1]).slice(0, 3) };
  });
  const slots = SLOT_ORDER.filter((s) => cols.some((x) => x.recs.some((id) => recipes[id].slot === s)));
  const topicCount = (t: TopicId) => picked.reduce((a, c) => a + c.videos.filter((v) => vTop.get(v.id)?.includes(t)).length + c.recipes.filter((id) => rTop.get(id)?.includes(t)).length, 0);
  const style = { "--n": Math.max(picked.length, 1) } as React.CSSProperties;
  const Who = ({ c }: { c: ChefSummary }) => <span className="cmp-who"><ChefAvatar chef={c} src={c.avatar} size={20} />{plain(c.name)}</span>;

  return (
    <div className="cmp">
      <div className="panel cmp-tools">
        <div className="cb-row">
          {picked.length < MAX_COMPARE && (
            <label className="cb-sel">Add a chef
              <span className="selwrap">
                <select value="" onChange={(e) => e.target.value && save([...ids, e.target.value])}>
                  <option value="">Choose…</option>
                  {(["indian", "world", "vegan"] as const).map((g) => (
                    <optgroup key={g} label={g === "indian" ? "Indian" : g === "world" ? "World" : "Plant-based"}>
                      {others.filter((c) => c.group === g).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </span>
            </label>
          )}
          <div className="seg" role="group" aria-label="Show">
            {([["both", "Videos + recipes"], ["videos", "Videos"], ["recipes", "Recipes"]] as const).map(([s, l]) => (
              <button key={s} type="button" className="chip" aria-pressed={show === s} onClick={() => setShow(s)}>{l}</button>
            ))}
          </div>
          {show !== "recipes" && (
            <label className="cb-sel">Videos
              <span className="selwrap">
                <select value={sort} onChange={(e) => setSort(e.target.value as "latest" | "views")}>
                  <option value="latest">Newest first</option>
                  <option value="views">Most viewed</option>
                </select>
              </span>
            </label>
          )}
          {picked.length > 0 && <button type="button" className="linkish" onClick={() => save([])}>Clear all</button>}
        </div>
        {picked.length > 0 && (
          <div className="cb-topics" role="group" aria-label="Topic">
            <button type="button" className="chip" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>All topics</button>
            {[...TOPICS.map((t) => t.id), "other" as const].map((t) => {
              const n = topicCount(t);
              return n ? <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{TOPIC_LABEL[t]} <small>{n}</small></button> : null;
            })}
          </div>
        )}
      </div>

      {picked.length < 2 && (
        <div className="panel cmp-empty">
          <h2>{picked.length ? "Pick one more chef" : "Pick 2–4 chefs to compare"}</h2>
          <p className="muted">Tap a chef to add them. You can also use “+ Compare” on any chef’s card or page.</p>
          <div className="cmp-pickgrid">
            {others.map((c) => (
              <button key={c.id} type="button" className="cb-chefchip" onClick={() => save([...ids, c.id])}>
                <ChefAvatar chef={c} src={c.avatar} size={28} />{plain(c.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      {picked.length > 0 && (
        <div className="cmp-scroll" tabIndex={0} aria-label="Chefs side by side; scroll sideways on small screens">
          <div className="cmp-grid" style={style}>
            {cols.map(({ c, avgP, tops }) => (
              <div key={c.id} className="panel cmp-head">
                <button type="button" className="cmp-x" onClick={() => save(ids.filter((x) => x !== c.id))} aria-label={`Remove ${c.name}`}>✕</button>
                <ChefAvatar chef={c} src={c.avatar} size={64} />
                <h2><Link href={`/chefs/${c.id}`}>{c.name}</Link></h2>
                <small>{c.label}</small>
                <dl className="cmp-stats">
                  <div><dt>Videos</dt><dd>{c.videos.length}</dd></div>
                  <div><dt>Recipes</dt><dd>{c.recipes.length}</dd></div>
                  <div><dt>Avg protein</dt><dd>{avgP} g</dd></div>
                </dl>
                <p className="cmp-tops">{tops.length ? <>Mostly: {tops.map(([t]) => TOPIC_LABEL[t]).join(" · ")}</> : "Mostly vlogs and other videos"}</p>
                <div className="actions"><Link className="btn ghost" href={`/chefs/${c.id}`}>All content</Link><a className="btn yt" href={c.channel} target="_blank" rel="noopener noreferrer">▶ YouTube</a></div>
              </div>
            ))}

            {show !== "recipes" && (
              <>
                <h3 className="cmp-sec">Videos{topic !== "all" && <> · {TOPIC_LABEL[topic]}</>}</h3>
                {cols.map(({ c, vids }) => (
                  <div key={c.id} className="cmp-cell">
                    <Who c={c} />
                    {vids.length ? (
                      <ul className="cmp-list">
                        {vids.map((v) => (
                          <li key={v.id}>
                            <a className="cb-video" href={v.url} target="_blank" rel="noopener noreferrer">
                              <span className="cb-thumb"><img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" width={320} height={180} loading="lazy" decoding="async" referrerPolicy="no-referrer" /><i aria-hidden="true">▶</i></span>
                              <span className="cb-txt"><b>{v.title}</b><small>{[v.views && `${v.views} views`, v.published].filter(Boolean).join(" · ")}</small></span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="cb-empty">No {topic === "all" ? "" : TOPIC_LABEL[topic].toLowerCase() + " "}videos in the latest uploads.</p>}
                  </div>
                ))}
              </>
            )}

            {show !== "videos" && (
              <>
                <h3 className="cmp-sec">VegGain recipes by meal{topic !== "all" && <> · {TOPIC_LABEL[topic]}</>}</h3>
                {slots.length === 0 && cols.map(({ c }) => <div key={c.id} className="cmp-cell"><Who c={c} /><p className="cb-empty">No recipes for this topic.</p></div>)}
                {slots.map((s) => (
                  <div key={s} className="cmp-slotrow" style={{ display: "contents" }}>
                    <h4 className="cmp-slot">{SLOTS[s]}</h4>
                    {cols.map(({ c, recs }) => {
                      const list = recs.filter((id) => recipes[id].slot === s).sort((a, b) => recipes[b].p - recipes[a].p);
                      return (
                        <div key={c.id} className="cmp-cell">
                          <Who c={c} />
                          {list.length ? (
                            <ul className="cmp-list">
                              {list.map((id) => (
                                <li key={id}>
                                  <Link className="cb-recipe" href={`/menu/${id}`}>
                                    <span className="cb-photo"><img src={thumbSrc(id)} alt="" width={160} height={120} loading="lazy" decoding="async" /></span>
                                    <span className="cb-txt"><b>{recipes[id].name}</b><small>{recipes[id].p} g protein · {recipes[id].kcal} kcal</small></span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="cb-empty">—</p>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
