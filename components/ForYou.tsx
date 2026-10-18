"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { read, usePlanner } from "./PlannerProvider";
import { Rail } from "./Rail";
import { NfCard, type CardMeal } from "./NfCard";

type Week = { days?: { breakfast: string; lunch: string; evening: string; dinner: string; extras: string[] }[] };

/** Rows built from what this browser has saved: today's plan, the day builder and the ♥ list. Hidden until there is something to show. */
export function ForYou({ meals }: { meals: Record<string, CardMeal> }) {
  const { day, favs, targets, ready } = usePlanner();
  const [today, setToday] = useState<string[]>([]);
  const [hello, setHello] = useState("");
  const [ownDay, setOwnDay] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setHello(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setOwnDay(read<string[] | null>("day", null) !== null);
    const w = read<Week | null>("week", null);
    const d = w?.days?.[(new Date().getDay() + 6) % 7];
    if (d) setToday([d.breakfast, d.lunch, d.evening, d.dinner, ...(d.extras ?? [])]);
  }, []);

  const pick = (ids: string[]) => [...new Set(ids)].map((id) => meals[id]).filter((m): m is CardMeal => !!m);
  const plan = pick(today), built = ownDay ? pick(day) : [], saved = pick([...favs].reverse());
  if (!ready || (!plan.length && !built.length && !saved.length)) return null;
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="foryou">
      <p className="foryou-hi">
        {hello}. Your target today: <b>{targets.proteinLo}–{targets.proteinHi} g protein</b> · <b>{targets.kcalLo.toLocaleString()}–{targets.kcalHi.toLocaleString()} kcal</b> <Link href="/plan#targets">Edit</Link>
      </p>
      {plan.length > 0 && (
        <Rail id="r-today" title={`Your plan for ${dayName}`} sub={`${plan.reduce((a, m) => a + m.p, 0)} g protein`} href="/plan#week">
          {plan.map((m) => <NfCard key={m.id} m={m} />)}
        </Rail>
      )}
      {built.length > 0 && (
        <Rail id="r-day" title="Continue building your day" sub={`${built.reduce((a, m) => a + m.p, 0)} g protein so far`} href="/plan#day">
          {built.map((m) => <NfCard key={m.id} m={m} />)}
        </Rail>
      )}
      {saved.length > 0 && (
        <Rail id="r-saved" title="My list" sub="Recipes you saved with ♥" href="/menu">
          {saved.map((m) => <NfCard key={m.id} m={m} />)}
        </Rail>
      )}
    </div>
  );
}
