"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import type { ChefSummary } from "@/lib/chef-data";
import { ChefAvatar } from "./ChefAvatar";
import { CompareToggle, CompareTray } from "./ChefCompareState";

const GROUPS = [
  ["indian", "Indian chefs", "Vegetarian home cooking from across India"],
  ["world", "World cuisines", "One trusted channel for each world cuisine on the menu"],
  ["vegan", "Plant-based fitness", "High-protein vegan cooking and training"],
] as const;
const FILTERS = [["all", "All"], ["indian", "Indian"], ["world", "World"], ["vegan", "Plant-based"]] as const;

/** Every chef as a card: open one to see all their content, or tick "+ Compare" on several to put them side by side. */
export function ChefDirectory({ chefs }: { chefs: ChefSummary[] }) {
  const [group, setGroup] = useState<(typeof FILTERS)[number][0]>("all");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const match = (c: ChefSummary) => !needle || [c.name, c.label, c.bio, ...c.videos.map((v) => v.title)].join(" ").toLowerCase().includes(needle);

  return (
    <>
      <div className="panel cd-tools">
        <label className="cb-search">
          <span className="sr-only">Find a chef</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a chef or a dish: Ranveer, Korean, paneer…" />
        </label>
        <div className="seg" role="group" aria-label="Chef group">
          {FILTERS.map(([g, label]) => <button key={g} type="button" className="chip" aria-pressed={group === g} onClick={() => setGroup(g)}>{label}</button>)}
        </div>
        <p className="cd-how"><b>1.</b> Open a chef to see all their videos and recipes. <b>2.</b> Tap <b>+ Compare</b> on 2–4 chefs. <b>3.</b> Press <b>Compare side by side</b>.</p>
      </div>

      {GROUPS.filter(([g]) => group === "all" || group === g).map(([g, title, sub]) => {
        const list = chefs.filter((c) => c.group === g && match(c));
        if (!list.length) return null;
        return (
          <section key={g} className="block" aria-labelledby={`g-${g}`}>
            <div className="shead"><div><p className="eyebrow">{sub}</p><h2 id={`g-${g}`}>{title}</h2></div><span className="muted">{list.length} chefs</span></div>
            <div className="cd-grid">
              {list.map((c) => (
                <article key={c.id} className="panel cd-card">
                  <Link href={`/chefs/${c.id}`} className="cd-top">
                    <ChefAvatar chef={c} src={c.avatar} size={56} />
                    <span className="cd-who"><b>{c.name}</b><small>{c.label}</small></span>
                  </Link>
                  <p className="cd-bio">{c.bio}</p>
                  <Link href={`/chefs/${c.id}`} className="cd-thumbs" aria-label={`${c.name}: latest videos`} tabIndex={-1}>
                    {c.videos.slice(0, 3).map((v) => <img key={v.id} src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" width={320} height={180} loading="lazy" decoding="async" referrerPolicy="no-referrer" />)}
                    {c.videos.length === 0 && <span className="cd-novid">No new videos in the latest fetch</span>}
                  </Link>
                  <div className="cd-counts"><span><b>{c.videos.length}</b> videos</span><span><b>{c.recipes.length}</b> recipes</span></div>
                  <div className="cd-act">
                    <Link className="btn add" href={`/chefs/${c.id}`}>View all content</Link>
                    <CompareToggle id={c.id} name={c.name} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
      {chefs.every((c) => !match(c)) && <div className="panel cb-none"><p>No chef matches “{q}”.</p><button className="btn ghost" onClick={() => setQ("")}>Clear search</button></div>}
      <CompareTray chefs={chefs} />
    </>
  );
}
