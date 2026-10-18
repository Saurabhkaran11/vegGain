// Weekly meal plan generator and grocery list builder (pure functions, no React).
import { MEALS, INDIAN_REGIONS, CUISINES, PRIORITY_CUISINE, SLOTS, isIndian, cuisineOf, type Meal, type Diet, type Cuisine } from "./meals";
import type { Targets } from "./targets";

export type Focus = "mix" | "indian" | "world" | Cuisine;
export type PlanOptions = { diet: "all" | Diet; focus: Focus; budget: boolean };
export const DEFAULT_OPTIONS: PlanOptions = { diet: "all", focus: "mix", budget: false };
export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MAIN_SLOTS = ["breakfast", "lunch", "evening", "dinner"] as const;
export type MainSlot = (typeof MAIN_SLOTS)[number];

/** A day is the four main meals plus up to three protein boosters (shakes, fruit bowls, snacks). */
export type PlanDay = { breakfast: string; lunch: string; evening: string; dinner: string; extras: string[] };

const byId = new Map(MEALS.map((m) => [m.id, m]));
export const meal = (id: string) => byId.get(id);
const dayIds = (d?: PlanDay) => (d ? [d.breakfast, d.lunch, d.evening, d.dinner, ...d.extras] : []);

/** The targets a plan was built for. When the calculator changes them, the plan is rebuilt. */
export const targetKey = (t: Targets) => `${t.proteinLo}-${t.proteinHi}-${t.kcalLo}-${t.kcalHi}`;

// Small seeded random generator so "Shuffle" is reproducible and plans can be saved.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Every recipe is vegetarian (no meat, fish or eggs); "vegan" narrows to recipes with no dairy or honey.
function fits(m: Meal, o: PlanOptions) {
  return o.diet !== "vegan" || m.tags.includes("vegan");
}
const isSingle = (f: Focus) => f !== "mix" && f !== "indian" && f !== "world";
const focusIsIndian = (f: Focus) => (INDIAN_REGIONS as readonly string[]).includes(f);

/** 2 = the chosen cuisine, 1 = a close one (another Indian region, or another world cuisine), 0 = anything else. */
function tier(m: Meal, o: PlanOptions): 0 | 1 | 2 {
  if (o.focus === "mix") return 2;
  const indian = isIndian(m);
  if (o.focus === "indian") return indian ? 2 : 0;
  if (o.focus === "world") return indian ? 0 : 2;
  if (cuisineOf(m) === o.focus) return 2;
  return indian === focusIsIndian(o.focus) ? 1 : 0;
}

/** Candidate recipes for each meal of the day, plus the shakes and snacks used as protein boosters. */
export function pools(o: PlanOptions) {
  const ok = MEALS.filter((m) => fits(m, o));
  const frozenMain = (m: Meal) => m.slot === "pantry" && /frozen/i.test(m.life ?? "") && m.kcal >= 450;
  const lunch = ok.filter((m) => m.slot === "lunch" || (m.slot === "skin" && m.kcal >= 450));
  const dinner = ok.filter((m) => m.slot === "dinner" || frozenMain(m));
  // With one cuisine chosen, its lunches and dinners can trade places so more of the week stays in that cuisine.
  const share = (a: Meal[], b: Meal[]) => (isSingle(o.focus) ? a.concat(b.filter((m) => tier(m, o) === 2 && !a.includes(m))) : a);
  const slots: Record<MainSlot, Meal[]> = {
    breakfast: ok.filter((m) => m.slot === "breakfast"),
    lunch: share(lunch, dinner),
    evening: ok.filter((m) => m.slot === "evening"),
    dinner: share(dinner, lunch),
  };
  const boosters = ok.filter((m) => (m.slot === "drinks" || m.slot === "fruit" || (m.slot === "pantry" && m.kcal <= 350) || (m.slot === "skin" && m.kcal < 450)) && m.p >= 10);
  return { ...slots, boosters };
}
type Pools = ReturnType<typeof pools>;

/** Where the chosen cuisine has few recipes for a meal, say so (the plan fills in from a close cuisine). */
export function focusNotes(o: PlanOptions): { slot: MainSlot; count: number }[] {
  if (!isSingle(o.focus)) return [];
  const P = pools(o);
  return MAIN_SLOTS.map((slot) => ({ slot, count: P[slot].filter((m) => tier(m, o) === 2).length })).filter((x) => x.count < 2);
}
export function focusNoteText(o: PlanOptions): string {
  const thin = focusNotes(o);
  if (!thin.length) return "";
  const name = `${o.diet === "vegan" ? "vegan " : ""}${CUISINES[o.focus as Cuisine]}`;
  const parts = thin.map((x) => `${x.count === 0 ? "no" : "one"} ${SLOTS[x.slot].toLowerCase()}${x.count === 0 ? " recipes" : " recipe"}`);
  const list = parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0];
  return `The menu has ${list} for ${name} so far, so those meals also come from ${focusIsIndian(o.focus) ? "other Indian regions" : "other world cuisines"}.`;
}

