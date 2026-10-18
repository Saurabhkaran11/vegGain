// Daily targets for lean weight and muscle gain.
// Energy: Mifflin-St Jeor BMR × activity factor, plus a goal surplus.
// Protein: 1.6–2.2 g per kg body weight per day (ISSN position stand), 1.8 g/kg as the midpoint.

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Goal = "lean" | "standard" | "fast";
export type Units = "metric" | "imperial";
export type KidneyStatus = "healthy" | "ckd" | "ckd-diabetes" | "dialysis";

/** Protein ranges in g/kg/day: ISSN for healthy adults; KDOQI 2020 for kidney disease. Per-meal guides: NKF Kidney-Friendly Plate. */
export const KIDNEY_STATUS: Record<KidneyStatus, { label: string; short: string; lo: number; hi: number; perMeal: string }> = {
  healthy: { label: "Healthy kidneys", short: "Healthy kidneys", lo: 1.6, hi: 2.2, perMeal: "" },
  ckd: { label: "Kidney disease (CKD 3–5), not on dialysis", short: "CKD, not on dialysis", lo: 0.55, hi: 0.6, perMeal: "Under 15 g per meal, 8 g per snack (NKF)" },
  "ckd-diabetes": { label: "Kidney disease with diabetes, not on dialysis", short: "CKD with diabetes", lo: 0.6, hi: 0.8, perMeal: "Under 15 g per meal, 8 g per snack (NKF)" },
  dialysis: { label: "On dialysis", short: "On dialysis", lo: 1.0, hi: 1.2, perMeal: "About 24 g per meal, 10 g per snack (NKF)" },
};

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  units: Units;
  kidney: KidneyStatus;
};

export const DEFAULT_PROFILE: Profile = { sex: "male", age: 28, heightCm: 175, weightKg: 70, activity: "moderate", goal: "standard", units: "metric", kidney: "healthy" };

export const ACTIVITY: Record<Activity, { label: string; hint: string; factor: number }> = {
  sedentary: { label: "Mostly sitting", hint: "Desk job, little exercise", factor: 1.2 },
  light: { label: "Light", hint: "Training 1–2 days a week", factor: 1.375 },
  moderate: { label: "Moderate", hint: "Lifting 3–4 days a week", factor: 1.55 },
  active: { label: "Very active", hint: "Training 5–6 days or an active job", factor: 1.725 },
  athlete: { label: "Athlete", hint: "Twice-a-day training", factor: 1.9 },
};

export const GOALS: Record<Goal, { label: string; hint: string; surplus: number; weekly: number }> = {
  lean: { label: "Lean gain", hint: "+10% calories, least fat gain", surplus: 0.1, weekly: 0.0025 },
  standard: { label: "Steady gain", hint: "+15% calories, the plan default", surplus: 0.15, weekly: 0.004 },
  fast: { label: "Faster gain", hint: "+20%, for hard gainers", surplus: 0.2, weekly: 0.005 },
};

export type Targets = {
  bmr: number; tdee: number; kcal: number; kcalLo: number; kcalHi: number;
  protein: number; proteinLo: number; proteinHi: number; perMealLo: number; perMealHi: number;
  fat: number; carbs: number; waterL: number | null; weeklyKg: number; eightWeekKg: number; bmi: number;
  /** "kidney" when a kidney condition is selected: muscle-gain targets are replaced by guideline ranges. */
  mode: "gain" | "kidney"; kidney: KidneyStatus; perMealText: string;
};

