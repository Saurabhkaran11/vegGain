// Netflix-style home: a featured "billboard" dish, personal rows, then sliding rows by meal, goal and cuisine.
import Image from "next/image";
import Link from "next/link";
import { CUISINES, MEALS, SLOTS, cuisineOf, isIndian, type Meal } from "@/lib/meals";
import { photoSrc } from "@/lib/photo-src";
import { chefSummaries } from "@/lib/chef-data";
import { Rail } from "@/components/Rail";
import { NfCard, type CardMeal } from "@/components/NfCard";
import { ForYou } from "@/components/ForYou";
import { AddDayButton } from "@/components/AddDayButton";
import { ChefAvatar } from "@/components/ChefAvatar";

const minutes = (t: string) => parseInt(t, 10) || 99;
const tagOf = (m: Meal) => (m.slot === "kidney" ? "Kidney care" : m.tags.includes("vegan") ? "Vegan" : undefined);
const card = (m: Meal): CardMeal => ({ id: m.id, name: m.name, p: m.p, kcal: m.kcal, time: m.time, tag: tagOf(m) });
const byProtein = (a: Meal, b: Meal) => b.p - a.p;
const MAINS = MEALS.filter((m) => ["breakfast", "lunch", "evening", "dinner"].includes(m.slot));

// The featured dish changes every day (picked when the site is built) from the most protein-rich mains.
function featured() {
  const pool = [...MAINS].sort(byProtein).slice(0, 24);
  return pool[Math.floor(Date.now() / 864e5) % pool.length];
}

export function Billboard() {
  const m = featured();
  return (
    <section className="billboard" aria-labelledby="bb-title">
      <Image src={photoSrc(m.id)} alt="" fill priority sizes="(max-width: 1240px) 100vw, 1240px" className="bb-img" />
      <div className="bb-shade" />
      <div className="bb-body">
        <p className="bb-kicker">Today’s pick · {SLOTS[m.slot]} · {CUISINES[cuisineOf(m)]}</p>
        <h1 id="bb-title">{m.name}</h1>
        <p className="bb-facts">
          <span className="bb-match">{m.p} g protein</span>
          <span>{m.kcal} kcal</span><span>{m.time.replace(/\s*\(.*\)/, "")}</span><span>${m.usd.toFixed(2)}</span>
          {m.tags.includes("vegan") && <span className="bb-pill">Vegan</span>}
        </p>
        <p className="bb-desc">{m.vit}</p>
        <div className="bb-actions">
          <Link className="btn bb-play" href={`/menu/${m.id}`}>▶ Cook it</Link>
          <AddDayButton id={m.id} className="btn bb-ghost" />
          <Link className="btn bb-ghost" href="/plan#targets">My targets &amp; 7-day plan</Link>
        </div>
      </div>
    </section>
  );
}

type Row = { id: string; title: string; sub?: string; href: string; list: Meal[]; top?: boolean };

export function BrowseRows() {
  const all = MEALS;
  const slot = (s: Meal["slot"]) => all.filter((m) => m.slot === s).sort(byProtein);
  const cuisine = (k: string) => all.filter((m) => cuisineOf(m) === k).sort(byProtein);
  const rows: Row[] = [
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
          {r.list.slice(0, r.top ? 10 : 16).map((m, j) => <NfCard key={m.id} m={card(m)} rank={r.top ? j + 1 : undefined} priority={i === 0 && j < 3} />)}
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
