"use client";

import { useEffect } from "react";
import { MEALS, SAMPLE_INDIAN_DAY, SAMPLE_VEGAN_DAY, SLOTS } from "@/lib/meals";
import { DAILY_SODIUM_MG, SAMPLE_KIDNEY_DAY, kidneyTotals } from "@/lib/kidney";
import { usePlanner } from "./PlannerProvider";

const KNOWN = new Set(MEALS.map((m) => m.id));
const r1 = (n: number) => Math.round(n * 10) / 10;

function Total({ k, v, target, pct, ok, warn }: { k: string; v: string; target?: string; pct?: number; ok?: boolean; warn?: string }) {
  return (
    <div className="tot">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
      {target && (
        <>
          <span className="t">
            {target}
            {ok && !warn && <> · <span className="ok">on target</span></>}
            {warn && <> · <span className="warn">{warn}</span></>}
          </span>
          {pct !== undefined && <div className="track"><i style={{ width: Math.min(100, Math.round(pct)) + "%" }} /></div>}
        </>
      )}
    </div>
  );
}

export function DayBuilder() {
  const { day, setDay, removeFromDay, currency, targets: tg } = usePlanner();
  // A saved day can hold recipes that were later removed from the menu; clean them out.
  useEffect(() => {
    if (day.some((id) => !KNOWN.has(id))) setDay(day.filter((id) => KNOWN.has(id)));
  }, [day, setDay]);

  const meals = day.map((id) => MEALS.find((m) => m.id === id)).filter((m) => m !== undefined);
  const t = meals.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f, usd: a.usd + m.usd, inr: a.inr + m.inr }),
    { kcal: 0, p: 0, c: 0, f: 0, usd: 0, inr: 0 }
  );
  const kidneyMode = tg.mode === "kidney";
  const kt = kidneyTotals(day);
  const pOver = kidneyMode && t.p > tg.proteinHi;
  const pOk = kidneyMode ? t.p >= tg.proteinLo && t.p <= tg.proteinHi : t.p >= tg.proteinLo;

  return (
    <section className="block" id="day">
      <div className="shead">
        <div><p className="eyebrow">Step 3 · Fine-tune a day</p><h2>Day builder</h2></div>
        <p>Add meals with “+ Add to day” on any recipe, or load a day from your weekly plan. Targets come from the <a href="#targets">calculator</a> above.</p>
      </div>
      <div className="builder">
        <div className="panel">
          <p className="muted small" style={{ marginTop: 0 }}>
            Your targets: <b>{kidneyMode ? `${tg.proteinLo}–${tg.proteinHi} g protein (guideline)` : `${tg.protein} g protein`}</b> · <b>{tg.kcalLo.toLocaleString()}–{tg.kcalHi.toLocaleString()} kcal</b> · <a href="#targets">change</a>
          </p>
          <ul className="picked">
            {meals.length === 0 && <li className="empty">No meals yet. Use “+ Add to day” on any card, or load a sample day.</li>}
            {meals.map((m, i) => (
              <li key={i}>
                <span><b>{SLOTS[m.slot]}</b> · {m.name} — {m.p} g / {m.kcal} kcal</span>
                <button onClick={() => removeFromDay(i)} aria-label={`Remove ${m.name}`}>✕</button>
              </li>
            ))}
          </ul>
          <div className="actions" style={{ marginTop: 14 }}>
            {kidneyMode ? (
              <button className="chip" onClick={() => setDay(tg.kidney === "dialysis" ? SAMPLE_KIDNEY_DAY.dialysis : SAMPLE_KIDNEY_DAY.ckd)}>Sample kidney-care day</button>
            ) : (
              <>
                <button className="chip" onClick={() => setDay(SAMPLE_INDIAN_DAY)}>Sample Indian day</button>
                <button className="chip" onClick={() => setDay(SAMPLE_VEGAN_DAY)}>Sample vegan day</button>
              </>
            )}
            <button className="chip" onClick={() => setDay([])}>Clear</button>
          </div>
        </div>
        <div className="panel">
          <div className="totals">
            <Total
              k="Protein" v={`${r1(t.p)} g`}
              target={kidneyMode ? `guideline ${tg.proteinLo}–${tg.proteinHi} g` : `target ${tg.protein} g (range ${tg.proteinLo}–${tg.proteinHi})`}
              pct={(t.p / (kidneyMode ? tg.proteinHi : tg.protein)) * 100} ok={pOk} warn={pOver ? "above the guideline" : undefined}
            />
            <Total k="Calories" v={t.kcal.toLocaleString()} target={`target ${tg.kcalLo.toLocaleString()}–${tg.kcalHi.toLocaleString()}`} pct={(t.kcal / tg.kcalHi) * 100} ok={t.kcal >= tg.kcalLo && t.kcal <= tg.kcalHi} />
            <Total k="Carbs" v={`${Math.round(t.c)} g`} />
            <Total k="Fat" v={`${Math.round(t.f)} g`} />
            <Total k="Cost per day" v={currency === "USD" ? "$" + t.usd.toFixed(2) : "₹" + t.inr} />
            <Total k="Per-meal protein guide" v={tg.perMealText} />
            {kt && (
              <>
                <Total k="Sodium" v={`${kt.na.toLocaleString()} mg`} target={`day guide: under ${DAILY_SODIUM_MG.toLocaleString()} mg`} pct={(kt.na / DAILY_SODIUM_MG) * 100} ok={kt.na < DAILY_SODIUM_MG} />
                <Total k="Potassium" v={`${kt.k.toLocaleString()} mg`} target="your limit comes from your blood tests" />
                <Total k="Phosphorus" v={`${kt.ph.toLocaleString()} mg`} target="your limit comes from your blood tests" />
              </>
            )}
          </div>
          {kidneyMode && meals.length > 0 && t.kcal < tg.kcalLo && (
            <p className="muted small">Kidney care recipes are moderate in calories. To reach your calorie goal without extra protein, add low-protein energy such as more rice, a little more oil, fruit or sabudana khichdi, as your dietitian advises.</p>
          )}
          {!kt && kidneyMode && meals.length > 0 && (
            <p className="muted small">Sodium, potassium and phosphorus totals appear when every item is a <a href="/menu#kidney">Kidney care</a> recipe.</p>
          )}
        </div>
      </div>
    </section>
  );
}
