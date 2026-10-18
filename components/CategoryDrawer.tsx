"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { CUISINES, DIETS, INDIAN_REGIONS, SLOTS, SLOT_HINT, WORLD_CUISINES, matches, type CuisineFilter, type Diet, type Meal, type Slot } from "@/lib/meal-meta";

/** Just enough of each recipe to count it (passed from the server so the full recipe list is not downloaded on every page). */
export type MealIndex = Pick<Meal, "slot" | "tags">[];
import { PAGES } from "@/lib/site";
import { usePlanner } from "./PlannerProvider";


/** Left-side drawer opened from the burger icon: recipe categories, filters and pages. */
export function CategoryDrawer({ index }: { index: MealIndex }) {
  const { slot, setSlot, diet, setDiet, cuisine, setCuisine, drawerOpen, setDrawerOpen } = usePlanner();
  const router = useRouter();
  const pathname = usePathname();
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("drawer-lock");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("drawer-lock");
    };
  }, [drawerOpen, setDrawerOpen]);

  // Close the drawer after any page change.
  useEffect(() => { setDrawerOpen(false); }, [pathname, setDrawerOpen]);

  const counts = useMemo(() => {
    const out = {} as Record<"all" | Slot, number>;
    (Object.keys(SLOTS) as ("all" | Slot)[]).forEach((k) => { out[k] = index.filter((m) => matches(m, k, diet, cuisine)).length; });
    return out;
  }, [index, diet, cuisine]);

  function goToMenu() {
    setDrawerOpen(false);
    if (pathname !== "/menu") router.push("/menu");
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className={`scrim${drawerOpen ? " show" : ""}`} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside id="categories" className={`drawer${drawerOpen ? " open" : ""}`} aria-label="Categories and pages" inert={!drawerOpen}>
        <div className="drawer-head">
          <span className="logo">Veg<b>Gain</b>&nbsp;8</span>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close">✕</button>
        </div>

        <p className="eyebrow">Recipes</p>
        <ul className="nav-list">
          {(Object.keys(SLOTS) as ("all" | Slot)[]).map((k, i) => (
            <li key={k}>
              <button
                ref={i === 0 ? firstRef : undefined}
                className="nav-item"
                data-slot={k}
                aria-current={slot === k ? "true" : undefined}
                onClick={() => { setSlot(k); goToMenu(); }}
              >
                <span className="dot" aria-hidden="true" />
                <span className="nav-text"><b>{SLOTS[k]}</b><small>{SLOT_HINT[k]}</small></span>
                <span className="nav-count">{counts[k]}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="eyebrow">Diet</p>
        <div className="nav-chips">
          {(Object.keys(DIETS) as ("all" | Diet)[]).map((k) => (
            <button key={k} className="chip" aria-pressed={diet === k} onClick={() => setDiet(k)}>{DIETS[k]}</button>
          ))}
        </div>

        <p className="eyebrow">Indian regions</p>
        <div className="nav-chips">
          {(["all", "indian-all", ...INDIAN_REGIONS] as CuisineFilter[]).map((k) => (
            <button key={k} className="chip" aria-pressed={cuisine === k} onClick={() => { setCuisine(k); goToMenu(); }}>
              {k === "all" ? "All cuisines" : k === "indian-all" ? "All Indian" : CUISINES[k]}
            </button>
          ))}
        </div>

        <p className="eyebrow">World</p>
        <div className="nav-chips">
          {([...WORLD_CUISINES, "global"] as CuisineFilter[]).map((k) => (
            <button key={k} className="chip" aria-pressed={cuisine === k} onClick={() => { setCuisine(k); goToMenu(); }}>
              {CUISINES[k as keyof typeof CUISINES]}
            </button>
          ))}
        </div>

        <p className="eyebrow">Pages</p>
        <ul className="nav-list jumps">
          {PAGES.map((p) => (
            <li key={p.href}>
              <Link href={p.href} aria-current={pathname === p.href ? "page" : undefined} onClick={() => setDrawerOpen(false)}>
                {p.label}<small>{p.blurb}</small>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
