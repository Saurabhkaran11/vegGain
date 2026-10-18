"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CUISINES, DIETS, INDIAN_REGIONS, MEALS, SLOTS, SORTS, VIEWS, WORLD_CUISINES, cuisineFilterLabel, matches, searchMeals, sortMeals,
  type CuisineFilter, type Diet, type Slot, type SortKey, type ViewMode,
} from "@/lib/meals";
import { usePlanner } from "./PlannerProvider";
import { MealCard } from "./MealCard";

const maxProtein = Math.max(...MEALS.map((m) => m.p));
const KNOWN = new Set(MEALS.map((m) => m.id));

const VIEW_ICONS: Record<ViewMode, React.ReactNode> = {
  grid: <svg viewBox="0 0 20 20"><rect x="2" y="2" width="7" height="9" rx="1.5" /><rect x="11" y="2" width="7" height="9" rx="1.5" /><rect x="2" y="13" width="7" height="5" rx="1.5" /><rect x="11" y="13" width="7" height="5" rx="1.5" /></svg>,
  square: <svg viewBox="0 0 20 20"><rect x="2" y="2" width="4.5" height="4.5" rx="1" /><rect x="7.75" y="2" width="4.5" height="4.5" rx="1" /><rect x="13.5" y="2" width="4.5" height="4.5" rx="1" /><rect x="2" y="7.75" width="4.5" height="4.5" rx="1" /><rect x="7.75" y="7.75" width="4.5" height="4.5" rx="1" /><rect x="13.5" y="7.75" width="4.5" height="4.5" rx="1" /><rect x="2" y="13.5" width="4.5" height="4.5" rx="1" /><rect x="7.75" y="13.5" width="4.5" height="4.5" rx="1" /><rect x="13.5" y="13.5" width="4.5" height="4.5" rx="1" /></svg>,
  wide: <svg viewBox="0 0 20 20"><rect x="2" y="3" width="16" height="6" rx="1.5" /><rect x="2" y="11" width="16" height="6" rx="1.5" /></svg>,
  list: <svg viewBox="0 0 20 20"><rect x="2" y="3" width="3" height="3" rx=".8" /><rect x="7" y="3.5" width="11" height="2" rx="1" /><rect x="2" y="8.5" width="3" height="3" rx=".8" /><rect x="7" y="9" width="11" height="2" rx="1" /><rect x="2" y="14" width="3" height="3" rx=".8" /><rect x="7" y="14.5" width="11" height="2" rx="1" /></svg>,
};

// Cards are rendered in pages: the first page is in the HTML, more are added as the visitor scrolls.
const PAGE = 24;

const isSlot = (v: string): v is Slot => v in SLOTS && v !== "all";
const isCuisineFilter = (v: string): v is CuisineFilter => v === "indian-all" || v in CUISINES;

