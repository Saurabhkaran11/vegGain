// Kidney-care helpers. Targets are the National Kidney Foundation "Kidney-Friendly Plate" per-meal and
// per-snack guides for people who have been told to limit these nutrients; protein ranges are KDOQI 2020.
import { MEALS, type Meal } from "./meals";
export { KIDNEY_STATUS, type KidneyStatus } from "./targets";

export const NKF = {
  meal: { na: 500, k: 450, ph: 250, protein: 15, proteinDialysis: 24 },
  snack: { na: 250, k: 200, ph: 125, protein: 8, proteinDialysis: 10 },
} as const;

/** Daily sodium guide for adults, including people with CKD (NKF, KDOQI 2020). */
export const DAILY_SODIUM_MG = 2300;

export type KidneyRow = { key: "na" | "k" | "ph"; label: string; value: number; limit: number; ok: boolean };

export function kidneyRows(m: Meal): KidneyRow[] | null {
  if (!m.rn) return null;
  const t = NKF[m.rn.kind];
  return [
    { key: "na", label: "Sodium", value: m.rn.na, limit: t.na, ok: m.rn.na < t.na },
    { key: "k", label: "Potassium", value: m.rn.k, limit: t.k, ok: m.rn.k < t.k },
    { key: "ph", label: "Phosphorus", value: m.rn.ph, limit: t.ph, ok: m.rn.ph < t.ph },
  ];
}

/** Short label such as "Low sodium · potassium · phosphorus". */
export function kidneyShort(m: Meal): string {
  const rows = kidneyRows(m);
  if (!rows) return "";
  const ok = rows.filter((r) => r.ok).map((r) => r.label.toLowerCase());
  return ok.length ? "Low " + ok.join(" · ") : "";
}

/** Compact card label such as "Low Na · K · Phos". */
export function kidneyAbbr(m: Meal): string {
  const rows = kidneyRows(m);
  if (!rows) return "";
  const ab: Record<KidneyRow["key"], string> = { na: "Na", k: "K", ph: "Phos" };
  const ok = rows.filter((r) => r.ok).map((r) => ab[r.key]);
  return ok.length ? "Low " + ok.join(" · ") : "Kidney care";
}

export function kidneyProteinNote(m: Meal): string {
  if (!m.rn) return "";
  const t = NKF[m.rn.kind];
  const what = m.rn.kind === "meal" ? "meal" : "snack";
  if (m.p < t.protein) return `${m.p} g protein: within the NKF guide of under ${t.protein} g per ${what} for kidney disease not on dialysis.`;
  if (m.p >= t.proteinDialysis - 4) return `${m.p} g protein: close to the NKF guide of about ${t.proteinDialysis} g per ${what} for people on dialysis, and a good fit for healthy kidneys.`;
  return `${m.p} g protein: above the under-${t.protein} g guide for kidney disease not on dialysis; fine for healthy kidneys.`;
}

/** Kidney numbers for a list of recipes, or null if any recipe has no kidney data. */
export function kidneyTotals(ids: string[]) {
  const ms = ids.map((id) => MEALS.find((m) => m.id === id)).filter((m): m is Meal => !!m);
  if (!ms.length || ms.some((m) => !m.rn)) return null;
  return ms.reduce((a, m) => ({ na: a.na + m.rn!.na, k: a.k + m.rn!.k, ph: a.ph + m.rn!.ph }), { na: 0, k: 0, ph: 0 });
}

/** Sample kidney-care days for the day builder. */
export const SAMPLE_KIDNEY_DAY = { ckd: ["kd5", "kd4", "kd11", "kd18", "kd7", "kd12", "kd14", "kd16"], dialysis: ["kd9", "kd17", "kd13", "kd8", "kd14"] };

export const KIDNEY_SOURCES = [
  { name: "National Kidney Foundation — Creating a Kidney-Friendly Plate", url: "https://www.kidney.org/kidney-topics/creating-kidney-friendly-plate" },
  { name: "National Kidney Foundation — 6 kidney diet myths", url: "https://www.kidney.org/newsletter/separating-kidney-diet-facts-fiction" },
  { name: "NIDDK — Eating, diet & nutrition for kidney stones", url: "https://www.niddk.nih.gov/health-information/urologic-diseases/kidney-stones/eating-diet-nutrition" },
  { name: "KDOQI 2020 nutrition guideline (summary, Healio)", url: "https://www.healio.com/news/nephrology/20200122/new-kdoqi-guidelines-offer-a-reset-on-nutrition" },
  { name: "DaVita — Lowering potassium in potatoes", url: "https://davita.com/diet-nutrition/articles/basics/lowering-potassium-in-potatoes" },
  { name: "Star fruit and kidney disease (PubMed)", url: "https://pubmed.ncbi.nlm.nih.gov/26154645/" },
  { name: "USDA FoodData Central (nutrient values)", url: "https://fdc.nal.usda.gov/" },
];
