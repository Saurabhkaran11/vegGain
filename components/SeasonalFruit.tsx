"use client";

import { useEffect, useState } from "react";

// Northern California seasons for common fruit. Highlights the current season in the visitor's browser.
const SEASONS = [
  { id: "winter", name: "Winter", months: [11, 0, 1], range: "Dec–Feb", fruit: ["Mandarins", "Navel oranges", "Kiwi", "Meyer lemons", "Grapefruit", "Asian pears (early)"] },
  { id: "spring", name: "Spring", months: [2, 3, 4], range: "Mar–May", fruit: ["Strawberries", "Early cherries (May)", "Loquats", "Oranges", "Avocados"] },
  { id: "summer", name: "Summer", months: [5, 6, 7], range: "Jun–Aug", fruit: ["Peaches", "Nectarines", "Plums", "Apricots", "Berries", "Melons", "Cherries"] },
  { id: "fall", name: "Fall", months: [8, 9, 10], range: "Sep–Nov", fruit: ["Fuyu persimmons", "Pomegranates", "Apples", "Asian pears", "Grapes", "Figs"] },
];
const YEAR_ROUND = ["Bananas", "Mango (frozen)", "Pineapple", "Papaya", "Frozen berries"];

export function SeasonalFruit() {
  const [month, setMonth] = useState<number | null>(null);
  useEffect(() => setMonth(new Date().getMonth()), []);
  return (
    <section className="block" aria-labelledby="season">
      <div className="shead">
        <div><p className="eyebrow">Fruit calendar</p><h2 id="season">What’s in season in the Bay Area</h2></div>
        <p>Seasonal fruit is cheaper and tastier. Year-round picks: {YEAR_ROUND.join(", ")}.</p>
      </div>
      <div className="cols">
        {SEASONS.map((s) => {
          const now = month !== null && s.months.includes(month);
          return (
            <div key={s.id} className={`panel season${now ? " now" : ""}`}>
              <h3>{s.name} <span className="muted">{s.range}</span>{now && <span className="pill">In season now</span>}</h3>
              <ul>{s.fruit.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
