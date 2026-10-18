// Server components for the home page.
import Link from "next/link";
import { CUISINES, INDIAN_REGIONS, MEALS, SAMPLE_INDIAN_DAY, SLOTS, WORLD_CUISINES, cuisineOf, isIndian } from "@/lib/meals";
import { MealPhoto } from "@/components/MealPhoto";
import { PAGES } from "@/lib/site";

const mains = MEALS.filter((m) => ["breakfast", "lunch", "evening", "dinner"].includes(m.slot));
const drinks = MEALS.filter((m) => m.slot === "drinks").length;
const fruit = MEALS.filter((m) => m.slot === "fruit").length;
const skin = MEALS.filter((m) => m.slot === "skin").length;
const pantry = MEALS.filter((m) => m.slot === "pantry").length;
const kidney = MEALS.filter((m) => m.slot === "kidney").length;
const indianCount = MEALS.filter(isIndian).length;

export function Hero() {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">Vegetarian (no eggs) · Vegan · {INDIAN_REGIONS.length - 1} Indian regions + {WORLD_CUISINES.length} world cuisines</p>
        <h1>
          Eat to grow: <em>{mains.length} high-protein meals</em>, {drinks} drinks, {fruit} fruit bowls, {skin} skin-glow picks, {kidney} kidney-care picks and {pantry} long-life foods for 8 weeks of muscle, weight and focus.
        </h1>
        <p>
          {indianCount} recipes come from Punjabi, Gujarati, Marathi, Rajasthani, South Indian and Bihari kitchens. Most take 30 minutes or less of active cooking, and every ingredient is easy to find in Bay Area stores.
          Pair the food with lifting 3–4 times a week and 7–9 hours of sleep.
        </p>
        <div className="actions">
          <Link className="btn add" href="/menu">Browse the menu</Link>
          <Link className="btn ghost" href="/plan#targets">Get my targets &amp; 7-day plan</Link>
        </div>
      </div>
      <div className="targets" aria-label="Daily targets">
        <div className="tgt"><b>1.6–2.2 g</b><span>protein per kg body weight per day</span></div>
        <div className="tgt"><b>+10–20%</b><span>calories above maintenance</span></div>
        <div className="tgt"><b>0.4–0.55 g/kg</b><span>protein per meal, 4 meals</span></div>
        <div className="tgt"><b>0.25–0.5%</b><span>body weight gained per week</span></div>
      </div>
    </section>
  );
}

const STEPS = [
  { t: "Pick your meals", d: "Choose one breakfast, lunch, evening snack and dinner from the menu. Add a drink or fruit bowl if you need more calories." },
  { t: "Check your day", d: "The day builder adds up protein, calories and cost against targets from your body weight." },
  { t: "Follow the 8 weeks", d: "Weigh in each morning, adjust calories every two weeks, and train with progressive overload." },
];

export function HowItWorks() {
  return (
    <section className="block" aria-labelledby="how">
      <div className="shead"><div><p className="eyebrow">How it works</p><h2 id="how">Three steps</h2></div></div>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s.t} className="panel step"><span className="step-n">{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p></li>
        ))}
      </ol>
    </section>
  );
}

export function SampleDayPreview() {
  const day = SAMPLE_INDIAN_DAY.map((id) => MEALS.find((m) => m.id === id)!).filter(Boolean);
  const p = day.reduce((a, m) => a + m.p, 0);
  const k = day.reduce((a, m) => a + m.kcal, 0);
  const usd = day.reduce((a, m) => a + m.usd, 0);
  return (
    <section className="block" aria-labelledby="sample">
      <div className="shead">
        <div><p className="eyebrow">Example</p><h2 id="sample">A sample Indian vegetarian day</h2></div>
        <p>{p} g protein · {k.toLocaleString()} kcal · about ${usd.toFixed(2)}. Built for roughly 70–80 kg; adjust portions to your weight.</p>
      </div>
      <div className="panel">
        <ul className="day-list">
          {day.map((m) => (
            <li key={m.id}><span className="eyebrow">{SLOTS[m.slot]}</span><b>{m.name}</b><span className="muted">{m.p} g protein · {m.kcal} kcal</span></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ExploreTiles() {
  return (
    <section className="block" aria-labelledby="explore">
      <div className="shead"><div><p className="eyebrow">Explore</p><h2 id="explore">Everything in the plan</h2></div></div>
      <div className="tiles">
        {PAGES.slice(1).map((p) => (
          <Link key={p.href} href={p.href} className="panel tile">
            <b>{p.label}</b><span>{p.blurb}</span><small>Open →</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

// One representative dish per cuisine, used as the tile photo.
const COVER: Record<string, string> = {
  punjabi: "pb4", gujarati: "gj1", marathi: "mh1", rajasthani: "rj1", southindian: "si1", bihari: "bh1",
  korean: "k4", chinese: "c4", japanese: "jp1", thai: "th1", mexican: "mx1", mediterranean: "md1", italian: "it1",
};

export function CuisineBrowser() {
  const tiles = Object.entries(COVER).map(([k, id]) => ({
    k, label: CUISINES[k as keyof typeof CUISINES], meal: MEALS.find((m) => m.id === id)!, n: MEALS.filter((m) => cuisineOf(m) === k).length,
  }));
  const skinMeal = MEALS.find((m) => m.id === "sk2")!;
  const pantryMeal = MEALS.find((m) => m.id === "pt4")!;
  const kidneyMeal = MEALS.find((m) => m.id === "kd4")!;
  return (
    <section className="block" aria-labelledby="cuisines">
      <div className="shead">
        <div><p className="eyebrow">Browse by cuisine</p><h2 id="cuisines">Indian regions and world kitchens</h2></div>
        <Link href="/menu#indian-all">All Indian recipes →</Link>
      </div>
      <div className="cuisine-tiles">
        {tiles.map((t) => (
          <Link key={t.k} href={`/menu#${t.k}`} className="cuisine-tile">
            <MealPhoto meal={t.meal} sizes="(max-width: 640px) 50vw, 220px" />
            <span><b>{t.label}</b><small>{t.n} {t.n === 1 ? "recipe" : "recipes"}</small></span>
          </Link>
        ))}
        <Link href="/menu#pantry" className="cuisine-tile">
          <MealPhoto meal={pantryMeal} sizes="(max-width: 640px) 50vw, 220px" />
          <span><b>{SLOTS.pantry}</b><small>{pantry} foods &amp; drinks</small></span>
        </Link>
        <Link href="/menu#kidney" className="cuisine-tile">
          <MealPhoto meal={kidneyMeal} sizes="(max-width: 640px) 50vw, 220px" />
          <span><b>{SLOTS.kidney}</b><small>{kidney} low-salt foods &amp; drinks</small></span>
        </Link>
        <Link href="/menu#skin" className="cuisine-tile">
          <MealPhoto meal={skinMeal} sizes="(max-width: 640px) 50vw, 220px" />
          <span><b>{SLOTS.skin}</b><small>{skin} foods &amp; drinks</small></span>
        </Link>
      </div>
    </section>
  );
}
