"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { read, write } from "./PlannerProvider";
import { ChefAvatar } from "./ChefAvatar";

export const MAX_COMPARE = 4;
const EVT = "vg8-compare";

/** The chefs picked for comparison, saved in this browser and shared by every page. */
export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const load = () => {
      const v = read<unknown>("compare", []);
      setIds(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, MAX_COMPARE) : []);
    };
    load();
    window.addEventListener(EVT, load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener(EVT, load); window.removeEventListener("storage", load); };
  }, []);
  const save = useCallback((next: string[]) => {
    const v = [...new Set(next)].slice(0, MAX_COMPARE);
    write("compare", v);
    setIds(v);
    window.dispatchEvent(new Event(EVT));
  }, []);
  const toggle = useCallback((id: string) => {
    const raw = read<unknown>("compare", []);
    const cur = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
    save(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, [save]);
  return { ids, save, toggle, clear: () => save([]) };
}

/** "+ Compare" button for one chef. */
export function CompareToggle({ id, name, big = false }: { id: string; name: string; big?: boolean }) {
  const { ids, toggle } = useCompare();
  const on = ids.includes(id);
  const full = !on && ids.length >= MAX_COMPARE;
  return (
    <button type="button" className={`btn ${on ? "add" : "ghost"} cmp-toggle${big ? "" : " small"}`} aria-pressed={on} disabled={full}
      title={full ? `You can compare up to ${MAX_COMPARE} chefs` : undefined}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}>
      {on ? "✓ In compare" : full ? "Compare is full" : "+ Compare"}
      <span className="sr-only"> {name}</span>
    </button>
  );
}

/** Bar fixed to the bottom of the screen showing who is picked, with the button to open the comparison. */
export function CompareTray({ chefs }: { chefs: { id: string; name: string; avatar: string }[] }) {
  const { ids, toggle, clear } = useCompare();
  const picked = ids.map((id) => chefs.find((c) => c.id === id)).filter((c): c is (typeof chefs)[number] => !!c);
  if (!picked.length) return null;
  return (
    <div className="cmp-tray" role="region" aria-label="Chefs to compare">
      <div className="cmp-tray-in">
        <span className="eyebrow">Compare {picked.length}/{MAX_COMPARE}</span>
        <ul>
          {picked.map((c) => (
            <li key={c.id}>
              <ChefAvatar chef={c} src={c.avatar} size={28} />
              <span>{c.name.replace(/\s*\(.*\)/, "")}</span>
              <button type="button" onClick={() => toggle(c.id)} aria-label={`Remove ${c.name}`}>✕</button>
            </li>
          ))}
        </ul>
        <div className="cmp-tray-act">
          {picked.length < 2 && <small>Pick one more chef</small>}
          <button type="button" className="linkish" onClick={clear}>Clear</button>
          <Link className={`btn add${picked.length < 2 ? " is-off" : ""}`} aria-disabled={picked.length < 2} href={`/chefs/compare?ids=${picked.map((c) => c.id).join(",")}`}>Compare side by side →</Link>
        </div>
      </div>
    </div>
  );
}