export function dayTotals(d: PlanDay) {
  const ms = dayIds(d).map(meal).filter((m): m is Meal => !!m);
  return ms.reduce((a, m) => ({ p: a.p + m.p, kcal: a.kcal + m.kcal, usd: a.usd + m.usd, inr: a.inr + m.inr }), { p: 0, kcal: 0, usd: 0, inr: 0 });
}

/** How far a day is from the targets (0 is perfect). Being short on protein or calories costs most. */
function cost(ids: string[], t: Targets, o: PlanOptions) {
  let p = 0, k = 0, usd = 0;
  for (const id of ids) { const m = byId.get(id); if (m) { p += m.p; k += m.kcal; usd += m.usd; } }
  const short = (x: number, lo: number) => Math.max(0, lo - x) / lo;
  const over = (x: number, hi: number) => Math.max(0, x - hi) / hi;
  return 12 * short(p, t.proteinLo) + 3 * over(p, t.proteinHi * 1.1) + 10 * short(k, t.kcalLo) + 6 * over(k, t.kcalHi) + Math.abs(k - t.kcal) / t.kcal + (o.budget ? usd * 0.12 : 0);
}

const SHARE: Record<MainSlot, number> = { breakfast: 0.24, lunch: 0.3, evening: 0.14, dinner: 0.32 };

/** Weighted random choice that favors protein (or protein per dollar on a budget) and a portion size that suits the targets. */
function sample(list: Meal[], s: MainSlot, o: PlanOptions, t: Targets, r: () => number, seen: Map<string, number>, soft: Set<string>) {
  const budget = SHARE[s] * t.kcal * 0.88;
  const w = list.map((m) => {
    const value = o.budget ? (m.p / Math.max(0.5, m.usd)) ** 1.2 : m.p ** 1.2;
    const fit = Math.exp(-(((m.kcal - budget) / (budget * 0.5)) ** 2));
    // The priority cuisine (Rajasthani) is picked more often whenever it is allowed by the chosen focus.
    const pri = cuisineOf(m) === PRIORITY_CUISINE ? 2.5 : 1;
    return value * pri * (0.3 + fit) * (soft.has(m.id) ? 0.35 : 1) / (1 + (seen.get(m.id) ?? 0));
  });
  let x = r() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) return list[i]; }
  return list[list.length - 1];
}

/** Recipes allowed for one meal: never the same as yesterday or earlier today, and from the closest cuisine tier available. */
function candidates(pool: Meal[], o: PlanOptions, hard: Set<string>, today: string[]) {
  let c = pool.filter((m) => !hard.has(m.id) && !today.includes(m.id));
  if (!c.length) c = pool.filter((m) => !today.includes(m.id));
  if (!c.length) c = pool;
  const top = Math.max(...c.map((m) => tier(m, o)));
  return c.filter((m) => tier(m, o) === top);
}

/** Add shakes or snacks (at most three) while they bring the day closer to the protein and calorie targets. */
function fill(main: string[], t: Targets, o: PlanOptions, P: Pools, avoid: Set<string>, seen: Map<string, number>, r: () => number) {
  const extras: string[] = [];
  let best = cost(main, t, o);
  for (let n = 0; n < 3; n++) {
    const ids = [...main, ...extras];
    let p = 0, k = 0;
    for (const id of ids) { const m = byId.get(id)!; p += m.p; k += m.kcal; }
    if (p >= t.proteinLo && k >= t.kcalLo) break;
    let pick = "", pickCost = best;
    for (const m of P.boosters) {
      if (avoid.has(m.id) || extras.includes(m.id)) continue;
      const c = cost([...ids, m.id], t, o) + 0.06 + 0.05 * (seen.get(m.id) ?? 0) + r() * 0.04;
      if (c < pickCost) { pickCost = c; pick = m.id; }
    }
    if (!pick) break;
    extras.push(pick);
    best = pickCost;
  }
  return { extras, cost: best };
}

