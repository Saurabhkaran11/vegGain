import type { Metadata } from "next";
import { MealExplorer } from "@/components/MealExplorer";

export const metadata: Metadata = {
  title: "Menu",
  description: "High-protein vegetarian and vegan recipes from Indian, Korean, Chinese, Japanese, Thai, Mexican, Mediterranean and Italian cooking, plus drinks and fruit bowls.",
};

export default function MenuPage() {
  return <MealExplorer />;
}
