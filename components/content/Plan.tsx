// Server component

export function PlanTimeline() {
  return (
  <section className="block" id="plan">
    <div className="shead"><div><p className="eyebrow">Progression</p><h2>The 8-week plan</h2></div>
      <p>Weigh yourself every morning and adjust from the weekly average, not from a single day.</p></div>
    <div className="timeline">
      <div className="panel phase"><p className="wk">Weeks 1–2 · Baseline</p><ul><li>Maintenance +10% calories</li><li>Protein 1.6 g/kg over 4 meals</li><li>Full-body lifting 3×/week, 2–3 sets, 1–3 reps in reserve</li><li>Batch-cook dal, rajma and rice on Sunday</li><li>Ask your doctor about B12, vitamin D and ferritin tests</li></ul><p className="gain">70 kg target: +0.18–0.35 kg/week</p></div>
      <div className="panel phase"><p className="wk">Weeks 3–4 · Adjust</p><ul><li>Gaining under 0.25%/week: add 150–200 kcal (a roti, 20 g peanuts or 200 ml milk)</li><li>Gaining over 0.5%/week: remove 100–150 kcal</li><li>Protein 1.8 g/kg</li><li>Add a set or add load each week</li></ul><p className="gain">Check waist: it should rise slowly, if at all</p></div>
      <div className="panel phase"><p className="wk">Weeks 5–6 · Build</p><ul><li>Upper/lower split 4×/week</li><li>Protein 1.8–2.0 g/kg</li><li>Sattu drink or soy shake 60–90 min before training</li><li>Sleep 7–9 h, caffeine before 2 pm</li></ul><p className="gain">Strength should climb on most lifts</p></div>
      <div className="panel phase"><p className="wk">Weeks 7–8 · Consolidate</p><ul><li>Hold calories; optional lighter training in week 8</li><li>Re-measure weight, waist, photos, lifts and a 1–10 focus score</li><li>Choose: continue the lean bulk or hold at maintenance</li></ul><p className="gain">Expected total: about 1.3–2.6 kg for a 65 kg beginner</p></div>
    </div>
  </section>
  );
}