/** Build one day: try many combinations and keep the one closest to the targets with the most variety. */
function makeDay(prev: PlanDay[], P: Pools, o: PlanOptions, t: Targets, r: () => number, tries = 40): PlanDay {
  const yesterday = new Set(dayIds(prev[prev.length - 1]));
  const before = new Set(dayIds(prev[prev.length - 2]));
  const seen = new Map<string, number>();
  for (const id of prev.flatMap(dayIds)) seen.set(id, (seen.get(id) ?? 0) + 1);
  let best: { d: PlanDay; c: number } | null = null;
  for (let i = 0; i < tries; i++) {
    const d: PlanDay = { breakfast: "", lunch: "", evening: "", dinner: "", extras: [] };
    const today: string[] = [];
    let penalty = 0;
    for (const s of MAIN_SLOTS) {
      const m = sample(candidates(P[s], o, yesterday, today), s, o, t, r, seen, before);
      d[s] = m.id; today.push(m.id);
      if (before.has(m.id)) penalty += 0.4;
      penalty += 0.15 * (seen.get(m.id) ?? 0);
    }
    const f = fill(today, t, o, P, new Set([...yesterday, ...today]), seen, r);
    const c = f.cost + penalty + 0.1 * f.extras.length;
    if (!best || c < best.c) best = { d: { ...d, extras: f.extras }, c };
  }
  return best!.d;
}

export function generateWeek(o: PlanOptions, t: Targets, seed: number): PlanDay[] {
  const r = rng(seed);
  const P = pools(o);
  const days: PlanDay[] = [];
  for (let i = 0; i < 7; i++) days.push(makeDay(days, P, o, t, r));
  return days;
}

/** Swap one meal for another from the same pool, then re-balance that day's boosters. Returns null when there is no alternative. */
export function swapMeal(days: PlanDay[], i: number, s: MainSlot, o: PlanOptions, t: Targets, seed: number): PlanDay[] | null {
  const r = rng(seed);
  const P = pools(o);
  const next = days.map((d) => ({ ...d, extras: [...d.extras] }));
  const d = next[i];
  const others = MAIN_SLOTS.filter((x) => x !== s).map((x) => d[x]);
  const near = new Set([...dayIds(next[i - 1]), ...dayIds(next[i + 1])]);
  const seen = new Map<string, number>();
  for (const id of next.filter((_, j) => j !== i).flatMap(dayIds)) seen.set(id, (seen.get(id) ?? 0) + 1);
  const pool = P[s].filter((m) => m.id !== d[s]);
  if (!pool.length) return null;
  const list = candidates(pool, o, near, others);
  // Try a handful of alternatives and keep the one that fits the day best.
  let best: { id: string; extras: string[]; c: number } | null = null;
  for (let k = 0; k < Math.min(8, list.length * 2); k++) {
    const m = sample(list, s, o, t, r, seen, new Set());
    const main = MAIN_SLOTS.map((x) => (x === s ? m.id : d[x]));
    const f = fill(main, t, o, P, new Set([...near, ...main]), seen, r);
    const c = f.cost + 0.15 * (seen.get(m.id) ?? 0) + 0.1 * f.extras.length + r() * 0.2;
    if (!best || c < best.c) best = { id: m.id, extras: f.extras, c };
  }
  if (!best) return null;
  d[s] = best.id;
  d.extras = best.extras;
  return next;
}

export function isValidWeek(v: unknown): v is PlanDay[] {
  return Array.isArray(v) && v.length === 7 && v.every((d) => d && MAIN_SLOTS.every((s) => typeof d[s] === "string" && byId.has(d[s])) && Array.isArray(d.extras) && d.extras.every((x: unknown) => typeof x === "string" && byId.has(x as string)));
}

// ---------- Grocery list ----------

export type GroceryGroup = "Protein & dairy" | "Grains, breads & flours" | "Vegetables & herbs" | "Fruit" | "Nuts & seeds" | "Pantry, spices & sauces";
export type GroceryItem = { name: string; qty?: string; uses: number };
export type Grocery = { groups: Record<GroceryGroup, GroceryItem[]>; batch: { id: string; name: string }[]; meals: number };

