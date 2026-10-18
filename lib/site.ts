export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veggain8.vercel.app";

/** Top-level pages, in navigation order. */
export const PAGES = [
  { href: "/", label: "Home", blurb: "Targets and how the plan works" },
  { href: "/menu", label: "Menu", blurb: "Recipes, drinks and fruit bowls with cost and video" },
  { href: "/plan", label: "Plan", blurb: "Protein & calorie calculator, auto 7-day plan with grocery list" },
  { href: "/health", label: "Health", blurb: "Brain focus, skin and kidney care" },
  { href: "/shop", label: "Shop", blurb: "Grocery list, long-life pantry, Bay Area stores and seasonal fruit" },
  { href: "/chefs", label: "Chefs", blurb: "20 chefs, their latest vegetarian videos and matching recipes" },
  { href: "/learn", label: "Learn", blurb: "YouTube earning, business ideas and deploy" },
  { href: "/agents", label: "Agents", blurb: "Live data agents, their settings and resources" },
] as const;
