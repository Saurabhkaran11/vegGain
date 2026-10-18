import type { Metadata } from "next";
import { GroceryList } from "@/components/content/Grocery";
import { BayAreaStores } from "@/components/content/Shop";
import { SeasonalFruit } from "@/components/SeasonalFruit";
import { PageHead } from "@/components/PageHead";
import { ExchangeRate } from "@/components/content/LiveData";
import { PantryGuide } from "@/components/content/Pantry";

export const metadata: Metadata = { title: "Shop", description: "Weekly grocery list, long-life pantry foods, Bay Area stores by cuisine, and a seasonal fruit calendar." };

export default function ShopPage() {
  return (
    <>
      <PageHead eyebrow="Shop" title="Grocery list, pantry, stores and seasonal fruit" />
      <GroceryList />
      <PantryGuide />
      <ExchangeRate />
      <BayAreaStores />
      <SeasonalFruit />
    </>
  );
}
