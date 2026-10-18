"use client";

import { useState } from "react";
import { usePlanner } from "./PlannerProvider";

export function AddDayButton({ id, className = "btn ghost" }: { id: string; className?: string }) {
  const { addToDay } = usePlanner();
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={className} onClick={() => { addToDay(id); setDone(true); }}>
      {done ? "✓ Added to my day" : "+ Add to my day"}
    </button>
  );
}
