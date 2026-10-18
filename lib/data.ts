// Typed access to the JSON files written by the data agents (agents/*). Missing data never breaks the build.
import chefsList from "./chefs.json";
import chefsData from "@/data/chefs.json";
import nutritionData from "@/data/nutrition.json";
import currencyData from "@/data/currency.json";
import statusData from "@/data/agents-status.json";
import hiddenTopics from "./hidden-topics.json";
import { isVegTitle } from "./veg-filter";
import { MEALS, cuisineOf, type Meal } from "./meals";

export type Chef = { id: string; name: string; handle: string; channelId: string; group: "indian" | "world" | "vegan"; cuisines: string[]; bio: string };
export type Video = { id: string; title: string; url: string; thumb: string; published?: string; views?: string };
type ChefFeed = { ok?: boolean; avatar?: string; videos?: Video[]; source?: string; error?: string };

export const CHEFS = chefsList as Chef[];
const feeds = ((chefsData as { chefs?: Record<string, ChefFeed> }).chefs ?? {}) as Record<string, ChefFeed>;
export const chefsUpdatedAt = (chefsData as { updatedAt?: string }).updatedAt;
export const chefById = (id: string) => CHEFS.find((c) => c.id === id);

// Topics removed from the site (lib/hidden-topics.json). Applied here too, so videos saved
// before a topic was hidden never show, even if the chefs agent has not refreshed yet.
const HIDDEN_TERMS: string[] = (hiddenTopics as { terms?: string[] }).terms ?? [];
const HIDDEN_RE = HIDDEN_TERMS.length ? new RegExp(`\\b(?:${HIDDEN_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i") : null;
export const isHiddenTopic = (title: string) => !!HIDDEN_RE?.test(title);
export const chefFeed = (id: string): ChefFeed => {
  const f = feeds[id] ?? { videos: [] };
  // Re-check every title here too, so videos fetched before a rule was added never show.
  return { ...f, videos: (f.videos ?? []).filter((v) => !isHiddenTopic(v.title) && isVegTitle(v.title)) };
};
export const channelUrl = (c: Chef) => (c.handle ? `https://www.youtube.com/@${c.handle}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(c.name)}`);

/** VegGain recipes in the cuisines this chef is known for. */
export function recipesForChef(c: Chef): Meal[] {
  if (c.cuisines.includes("global")) return MEALS.filter((m) => m.tags.includes("vegan"));
  return MEALS.filter((m) => c.cuisines.includes(cuisineOf(m)));
}
export function chefsForMeal(m: Meal): Chef[] {
  const k = cuisineOf(m);
  const direct = CHEFS.filter((c) => c.cuisines.includes(k));
  return direct.length ? direct : CHEFS.filter((c) => c.group === "vegan");
}
export const searchChefVideo = (c: Chef, m: Meal) =>
  "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${c.name.replace(/\(.*\)/, "")} ${m.name.replace(/\s*\+.*$/, "").replace(/\(.*?\)/g, "")}`);

export type FoodRow = { name: string; usdaName: string; url: string; per100g: Record<string, number | null> };
export const nutrition = nutritionData as { updatedAt?: string; total?: number; foods?: FoodRow[] };
export const currency = currencyData as { updatedAt?: string; base?: string; rates?: Record<string, number>; providerUpdated?: string; attributionUrl?: string };
export const usdToInr = () => currency.rates?.INR;

export type AgentStatus = { ok?: boolean; lastRun?: string; lastSuccess?: string; summary?: string; error?: string; warnings?: string[]; durationMs?: number; envFile?: string; skipped?: boolean;
  resources?: { name: string; url: string; type: string; cost: string; note?: string }[] };
export const agentStatus = statusData as { lastRun?: string; agents?: Record<string, AgentStatus> };

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles", timeZoneName: "short" }) : "not yet";
