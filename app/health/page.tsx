import type { Metadata } from "next";
import { BrainFocus, KidneyCare, SkinHealth } from "@/components/content/Health";
import { PageHead } from "@/components/PageHead";
import { NutritionTable } from "@/components/content/LiveData";

export const metadata: Metadata = { title: "Health", description: "Nutrients vegetarians need for brain focus, healthy skin and kidney care, and what food can and cannot do." };

export default function HealthPage() {
  return (
    <>
      <PageHead eyebrow="Health" title="Focus, skin and kidney nutrition" intro="Food supports your health. It does not replace medical care." />
      <BrainFocus />
      <SkinHealth />
      <KidneyCare />
      <NutritionTable />
    </>
  );
}
