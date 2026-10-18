import type { MetadataRoute } from "next";
import { MEALS } from "@/lib/meals";
import { PAGES, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES.map((p) => ({ url: SITE_URL + p.href, changeFrequency: "monthly" as const, priority: p.href === "/" ? 1 : 0.8 })),
    ...MEALS.map((m) => ({ url: `${SITE_URL}/menu/${m.id}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
