"use client";

import { useState } from "react";
import { usePlanner } from "./PlannerProvider";
import { FavButton } from "./MealCard";

/** Client-side buttons for the static recipe page. */
export function RecipeActions({ id, name }: { id: string; name: string }) {
  const { addToDay } = usePlanner();
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="actions recipe-actions">
      <button className="btn add" onClick={() => { addToDay(id); setAdded(true); setTimeout(() => setAdded(false), 1200); }}>
        {added ? "✓ Added to your day" : "+ Add to my day"}
      </button>
      <span className="fav-inline"><FavButton id={id} name={name} /> Save</span>
      <button
        className="btn ghost"
        onClick={async () => {
          try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
        }}
      >
        {copied ? "✓ Link copied" : "Copy link"}
      </button>
    </div>
  );
}
