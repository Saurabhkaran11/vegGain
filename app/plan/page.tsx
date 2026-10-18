import type { Metadata } from "next";
import { DayBuilder } from "@/components/DayBuilder";
import { PlanTimeline } from "@/components/content/Plan";
import { PageHead } from "@/components/PageHead";
import { TargetCalculator } from "@/components/TargetCalculator";
import { WeekPlan } from "@/components/WeekPlan";

export const metadata: Metadata = {
  title: "Plan",
  description: "Protein and calorie calculator, an automatic 7-day vegetarian meal plan with a grocery list, a day builder and the 8-week progression.",
};

export default function PlanPage() {
  return (
    <>
      <PageHead eyebrow="Plan" title="Your targets, your week, your 8 weeks" />
      <nav className="plan-steps" aria-label="Plan steps">
        <a href="#targets"><span>1</span>Calculator</a>
        <a href="#week"><span>2</span>7-day plan</a>
        <a href="#grocery"><span>✓</span>Grocery list</a>
        <a href="#day"><span>3</span>Day builder</a>
      </nav>
      <TargetCalculator />
      <WeekPlan />
      <DayBuilder />
      <PlanTimeline />
    </>
  );
}
