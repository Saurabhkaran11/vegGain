"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePlanner } from "./PlannerProvider";
import { ACTIVITY, GOALS, KIDNEY_STATUS, cmToFtIn, fmtWeight, ftInToCm, kgToLb, lbToKg, sanitize, type Activity, type Goal, type KidneyStatus, type Profile } from "@/lib/targets";

type Draft = { age: string; cm: string; kg: string; ft: string; inch: string; lb: string };

function toDraft(p: Profile): Draft {
  const { ft, inch } = cmToFtIn(p.heightCm);
  return { age: String(p.age), cm: String(Math.round(p.heightCm)), kg: String(Math.round(p.weightKg * 10) / 10), ft: String(ft), inch: String(inch), lb: String(Math.round(kgToLb(p.weightKg))) };
}

export function TargetCalculator() {
  const { profile, setProfile, targets: t } = usePlanner();
  const [d, setD] = useState<Draft>(() => toDraft(profile));
  // Refresh the inputs when the profile changes from outside the text fields
  // (loaded from storage, units switched) but not while the person is typing.
  const typed = useRef<Profile | null>(null);
  useEffect(() => {
    if (typed.current && JSON.stringify(sanitize(typed.current)) === JSON.stringify(profile)) return;
    setD(toDraft(profile));
  }, [profile]);

  const num = (s: string) => { const n = parseFloat(s); return Number.isFinite(n) ? n : NaN; };
  function commit(next: Draft, patch: Partial<Profile> = {}) {
    setD(next);
    const imperial = (patch.units ?? profile.units) === "imperial";
    const heightCm = imperial ? ftInToCm(num(next.ft) || 0, num(next.inch) || 0) : num(next.cm);
    const weightKg = imperial ? lbToKg(num(next.lb)) : num(next.kg);
    const age = num(next.age);
    // Only save once every number is filled in and plausible; keep typing otherwise.
    if (!(heightCm > 120 && weightKg > 30 && age >= 14)) return;
    const next2 = { ...profile, ...patch, age, heightCm, weightKg };
    typed.current = next2;
    setProfile(next2);
  }
  const field = (k: keyof Draft) => ({
    value: d[k],
    inputMode: "decimal" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => commit({ ...d, [k]: e.target.value }),
  });
  const imperial = profile.units === "imperial";
  const kidneyMode = t.mode === "kidney";

  return (
    <section className="block" id="targets" aria-labelledby="targets-h">
      <div className="shead">
        <div><p className="eyebrow">Step 1 · Your numbers</p><h2 id="targets-h">Protein &amp; calorie calculator</h2></div>
        <p>Your targets are saved in this browser and used by the weekly plan and the day builder below.</p>
      </div>
      <div className="calc">
        <form className="panel calc-form" onSubmit={(e) => e.preventDefault()} aria-label="Your details">
          <div className="seg" role="group" aria-label="Units">
            {(["metric", "imperial"] as const).map((u) => (
              <button key={u} type="button" className="chip" aria-pressed={profile.units === u} onClick={() => setProfile({ ...profile, units: u })}>
                {u === "metric" ? "kg · cm" : "lb · ft"}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Sex">
            {(["male", "female"] as const).map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={profile.sex === s} onClick={() => setProfile({ ...profile, sex: s })}>
                {s === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
          <div className="calc-row">
            <label>Age<input type="number" min={14} max={90} {...field("age")} /></label>
            {imperial ? (
              <>
                <label>Weight (lb)<input type="number" min={66} max={550} {...field("lb")} /></label>
                <label>Height (ft)<input type="number" min={4} max={7} {...field("ft")} /></label>
                <label>(in)<input type="number" min={0} max={11} {...field("inch")} /></label>
              </>
            ) : (
              <>
                <label>Weight (kg)<input type="number" min={30} max={250} step={0.1} {...field("kg")} /></label>
                <label>Height (cm)<input type="number" min={120} max={230} {...field("cm")} /></label>
              </>
            )}
          </div>
          <label className="calc-sel">Activity
            <span className="selwrap">
              <select value={profile.activity} onChange={(e) => setProfile({ ...profile, activity: e.target.value as Activity })}>
                {(Object.keys(ACTIVITY) as Activity[]).map((a) => <option key={a} value={a}>{ACTIVITY[a].label} — {ACTIVITY[a].hint}</option>)}
              </select>
            </span>
          </label>
          <label className="calc-sel">Kidney health
            <span className="selwrap">
              <select value={profile.kidney} onChange={(e) => setProfile({ ...profile, kidney: e.target.value as KidneyStatus })}>
                {(Object.keys(KIDNEY_STATUS) as KidneyStatus[]).map((k) => <option key={k} value={k}>{KIDNEY_STATUS[k].label}</option>)}
              </select>
            </span>
          </label>
          <fieldset className={`calc-goal${kidneyMode ? " is-off" : ""}`} disabled={kidneyMode}>
            <legend>Goal{kidneyMode && " (off while a kidney condition is selected)"}</legend>
            {(Object.keys(GOALS) as Goal[]).map((g) => (
              <label key={g} className={profile.goal === g ? "on" : undefined}>
                <input type="radio" name="goal" checked={profile.goal === g} onChange={() => setProfile({ ...profile, goal: g })} />
                <b>{GOALS[g].label}</b><small>{GOALS[g].hint}</small>
              </label>
            ))}
          </fieldset>
        </form>

        <div className="panel calc-out" aria-live="polite">
          {kidneyMode && (
            <div className="kidney-alert" role="note">
              <b>Kidney mode: muscle-gain targets are switched off.</b>
              <span>Protein below is the KDOQI 2020 guideline range for people with {KIDNEY_STATUS[t.kidney].short} ({KIDNEY_STATUS[t.kidney].lo}–{KIDNEY_STATUS[t.kidney].hi} g/kg, worked out from your current weight). Your nephrologist or renal dietitian sets your actual numbers.</span>
              <Link href="/menu#kidney">See Kidney care recipes →</Link>
            </div>
          )}
          <div className="calc-big">
            <div><span>Calories / day</span><b>{t.kcal.toLocaleString()}</b><small>{t.kcalLo.toLocaleString()}–{t.kcalHi.toLocaleString()} kcal{kidneyMode && " (25–35 kcal/kg)"}</small></div>
            <div><span>{kidneyMode ? "Protein / day (guideline)" : "Protein / day"}</span><b>{t.protein} g</b><small>range {t.proteinLo}–{t.proteinHi} g</small></div>
          </div>
          <dl className="calc-list">
            <div><dt>Protein per meal{kidneyMode ? "" : " (4 meals)"}</dt><dd>{kidneyMode ? t.perMealText : `${t.perMealLo}–${t.perMealHi} g`}</dd></div>
            <div><dt>Carbs</dt><dd>{t.carbs} g</dd></div>
            <div><dt>Fat</dt><dd>{t.fat} g</dd></div>
            <div><dt>{kidneyMode ? "Fluids" : "Water"}</dt><dd>{t.waterL === null ? "Ask your care team (some people need a limit)" : `about ${t.waterL} L`}</dd></div>
            {kidneyMode && <div><dt>Sodium</dt><dd>Under 2,300 mg a day</dd></div>}
            <div><dt>Maintenance (TDEE)</dt><dd>{t.tdee.toLocaleString()} kcal</dd></div>
            <div><dt>Resting (BMR)</dt><dd>{t.bmr.toLocaleString()} kcal</dd></div>
            <div><dt>{kidneyMode ? "Weight goal" : "Expected gain"}</dt><dd>{kidneyMode ? "Set with your care team" : <>{fmtWeight(t.weeklyKg, profile.units).replace(/^(\d)/, "~$1")} / week · {fmtWeight(t.eightWeekKg, profile.units)} in 8 weeks</>}</dd></div>
            <div><dt>BMI now</dt><dd>{t.bmi}</dd></div>
          </dl>
          <div className="actions">
            {kidneyMode ? <Link className="btn add" href="/menu#kidney">Kidney care recipes</Link> : <a className="btn add" href="#week">See my 7-day plan ↓</a>}
            <Link className="btn ghost" href={kidneyMode ? "/health#kidney" : "/menu"}>{kidneyMode ? "Kidney diet guide" : "Browse recipes"}</Link>
          </div>
          <p className="muted small">
            {kidneyMode
              ? "Protein ranges come from the KDOQI 2020 nutrition guideline (which uses ideal body weight) and per-meal guides from the National Kidney Foundation. Limits for potassium, phosphorus and fluids depend on your blood tests. This is general information, not medical advice."
              : "Calories use the Mifflin-St Jeor equation × your activity level, plus your goal surplus. Protein uses 1.6–2.2 g per kg (ISSN). Weigh in each morning; if the weekly average is not rising after 2 weeks, add 150–200 kcal. These are estimates, not medical advice. Ask a doctor or dietitian if you have a health condition, are under 18, pregnant or breastfeeding."}
          </p>
        </div>
      </div>
    </section>
  );
}