const GROUP_WORDS: [GroceryGroup, RegExp][] = [
  ["Grains, breads & flours", /glass noodle|rice cake|rice flour|rice noodle|oat milk|bread|tortilla|bolillo/],
  ["Protein & dairy", /soy milk|almond milk|coconut milk|coconut yogurt|soy yogurt|peanut butter|almond butter|cottage cheese|cream cheese|soy chorizo|soyrizo|seitan|vital wheat gluten|soy protein|pea protein|protein powder|nutritional yeast/],
  ["Pantry, spices & sauces", /mustard seed|powder|masala\b|seasoning|paste|sauce|\boil\b|vinegar|chutney|relish|salsa|hoisin|mirin|balsamic|dark soy|wakame|kombu|nori|\bgim\b|seaweed|black pepper|white pepper|peppercorn|amchur|sparkling water|tea bag/],
  ["Vegetables & herbs", /tomato|green bean|french bean|string bean|long bean|surti papdi|bell pepper|capsicum|green pepper|red pepper|poblano|jalape|ginger|garlic|green chilli|curry leaves|coriander|mint|lemongrass|galangal|kaffir|basil|parsley|dill|spring onion|scallion|fenugreek leaves|kasuri methi/],
  ["Pantry, spices & sauces", /syrup|honey|jaggery|sugar|stock|starch|cornflour|roux|kimchi/],
  ["Nuts & seeds", /almond|walnut|cashew|peanut|pistachio|hazelnut|pine nut|pumpkin seed|pepita|sunflower seed|chia|flax|hemp|sesame|melon seed|poppy seed|seeds|makhana|nuts/],
  ["Protein & dairy", /tofu|tempeh|paneer|soya|edamame|natto|inari|chickpea|chana|rajma|kidney bean|black bean|pinto|borlotti|cannellini|gigante|bean|lentil|dal|moong|masoor|urad|moth|matki|mangodi|sprout|yogurt|curd|dahi|kefir|labneh|skyr|milk|cheese|cotija|ricotta|feta|mozzarella|parmesan|cheddar|monterey|oaxaca|cottage|ghee|butter|protein|sattu|besan|hummus|falafel|cream/],
  ["Grains, breads & flours", /rice|oat|atta|flour|pita|roti|rotli|chapati|paratha|kulcha|pasta|spaghetti|noodle|soba|udon|quinoa|farro|poha|chura|rava|semolina|sooji|bajra|jowar|ragi|millet|bhakri|bhajani|pav|bun|roll|bao|granola|couscous|wrapper|toast|sourdough|idli|sabudana|hominy|popcorn/],
  ["Fruit", /banana|apple|mango|berr|cherr|orange|mandarin|lemon|lime|kiwi|papaya|pineapple|pomegranate|grape|pear|persimmon|date|fig|guava|watermelon|melon|raisin|amla|avocado|coconut|juice/],
  ["Pantry, spices & sauces", /salt|pepper|cumin|jeera|turmeric|chilli|paprika|cinnamon|cardamom|clove|hing|asafoetida|mustard seed|ajwain|fenugreek seed|fennel|panch phoron|star anise|garam|curry powder|gochujang|gochugaru|doenjang|doubanjiang|miso|tahini|maple|ketchup|spice|herbs|bay leaf|saffron|kokum|tamarind|vanilla|cocoa|cacao|chocolate|tea|matcha|coffee|misugaru|farsan|crisp/],
];
function groupOf(name: string): GroceryGroup {
  for (const [g, re] of GROUP_WORDS) if (re.test(name)) return g;
  return "Vegetables & herbs";
}

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
function parseNum(s: string) {
  const t = s.trim();
  const m = /^(\d+(?:\.\d+)?)?\s*([½¼¾⅓⅔⅛])?$/.exec(t);
  if (m && (m[1] || m[2])) return (m[1] ? +m[1] : 0) + (m[2] ? FRACTIONS[m[2]] : 0);
  const f = /^(\d+)\/(\d+)$/.exec(t);
  return f ? +f[1] / +f[2] : parseFloat(t);
}

