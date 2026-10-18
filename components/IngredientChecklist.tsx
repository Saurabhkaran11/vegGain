"use client";

import { useState } from "react";

/** Tick-off ingredient list (resets when you leave the page). */
export function IngredientChecklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  const count = done.filter(Boolean).length;
  return (
    <>
      <ul className="checklist interactive">
        {items.map((it, i) => (
          <li key={it}>
            <label>
              <input type="checkbox" checked={done[i]} onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} />
              <span>{it}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="muted small">{count} of {items.length} ready{count === items.length ? " · you’re set to cook!" : ""}</p>
    </>
  );
}
