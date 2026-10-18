import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MEALS, SLOTS, TAG_LABEL, cuisineOf, isDiet, isIndian, mealById } from "@/lib/meals";
import { photoSrc } from "@/lib/photos";
import { allergens, goodFor, macroSplit, neighbors, pairings, storageAdvice, storeAt, storesFor } from "@/lib/recipe-info";
import { chefFeed, chefsForMeal, searchChefVideo, usdToInr } from "@/lib/data";
import { ChefAvatar } from "@/components/ChefAvatar";
import { MealPhoto } from "@/components/MealPhoto";
import { PhotoCreditLine } from "@/components/PhotoCreditLine";
import { RecipeActions } from "@/components/RecipeActions";
import { KidneyPanel } from "@/components/KidneyPanel";
import { IngredientChecklist } from "@/components/IngredientChecklist";

// Every recipe page is generated at build time; unknown ids return 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return MEALS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/menu/[id]">): Promise<Metadata> {
  const { id } = await params;
  const m = mealById(id);
  if (!m) return {};
  const description = `${m.p} g protein · ${m.kcal} kcal · ${m.time}. ${m.vit}`;
  return { title: m.name, description, openGraph: { title: m.name, description, images: [{ url: photoSrc(m.id), width: 800, height: 600 }] } };
}

const SECTIONS = [
  ["overview", "Overview"], ["nutrition", "Nutrition"], ["ingredients", "Ingredients"], ["method", "Method"],
  ["benefits", "Health benefits"], ["storage", "Storage"], ["cost", "Cost & shopping"], ["video", "Videos"], ["more", "More recipes"],
] as const;

// Reference targets for a 70 kg person on the plan (1.8 g/kg protein, ~2,900 kcal).
const REF = { protein: 126, kcal: 2900, perMealLow: 28, perMealHigh: 39 };