// Words that describe how an ingredient is prepared rather than what to buy.
const PREP = /^(of|each|fresh|large|small|medium|big|thick|thin|plain|dry|dried|unsweetened|cooked|frozen|chopped|cold|hot|warm|2%|low-fat|nonfat|full-fat|part-skim|whole-milk|ripe|boiled|soaked|sliced|diced|minced|grated|shredded|crumbled|cubed|torn|finely|thinly|roughly|toasted|mashed|steamed|leftover|day-old|extra|some|optional|about|approx\.?|around|heaped|level|packed|scant|crushed(?= (?!tomato)))\s+/;
const LEAD = /^(a few|few|a |an |some )?(handfuls?|pinch(?:es)?|sprinkle|drizzle|dash|splash|squeeze|zest|slices?|pieces?|sheets?|cups?|little)?\s*(of\s+)?(?=\S)/;
const AFTER = /\s+(finely|roughly|thinly)?\s*(chopped|sliced|diced|minced|grated|shredded|crumbled|cubed|pur[eé]ed|mashed|halved|quartered|torn|peeled|deseeded|rinsed|drained|soaked|cooked|boiled|steamed|roasted|toasted|segmented|crushed|to taste)$/;
const TAIL = /\s+(cubes?|pieces?|florets?|strips?|wedges?|rings?|matchsticks?|halves|segments?|segment row|batons?|rounds?|chunks?|sticks?|stalks?|slices?|spears?)$/;
const CAT = /^(dal|daal|beans?|rice|flour|atta|oil|milk|yogurt|cheese|lentils?|noodles?|sugar|vinegar|sauce|paste|tofu|protein|basil|masala|stock)$/;
// Foods that stand on their own, so "curd or plain yogurt" means curd (not "curd yogurt"); other single words
// share the noun after "or": "silken or soft tofu" → "silken tofu", "toor or masoor dal" → "toor dal".
const STANDALONE = new Set(["curd", "labneh", "skyr", "milk", "yogurt", "kefir", "ghee", "paneer", "tofu", "tempeh", "cheese", "cream", "honey", "sugar", "jaggery", "water", "stock", "quinoa", "couscous", "oil", "tahini", "hummus", "rice", "oats", "poha", "sattu", "besan", "atta", "ricotta", "feta", "chickpeas", "rajma", "lentils", "peanuts", "almonds", "walnuts"]);
const ALIAS: Record<string, string> = {
  "coriander leaves": "coriander", "coriander leaf": "coriander", "mint leaves": "mint", "mint leaf": "mint", "basil leaves": "basil",
  "curry leaf": "curry leaves", "fenugreek leaf": "fenugreek leaves", "spinach leaves": "spinach", "green chillies": "green chilli",
  "chillies": "green chilli", "chilli": "green chilli", "red chillies": "dried red chilli", "dried red chillies": "dried red chilli", "red chilli": "dried red chilli",
  "scallion": "spring onion", "green onion": "spring onion", "chickpeas": "chickpea", "kabuli chana": "chickpea", "rajma": "kidney bean",
  "lemon juice": "lemon", "lime juice": "lime", "cilantro": "coriander", "pepitas": "pumpkin seed", "pepita": "pumpkin seed",
  "soy chunk": "soya chunk", "soya": "soya chunk", "cornstarch": "corn starch", "corn flour": "corn starch", "pepper": "black pepper",
  "soy": "soy sauce", "dark soy": "dark soy sauce", "light soy": "light soy sauce", "tahini paste": "tahini", "unflavoured soy": "soy protein powder",
  "unflavoured soy protein": "soy protein powder", "mushroom oyster sauce": "vegetarian oyster sauce", "garlic clove": "garlic",
  "idli": "idli (ready-made)", "sesame": "sesame seed", "beet": "beetroot", "green pea": "green peas", "pea": "green peas", "peas": "green peas",
  "tomatoes puréed": "tomato", "galangal ginger": "galangal", "canned chickpea": "chickpea (canned)", "boiled chickpea": "chickpea",
  "maple": "maple syrup", "bean": "green bean", "mustard seed": "mustard seeds", "mustard": "mustard seeds", "ginger-garlic": "ginger-garlic paste", "ginger-chilli": "ginger-chilli paste", "rotli": "whole-wheat roti", "misal masala": "misal masala", "white pepper": "white pepper", "celery": "celery",
};
function singular(w: string) {
  if (/chillies$/.test(w)) return w.replace(/chillies$/, "chilli");
  if (/(ss|us|ous|ies|leaves|oats|lentils|greens|grits)$/.test(w)) return w;
  if (/(tomato|potato|mango)es$/.test(w)) return w.slice(0, -2);
  if (/(sh|ch)es$/.test(w)) return w.slice(0, -2);
  if (/[^s]s$/.test(w)) return w.slice(0, -1);
  return w;
}

