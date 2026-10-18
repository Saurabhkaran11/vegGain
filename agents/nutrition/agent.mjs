/**
 * Nutrition agent — protein and key nutrients per 100 g for the core vegetarian protein foods,
 * from USDA FoodData Central (Foundation + SR Legacy data).
 */
import { getJSON, pool } from "../_lib/http.mjs";
import { num } from "../_lib/env.mjs";

// [display name, USDA search query, regex the USDA description must match]
const FOODS = [
  ["Paneer (Indian cottage cheese)", "paneer", /paneer/i],
  ["Tofu, firm", "tofu raw firm prepared with calcium sulfate", /tofu.*firm/i],
  ["Tempeh", "tempeh", /^tempeh/i],
  ["Soya chunks (defatted soy flour)", "soy flour defatted", /soy flour, defatted/i],
  ["Edamame", "edamame frozen prepared", /edamame/i],
  ["Chickpeas (chana), cooked", "chickpeas garbanzo beans mature seeds cooked boiled without salt", /chickpea.*cooked/i],
  ["Lentils (masoor), cooked", "lentils mature seeds cooked boiled without salt", /^lentils.*cooked/i],
  ["Kidney beans (rajma), cooked", "kidney beans red mature seeds cooked boiled without salt", /kidney.*cooked/i],
  ["Mung beans (moong), cooked", "mung beans mature seeds cooked boiled without salt", /mung beans, mature seeds, cooked/i],
  ["Chickpea flour (besan)", "chickpea flour besan", /chickpea flour/i],
  ["Greek yogurt, nonfat", "yogurt greek plain nonfat", /yogurt, greek, plain, nonfat/i],
  ["Cottage cheese, low fat", "cheese cottage lowfat 2% milkfat", /cottage.*low ?fat/i],
  ["Milk, 2%", "milk reduced fat fluid 2% milkfat", /milk, reduced fat/i],
  ["Soy milk, unsweetened", "soymilk unsweetened", /soy ?milk.*unsweetened/i],
  ["Peanuts, roasted", "peanuts all types dry-roasted without salt", /peanuts.*dry-roasted/i],
  ["Almonds", "nuts almonds", /^nuts, almonds/i],
  ["Pumpkin seeds", "seeds pumpkin and squash seed kernels dried", /pumpkin/i],
  ["Hemp seeds", "seeds hemp seed hulled", /hemp/i],
  ["Chia seeds", "seeds chia seeds dried", /chia/i],
  ["Oats, rolled", "oats whole grain rolled old fashioned", /oats/i],
  ["Quinoa, cooked", "quinoa cooked", /quinoa, cooked/i],
  ["Spinach (palak), raw", "spinach raw", /spinach, raw/i],
];
const NUTRIENTS = { protein: [1003, 203], kcal: [1008, 208, 2047, 2048], fat: [1004, 204], carbs: [1005, 205], fiber: [1079, 291], iron: [1089, 303], calcium: [1087, 301], zinc: [1095, 309], vitC: [1162, 401] };

function pick(food) {
  const out = {};
  for (const [k, ids] of Object.entries(NUTRIENTS)) {
    const n = (food.foodNutrients || []).find((x) => ids.includes(x.nutrientId) || ids.includes(Number(x.nutrientNumber ?? x.number)) || ids.includes(x.nutrient?.id) || ids.includes(Number(x.nutrient?.number)));
    const v = n ? (n.value ?? n.amount) : null;
    out[k] = v == null ? null : Math.round(v * 10) / 10;
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function run({ env, previous, log }) {
  const key = env.NUTRITION_USDA_API_KEY || "DEMO_KEY";
  const demo = key === "DEMO_KEY";
  const maxSearches = num(env.NUTRITION_MAX_SEARCHES, demo ? 6 : 50);
  const delay = num(env.NUTRITION_DELAY_MS, demo ? 1500 : 200);
  const warnings = [];
  const prev = Object.fromEntries((previous?.foods || []).map((f) => [f.name, f]));

  // 1) Find the USDA id for foods we have not matched yet (a few per run with DEMO_KEY).
  const MUST = Object.fromEntries(FOODS.map(([n, , re]) => [n, re]));
  for (const n of Object.keys(prev)) if (!MUST[n] || !MUST[n].test(prev[n].usdaName || "")) delete prev[n]; // wrong or renamed match
  const ids = Object.fromEntries(Object.entries(prev).filter(([, f]) => f.fdcId).map(([n, f]) => [n, f.fdcId]));
  let searches = 0;
  for (const [name, query, must] of FOODS) {
    if (ids[name] || searches >= maxSearches) continue;
    searches++;
    try {
      await sleep(delay);
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${key}&pageSize=10&dataType=Foundation,SR%20Legacy,Survey%20%28FNDDS%29&query=${encodeURIComponent(query)}`;
      const d = await getJSON(url, { retries: 1 });
      const f = (d.foods || []).find((x) => must.test(x.description));
      if (!f) { warnings.push(`${name}: no matching USDA food`); continue; }
      ids[name] = f.fdcId;
      prev[name] = { name, fdcId: f.fdcId, usdaName: f.description, dataType: f.dataType, per100g: pick(f), url: `https://fdc.nal.usda.gov/food-details/${f.fdcId}/nutrients` };
    } catch (e) {
      warnings.push(`${name}: ${e.message}`);
      if (String(e.message).includes("429")) break; // rate limited: try again next run
    }
  }

  // 2) Refresh every matched food in ONE request.
  const known = FOODS.filter(([n]) => ids[n]);
  if (known.length) {
    try {
      const d = await getJSON(`https://api.nal.usda.gov/fdc/v1/foods?api_key=${key}&format=abridged&fdcIds=${known.map(([n]) => ids[n]).join(",")}`, { retries: 1 });
      for (const f of d) {
        const name = known.find(([n]) => ids[n] === f.fdcId)?.[0];
        if (name) prev[name] = { name, fdcId: f.fdcId, usdaName: f.description, dataType: f.dataType, per100g: pick(f), url: `https://fdc.nal.usda.gov/food-details/${f.fdcId}/nutrients` };
      }
    } catch (e) { warnings.push(`batch refresh: ${e.message} (kept previous values)`); }
  }

  const list = FOODS.map(([n]) => prev[n]).filter((f) => f?.per100g).sort((a, b) => (b.per100g.protein ?? 0) - (a.per100g.protein ?? 0));
  if (!list.length) throw new Error(warnings[0] || "USDA returned nothing");
  const pending = FOODS.length - list.length;
  log(`${list.length}/${FOODS.length} foods${pending ? `, ${pending} to look up on later runs` : ""}`);
  return { data: { source: "USDA FoodData Central", total: FOODS.length, foods: list }, summary: `${list.length}/${FOODS.length} foods from USDA${pending ? ` (${pending} pending: rate limit)` : ""}`, warnings };
}