export function MealExplorer() {
  const { style, slot, setSlot, diet, setDiet, cuisine, setCuisine, view, setView, favs, setDrawerOpen } = usePlanner();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [savedOnly, setSavedOnly] = useState(false);
  const savedCount = favs.filter((id) => KNOWN.has(id)).length;

  // Deep links: /menu#skin, /menu#punjabi, /menu#indian-all …
  useEffect(() => {
    const apply = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (!h) return;
      setSavedOnly(false); setQuery("");
      if (isSlot(h)) { setSlot(h); setCuisine("all"); }
      else if (isCuisineFilter(h)) { setCuisine(h); setSlot("all"); }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [setSlot, setCuisine]);

  const list = useMemo(() => {
    let l = MEALS.filter((m) => matches(m, slot, diet, cuisine));
    if (savedOnly) l = l.filter((m) => favs.includes(m.id));
    return sortMeals(searchMeals(l, query), sort);
  }, [slot, diet, cuisine, savedOnly, favs, query, sort]);

  const [shown, setShown] = useState(PAGE);
  const more = useRef<HTMLDivElement>(null);
  const listKey = `${slot}-${diet}-${cuisine}-${sort}-${savedOnly}-${query}`;
  useEffect(() => setShown(PAGE), [listKey]);
  useEffect(() => {
    const el = more.current;
    if (!el || shown >= list.length) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, list.length]);

  // Bento feature tiles: the first item of each category (or the first result when one category is shown).
  const features = useMemo(() => {
    const seen = new Set<Slot>();
    return list.map((m, i) => {
      const f = sort === "recommended" && !query && (slot === "all" ? !seen.has(m.slot) : i === 0);
      seen.add(m.slot);
      return f && list.length > 2;
    });
  }, [list, slot, sort, query]);


  const filtered = slot !== "all" || diet !== "all" || cuisine !== "all" || savedOnly || !!query || sort !== "recommended";
  const reset = () => { setSlot("all"); setDiet("all"); setCuisine("all"); setSavedOnly(false); setQuery(""); setSort("recommended"); };
  const title = slot !== "all" ? SLOTS[slot] : cuisine !== "all" ? cuisineFilterLabel(cuisine) : "All recipes";

  return (
    <section id="menu" aria-label="Recipes">
      <div className="explorer-head">
        <div className="current">
          <button className="chip burger-chip" onClick={() => setDrawerOpen(true)} aria-label="Open categories">
            <span className="burger-ico" aria-hidden="true"><i /><i /><i /></span> Categories
          </button>
          <h1 className="current-title">{title}</h1>
          <span id="count" aria-live="polite">{list.length} {list.length === 1 ? "recipe" : "recipes"}</span>
        </div>

        <div className="toolbar">
          <label className="search">
            <span className="sr-only">Search recipes</span>
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" /><path d="M13.5 13.5 18 18" /></svg>
            <input id="search" type="search" placeholder="Search paneer, dal, smoothie…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="seg" role="group" aria-label="Diet">
            {(Object.keys(DIETS) as ("all" | Diet)[]).map((k) => (
              <button key={k} className="chip" aria-pressed={diet === k} onClick={() => setDiet(k)}>{DIETS[k]}</button>
            ))}
          </div>
          <span className="selwrap">
            <select id="cuisine" aria-label="Cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value as CuisineFilter)}>
              <option value="all">All cuisines</option>
              <optgroup label="Indian regions">
                <option value="indian-all">All Indian regions</option>
                {INDIAN_REGIONS.map((k) => <option key={k} value={k}>{CUISINES[k]}</option>)}
              </optgroup>
              <optgroup label="World">
                {WORLD_CUISINES.map((k) => <option key={k} value={k}>{CUISINES[k]}</option>)}
                <option value="global">{CUISINES.global}</option>
              </optgroup>
            </select>
          </span>
          <span className="selwrap">
            <select id="sort" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
            </select>
          </span>
          <button className="chip saved-chip" aria-pressed={savedOnly} onClick={() => setSavedOnly((s) => !s)}>
            ♥ Saved{savedCount ? ` (${savedCount})` : ""}
          </button>
          <div className="seg view-switch" role="group" aria-label="Layout">
            {(Object.keys(VIEWS) as ViewMode[]).map((v) => (
              <button key={v} className="chip icon-chip" aria-pressed={view === v} onClick={() => setView(v)} title={VIEWS[v]}>
                {VIEW_ICONS[v]}<span className="sr-only">{VIEWS[v]}</span>
              </button>
            ))}
          </div>
          {filtered && <button className="chip" onClick={reset}>Reset</button>}
        </div>
      </div>

      {/* key re-mounts the cards so the entrance motion replays on every change */}
      <div className={`grid view-${view}`} key={`${style}-${view}-${slot}-${diet}-${cuisine}-${sort}-${savedOnly}`}>
        {list.length === 0 && (
          <div className="empty panel">
            <b>No recipes match.</b>
            <p>{savedOnly && savedCount === 0 ? "Tap ♥ on any recipe to save it here." : "Try a different search, cuisine or diet."}</p>
            <button className="btn add" onClick={reset}>Show all recipes</button>
          </div>
        )}
        {list.slice(0, shown).map((m, i) => (
          <MealCard key={m.id} meal={m} index={i} feature={features[i]} maxProtein={maxProtein} view={view} />
        ))}
      </div>
      {shown < list.length && (
        <div ref={more} className="more-cards">
          <button type="button" className="btn ghost" onClick={() => setShown((n) => n + PAGE)}>Show more recipes ({list.length - shown} left)</button>
        </div>
      )}

    </section>
  );
}