/** Turn "2 tbsp finely chopped fresh coriander leaves, to serve" into ["coriander"]. */
export function cleanName(s: string): string[] {
  let n = s.toLowerCase().replace(/[“”"*]/g, "").replace(/\bchili\b/g, "chilli").trim();
  n = n.split(/,|;|:| — | – | - (?=[a-z])| to (?:serve|dip|taste|garnish|finish)| for | on the side| whisked | mixed | made into | soaked | tossed | seasoned | cooked into | cooked in | ground with | blended with | with (?!out)| in (?=\S)| if needed| only if/)[0];
  n = n.split("/")[0];
  // "toor or masoor dal" → "toor dal"; "sugar or jaggery" → "sugar"; "tahini or sesame seeds" → "tahini".
  const or = n.split(/\s+or\s+/);
  if (or.length > 1) {
    const a = or[0].trim(), aw = a.split(/\s+/), bw = or[1].trim().split(/\s+/), last = bw[bw.length - 1];
    if (!(a + " ").replace(PREP, "").trim()) n = or[1];
    else n = !/^[\d½¼¾⅓⅔⅛]/.test(bw[0]) && bw.length > 1 && CAT.test(last) && !STANDALONE.has(aw[aw.length - 1]) && !a.endsWith(last) ? `${a} ${last}` : a;
  }
  for (let i = 0; i < 4; i++) n = n.trim().replace(PREP, "").replace(LEAD, "");
  n = n.replace(/\s+/g, " ").trim();
  // "garlic and ginger" → two items; "mustard and sesame seeds" → mustard seeds + sesame seeds.
  const andParts = n.split(/\s+(?:and|&)\s+/);
  const lastPart = andParts[andParts.length - 1].trim().split(/\s+/);
  const shared = lastPart.length > 1 && /^(dal|beans?|seeds?|powder|leaves|flour|lentils?|noodles?)$/.test(lastPart[lastPart.length - 1]) ? lastPart[lastPart.length - 1] : "";
  return andParts.map((p, i) => (shared && i < andParts.length - 1 && !/\s/.test(p.trim()) && !STANDALONE.has(p.trim()) ? `${p.trim()} ${shared}` : p)).map((p) => {
    let x = p.trim();
    for (let i = 0; i < 3; i++) x = x.replace(PREP, "").replace(LEAD, "").replace(AFTER, "").replace(TAIL, "").trim();
    if (x.split(" ").length > 4) x = x.split(" ").slice(0, 4).join(" ");
    x = singular(x);
    return ALIAS[x] ?? x;
  }).filter((x) => x.length > 1 && !/^[\d½¼¾⅓⅔⅛]/.test(x) && !/^(juice|zest|juiced|zested)$/.test(x));
}
// Comma-separated notes after an ingredient ("1 onion, finely chopped", "tofu, pressed and cubed, blanched 2 min").
const DESCRIPTOR = /^((\w+ly|very)\s+)?[a-z-]*(ed|ground)(\s+(and|&|then|or)\s+((\w+ly)\s+)?[a-z-]*(ed|ground))*(\s+(\d.*|overnight|until\b.*|till\b.*|in\b.*|into\b.*|on\b.*|for\b.*|with\b.*|without\b.*|well|lightly|briefly|thoroughly|very well|slightly|if\b.*|at\b.*))?$|^(\w+ly|very well|well|ground|cut .*|split|whole|halved|thin|thick|small|large|optional|divided|packed|skin on|.*removed|to .*|for .*|if .*|into .*|in .*|without .*|with .*|no .*|plus .*|about .*|at .*|as needed|room temperature|overnight|juice|zest|juiced|zested|or .*|then .*)$/;
const PARTICIPLE_ITEM = /^(dried|roasted|toasted|salted|unsalted|smoked|pickled|fried|puffed|mixed|shredded|grated|sprouted|boiled|steamed|frozen|cooked|canned|crushed|minced|sliced|chopped|diced|peeled)\s+(?!(and|&|then|or|until|in|into|on|for|with|without|if|at|overnight|well|lightly|briefly)\b)[a-z]/;
/** "20 g each chana, toor and moong dal" → "20 g chana dal", "20 g toor dal", "20 g moong dal". */
function eachList(p: string): string[] {
  const m = /^(?:[A-Za-z][A-Za-z ]{1,18}:\s*)?([\d½¼¾⅓⅔⅛.\/]+\s*(?:g|ml|tbsp|tsp|cups?)?)\s+each\s+(.+)$/i.exec(p.trim());
  if (!m) return [p];
  const body = m[2].split(/,\s*(?=[a-z][a-z ]*(?:,|\s+and\s+|$))/i);
  const items = body.filter((x, i) => i === 0 || !DESCRIPTOR.test(x.trim().toLowerCase())).flatMap((x) => x.split(/\s+and\s+/)).map((x) => x.trim()).filter(Boolean);
  if (items.length < 2) return [p];
  const tail = items[items.length - 1].split(/,/)[0].trim();
  const tw = tail.split(/\s+/);
  const noun = tw.length > 1 && /^(dal|beans?|seeds?|powder|leaves|flour)$/.test(tw[tw.length - 1]) ? tw[tw.length - 1] : "";
  return items.map((x, i) => `${m[1]} ${i < items.length - 1 && noun && !/\s/.test(x) ? `${x} ${noun}` : i === items.length - 1 ? tail : x}`);
}
function subItems(p: string): string[] {
  return p.split(/,\s*/).flatMap((x, i) => {
    if (i === 0) return [x];
    let t = x.trim().toLowerCase().replace(/^and\s+/, "");
    if (!t) return [];
    if (PARTICIPLE_ITEM.test(t)) return [t];
    return DESCRIPTOR.test(t) ? [] : [t];
  });
}
const SKIP = /^(water|hot water|cold water|warm water|boiling water|ice|ice cube|salt|sea salt|table salt|kosher salt|no salt|salt and pepper|pepper to taste|water at .*|filtered water|more water|extra water|steam|oil spray|cooking spray)$/;

const NUM = "(\\d+(?:\\.\\d+)?|\\d*\\s?[½¼¾⅓⅔⅛]|\\d+\\/\\d+)";
const RANGE = new RegExp(`^${NUM}\\s*[–-]\\s*${NUM}`);
const RE_WEIGHT = new RegExp(`^${NUM}\\s*(g|kg|ml|l)\\s+(.+)$`, "i");
const SPOON = "tbsp|tsp|cups?";
const OTHER = "inch(?:es)?|handfuls?|pinch(?:es)?|sheets?|slices?|packs?|packets?|cans?|tins?|bowls?|cubes?|stalks?|cloves?|sprigs?|bunch(?:es)?|scoops?|blocks?";
const RE_MEASURE = new RegExp(`^${NUM}\\s*(${SPOON}|${OTHER})\\.?\\s+(.+)$`, "i");
const RE_COUNT = new RegExp(`^${NUM}\\s+(?!(?:${SPOON}|${OTHER})\\b)(.+)$`, "i");

type Agg = { g: number; ml: number; tsp: number; n: number; other: Map<string, number>; uses: number };
const UNIT_ONE: Record<string, string> = { inches: "inch", handfuls: "handful", pinches: "pinch", sheets: "sheet", slices: "slice", packs: "pack", packets: "pack", packet: "pack", cans: "can", tins: "can", tin: "can", bowls: "bowl", cubes: "cube", stalks: "stalk", cloves: "clove", sprigs: "sprig", bunches: "bunch", scoops: "scoop", blocks: "block" };
const PLURAL: Record<string, string> = { inch: "inch", pinch: "pinches", bunch: "bunches" };

export function buildGrocery(ids: string[]): Grocery {
  const items = new Map<string, Agg>();
  const batch = new Map<string, string>();
  const get = (name: string) => {
    let a = items.get(name);
    if (!a) { a = { g: 0, ml: 0, tsp: 0, n: 0, other: new Map(), uses: 0 }; items.set(name, a); }
    a.uses++;
    return a;
  };

  for (const id of ids) {
    const m = meal(id);
    if (!m) continue;
    // Batch recipes (jars, freezer batches) list ingredients for many servings: show them separately.
    if (m.ing.some((x) => /^For (the jar|\d)/i.test(x))) { batch.set(m.id, m.name); continue; }
    for (const raw of m.ing) {
      // Optional extras ("Dairy option: +150 g curd") are not part of the plan.
      if (/^\s*[A-Za-z ]*option(al)?\s*:/i.test(raw)) continue;
      const line = raw
        .replace(/\([^)]*\)/g, " ").replace(/\([^)]*$/, " ").replace(/\)/g, " ")
        .replace(/^(Per (glass|bowl|mug|serving|curry|pack|jar|portion|plate)|To (blend|cook|serve|finish|top)|Serve (each portion )?with|Topping|Toppings|Garnish|Optional)\s*:\s*/i, "")
        .trim();
      // "1 tbsp soy sauce, white pepper, chilli oil" → three items; "1 onion, finely chopped" → one.
      const pieces = line.split(/\s\+\s?|;|\s+and\s+(?=[\d½¼¾⅓⅔⅛])/).flatMap(eachList).flatMap(subItems);
      for (const piece of pieces) {
        // Drop sub-recipe labels such as "Gravy: 150 g curd" or "Batter: 30 g rice".
        let part = piece.replace(/^[A-Za-z][A-Za-z ]{1,18}:\s*/, "").replace(/^[+•\-–]\s*/, "").replace(/^(about|approx\.?|around|~)\s*/i, "")
          .replace(/^juice of ([\d½¼]+)\s+(lemon|lime|orange)s?/i, "$1 $2")
          .replace(/^(\d+(?:\.\d+)?\s*(?:g|ml))\s+each\s+/i, "$1 ").trim();
        const rg = RANGE.exec(part);
        if (rg) part = part.replace(RANGE, String(Math.max(parseNum(rg[1]), parseNum(rg[2]))));
        let x: RegExpExecArray | null;
        if ((x = RE_WEIGHT.exec(part))) {
          const names = cleanName(x[3]);
          const q = (parseNum(x[1]) * (/^k|^l$/i.test(x[2]) ? 1000 : 1)) / Math.max(1, names.length);
          for (const name of names) { const a = get(name); if (/m?l$/i.test(x[2])) a.ml += q; else a.g += q; }
        } else if ((x = RE_MEASURE.exec(part))) {
          const names = cleanName(x[3]);
          const unit = x[2].toLowerCase();
          const q = parseNum(x[1]) / Math.max(1, names.length);
          for (const name of names) {
            const a = get(name);
            if (/^(tbsp|tsp|cups?)$/.test(unit)) a.tsp += q * (unit === "tsp" ? 1 : unit === "tbsp" ? 3 : 48);
            else { const u = UNIT_ONE[unit] ?? unit; a.other.set(u, (a.other.get(u) ?? 0) + q); }
          }
        } else if ((x = RE_COUNT.exec(part))) {
          const raw2 = x[2].toLowerCase();
          const names = cleanName(x[2]);
          const um = /^(?:(?:big|small|large|thick|thin|heaped|generous|fresh)\s+)?(slice|piece|handful|bunch|stalk|stick)(?:e?s)?\b/.exec(raw2);
          const unit = /^(?:\S+\s+)?(garlic cloves?|cloves? garlic)/.test(raw2) ? "clove" : /lemongrass stalks?|celery (stalk|stick)s?/.test(raw2) ? "stalk" : um ? (um[1] === "stick" ? "stalk" : um[1]) : "";
          for (const name of names) {
            const a = get(name), q = parseNum(x[1]) / Math.max(1, names.length);
            if (unit) a.other.set(unit, (a.other.get(unit) ?? 0) + q); else a.n += q;
          }
        } else {
          for (const name of cleanName(part)) get(name);
        }
      }
    }
  }

  const groups = {
    "Protein & dairy": [], "Grains, breads & flours": [], "Vegetables & herbs": [], Fruit: [], "Nuts & seeds": [], "Pantry, spices & sauces": [],
  } as Record<GroceryGroup, GroceryItem[]>;
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString().replace(/\.0$/, "");
  const half = (n: number) => fmt(Math.ceil(n * 2) / 2);
  for (const [name, a] of items) {
    if (SKIP.test(name)) continue;
    const group = groupOf(name);
    const q: string[] = [];
    if (a.g) q.push(a.g >= 1000 ? `${fmt(a.g / 1000)} kg` : `${Math.ceil(a.g / 10) * 10} g`);
    if (a.ml) q.push(a.ml >= 1000 ? `${fmt(a.ml / 1000)} L` : `${Math.ceil(a.ml / 10) * 10} ml`);
    if (a.n) q.push(`× ${Math.ceil(a.n)}`);
    for (const [u, v] of a.other) { const r = u === "inch" || u === "handful" || u === "bowl" ? Number(half(v)) : Math.ceil(v); q.push(`${r} ${r > 1 ? PLURAL[u] ?? u + "s" : u}`); }
    // Dry spices are bought by the packet, so spoon amounts are left off; everything else shows a rounded amount.
    const drySpice = group === "Pantry, spices & sauces" && !/oil|sauce|vinegar|syrup|honey|paste|ketchup|stock|tahini|miso|gochujang|doenjang|doubanjiang|jaggery|sugar|chutney|salsa/.test(name);
    if (a.tsp && !drySpice && !q.length) q.push(a.tsp >= 24 ? `${half(a.tsp / 48)} cup${a.tsp / 48 > 1 ? "s" : ""}` : a.tsp >= 3 ? `${Math.ceil(a.tsp / 3)} tbsp` : `${half(a.tsp)} tsp`);
    groups[group].push({ name, qty: q.length ? q.join(" + ") : undefined, uses: a.uses });
  }
  for (const g of Object.keys(groups) as GroceryGroup[]) groups[g].sort((a, b) => a.name.localeCompare(b.name));

  return { groups, batch: [...batch].map(([id, name]) => ({ id, name })), meals: ids.length };
}

export function groceryText(g: Grocery, title: string) {
  const lines = [title, ""];
  for (const [group, items] of Object.entries(g.groups)) {
    if (!items.length) continue;
    lines.push(group.toUpperCase());
    for (const i of items) lines.push(`☐ ${i.name}${i.qty ? ` — ${i.qty}` : ""}`);
    lines.push("");
  }
  if (g.batch.length) {
    lines.push("BATCH PREP (see each recipe for its ingredients)");
    for (const b of g.batch) lines.push(`☐ ${b.name}`);
  }
  return lines.join("\n");
}
