// Server-side shaping of chef data for the Chefs directory and the Compare page (plain, serialisable props).
import { CHEFS, chefFeed, channelUrl, recipesForChef } from "./data";
import { CUISINES, MEALS, type Slot } from "./meals";

export type ChefVideo = { id: string; title: string; url: string; views: string; published: string };
export type ChefSummary = {
  id: string; name: string; group: "indian" | "world" | "vegan"; label: string; bio: string; avatar: string; channel: string;
  videos: ChefVideo[]; recipes: string[];
};
export type RecipeLite = { name: string; slot: Slot; p: number; kcal: number };

const GROUP_LABEL = { indian: "Indian", world: "World", vegan: "Plant-based fitness" } as const;

export function chefSummaries(): { chefs: ChefSummary[]; recipes: Record<string, RecipeLite> } {
  const chefs: ChefSummary[] = CHEFS.map((c) => {
    const feed = chefFeed(c.id);
    const cuisines = c.cuisines.includes("global") ? "Vegan & fitness" : c.cuisines.slice(0, 3).map((k) => CUISINES[k as keyof typeof CUISINES]).join(" · ");
    return {
      id: c.id, name: c.name, group: c.group, bio: c.bio, avatar: feed.avatar ?? "", channel: channelUrl(c),
      label: c.group === "world" ? cuisines : `${GROUP_LABEL[c.group]} · ${cuisines}`,
      videos: (feed.videos ?? []).map((v) => ({ id: v.id, title: v.title, url: v.url, views: v.views ?? "", published: v.published ?? "" })),
      recipes: recipesForChef(c).map((m) => m.id),
    };
  });
  const used = new Set(chefs.flatMap((c) => c.recipes));
  const recipes = Object.fromEntries(MEALS.filter((m) => used.has(m.id)).map((m) => [m.id, { name: m.name, slot: m.slot, p: m.p, kcal: m.kcal }]));
  return { chefs, recipes };
}