export default async function RecipePage({ params }: PageProps<"/menu/[id]">) {
  const { id } = await params;
  const m = mealById(id);
  if (!m) notFound();

  const c = cuisineOf(m);
  const split = macroSplit(m);
  const badges = goodFor(m);
  const allergy = allergens(m);
  const pairs = pairings(m);
  const { prev, next } = neighbors(m);
  const related = m.slot === "kidney"
    ? MEALS.filter((x) => x.slot === "kidney" && x.id !== m.id && !pairs.includes(x)).slice(0, 4)
    : MEALS.filter((x) => x.id !== m.id && !pairs.includes(x) && (isIndian(m) ? cuisineOf(x) === c : cuisineOf(x) === c || x.slot === m.slot))
    .concat(MEALS.filter((x) => x.id !== m.id && x.slot === m.slot && !pairs.includes(x)))
    .filter((x, i, a) => a.indexOf(x) === i)
    .slice(0, 4);
  const per10 = (m.usd / m.p) * 10;
  const diet = m.tags.includes("vegan") ? "Vegan — no dairy, eggs, meat or fish" : "Vegetarian — contains dairy; no eggs, meat or fish";
  const pctProtein = Math.round((m.p / REF.protein) * 100);
  const pctKcal = Math.round((m.kcal / REF.kcal) * 100);
  const mealGoal = m.p >= REF.perMealLow ? "Meets" : "Below";
  const where = storeAt(m);

  return (
    <article className="recipe" data-slot={m.slot}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">›</span> <Link href="/menu">Menu</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={`/menu#${m.slot}`}>{SLOTS[m.slot]}</Link> <span aria-hidden="true">›</span> <span aria-current="page">{m.name}</span>
      </nav>

      {/* ---------- Overview ---------- */}
      <section id="overview" className="recipe-top">
        <div className="recipe-photo">
          <MealPhoto meal={m} sizes="(max-width: 900px) 100vw, 640px" eager />
          <PhotoCreditLine id={m.id} />
        </div>
        <div className="recipe-info">
          <div className="ctop">
            <span className="slot">{SLOTS[m.slot]}</span>
            {m.tags.map((t) => <span key={t} className={`tag ${isDiet(t) ? t : "cuisine"}`}>{TAG_LABEL[t]}</span>)}
          </div>
          <h1>{m.name}</h1>
          <div className="stats">
            <div><b>{m.p} g</b><span>protein</span></div>
            <div><b>{m.kcal}</b><span>calories</span></div>
            <div><b>{m.time.split(/ [(+]/)[0]}</b><span>{m.time.includes("(") || m.time.includes("+") ? m.time.slice(m.time.split(/ [(+]/)[0].length).replace(/^ [(+] ?|\)$/g, "") : "time"}</span></div>
            <div><b>${m.usd.toFixed(2)}</b><span>₹{m.inr} in India</span></div>
          </div>
          {badges.length > 0 && (
            <ul className="badges" aria-label="Good for">
              {badges.map((b) => <li key={b.label} title={b.why}>{b.label}</li>)}
            </ul>
          )}
          <dl className="facts">
            <div><dt>Diet</dt><dd>{diet}</dd></div>
            <div><dt>Cuisine</dt><dd>{c === "global" ? "Everyday American" : TAG_LABEL[c]}</dd></div>
            <div><dt>Serves</dt><dd>1 (multiply ingredients for more)</dd></div>
            {m.life && <div><dt>Keeps</dt><dd>{m.life}</dd></div>}
            <div><dt>Contains</dt><dd>{allergy.length ? allergy.join(", ") : "None of the common allergens"}</dd></div>
          </dl>
          <RecipeActions id={m.id} name={m.name} />
        </div>
      </section>

      {/* ---------- Section tabs ---------- */}
      <nav className="section-nav" aria-label="On this page">
        {SECTIONS.map(([sid, label]) => <a key={sid} href={`#${sid}`}>{label}</a>)}
      </nav>

      <div className="recipe-grid">
        {/* ---------- Nutrition ---------- */}
        <section id="nutrition" className="panel r-span">
          <h2><span className="sec-n">1</span>Nutrition <span className="muted">per serving</span></h2>
          <div className="nutri">
            <table className="nutri-table">
              <tbody>
                <tr><th scope="row">Calories</th><td>{m.kcal} kcal</td><td className="muted">{pctKcal}% of a 2,900 kcal day</td></tr>
                <tr><th scope="row">Protein</th><td>{m.p} g</td><td className="muted">{m.rn ? "Moderate, for kidney care" : `${pctProtein}% of 126 g (70 kg × 1.8 g/kg)`}</td></tr>
                <tr><th scope="row">Carbohydrates</th><td>{m.c} g</td><td className="muted">Energy for training</td></tr>
                <tr><th scope="row">Fat</th><td>{m.f} g</td><td className="muted">Supports hormones and vitamin absorption</td></tr>
              </tbody>
            </table>
            <div className="split">
              <p className="eyebrow">Where the calories come from</p>
              <div className="split-bar" role="img" aria-label={`Protein ${split.protein}%, carbs ${split.carbs}%, fat ${split.fat}%`}>
                <i className="sp" style={{ width: split.protein + "%" }} /><i className="sc" style={{ width: split.carbs + "%" }} /><i className="sf" style={{ width: split.fat + "%" }} />
              </div>
              <ul className="legend">
                <li><i className="sp" />Protein {split.protein}%</li><li><i className="sc" />Carbs {split.carbs}%</li><li><i className="sf" />Fat {split.fat}%</li>
              </ul>
              {m.rn ? (
                <p className="goal ok"><b>Kidney care recipe:</b> low in sodium, with protein kept moderate. See the kidney numbers below.</p>
              ) : (
                <p className={`goal ${mealGoal === "Meets" ? "ok" : "low"}`}>
                  <b>{mealGoal} the per-meal protein goal</b> of {REF.perMealLow}–{REF.perMealHigh} g for a 70 kg person.
                  {mealGoal === "Below" && " Pair it with a high-protein drink or snack below."}
                </p>
              )}
            </div>
          </div>
          {m.rn && <KidneyPanel meal={m} />}
        </section>

        {/* ---------- Ingredients ---------- */}
        <section id="ingredients" className="panel">
          <h2><span className="sec-n">2</span>Ingredients <span className="muted">· 1 serving</span></h2>
          <IngredientChecklist items={m.ing} />
        </section>

        {/* ---------- Method ---------- */}
        <section id="method" className="panel">
          <h2><span className="sec-n">3</span>Method <span className="muted">· {m.time}</span></h2>
          <ol className="method">
            {m.steps.map((s, i) => <li key={s}><span className="step-num">{i + 1}</span><p>{s}</p></li>)}
          </ol>
        </section>

        {/* ---------- Health benefits ---------- */}
        <section id="benefits" className="panel">
          <h2><span className="sec-n">4</span>Health benefits</h2>
          <p><b>Key vitamins &amp; minerals:</b> {m.vit}</p>
          {badges.length > 0 && (
            <ul className="why-list">{badges.map((b) => <li key={b.label}><b>{b.label}:</b> {b.why}</li>)}</ul>
          )}
          <p className="muted small">Food supports health; it does not cure disease. Ask a doctor or dietitian about supplements or medical conditions.</p>
        </section>

        {/* ---------- Storage ---------- */}
        <section id="storage" className="panel">
          <h2><span className="sec-n">5</span>Storage{m.life && <span className="muted"> · keeps {m.life}</span>}</h2>
          <p>{storageAdvice(m)}</p>
          {m.life && (
            <ul className="store-where" aria-label="Where to keep it">
              {(["cupboard", "fridge", "freezer"] as const).map((w) => (
                <li key={w} className={w === where ? "on" : undefined}>{w === "cupboard" ? "Cupboard" : w === "fridge" ? "Fridge" : "Freezer"}</li>
              ))}
            </ul>
          )}
          <p className="muted small">Fridge at 4 °C / 40 °F or colder; freezer at −18 °C / 0 °F. Freezer times are for best quality. Label jars and boxes with the date. <Link href="/shop#pantry">Storage guide →</Link></p>
        </section>

        {/* ---------- Cost & shopping ---------- */}
        <section id="cost" className="panel r-span">
          <h2><span className="sec-n">6</span>Cost &amp; shopping</h2>
          <div className="cost-row">
            <div><b>${m.usd.toFixed(2)}</b><span>per serving (US)</span></div>
            <div><b>₹{m.inr}</b><span>per serving (India)</span></div>
            <div><b>${per10.toFixed(2)}</b><span>per 10 g protein</span></div>
          </div>
          {usdToInr() && <p className="muted small">At today’s rate ($1 = ₹{usdToInr()!.toFixed(2)}), the US price is about ₹{Math.round(m.usd * usdToInr()!)}.</p>}
          <h3>Where to buy in the Bay Area</h3>
          <ul>{storesFor(m).map((s) => <li key={s}>{s}</li>)}</ul>
          <p className="muted small">October 2026 estimates. US prices from Bay Area stores; India prices are typical city prices.</p>
        </section>

        {/* ---------- Videos ---------- */}
        <section id="video" className="panel r-span">
          <h2><span className="sec-n">7</span>Watch &amp; cook along</h2>
          <div className="video-links">
            {chefsForMeal(m).slice(0, 6).map((ch) => (
              <div key={ch.id} className="video-link">
                <ChefAvatar chef={ch} src={chefFeed(ch.id).avatar} size={40} />
                <span>
                  <a href={searchChefVideo(ch, m)} target="_blank" rel="noopener noreferrer"><b>{ch.name}</b></a>
                  <small><a href={searchChefVideo(ch, m)} target="_blank" rel="noopener noreferrer">▶ Their video for this dish</a> · <Link href={`/chefs/${ch.id}`}>All their recipes</Link></small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ---------- More recipes ---------- */}
      <section id="more" className="block">
        {pairs.length > 0 && (
          <>
            <div className="shead"><div><p className="eyebrow">Complete the day</p><h2>Pairs well with</h2></div></div>
            <div className="tiles">
              {pairs.map((r) => <RecipeTile key={r.id} id={r.id} />)}
            </div>
          </>
        )}
        {related.length > 0 && (
          <>
            <div className="shead" style={{ marginTop: 28 }}><div><p className="eyebrow">Similar</p><h2>More like this</h2></div><Link href="/menu">All recipes →</Link></div>
            <div className="tiles">{related.map((r) => <RecipeTile key={r.id} id={r.id} />)}</div>
          </>
        )}
        <nav className="prev-next" aria-label="Previous and next recipe">
          <Link href={`/menu/${prev.id}`} className="panel"><small>← Previous</small><b>{prev.name}</b></Link>
          <Link href={`/menu/${next.id}`} className="panel nx"><small>Next →</small><b>{next.name}</b></Link>
        </nav>
      </section>
    </article>
  );
}

function RecipeTile({ id }: { id: string }) {
  const r = mealById(id)!;
  return (
    <Link href={`/menu/${r.id}`} className="panel tile photo-tile">
      <MealPhoto meal={r} sizes="(max-width: 640px) 100vw, 300px" />
      <span className="eyebrow">{SLOTS[r.slot]}</span>
      <b>{r.name}</b>
      <span>{r.p} g protein · {r.kcal} kcal · ${r.usd.toFixed(2)}</span>
    </Link>
  );
}