const r5 = (n: number) => Math.round(n / 5) * 5;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Fill in missing or out-of-range values so the maths never breaks. */
export function sanitize(p: Partial<Profile> | null | undefined): Profile {
  const d = DEFAULT_PROFILE;
  const n = (v: unknown, lo: number, hi: number, f: number) => (typeof v === "number" && Number.isFinite(v) ? clamp(v, lo, hi) : f);
  return {
    sex: p?.sex === "female" ? "female" : "male",
    age: Math.round(n(p?.age, 14, 90, d.age)),
    heightCm: n(p?.heightCm, 120, 230, d.heightCm),
    weightKg: n(p?.weightKg, 30, 250, d.weightKg),
    activity: p?.activity && p.activity in ACTIVITY ? p.activity : d.activity,
    goal: p?.goal && p.goal in GOALS ? p.goal : d.goal,
    units: p?.units === "imperial" ? "imperial" : "metric",
    kidney: p?.kidney && p.kidney in KIDNEY_STATUS ? p.kidney : "healthy",
  };
}

export function computeTargets(input: Profile): Targets {
  const p = sanitize(input);
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const tdee = bmr * ACTIVITY[p.activity].factor;
  const bmi = Math.round((p.weightKg / (p.heightCm / 100) ** 2) * 10) / 10;
  if (p.kidney !== "healthy") {
    // Kidney disease: no muscle-gain surplus. KDOQI 2020: 25–35 kcal/kg/day and the protein range for this condition.
    const ks = KIDNEY_STATUS[p.kidney];
    const kLo = r5(25 * p.weightKg), kHi = r5(35 * p.weightKg);
    const kcalK = r5(clamp(tdee, kLo, kHi));
    const lo = Math.round(p.weightKg * ks.lo), hi = Math.round(p.weightKg * ks.hi);
    const prot = (lo + hi) / 2;
    const fatK = (kcalK * 0.3) / 9;
    return {
      bmr: r5(bmr), tdee: r5(tdee), kcal: kcalK, kcalLo: kLo, kcalHi: kHi,
      protein: Math.round(prot), proteinLo: lo, proteinHi: hi, perMealLo: 0, perMealHi: p.kidney === "dialysis" ? 24 : 15,
      fat: Math.round(fatK), carbs: Math.round(Math.max(0, (kcalK - prot * 4 - fatK * 9) / 4)), waterL: null,
      weeklyKg: 0, eightWeekKg: 0, bmi, mode: "kidney", kidney: p.kidney, perMealText: ks.perMeal,
    };
  }
  const g = GOALS[p.goal];
  const kcal = tdee * (1 + g.surplus);
  const protein = p.weightKg * 1.8;
  const fat = (kcal * 0.27) / 9;
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  const weeklyKg = p.weightKg * g.weekly;
  return {
    bmr: r5(bmr), tdee: r5(tdee), kcal: r5(kcal), kcalLo: r5(kcal * 0.95), kcalHi: r5(kcal * 1.05),
    protein: Math.round(protein), proteinLo: Math.round(p.weightKg * 1.6), proteinHi: Math.round(p.weightKg * 2.2),
    perMealLo: Math.round(p.weightKg * 0.4), perMealHi: Math.round(p.weightKg * 0.55),
    fat: Math.round(fat), carbs: Math.round(carbs), waterL: Math.round(p.weightKg * 0.035 * 10) / 10,
    weeklyKg: Math.round(weeklyKg * 100) / 100, eightWeekKg: Math.round(weeklyKg * 8 * 10) / 10,
    bmi, mode: "gain", kidney: "healthy", perMealText: `${Math.round(p.weightKg * 0.4)}–${Math.round(p.weightKg * 0.55)} g per meal`,
  };
}

export const kgToLb = (kg: number) => kg * 2.20462;
export const lbToKg = (lb: number) => lb / 2.20462;
export const cmToFtIn = (cm: number) => { const t = cm / 2.54; let ft = Math.floor(t / 12); let inch = Math.round(t - ft * 12); if (inch === 12) { ft++; inch = 0; } return { ft, inch }; };
export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * 2.54;
export const fmtWeight = (kg: number, units: Units) => (units === "imperial" ? `${Math.round(kgToLb(kg) * 10) / 10} lb` : `${kg} kg`);
