// Netflix-style home: a featured "billboard" dish, personal rows, then sliding rows by meal, goal and cuisine.
import Link from "next/link";
import { CUISINES, MEALS, PRIORITY_CUISINE, SLOTS, cuisineOf, isIndian, type Meal } from "@/lib/meals";
import { chefSummaries } from "@/lib/chef-data";
import { Rail } from "@/components/Rail";
import { NfCard, type CardMeal } from "@/components/NfCard";
import { ForYou } from "@/components/ForYou";
import { HeroCarousel, type Slide } from "@/components/HeroCarousel";
import { ChefAvatar } from "@/components/ChefAvatar";

const minutes = (t: string) => parseInt(t, 10) || 99;
const tagOf = (m: Meal) => (m.slot === "kidney" ? "Kidney care" : m.tags.includes("vegan") ? "Vegan" : undefined);
const card = (m: Meal): CardMeal => ({ id: m.id, name: m.name, p: m.p, kcal: m.kcal, time: m.time, tag: tagOf(m) });
const byProtein = (a: Meal, b: Meal) => b.p - a.p;
const MAINS = MEALS.filter((m) => ["breakfast", "lunch", "evening", "dinner"].includes(m.slot));

// Featured dishes for the sliding hero: the most protein-rich mains, starting from a different one each day.
function featured(count = 6) {
  // Rajasthani first: the opening slide and every other slide come from Rajasthani mains.
  const raj = MAINS.filter((m) => cuisineOf(m) === PRIORITY_CUISINE).sort(byProtein);
  const day = Math.floor(Date.now() / 864e5);
  const rajPicks = Array.from({ length: Math.ceil(count / 2) }, (_, k) => raj[(day + k * 3) % raj.length]);
  const pool = [...MAINS].filter((m) => cuisineOf(m) !== PRIORITY_CUISINE).sort(byProtein).slice(0, 30);
  const start = day % pool.length;
  // Spread picks across the pool so the slides differ (meal type and cuisine).
  const out: Meal[] = [];
  for (let k = 0; out.length < count && k < pool.length; k++) {
    const m = pool[(start + k * 5) % pool.length];
    if (!out.some((o) => o.id === m.id || (o.slot === m.slot && cuisineOf(o) === cuisineOf(m)))) out.push(m);
  }
  const mixed: Meal[] = [];
  for (let k = 0; mixed.length < count; k++) {
    const r = rajPicks[k], o = out[k];
    if (r && !mixed.includes(r)) mixed.push(r);
    if (o && mixed.length < count) mixed.push(o);
    if (!r && !o) break;
  }
  return mixed;
}

export function Billboard() {
  const slides: Slide[] = featured().map((m, k) => ({
    id: m.id, name: m.name, p: m.p, kcal: m.kcal, usd: m.usd, vegan: m.tags.includes("vegan"),
    time: m.time.replace(/\s*\(.*\)/, ""), desc: m.vit,
    kicker: `${k === 0 ? "Today’s pick" : "Featured"} · ${SLOTS[m.slot]} · ${CUISINES[cuisineOf(m)]}`,
  }));
  return <HeroCarousel slides={slides} />;
}

type Row = { id: string; title: string; sub?: string; href: string; list: Meal[]; top?: boolean };

