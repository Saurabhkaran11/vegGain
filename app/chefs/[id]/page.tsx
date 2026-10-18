import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHEFS, chefById, chefFeed, chefsUpdatedAt, channelUrl, fmtDate, recipesForChef, searchChefVideo } from "@/lib/data";
import { CUISINES, SLOTS, SLOT_ORDER, cuisineOf, type Meal } from "@/lib/meals";
import { ChefAvatar } from "@/components/ChefAvatar";
import { ChefVideos } from "@/components/ChefVideos";
import { MealPhoto } from "@/components/MealPhoto";
import { CompareToggle, CompareTray } from "@/components/ChefCompareState";

export const dynamicParams = false;
export function generateStaticParams() {
  return CHEFS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/chefs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = chefById(id);
  return c ? { title: c.name, description: `${c.name}: latest vegetarian videos by topic and VegGain recipes to cook along. ${c.bio}` } : {};
}

export default async function ChefPage({ params }: PageProps<"/chefs/[id]">) {
  const { id } = await params;
  const c = chefById(id);
  if (!c) notFound();
  const feed = chefFeed(c.id);
  const videos = feed.videos ?? [];
  const recipes = recipesForChef(c);
  const plain = c.name.replace(/\(.*\)/, "").trim();
  const cuisineLabel = c.cuisines.includes("global") ? "Vegan & fitness" : c.cuisines.map((k) => CUISINES[k as keyof typeof CUISINES]).join(" · ");
  // Recipes grouped by meal, in menu order; protein-richest first inside each group.
  const bySlot = SLOT_ORDER.map((s) => [s, recipes.filter((m) => m.slot === s).sort((a, b) => b.p - a.p)] as const).filter(([, list]) => list.length);
  // Chefs who share a cuisine (or the same group) — handy for comparing.
  const related = CHEFS.filter((o) => o.id !== c.id && (o.cuisines.some((k) => c.cuisines.includes(k)) || o.group === c.group)).slice(0, 6);

  return (
    <article className="chef-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">›</span> <Link href="/chefs">Chefs</Link> <span aria-hidden="true">›</span> <span aria-current="page">{c.name}</span>
      </nav>
      <div className="chef-hero panel">
        <ChefAvatar chef={c} src={feed.avatar} size={96} />
        <div>
          <p className="eyebrow">{cuisineLabel}</p>
          <h1>{c.name}</h1>
          <p>{c.bio}</p>
          <div className="chef-stats">
            <a href="#latest"><b>{videos.length}</b> new videos</a>
            <a href="#recipes"><b>{recipes.length}</b> VegGain recipes</a>
            <a href="#recipes"><b>{bySlot.length}</b> meal types</a>
          </div>
          <div className="actions">
            <a className="btn yt" href={channelUrl(c)} target="_blank" rel="noopener noreferrer">▶ {c.handle ? "Open YouTube channel" : "Find on YouTube"}</a>
            <CompareToggle id={c.id} name={c.name} big />
          </div>
        </div>
      </div>

      <nav className="chef-tabs" aria-label="On this page">
        <a href="#latest">Videos <small>{videos.length}</small></a>
        <a href="#recipes">Recipes <small>{recipes.length}</small></a>
        {related.length > 0 && <a href="#related-s">Similar chefs <small>{related.length}</small></a>}
      </nav>

      <section className="block" aria-labelledby="latest-h" id="latest">
        <div className="shead">
          <div><p className="eyebrow">Fetched from YouTube · {fmtDate(chefsUpdatedAt)}</p><h2 id="latest-h">Latest vegetarian videos</h2></div>
          {videos.length > 0 && <span className="muted">{videos.length} videos · meat, fish and egg dishes filtered out</span>}
        </div>
        {videos.length === 0 ? (
          <div className="panel empty-feed">
            <p>No vegetarian videos were found in the latest fetch. They refresh every time the app starts.</p>
            <a className="btn yt" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(plain + " vegetarian recipe")}`} target="_blank" rel="noopener noreferrer">▶ Search {plain}’s vegetarian recipes</a>
          </div>
        ) : (
          <ChefVideos videos={videos} />
        )}
      </section>

      <section id="recipes" className="block" aria-labelledby="ours">
        <div className="shead">
          <div><p className="eyebrow">VegGain recipes in {plain}’s cuisine</p><h2 id="ours">Cook along with {plain}</h2></div>
          <span className="muted">{recipes.length} recipes</span>
        </div>
        <nav className="cr-jump" aria-label="Meal types">
          {bySlot.map(([s, list]) => <a key={s} className="chip" href={`#r-${s}`}>{SLOTS[s]} <small>{list.length}</small></a>)}
        </nav>
        {bySlot.map(([s, list]) => (
          <div key={s} className="cr-group" id={`r-${s}`}>
            <h3>{SLOTS[s]} <span className="muted">{list.length}</span></h3>
            <ul className="chef-recipes">
              {list.map((m: Meal) => (
                <li key={m.id} className="panel">
                  <Link href={`/menu/${m.id}`} className="cr-photo"><MealPhoto meal={m} sizes="120px" /></Link>
                  <div className="cr-body">
                    <span className="eyebrow">{CUISINES[cuisineOf(m)]}</span>
                    <Link href={`/menu/${m.id}`} className="cr-name">{m.name}</Link>
                    <small>{m.p} g protein · {m.kcal} kcal · {m.time}</small>
                  </div>
                  <div className="cr-actions">
                    <Link className="btn add" href={`/menu/${m.id}`}>Our recipe</Link>
                    <a className="btn ghost" href={searchChefVideo(c, m)} target="_blank" rel="noopener noreferrer">▶ Watch on {plain}</a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {related.length > 0 && (
        <section className="block" aria-labelledby="related" id="related-s">
          <div className="shead"><div><p className="eyebrow">Compare</p><h2 id="related">Chefs who cook similar food</h2></div></div>
          <div className="chef-grid">
            {related.map((o) => {
              const f = chefFeed(o.id);
              const latest = f.videos?.[0];
              return (
                <article key={o.id} className="panel chef-card">
                  <Link href={`/chefs/${o.id}`} className="chef-head">
                    <ChefAvatar chef={o} src={f.avatar} />
                    <div><b>{o.name}</b><small>{o.cuisines.includes("global") ? "Vegan & fitness" : o.cuisines.slice(0, 3).map((k) => CUISINES[k as keyof typeof CUISINES]).join(" · ")}</small></div>
                  </Link>
                  {latest && <p className="latest"><span className="eyebrow">Latest</span> {latest.title}</p>}
                  <div className="chef-counts"><span><b>{f.videos?.length ?? 0}</b> new videos</span><span><b>{recipesForChef(o).length}</b> VegGain recipes</span></div>
                  <div className="cd-act"><Link className="btn ghost" href={`/chefs/${o.id}`}>View all</Link><CompareToggle id={o.id} name={o.name} /></div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      <CompareTray chefs={CHEFS.map((o) => ({ id: o.id, name: o.name, avatar: chefFeed(o.id).avatar ?? "" }))} />
    </article>
  );
}
