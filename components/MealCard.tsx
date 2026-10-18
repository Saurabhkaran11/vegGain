"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { SLOTS, TAG_LABEL, isDiet, ytURL, type Meal, type ViewMode } from "@/lib/meals";
import { usePlanner } from "./PlannerProvider";
import { MealPhoto, PhotoCreditLine } from "./MealPhoto";
import { kidneyAbbr, kidneyShort } from "@/lib/kidney";

export function money(m: Meal, currency: "USD" | "INR") {
  return currency === "USD" ? "$" + m.usd.toFixed(2) : "₹" + m.inr;
}

export function Tags({ meal }: { meal: Meal }) {
  return (
    <>
      {meal.tags.map((t) => (
        <span key={t} className={`tag ${isDiet(t) ? t : "cuisine"}`}>{TAG_LABEL[t]}</span>
      ))}
    </>
  );
}

export function Macros({ meal }: { meal: Meal }) {
  return (
    <dl className="macros">
      <div><dt>kcal</dt><dd>{meal.kcal}</dd></div>
      <div><dt>Carbs</dt><dd>{meal.c} g</dd></div>
      <div><dt>Fat</dt><dd>{meal.f} g</dd></div>
    </dl>
  );
}

export function RecipeDetails({ meal }: { meal: Meal }) {
  return (
    <div>
      <h4>Vitamins &amp; minerals</h4>
      <p>{meal.vit}</p>
      <h4>Ingredients · 1 serving</h4>
      <ul>{meal.ing.map((i) => <li key={i}>{i}</li>)}</ul>
      <h4>Steps</h4>
      <ol>{meal.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      {meal.keep && (<><h4>Storage</h4><p>{meal.keep}</p></>)}
      {meal.rn && (<><h4>Kidney numbers</h4><p>Sodium {meal.rn.na} mg · potassium {meal.rn.k} mg · phosphorus {meal.rn.ph} mg per serving (USDA estimates).{meal.tip ? " " + meal.tip : ""}</p></>)}
      <p className="muted">Cost per serving: ${meal.usd.toFixed(2)} (US) · ₹{meal.inr} (India), Oct 2026 estimates.</p>
    </div>
  );
}

export function FavButton({ id, name }: { id: string; name: string }) {
  const { favs, toggleFav } = usePlanner();
  const on = favs.includes(id);
  return (
    <button
      className={`fav${on ? " on" : ""}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from saved` : `Save ${name}`}
      title={on ? "Saved" : "Save"}
      onClick={(e) => { e.stopPropagation(); toggleFav(id); }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.4 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.6 0 6 3.7 4.5 7.3C19.5 16.4 12 21 12 21z" /></svg>
    </button>
  );
}

export function MealActions({ meal, compact = false }: { meal: Meal; compact?: boolean }) {
  const { addToDay } = usePlanner();
  const [added, setAdded] = useState(false);
  return (
    <div className="actions">
      <button className="btn add" onClick={() => { addToDay(meal.id); setAdded(true); setTimeout(() => setAdded(false), 900); }}>
        {added ? "✓ Added" : "+ Add to day"}
      </button>
      <Link className="btn ghost" href={`/menu/${meal.id}`}>{compact ? "Details →" : "Open full recipe →"}</Link>
      <a className="btn yt" href={ytURL(meal)} target="_blank" rel="noopener noreferrer">▶ {compact ? "Video" : "YouTube recipe"}</a>
    </div>
  );
}

type Props = { meal: Meal; index: number; feature: boolean; maxProtein: number; view: ViewMode };

export const MealCard = memo(function MealCard({ meal, index, feature, maxProtein, view }: Props) {
  const router = useRouter();
  const href = `/menu/${meal.id}`;
  const { currency, style } = usePlanner();
  const [edge, setEdge] = useState<"left" | "right" | "center">("center");

  // Keep the hover preview on screen near the left and right edges.
  function onPointerEnter(e: React.PointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const half = Math.max(0, (Math.min(380, window.innerWidth * 0.92) - r.width) / 2) + 12;
    setEdge(r.left < half ? "left" : window.innerWidth - r.right < half ? "right" : "center");
  }
  // Pointer-driven depth (Spatial UI) and moving light sheen (Liquid glass).
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (style !== "spatial" && style !== "liquid") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", x * 100 + "%");
    el.style.setProperty("--my", y * 100 + "%");
    if (style === "spatial") {
      el.style.setProperty("--ry", (x - 0.5) * 10 + "deg");
      el.style.setProperty("--rx", (0.5 - y) * 8 + "deg");
    }
  }
  function onPointerLeave(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.style.removeProperty("--rx");
    e.currentTarget.style.removeProperty("--ry");
  }

  const protein = (
    <div className="pbar">
      <div className="lbl"><span>Protein</span><b>{meal.p} g</b></div>
      <div className="track"><i style={{ "--w": Math.round((meal.p / maxProtein) * 100) + "%" } as React.CSSProperties} /></div>
    </div>
  );
  const sizes =
    view === "list" ? "120px" : view === "square" ? "(max-width: 640px) 50vw, 260px" : view === "wide" ? "(max-width: 900px) 45vw, 320px" : "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 360px";

  return (
    <article
      className={`card${feature && view === "grid" ? " feature" : ""}`}
      data-slot={meal.slot}
      data-edge={edge}
      tabIndex={0}
      aria-label={`${meal.name}, ${meal.p} grams protein, ${money(meal, currency)}`}
      style={{ "--i": Math.min(index, 12) } as React.CSSProperties}
      role="link"
      // Clicking anywhere on the card opens the recipe page (Cmd/Ctrl-click opens a new tab).
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button")) return;
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank", "noopener");
        else router.push(href);
      }}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) router.push(href); }}
      onMouseEnter={() => router.prefetch(href)}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="card-in">
        <MealPhoto meal={meal} sizes={sizes} eager={index < 3} />
        <FavButton id={meal.id} name={meal.name} />
        <div className="card-body">
          <div className="ctop">
            <span className="slot">{SLOTS[meal.slot]}</span>
            <Tags meal={meal} />
          </div>
          <h3><Link href={href} className="card-link">{meal.name}</Link></h3>
          {protein}
          <div className="price"><b>{money(meal, currency)}</b><span>{meal.kcal} kcal · ⏱ {meal.time}</span></div>
          {meal.life && <span className="keeps" title={meal.keep}>Keeps {meal.life}</span>}
          {meal.rn && <span className="kid-badge" title={`${kidneyShort(meal) || "Kidney care"} — checked against National Kidney Foundation targets`}>{kidneyAbbr(meal)}</span>}
          <span className="hint" />
          <div className="touch-actions"><MealActions meal={meal} compact /></div>
        </div>
      </div>

      {/* Hover preview: zooms in over the card with the full details (not used in list view) */}
      {view !== "list" && (
        <div className="pop" role="presentation">
          <MealPhoto meal={meal} sizes="380px" />
          <div className="pop-body">
            <div className="ctop">
              <span className="slot">{SLOTS[meal.slot]}</span>
              <Tags meal={meal} />
            </div>
            <h3>{meal.name}</h3>
            <div className="meta"><span>⏱ {meal.time}</span><span>1 serving</span>{meal.life && <span>Keeps {meal.life}</span>}{meal.rn && <span>{kidneyAbbr(meal)}</span>}</div>
            {protein}
            <Macros meal={meal} />
            <div className="price"><b>{money(meal, currency)}</b><span>per serving</span></div>
            <div className="pop-scroll"><RecipeDetails meal={meal} /><PhotoCreditLine id={meal.id} /></div>
            <MealActions meal={meal} />
          </div>
        </div>
      )}
    </article>
  );
});
