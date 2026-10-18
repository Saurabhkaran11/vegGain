/** Currency agent — today's exchange rates (USD base) for the INR toggle and cost notes. */
import { getJSON } from "../_lib/http.mjs";

export async function run({ env, log }) {
  const base = env.CURRENCY_BASE || "USD";
  const targets = (env.CURRENCY_TARGETS || "INR").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const d = await getJSON(`${env.CURRENCY_API_URL || "https://open.er-api.com/v6/latest"}/${base}`);
  if (d.result !== "success") throw new Error(d["error-type"] || "rate API error");
  const rates = Object.fromEntries(targets.map((t) => [t, d.rates[t]]));
  log(`1 ${base} = ${targets.map((t) => `${rates[t]} ${t}`).join(", ")}`);
  return {
    data: { base, rates, providerUpdated: d.time_last_update_utc, provider: "ExchangeRate-API (open access)", attributionUrl: "https://www.exchangerate-api.com" },
    summary: `1 ${base} = ${rates.INR ?? Object.values(rates)[0]} ${targets[0]}`,
  };
}
