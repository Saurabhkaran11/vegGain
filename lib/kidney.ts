// Kidney-care helpers plus totals that need the full recipe list.
import { MEALS, type Meal } from "./meals";
export * from "./kidney-core";

/** Kidney numbers for a list of recipes, or null if any recipe has no kidney data. */
export function kidneyTotals(ids: string[]) {
  const ms = ids.map((id) => MEALS.find((m) => m.id === id)).filter((m): m is Meal => !!m);
  if (!ms.length || ms.some((m) => !m.rn)) return null;
  return ms.reduce((a, m) => ({ na: a.na + m.rn!.na, k: a.k + m.rn!.k, ph: a.ph + m.rn!.ph }), { na: 0, k: 0, ph: 0 });
}

