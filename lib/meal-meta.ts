// Small, data-free part of the menu: types, labels and helpers. Import this (not ./meals) in code that runs
// on every page, so the full recipe list (ingredients and steps) only downloads where it is used.
export type Slot = "breakfast" | "lunch" | "evening" | "dinner" | "drinks" | "fruit" | "skin" | "kidney" | "pantry";
export type Diet = "veg" | "vegan";
export const INDIAN_REGIONS = ["rajasthani", "punjabi", "gujarati", "marathi", "southindian", "bihari", "indian"] as const;
export const WORLD_CUISINES = ["korean", "chinese", "japanese", "thai", "mexican", "mediterranean", "italian"] as const;
export type IndianRegion = (typeof INDIAN_REGIONS)[number];
export type Cuisine = IndianRegion | (typeof WORLD_CUISINES)[number];

/** The site always puts this cuisine first: menu order, home rows, the featured hero and the 7-day plan. */
export const PRIORITY_CUISINE = "rajasthani" as const;
export type Tag = Diet | Cuisine;
/** Cuisine filter value: a single cuisine, every Indian region, recipes with no cuisine tag, or everything. */
export type CuisineFilter = "all" | "indian-all" | Cuisine | "global";

export type Meal = {
  id: string; slot: Slot; tags: Tag[]; name: string; time: string;
  kcal: number; p: number; c: number; f: number; usd: number; inr: number;
  /** YouTube search query for a cook-along video */
  yt: string; vit: string; ing: string[]; steps: string[];
  /** Short shelf life for the card badge, e.g. "3 months (frozen)" */
  life?: string;
  /** How to store it and for how long */
  keep?: string;
  /** Kidney numbers per serving (mg), estimated from USDA FoodData Central; kind picks the NKF meal or snack target */
  rn?: { na: number; k: number; ph: number; kind: "meal" | "snack" };
  /** A short kidney-care tip */
  tip?: string;
};

export const SLOTS: Record<"all" | Slot, string> = {
  all: "All recipes", breakfast: "Breakfast", lunch: "Lunch", evening: "Evening snack", dinner: "Dinner",
  drinks: "Drinks", fruit: "Fruit bowls", skin: "Skin glow", kidney: "Kidney care", pantry: "Long-life & make-ahead",
};
export const SLOT_HINT: Record<"all" | Slot, string> = {
  all: "Everything", breakfast: "7–9 am", lunch: "12–2 pm", evening: "4–6 pm · pre-workout", dinner: "7–9 pm",
  drinks: "Any time", fruit: "Snack or dessert", skin: "Vitamin C, A, E, zinc, omega-3", kidney: "Low salt · checked against NKF targets", pantry: "Keeps weeks to months",
};
/** Vegetarian here means Indian-style lacto-vegetarian: dairy yes; no meat, fish or eggs. */
export const DIETS: Record<"all" | Diet, string> = { all: "Any diet", veg: "Vegetarian", vegan: "Vegan" };
export const CUISINES: Record<Cuisine | "global", string> = {
  punjabi: "Punjabi", gujarati: "Gujarati", marathi: "Marathi", rajasthani: "Rajasthani / Marwari", southindian: "South Indian",
  bihari: "Bihari", indian: "North Indian home-style",
  korean: "Korean", chinese: "Chinese", japanese: "Japanese", thai: "Thai", mexican: "Mexican",
  mediterranean: "Mediterranean", italian: "Italian", global: "Everyday American",
};
export const TAG_LABEL: Record<Tag, string> = { veg: "Vegetarian", vegan: "Vegan", ...CUISINES };
const ALL_CUISINES: readonly string[] = [...INDIAN_REGIONS, ...WORLD_CUISINES];
export const cuisineOf = (m: Pick<Meal, "tags">): Cuisine | "global" => (m.tags.find((t) => ALL_CUISINES.includes(t)) as Cuisine) ?? "global";
export const isIndian = (m: Pick<Meal, "tags">) => (INDIAN_REGIONS as readonly string[]).includes(cuisineOf(m));
export const isDiet = (t: Tag): t is Diet => t === "veg" || t === "vegan";
export const cuisineFilterLabel = (c: CuisineFilter) => (c === "all" ? "All cuisines" : c === "indian-all" ? "All Indian regions" : CUISINES[c]);

export function matches(m: Pick<Meal, "slot" | "tags">, slot: "all" | Slot, diet: "all" | Diet, cuisine: CuisineFilter) {
  if (slot !== "all" && m.slot !== slot) return false;
  if (diet !== "all" && !m.tags.includes(diet)) return false;
  if (cuisine === "all") return true;
  if (cuisine === "indian-all") return isIndian(m);
  return cuisineOf(m) === cuisine;
}

export const SORTS = {
  recommended: "Recommended",
  protein: "Most protein",
  value: "Most protein per $",
  cost: "Lowest cost",
  calories: "Most calories",
  time: "Quickest",
  keeps: "Keeps longest",
} as const;
export type SortKey = keyof typeof SORTS;
const minutes = (t: string) => parseInt(t, 10) || 99;
/** Approximate shelf life in days, parsed from `life` (recipes without it count as 3 days, like most leftovers). */
export function shelfDays(m: Meal) {
  const r = /(\d+)\s*(day|week|month)/.exec(m.life ?? "");
  if (!r) return 3;
  return Number(r[1]) * (r[2] === "month" ? 30 : r[2] === "week" ? 7 : 1);
}
export function sortMeals(list: Meal[], key: SortKey) {
  const a = [...list];
  if (key === "protein") a.sort((x, y) => y.p - x.p);
  if (key === "value") a.sort((x, y) => y.p / y.usd - x.p / x.usd);
  if (key === "cost") a.sort((x, y) => x.usd - y.usd);
  if (key === "calories") a.sort((x, y) => y.kcal - x.kcal);
  if (key === "time") a.sort((x, y) => minutes(x.time) - minutes(y.time));
  if (key === "keeps") a.sort((x, y) => shelfDays(y) - shelfDays(x));
  return a;
}
export function searchMeals(list: Meal[], q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return list;
  return list.filter((m) =>
    [m.name, m.vit, m.keep ?? "", m.tip ?? "", ...m.ing, ...m.tags.map((x) => TAG_LABEL[x]), SLOTS[m.slot]].join(" ").toLowerCase().includes(t)
  );
}

export const VIEWS = { grid: "Cards", square: "Squares", wide: "Wide", list: "List" } as const;
export type ViewMode = keyof typeof VIEWS;

export const DESIGN_STYLES = [
  { value: "bento", label: "Bento grid" },
  { value: "neo", label: "Neomorphism" },
  { value: "skew", label: "Skewmorphism" },
  { value: "glass", label: "Glassmorphism" },
  { value: "skeuo", label: "Skeuomorphism" },
  { value: "brutal", label: "Brutalism" },
  { value: "minimal", label: "Minimalism" },
  { value: "liquid", label: "Liquid glass" },
  { value: "spatial", label: "Spatial UI" },
] as const;
export type DesignStyle = (typeof DESIGN_STYLES)[number]["value"];

export const SAMPLE_INDIAN_DAY = ["b2", "l1", "e1", "d2"];
export const SAMPLE_VEGAN_DAY = ["b4", "l3", "e3", "d3"];

export const ytURL = (m: Meal) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(m.yt);
export const SLOT_ORDER: Slot[] = ["breakfast", "lunch", "evening", "dinner", "drinks", "fruit", "skin", "kidney", "pantry"];