export function BrowseRows() {
  const all = MEALS;
  const slot = (s: Meal["slot"]) => all.filter((m) => m.slot === s).sort(byProtein);
  const cuisine = (k: string) => all.filter((m) => cuisineOf(m) === k).sort(byProtein);
  const rows: Row[] = [
    { id: "r-raj", title: "Rajasthani kitchen", sub: "Marwar & Mewar favourites: dal baati, gatte, ker sangri, bajra rotis", href: `/menu#${PRIORITY_CUISINE}`, list: all.filter((m) => cuisineOf(m) === PRIORITY_CUISINE && ["breakfast", "lunch", "evening", "dinner"].includes(m.slot)).sort(byProtein) },
    { id: "r-raj2", title: "Rajasthani drinks & make-ahead", href: `/menu#${PRIORITY_CUISINE}`, list: all.filter((m) => cuisineOf(m) === PRIORITY_CUISINE && !["breakfast", "lunch", "evening", "dinner"].includes(m.slot)) },
    { id: "r-top", title: "Top 10 for protein", sub: "Highest protein per serving", href: "/menu", list: [...MAINS].sort(byProtein).slice(0, 10), top: true },
    { id: "r-break", title: SLOTS.breakfast, sub: "7–9 am", href: "/menu#breakfast", list: slot("breakfast") },
    { id: "r-lunch", title: SLOTS.lunch, href: "/menu#lunch", list: slot("lunch") },
    { id: "r-quick", title: "Ready in 15 minutes or less", href: "/menu", list: MAINS.filter((m) => minutes(m.time) <= 15).sort(byProtein) },
    { id: "r-even", title: SLOTS.evening, sub: "Pre-workout", href: "/menu#evening", list: slot("evening") },
    { id: "r-dinner", title: SLOTS.dinner, href: "/menu#dinner", list: slot("dinner") },
    { id: "r-budget", title: "Under $2 a serving", sub: "Most protein per dollar", href: "/menu", list: MAINS.filter((m) => m.usd < 2).sort((a, b) => b.p / b.usd - a.p / a.usd) },
    { id: "r-vegan", title: "Vegan power", sub: "No dairy, no eggs", href: "/menu", list: MAINS.filter((m) => m.tags.includes("vegan")).sort(byProtein) },
    { id: "r-shakes", title: "Shakes & drinks", href: "/menu#drinks", list: slot("drinks") },
    { id: "r-indian", title: "Indian regional favourites", href: "/menu#indian-all", list: MAINS.filter(isIndian).sort(byProtein) },
    ...(["punjabi", "southindian", "gujarati", "marathi"] as const).map((k) => ({ id: `r-${k}`, title: CUISINES[k], href: `/menu#${k}`, list: cuisine(k) })),
    { id: "r-world", title: "World kitchens", sub: "Korean, Chinese, Japanese, Thai, Mexican, Mediterranean, Italian", href: "/menu", list: MAINS.filter((m) => !isIndian(m) && cuisineOf(m) !== "global").sort(byProtein) },
    { id: "r-fruit", title: SLOTS.fruit, href: "/menu#fruit", list: slot("fruit") },
    { id: "r-skin", title: SLOTS.skin, href: "/menu#skin", list: slot("skin") },
    { id: "r-pantry", title: SLOTS.pantry, sub: "Batch-cook and store", href: "/menu#pantry", list: slot("pantry") },
    { id: "r-kidney", title: SLOTS.kidney, sub: "Low salt, checked against NKF targets", href: "/menu#kidney", list: slot("kidney") },
  ];
  const lite = Object.fromEntries(all.map((m) => [m.id, card(m)]));
  const { chefs } = chefSummaries();

  return (
    <div className="browse">
      <ForYou meals={lite} />
      {rows.filter((r) => r.list.length >= 3).map((r, i) => (
        <Rail key={r.id} id={r.id} title={r.title} sub={r.sub} href={r.href} top={r.top}>
          {r.list.slice(0, r.top ? 10 : r.id.startsWith("r-raj") ? 40 : 16).map((m, j) => <NfCard key={m.id} m={card(m)} rank={r.top ? j + 1 : undefined} priority={i === 0 && j < 3} />)}
        </Rail>
      ))}
      <Rail id="r-chefs" title="Cook along with chefs" sub={`${chefs.length} YouTube chefs`} href="/chefs">
        {chefs.map((c) => (
          <div role="listitem" key={c.id} className="nf-chef">
            <Link href={`/chefs/${c.id}`}>
              <ChefAvatar chef={c} src={c.avatar} size={96} />
              <b>{c.name.replace(/\s*\(.*\)/, "")}</b>
              <small>{c.videos.length} new videos</small>
            </Link>
          </div>
        ))}
      </Rail>
    </div>
  );
}
