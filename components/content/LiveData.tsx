// Server components that show data refreshed by the agents.
import Link from "next/link";
import { currency, fmtDate, nutrition } from "@/lib/data";

export function NutritionTable() {
  const foods = nutrition.foods ?? [];
  const pending = (nutrition.total ?? foods.length) - foods.length;
  return (
    <section className="block" aria-labelledby="usda">
      <div className="shead">
        <div><p className="eyebrow">Live from USDA FoodData Central · {fmtDate(nutrition.updatedAt)}</p><h2 id="usda">Best vegetarian protein sources, per 100 g</h2></div>
        <p>Sorted by protein. Values are refreshed by the nutrition agent each time the app starts.</p>
      </div>
      {foods.length === 0 ? (
        <div className="panel"><p>Nutrition data appears after the first agent run (<code>npm run agents</code>).</p></div>
      ) : (
        <div className="panel scroll">
          <table className="usda">
            <thead><tr><th scope="col">Food</th><th scope="col">Protein</th><th scope="col">Calories</th><th scope="col">Fiber</th><th scope="col">Iron</th><th scope="col">Calcium</th><th scope="col">Zinc</th><th scope="col">Vitamin C</th></tr></thead>
            <tbody>
              {foods.map((f) => {
                const n = f.per100g; const v = (x: number | null | undefined, u: string) => (x == null ? "—" : `${x} ${u}`);
                return (
                  <tr key={f.name}>
                    <th scope="row"><a href={f.url} target="_blank" rel="noopener noreferrer">{f.name}</a></th>
                    <td className="num"><b>{v(n.protein, "g")}</b></td><td className="num">{v(n.kcal, "kcal")}</td><td className="num">{v(n.fiber, "g")}</td>
                    <td className="num">{v(n.iron, "mg")}</td><td className="num">{v(n.calcium, "mg")}</td><td className="num">{v(n.zinc, "mg")}</td><td className="num">{v(n.vitC, "mg")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pending > 0 && <p className="muted small">{pending} more foods load automatically on later app starts (the free USDA demo key is rate-limited). Add a free key in <code>agents/nutrition/.env</code> to load them all at once.</p>}
        </div>
      )}
    </section>
  );
}

export function ExchangeRate() {
  const r = currency.rates;
  if (!r?.INR) return null;
  return (
    <section className="block" aria-labelledby="fx">
      <div className="panel fx">
        <div><p className="eyebrow">Today’s exchange rate · {fmtDate(currency.updatedAt)}</p><h2 id="fx">$1 = ₹{r.INR.toFixed(2)}</h2></div>
        <p>A $70 weekly Bay Area grocery bill is about ₹{Math.round(70 * r.INR).toLocaleString("en-IN")}. Indian prices on the site are local Indian store prices, not conversions.{" "}
          <a href={currency.attributionUrl ?? "https://www.exchangerate-api.com"} target="_blank" rel="noopener noreferrer">Rates by ExchangeRate-API</a> · <Link href="/agents">Data agents</Link></p>
      </div>
    </section>
  );
}
