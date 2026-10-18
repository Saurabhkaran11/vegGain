"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CUISINES, INDIAN_REGIONS, SLOTS, WORLD_CUISINES } from "@/lib/meal-meta";
import {
  DAY_NAMES, DEFAULT_OPTIONS, MAIN_SLOTS, buildGrocery, dayTotals, focusNoteText, generateWeek, groceryText, isValidWeek, meal, swapMeal, targetKey,
  type Focus, type MainSlot, type PlanDay, type PlanOptions,
} from "@/lib/weekplan";
import { thumbSrc } from "@/lib/photo-src";
import { read, usePlanner, write } from "./PlannerProvider";
import { SAMPLE_KIDNEY_DAY } from "@/lib/kidney";
import { KIDNEY_STATUS } from "@/lib/targets";

/** `key` records the targets the week was built for, so a change in the calculator rebuilds it. */
type Saved = { opts: PlanOptions; seed: number; days: PlanDay[]; key?: string };
const focusOk = (f: unknown) => f === "mix" || f === "indian" || f === "world" || (typeof f === "string" && f !== "global" && f in CUISINES);

export function WeekPlan() {
  const { targets: t, ready, currency, setDay, profile, setProfile } = usePlanner();
  const [opts, setOpts] = useState<PlanOptions>(DEFAULT_OPTIONS);
  const [seed, setSeed] = useState(1);
  const [days, setDays] = useState<PlanDay[] | null>(null);
  const [builtFor, setBuiltFor] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const [open, setOpen] = useState(0);
  const key = targetKey(t);
  const kidneyMode = t.mode === "kidney";
  const range = `${t.proteinLo}–${t.proteinHi} g protein · ${t.kcalLo.toLocaleString()}–${t.kcalHi.toLocaleString()} kcal`;

  // Wait until saved settings are loaded (the targets before that are only defaults). Then restore the saved week if it
  // was built for these targets; otherwise build one. Whenever the calculator changes the targets, rebuild the week.
  useEffect(() => {
    if (!ready || kidneyMode) return;
    if (days === null) {
      const s = read<Saved | null>("week", null);
      const savedOpts = s && focusOk(s.opts?.focus) ? { ...DEFAULT_OPTIONS, ...s.opts } : DEFAULT_OPTIONS;
      const savedSeed = s && Number.isFinite(s.seed) ? s.seed : 1;
      setOpts(savedOpts);
      setSeed(savedSeed);
      setBuiltFor(key);
      if (s && isValidWeek(s.days) && s.key === key) setDays(s.days);
      else {
        setDays(generateWeek(savedOpts, t, savedSeed));
        if (s && isValidWeek(s.days)) setNotice(`Your plan was rebuilt for your targets: ${range}.`);
      }
      return;
    }
    if (builtFor !== key) {
      setDays(generateWeek(opts, t, seed));
      setBuiltFor(key);
      setNotice(`Plan updated for your new targets: ${range}.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key, kidneyMode]);
  useEffect(() => { if (days && builtFor) write("week", { opts, seed, days, key: builtFor } satisfies Saved); }, [opts, seed, days, builtFor]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  function rebuild(next: PlanOptions = opts, s = seed) { setOpts(next); setSeed(s); setDays(generateWeek(next, t, s)); setBuiltFor(key); }
  const shuffle = () => rebuild(opts, (seed * 7919 + 13) % 2147483647);
  const swap = (i: number, s: MainSlot) => {
    if (!days) return;
    const ns = (seed * 31 + i * 7 + s.length + Date.now()) % 2147483647;
    const next = swapMeal(days, i, s, opts, t, ns);
    if (next) setDays(next);
    else setNotice(`No other ${SLOTS[s].toLowerCase()} fits these filters. Try “Mix of every cuisine” or Vegetarian.`);
  };
  const focusNote = focusNoteText(opts);

  const ids = useMemo(() => (days ?? []).flatMap((d) => [d.breakfast, d.lunch, d.evening, d.dinner, ...d.extras]), [days]);
  const grocery = useMemo(() => buildGrocery(ids), [ids]);
  const totals = useMemo(() => (days ?? []).map(dayTotals), [days]);
  const week = totals.reduce((a, x) => ({ p: a.p + x.p, kcal: a.kcal + x.kcal, usd: a.usd + x.usd, inr: a.inr + x.inr }), { p: 0, kcal: 0, usd: 0, inr: 0 });
  const money = (usd: number, inr: number) => (currency === "USD" ? "$" + usd.toFixed(2) : "₹" + Math.round(inr).toLocaleString("en-IN"));

  async function copy() {
    const text = groceryText(grocery, `VegGain 8 grocery list — ${grocery.meals} meals, 7 days`);
    try { await navigator.clipboard.writeText(text); setCopied("ok"); }
    catch { setCopied("fail"); }
    setTimeout(() => setCopied(""), 2500);
  }

  // With a kidney condition selected, high-protein muscle-gain days are not appropriate.
  if (t.mode === "kidney") {
    const sample = t.kidney === "dialysis" ? SAMPLE_KIDNEY_DAY.dialysis : SAMPLE_KIDNEY_DAY.ckd;
    return (
      <section className="block" id="week" aria-labelledby="week-h">
        <div className="shead">
          <div><p className="eyebrow">Step 2 · Your week</p><h2 id="week-h">Weekly plan paused in kidney mode</h2></div>
          <p>Kidney health is set to “{KIDNEY_STATUS[t.kidney].label}” in the calculator.</p>
        </div>
        <div className="panel kidney-week">
          <p>The automatic plan builds muscle-gain days around dal, paneer, dairy and protein shakes. With kidney disease those days are usually too high in protein, potassium or phosphorus, so the plan is switched off.</p>
          <ul className="why-list">
            <li>Build your day from the <Link href="/menu#kidney">Kidney care recipes</Link>; each one shows sodium, potassium and phosphorus against the National Kidney Foundation targets.</li>
            <li>The day builder below adds up protein and these kidney numbers for you.</li>
            <li>Check your plan with your renal dietitian, especially potassium, phosphorus and fluids.</li>
          </ul>
          <div className="actions">
            <button className="btn add" onClick={() => { setDay(sample); document.getElementById("day")?.scrollIntoView({ behavior: "smooth" }); }}>Load a sample kidney-care day ↓</button>
            <Link className="btn ghost" href="/health#kidney">Kidney diet guide</Link>
          </div>
          <p className="muted small">Chose a kidney condition by mistake? <button type="button" className="linkish" onClick={() => setProfile({ ...profile, kidney: "healthy" })}>Switch back to healthy kidneys</button> to turn the muscle-gain plan on again.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="block" id="week" aria-labelledby="week-h">
      <div className="shead">
        <div><p className="eyebrow">Step 2 · Your week</p><h2 id="week-h">Automatic 7-day meal plan</h2></div>
        <p>Built to your targets: <b>{t.proteinLo}–{t.proteinHi} g protein</b> and <b>{t.kcalLo.toLocaleString()}–{t.kcalHi.toLocaleString()} kcal</b> a day. It updates by itself when you change the calculator; shakes or snacks are added only when a day falls short.</p>
      </div>

      <div className="panel week-controls">
        <div className="seg" role="group" aria-label="Diet">
          <button className="chip" aria-pressed={opts.diet !== "vegan"} onClick={() => rebuild({ ...opts, diet: "all" })}>Vegetarian</button>
          <button className="chip" aria-pressed={opts.diet === "vegan"} onClick={() => rebuild({ ...opts, diet: "vegan" })}>Vegan</button>
        </div>
        <span className="selwrap">
          <select aria-label="Cuisine focus" value={opts.focus} onChange={(e) => rebuild({ ...opts, focus: e.target.value as Focus })}>
            <option value="mix">Mix of every cuisine</option>
            <option value="indian">All Indian regions</option>
            <option value="world">World cuisines only</option>
            <optgroup label="Focus on one Indian region">
              {INDIAN_REGIONS.map((k) => <option key={k} value={k}>{CUISINES[k]}</option>)}
            </optgroup>
            <optgroup label="Focus on one world cuisine">
              {WORLD_CUISINES.map((k) => <option key={k} value={k}>{CUISINES[k]}</option>)}
            </optgroup>
          </select>
        </span>
        <label className="chip check-chip">
          <input type="checkbox" checked={opts.budget} onChange={(e) => rebuild({ ...opts, budget: e.target.checked })} /> Budget mode
        </label>
        <button className="btn add" onClick={shuffle}>↻ Shuffle the week</button>
      </div>
      <p className="week-note" role="status" aria-live="polite" hidden={!notice}>✓ {notice}</p>
      {focusNote && <p className="muted small week-focus-note">{focusNote}</p>}
      {!days && <div className="panel week-loading">Building your week…</div>}

      {days && (
        <>
          <div className="week-sum" aria-live="polite">
            <div><span>Average protein</span><b>{Math.round(week.p / 7)} g/day</b></div>
            <div><span>Average calories</span><b>{Math.round(week.kcal / 7).toLocaleString()}/day</b></div>
            <div><span>Food cost, 7 days</span><b>{money(week.usd, week.inr)}</b></div>
            <div><span>Per day</span><b>{money(week.usd / 7, week.inr / 7)}</b></div>
          </div>

          <div className="week-days">
            {days.map((d, i) => {
              const x = totals[i];
              const okP = x.p >= t.proteinLo;
              const kc = x.kcal < t.kcalLo ? "low" : x.kcal > t.kcalHi * 1.1 ? "high" : "ok";
              return (
                <article key={i} className={`panel week-day${open === i ? " open" : ""}`}>
                  <button className="wd-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                    <b>{DAY_NAMES[i]}</b>
                    <span className={okP ? "ok" : "low"} title={`Protein ${x.p} g · target ${t.proteinLo}–${t.proteinHi} g`}>{x.p} g</span>
                    <span className={kc} title={`Calories ${x.kcal.toLocaleString()} · target ${t.kcalLo.toLocaleString()}–${t.kcalHi.toLocaleString()}`}>{x.kcal.toLocaleString()} kcal</span>
                    <span className="muted">{money(x.usd, x.inr)}</span>
                  </button>
                  <ul className="wd-meals">
                    {MAIN_SLOTS.map((s) => {
                      const m = meal(d[s]);
                      if (!m) return null;
                      return (
                        <li key={s}>
                          <img src={thumbSrc(m.id, 128)} alt="" width={56} height={42} loading="lazy" decoding="async" />
                          <span><small>{SLOTS[s]}</small><Link href={`/menu/${m.id}`}>{m.name}</Link><em>{m.p} g · {m.kcal} kcal</em></span>
                          <button className="swap" onClick={() => swap(i, s)} aria-label={`Swap ${SLOTS[s]} on ${DAY_NAMES[i]}`} title="Swap this meal">↻</button>
                        </li>
                      );
                    })}
                    {d.extras.map((id) => {
                      const m = meal(id);
                      if (!m) return null;
                      return (
                        <li key={id} className="extra">
                          <img src={thumbSrc(m.id, 128)} alt="" width={56} height={42} loading="lazy" decoding="async" />
                          <span><small>Protein boost</small><Link href={`/menu/${m.id}`}>{m.name}</Link><em>{m.p} g · {m.kcal} kcal</em></span>
                        </li>
                      );
                    })}
                  </ul>
                  <button className="chip wd-load" onClick={() => { setDay([d.breakfast, d.lunch, d.evening, d.dinner, ...d.extras]); document.getElementById("day")?.scrollIntoView({ behavior: "smooth" }); }}>
                    Open {DAY_NAMES[i]} in the day builder ↓
                  </button>
                </article>
              );
            })}
          </div>

          <div className="panel grocery" id="grocery">
            <div className="shead" style={{ marginBottom: 12 }}>
              <div><p className="eyebrow">Shopping</p><h3>Grocery list for the week</h3></div>
              <div className="actions">
                <button className="btn add" onClick={copy}>{copied === "ok" ? "✓ Copied" : copied === "fail" ? "Select the list to copy" : "Copy list"}</button>
                <button className="btn ghost" onClick={() => window.print()}>Print</button>
              </div>
            </div>
            <p className="muted small">Quantities are added up across all {grocery.meals} meals for one person. Buy a little extra of staples; prices are in each recipe’s cost section.</p>
            <div className="grocery-cols">
              {Object.entries(grocery.groups).filter(([, items]) => items.length).map(([group, items]) => (
                <div key={group}>
                  <h4>{group}</h4>
                  <ul>
                    {items.map((it) => (
                      <li key={it.name}><label><input type="checkbox" /> <span>{it.name}</span>{it.qty && <b>{it.qty}</b>}</label></li>
                    ))}
                  </ul>
                </div>
              ))}
              {grocery.batch.length > 0 && (
                <div>
                  <h4>Batch prep this week</h4>
                  <ul>{grocery.batch.map((b) => <li key={b.id}><Link href={`/menu/${b.id}`}>{b.name}</Link> <span className="muted">— see recipe</span></li>)}</ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
