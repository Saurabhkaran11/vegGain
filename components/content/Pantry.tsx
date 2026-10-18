// Server component: long-life foods grouped by where they are stored, plus safe-storage rules.
import Link from "next/link";
import { MEALS } from "@/lib/meals";
import { storeAt, type StoreAt } from "@/lib/recipe-info";
import { MealPhoto } from "@/components/MealPhoto";

const pantry = MEALS.filter((m) => m.slot === "pantry");
const GROUPS: { k: StoreAt; t: string; d: string }[] = [
  { k: "cupboard", t: "Cupboard", d: "Dry mixes, roasted snacks and laddoos. Airtight jars, cool and dark, dry spoon." },
  { k: "fridge", t: "Fridge", d: "Ferments, nut butters, syrups and flatbreads. 4 °C / 40 °F or colder." },
  { k: "freezer", t: "Freezer", d: "Batch curries, dumplings, burritos and smoothie packs. −18 °C / 0 °F." },
];

const RULES = [
  "Cool cooked food and refrigerate it within 2 hours (1 hour if it is above 32 °C / 90 °F outside).",
  "Cooked leftovers: 3–4 days in the fridge. Soups, curries and stews: 2–3 months in the freezer.",
  "Freeze in flat, single-serve portions and label each with the name and date.",
  "Thaw in the fridge overnight, not on the counter; reheat until steaming hot (74 °C / 165 °F).",
  "Dry mixes stay safe only while dry: use a clean, dry spoon and keep jars closed.",
  "Nuts, seeds and flour with oil go rancid in warmth; move them to the fridge in summer.",
  "Never store garlic or herbs in oil at room temperature (botulism risk); keep in the fridge up to 4 days or freeze.",
  "Ferments like kimchi: discard if you see fuzzy mould, pink slime or an off smell.",
];

export function PantryGuide() {
  return (
    <section className="block" id="pantry" aria-labelledby="pantry-h">
      <div className="shead">
        <div><p className="eyebrow">Stock up once, eat well all month</p><h2 id="pantry-h">Long-life &amp; make-ahead foods</h2></div>
        <Link href="/menu#pantry">All {pantry.length} recipes →</Link>
      </div>
      <div className="pantry-groups">
        {GROUPS.map((g) => {
          const items = pantry.filter((m) => storeAt(m) === g.k);
          return (
            <div key={g.k} className="panel pantry-group">
              <h3>{g.t} <span className="muted">· {items.length}</span></h3>
              <p className="muted small">{g.d}</p>
              <ul>
                {items.map((m) => (
                  <li key={m.id}>
                    <Link href={`/menu/${m.id}`}>
                      <MealPhoto meal={m} sizes="56px" />
                      <span><b>{m.name}</b><small>Keeps {m.life} · {m.p} g protein</small></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="panel" style={{ marginTop: 18 }}>
        <h3>Safe storage rules</h3>
        <ul className="why-list">{RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        <p className="muted small">
          Based on <a href="https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts" target="_blank" rel="noopener noreferrer">FoodSafety.gov cold storage charts</a>,{" "}
          <a href="https://www.foodsafety.gov/keep-food-safe/foodkeeper-app" target="_blank" rel="noopener noreferrer">the USDA FoodKeeper app</a>,{" "}
          <a href="https://extension.umn.edu/preserving-and-preparing/storage-times-food-refrigerator-and-freezer" target="_blank" rel="noopener noreferrer">University of Minnesota Extension</a> and{" "}
          <a href="https://nchfp.uga.edu/" target="_blank" rel="noopener noreferrer">the National Center for Home Food Preservation</a>.
        </p>
      </div>
    </section>
  );
}
