// Server components
import Link from "next/link";
import { MEALS } from "@/lib/meals";
import { KIDNEY_SOURCES, kidneyRows } from "@/lib/kidney";

export function BrainFocus() {
  return (
  <section className="block" id="focus">
    <div className="shead"><div><p className="eyebrow">Brain focus</p><h2>Close the vegetarian nutrient gaps</h2></div>
      <p>Food cannot promise a measurable rise in focus within 8 weeks. Fixing these common gaps and protecting sleep gives you the best chance.</p></div>
    <div className="cols">
      <div className="panel"><h3>Vitamin B12</h3><p>Only found naturally in animal foods. Vegans need fortified soy milk, fortified nutritional yeast or a supplement. Vegetarians should get tested.</p></div>
      <div className="panel"><h3>Iron</h3><p>Vegetarians may need about 1.8× the usual iron intake because plant iron is absorbed less well. Eat dal, chana and greens with lemon or tomato.</p></div>
      <div className="panel"><h3>Omega-3 DHA</h3><p>The body converts flax, chia and walnut ALA to DHA poorly. Algae-oil DHA (100–300 mg) is the vegan option; ask your doctor.</p></div>
      <div className="panel"><h3>Creatine</h3><p>3–5 g/day supports strength training. Effects on memory are mixed: a 2023 trial found a small benefit that was not larger for vegetarians.</p></div>
      <div className="panel"><h3>Choline, iodine, vitamin D</h3><p>Soy, peanuts, quinoa, broccoli and milk for choline. Use iodized salt. Get 15–20 minutes of sun or a tested vitamin D dose.</p></div>
      <div className="panel"><h3>Sleep</h3><p>7–9 hours on a steady schedule. Muscle repair and attention both depend on it more than on any single food.</p></div>
    </div>
  </section>
  );
}

export function SkinHealth() {
  return (
  <section className="block" id="skin">
    <div className="shead"><div><p className="eyebrow">Skin &amp; whole-body health</p><h2>Nutrients for healthy skin</h2></div>
      <p>These foods support skin and overall health. They do not cure diseases; see a doctor or dermatologist for any skin or medical condition.</p></div>
    <div className="cols">
      <div className="panel"><h3>Protein + vitamin C</h3><p>Your body needs both to make collagen. Pair tofu, dal or paneer with tomato, lemon, peppers or berries.</p></div>
      <div className="panel"><h3>Vitamin A (beta-carotene)</h3><p>Supports skin repair. Carrot, sweet potato, spinach and pumpkin; eat with a little fat to absorb it.</p></div>
      <div className="panel"><h3>Zinc</h3><p>Needed for wound healing. Chickpeas, lentils, pumpkin seeds, cashews and tofu; soaking and sprouting improve absorption.</p></div>
      <div className="panel"><h3>Vitamin E and omega-3 fats</h3><p>Help protect the skin barrier. Almonds, peanuts, sunflower seeds, walnuts, flax and algae DHA.</p></div>
      <div className="panel"><h3>Water and fibre</h3><p>Drink regularly through the day. Kimchi, curd and vegetables support a healthy gut alongside fibre from dal and whole grains.</p></div>
      <div className="panel"><h3>What to limit</h3><p>Sugary drinks and very refined snacks. If you are acne-prone, notice whether milk or high-sugar foods make it worse and discuss it with a dermatologist.</p></div>
    </div>
    <div className="panel cta-panel">
      <div><h3>Skin-glow foods and drinks</h3><p>Eight recipes built around these nutrients: amla-carrot-beet juice, palak paneer, sweet potato tahini bowl, avocado-walnut toast, papaya-orange smoothie, seed trail mix, lemon-mint green tea and carrot kosambari.</p></div>
      <Link className="btn add" href="/menu#skin">See skin-glow recipes →</Link>
    </div>
    <div className="panel note-panel">
      <h3>What food can and cannot do</h3>
      <p>A balanced, high-protein diet with enough sleep and exercise lowers the risk of many problems and supports recovery. No diet cures diseases such as diabetes, eczema, psoriasis, thyroid disorders, infections or cancer. If you have symptoms or a diagnosis, follow your doctor&apos;s treatment and use food as support, not a replacement.</p>
    </div>
  </section>
  );
}

const kidneyRecipes = MEALS.filter((m) => m.slot === "kidney");
const kidneyAllLow = kidneyRecipes.filter((m) => (kidneyRows(m) ?? []).every((r) => r.ok)).length;

