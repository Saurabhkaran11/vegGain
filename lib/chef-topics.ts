// Sorts chef videos and VegGain recipes into topics, so the Chefs page can show, say, every chef's
// paneer videos side by side. Titles are matched in English and Hindi (Devanagari); one item can sit in several topics.
import type { Slot } from "./meal-meta";

export const TOPICS = [
  { id: "breakfast", label: "Breakfast", re: /breakfast|nashta|nasta|\bpoha|upma|parath?a|parantha|thepla|chill?a\b|cheela|dosa|idli|uttapam|appam|pancake|toast|sandwich|\boats?\b|porridge|granola|नाश्ता|पोहा|उपमा|पराठा|चीला|डोसा|इडली/i },
  { id: "dal", label: "Dal & curries", re: /\bdh?aa?l\b|dal\s|curry|sabz?i|sabji|subzi|rajma|chh?ole|chana masala|kadhi|korma|kofta|gravy|stew|sambar|rasam|makhani|\bpalak|aloo gobi|aloo matar|bhaji\b|undhiyu|usal|misal|jalfrezi|makhanwala|salan|bharta|baingan|bhindi|\baloo\b|gobh?i|matar|mix veg|kurma|thali|दाल|सब्ज़?ी|छोले|राजमा|कढ़ी|कोफ्ता|सांभर/i },
  { id: "paneer", label: "Paneer, tofu & soya", re: /paneer|tofu|soya|soy chunk|tempeh|chaap|seitan|पनीर|सोया/i },
  { id: "rice", label: "Rice, khichdi & noodles", re: /\brice|biryani|pulao|pulav|khichdi|khichri|chow ?mein|hakka|noodle|pasta|spaghetti|linguine|penne|lasagn|risotto|ramen|udon|soba|bibimbap|japchae|pad thai|lo mein|चावल|खिचड़ी|पुलाव|बिरयानी|नूडल्स|पास्ता/i },
  { id: "breads", label: "Breads & rotis", re: /\broti|naan|kulcha|\bpuri\b|poori|bhatura|bhakri|tortilla|bread|focaccia|pizza|\bbao\b|\bbuns?\b|\bpav\b|flatbread|rotli|रोटी|नान|पूरी|कुलचा|भटूरे/i },
  { id: "snacks", label: "Snacks & street food", re: /snack|chaat|pakora|pakoda|bhajiya|samosa|kachori|\bvada|\bwada|tikki|cutlet|bhel|pav bhaji|dhokla|khandvi|street|fritter|dumpling|momo|spring roll|taco|quesadilla|nachos|fries|chips|namkeen|mathri|chakli|hummus|falafel|kebab|kabab|kach(?:o|au)ri|starter|patt(?:y|ies)|burger|chilli potato|manchurian|चाट|समोसा|पकोड़े|पकौड़े|कचौरी|ढोकला|वड़ा|टिक्की/i },
  { id: "sweets", label: "Sweets & desserts", re: /sweet(?! potato)|dessert|halwa|halva|lad+o+o?|laddu|kheer|payasam|barfi|burfi|gulab jamun|jalebi|rasmalai|\bpeda|modak|mithai|cake|cookie|brownie|ice cream|kulfi|pudding|paleta|churro|tiramisu|panna cotta|mochi|chikki|malpua|shrikhand|basundi|rabri|kalakand|gujiya|ghevar|mysore pak|हलवा|लड्डू|खीर|बर्फी|मिठाई|केक/i },
  { id: "drinks", label: "Drinks & shakes", re: /drink|lassi|\bchai\b|\btea\b|coffee|latte|smoothie|shake|juice|sharbat|sherbet|aguas?\b|horchata|lemonade|thandai|kadha|mocktail|buttermilk|chaas|लस्सी|चाय|शरबत|ठंडाई/i },
  { id: "soups", label: "Soups & salads", re: /soup|salad|broth|shorba|gazpacho|minestrone|\bmiso\b|सूप|सलाद/i },
  { id: "chutney", label: "Chutneys, pickles & kimchi", re: /chutney|thecha|pickle|achaa?r|kimchi|kasundi|raita|relish|\bdips?\b|sauce|chil+i oil|paste|अचार|चटनी/i },
  { id: "fitness", label: "Protein & fitness", re: /protein|muscle|\bgym\b|workout|fitness|\bbulk|weight (gain|loss)|\bdiet\b|calorie|macro|meal prep|high-protein|nutrition|what i eat|प्रोटीन/i },
  { id: "festival", label: "Festival & fasting", re: /navratri|\bvrat\b|fasting|upvas|diwali|holi\b|ganesh|ganpati|janmashtami|ekadashi|prasad|bhog|festival|thanksgiving|christmas|नवरात्रि|व्रत|उपवास|प्रसाद|भोग|दिवाली|होली/i },
] as const;
export type TopicId = (typeof TOPICS)[number]["id"] | "other";
export const TOPIC_LABEL: Record<TopicId, string> = { ...Object.fromEntries(TOPICS.map((t) => [t.id, t.label])), other: "Other" } as Record<TopicId, string>;

/** Topics for a video title. */
export function videoTopics(title: string): TopicId[] {
  const hit = TOPICS.filter((t) => t.re.test(title)).map((t) => t.id);
  return hit.length ? hit : ["other"];
}

/** Topics for a VegGain recipe: its name, plus its meal slot. */
export function recipeTopics(name: string, slot: Slot): TopicId[] {
  const set = new Set<TopicId>(TOPICS.filter((t) => t.re.test(name)).map((t) => t.id));
  if (slot === "breakfast") set.add("breakfast");
  if (slot === "drinks") set.add("drinks");
  if (slot === "evening") set.add("snacks");
  if (slot === "fruit") set.add("sweets");
  return set.size ? [...set] : ["other"];
}

/** "35K" → 35000, "1.2M" → 1200000 (YouTube's short view counts). */
export function viewCount(v?: string): number {
  const m = /([\d.,]+)\s*([KMB])?/i.exec(v ?? "");
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return n * ({ K: 1e3, M: 1e6, B: 1e9 }[(m[2] ?? "").toUpperCase() as "K" | "M" | "B"] ?? 1);
}

/** "2d ago" → 48 (hours since upload); unknown dates sort last. */
export function ageHours(p?: string): number {
  const m = /(\d+)\s*(second|minute|hour|day|week|month|year|mo|[smhdwy])/i.exec(p ?? "");
  if (!m) {
    const d = Date.parse(p ?? "");
    return Number.isFinite(d) ? (Date.now() - d) / 36e5 : 1e9;
  }
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  const h = u.startsWith("mo") ? 730 : u.startsWith("y") ? 8760 : u.startsWith("w") ? 168 : u.startsWith("d") ? 24 : u.startsWith("h") ? 1 : u.startsWith("mi") || u === "m" ? 1 / 60 : 1 / 3600;
  return n * h;
}
