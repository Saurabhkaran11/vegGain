// Vegetarian check for chef video titles. The word lists live in veg-filter.json so the chefs agent
// (which fetches the videos) and the site (which shows them) always apply the same rules.
import lists from "./veg-filter.json";

const words = (a: string[]) => new RegExp(`\\b(?:${a.join("|")})\\b`, "i");
const NON_VEG = words(lists.nonVeg);
const WEAK = words(lists.ambiguousWeak);
const STRONG = words(lists.ambiguousStrong);
const MARKER = words(lists.vegMarkers);
const STRONG_MARKER = words(lists.strongMarkers);

/** True when a title reads as a vegetarian dish (no meat, fish or eggs). */
export function isVegTitle(title: string): boolean {
  if (NON_VEG.test(title)) return false;
  if (STRONG.test(title) && !STRONG_MARKER.test(title)) return false;
  if (WEAK.test(title) && !MARKER.test(title)) return false;
  return true;
}