export function KidneyCare() {
  return (
  <section className="block" id="kidney">
    <div className="shead"><div><p className="eyebrow">Kidney care</p><h2>Eating for your kidneys</h2></div>
      <p>What helps depends on how your kidneys are doing. This is general guidance from the National Kidney Foundation (NKF), NIDDK and the KDOQI 2020 nutrition guideline. Your doctor or renal dietitian sets your personal numbers.</p></div>
    <div className="cols">
      <div className="panel"><h3>Healthy kidneys</h3><p>Keep sodium under 2,300 mg a day, counting salt already in food; that is about one teaspoon of salt in total (2,325 mg). Eat plenty of vegetables, fruit, beans and whole grains, drink water through the day, and keep blood pressure and blood sugar in range. Most research finds high-protein eating like this site&apos;s plan does not harm healthy kidneys, though some studies link very high intakes to faster decline. If you have diabetes, high blood pressure, one kidney or a family history of kidney disease, ask your doctor before following high-protein targets.</p></div>
      <div className="panel"><h3>Preventing kidney stones</h3><p>Unless you have kidney failure, drink six to eight 8-ounce glasses of fluid a day, mostly water; lemon or lime makes that easier. Keep sodium under 2,300 mg. Do not cut calcium. If you have had calcium-oxalate stones, limit high-oxalate foods such as spinach, nuts, peanuts, rhubarb and wheat bran, and get protein from beans, lentils and soy (NIDDK).</p></div>
      <div className="panel"><h3>Kidney disease, not on dialysis</h3><p>Protein is usually limited: KDOQI 2020 suggests 0.55–0.6 g per kg a day for CKD stages 3–5 (0.6–0.8 g/kg with diabetes), under a dietitian&apos;s care. Do not follow this site&apos;s muscle-gain protein targets; choose “Kidney health” in the <Link href="/plan#targets">calculator</Link> instead. NKF meal guide: under 15 g protein and 500 mg sodium, and if your labs call for it, under 450 mg potassium and 250 mg phosphorus.</p></div>
      <div className="panel"><h3>On dialysis</h3><p>Protein needs go up, because dialysis removes some protein: KDOQI suggests 1.0–1.2 g per kg a day, and the NKF guide is about 24 g protein per meal and 10 g per snack. Sodium, potassium, phosphorus and fluid limits are set from your blood tests. Seitan (wheat gluten) and tofu have less phosphorus per gram of protein than dairy.</p></div>
      <div className="panel"><h3>Plants and phosphorus</h3><p>You absorb only about half the phosphorus in unprocessed plant foods such as beans, nuts and whole grains, but 80–100% from phosphate additives in processed foods. Many people with kidney disease do not need to cut beans, nuts or whole grains; potassium and phosphorus limits depend on your blood levels (NKF). Well-planned plant-based diets may help slow kidney disease.</p></div>
      <div className="panel"><h3>Read labels and watch out for</h3><p>Phosphate additives: any ingredient with “phos” (phosphoric acid in dark colas, sodium tripolyphosphate). Salt substitutes and some “reduced-sodium” sauces made with potassium chloride. Salty pickles, papad, chaat masala, instant noodles and seasoning packets. Coconut water, which has about 600 mg potassium a cup (USDA). Never eat star fruit if you have kidney disease: its toxin can cause confusion, seizures and death.</p></div>
    </div>
    <div className="panel cta-panel">
      <div><h3>Kidney care recipes</h3><p>{kidneyRecipes.length} low-salt meals, snacks and drinks, each with sodium, potassium and phosphorus worked out from USDA data and checked against the NKF targets ({kidneyAllLow} are within all three). Includes higher-protein seitan dishes for people on dialysis. To lower potassium in potatoes, cut them small and boil at least 10 minutes in plenty of water (DaVita).</p></div>
      <Link className="btn add" href="/menu#kidney">See kidney care recipes →</Link>
    </div>
    <div className="panel note-panel">
      <h3>Sources</h3>
      <ul className="source-list">
        {KIDNEY_SOURCES.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></li>)}
      </ul>
      <p className="muted small">Food supports kidney health; it cannot reverse kidney disease. If you have kidney disease, follow your care team&apos;s plan and ask before changing your diet.</p>
    </div>
  </section>
  );
}
