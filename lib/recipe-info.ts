// Derived details for the recipe page: allergens, "good for" badges, stores, video channels, pairings.
import { MEALS, cuisineOf, isIndian, type Meal } from "./meals";
import { kidneyShort } from "./kidney";

const has = (m: Meal, words: string[]) => {
  const text = m.ing.join(" ").toLowerCase();
  return words.some((w) => new RegExp(`\\b${w}`, "i").test(text));
};

export function allergens(m: Meal): string[] {
  const out: string[] = [];
  if (has(m, ["paneer", "curd", "yogurt", "milk", "cheese", "cheddar", "butter", "ghee", "cream", "feta", "cottage", "chhena", "parmesan", "queso", "condensed", "lassi", "dahi"]) && !m.tags.includes("vegan")) out.push("Dairy");
  if (has(m, ["tofu", "soy", "soya", "tempeh", "edamame", "miso", "doubanjiang", "soyrizo", "soy chorizo"])) out.push("Soy");
  if (has(m, ["atta", "wheat", "bread", "pav", "tortilla", "pita", "noodle", "spaghetti", "semolina", "rava", "farsan", "somyeon", "soba", "granola", "oats", "pasta"])) out.push("Gluten (wheat/oats)");
  if (has(m, ["peanut"])) out.push("Peanuts");
  if (has(m, ["almond", "walnut", "cashew", "pistachio", "pine nut"])) out.push("Tree nuts");
  if (has(m, ["sesame", "tahini"])) out.push("Sesame");
  return out;
}

export type Badge = { label: string; why: string };
export function goodFor(m: Meal): Badge[] {
  const v = m.vit.toLowerCase();
  const b: Badge[] = [];
  if (m.rn) b.push({ label: "Kidney care", why: kidneyShort(m) || "Low sodium" });
  if (m.p >= 30) b.push({ label: "Muscle building", why: `${m.p} g protein, above the ~28 g per-meal goal for a 70 kg person` });
  else if (m.p >= 20) b.push({ label: "Good protein", why: `${m.p} g protein` });
  if (m.kcal >= 650) b.push({ label: "Weight gain", why: `${m.kcal} kcal per serving` });
  if (m.slot === "skin" || /vitamin c|vitamin a|beta-carotene|vitamin e|zinc|collagen/.test(v)) b.push({ label: "Skin health", why: "Vitamin C, A or E, or zinc" });
  if (/b12|omega|iron|choline|creatine/.test(v)) b.push({ label: "Brain focus", why: "B12, iron, choline or omega-3" });
  if (m.usd <= 1.5) b.push({ label: "Budget", why: `Under $1.50 per serving` });
  if (parseInt(m.time, 10) <= 15) b.push({ label: "Quick", why: m.time });
  if (/digest|probiotic|ferment/.test(v)) b.push({ label: "Gut friendly", why: "Fermented or digestive ingredients" });
  return b;
}

const STORE_BY_CUISINE: Record<string, string> = {
  indian: "India Cash & Carry (Foster City, Sunnyvale), neighborhood Indian grocers",
  korean: "H Mart (Fremont, Dublin), 99 Ranch Market",
  chinese: "99 Ranch Market (Foster City and other Bay Area stores)",
  thai: "99 Ranch Market, Thai and Southeast Asian markets",
  japanese: "Nijiya Market, Mitsuwa (San Jose)",
  mexican: "Latino markets, Safeway, Costco, Trader Joe’s",
  mediterranean: "Trader Joe’s, Costco, Middle Eastern markets",
  italian: "Trader Joe’s, Safeway, Costco",
  global: "Costco, Trader Joe’s, Safeway, Whole Foods, Sprouts",
};
export function storesFor(m: Meal) {
  const key = isIndian(m) ? "indian" : cuisineOf(m);
  return [STORE_BY_CUISINE[key] ?? STORE_BY_CUISINE.global, "Staples (tofu, yogurt, oats, nuts, produce): Costco, Trader Joe’s, Safeway"];
}

const CHANNELS: Record<string, string[]> = {
  indian: ["Hebbars Kitchen", "Ranveer Brar", "Nisha Madhulika"],
  korean: ["Maangchi"],
  chinese: ["Chinese Cooking Demystified"],
  japanese: ["Just One Cookbook"],
  thai: ["Pailin's Kitchen"],
  mexican: ["Rick Bayless"],
  mediterranean: ["The Mediterranean Dish"],
  italian: ["Vincenzo's Plate"],
  global: ["Rainbow Plant Life", "Simnett Nutrition"],
};
export function videoLinks(m: Meal) {
  const key = isIndian(m) ? "indian" : cuisineOf(m);
  const base = m.name.replace(/\s*\+.*$/, "").replace(/\(.*?\)/g, "").trim();
  return (CHANNELS[key] ?? CHANNELS.global).map((ch) => ({
    channel: ch,
    href: "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${ch} ${base}`),
  }));
}

export function macroSplit(m: Meal) {
  const p = m.p * 4, c = m.c * 4, f = m.f * 9, t = p + c + f || 1;
  return { protein: Math.round((p / t) * 100), carbs: Math.round((c / t) * 100), fat: Math.round((f / t) * 100) };
}

/** Complementary items from other categories to round out the day. */
export function pairings(m: Meal) {
  // Kidney care recipes pair with other kidney care items (a meal with a low-salt snack or drink, and the reverse),
  // never with high-protein shakes.
  if (m.slot === "kidney") {
    const others = MEALS.filter((x) => x.slot === "kidney" && x.id !== m.id && x.rn?.kind !== m.rn?.kind);
    const start = others.length ? (parseInt(m.id.replace(/\D/g, ""), 10) || 0) % others.length : 0;
    return [...others.slice(start), ...others.slice(0, start)].slice(0, 3);
  }
  const want = m.slot === "drinks" || m.slot === "fruit" || m.slot === "pantry" ? ["breakfast", "evening", "fruit"].filter((s) => s !== m.slot) : ["drinks", "fruit", "pantry"];
  const sameFamily = (x: Meal) => (isIndian(m) ? isIndian(x) : cuisineOf(x) === cuisineOf(m));
  return want
    .map((s) => MEALS.filter((x) => x.slot === s).sort((a, b) => Number(sameFamily(b)) - Number(sameFamily(a)) || b.p - a.p)[0])
    .filter(Boolean)
    .slice(0, 3);
}

export function neighbors(m: Meal) {
  const i = MEALS.findIndex((x) => x.id === m.id);
  return { prev: MEALS[(i - 1 + MEALS.length) % MEALS.length], next: MEALS[(i + 1) % MEALS.length] };
}

/** Where a recipe is stored, read from its storage note. */
export type StoreAt = "cupboard" | "fridge" | "freezer";
export function storeAt(m: Meal): StoreAt {
  const l = (m.life ?? "").toLowerCase();
  return l.includes("frozen") ? "freezer" : l.includes("fridge") ? "fridge" : "cupboard";
}

/** Storage advice for any recipe: its own note, or general leftover guidance (FoodSafety.gov). */
export function storageAdvice(m: Meal) {
  if (m.keep) return m.keep;
  if (m.slot === "drinks" || m.slot === "fruit") return "Best made fresh. Cut fruit and smoothies keep up to 1 day in a sealed container in the fridge.";
  return "Best eaten fresh. Leftovers: refrigerate within 2 hours and eat within 3–4 days. Curries, dals and soups freeze well for 2–3 months; reheat until steaming hot.";
}
