import type { Metadata } from "next";
import Link from "next/link";
import { chefSummaries } from "@/lib/chef-data";
import { ChefCompare } from "@/components/ChefCompare";

export const metadata: Metadata = {
  title: "Compare chefs",
  description: "Put 2–4 vegetarian YouTube chefs side by side: every latest video and every VegGain recipe in their cuisine, lined up by topic and meal.",
};

export default function ComparePage() {
  const { chefs, recipes } = chefSummaries();
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden="true">›</span> <Link href="/chefs">Chefs</Link> <span aria-hidden="true">›</span> <span aria-current="page">Compare</span>
      </nav>
      <div className="page-head" style={{ paddingTop: 8 }}>
        <p className="eyebrow">Compare chefs</p>
        <h1>Side by side</h1>
        <p>Every video and recipe for each chef, in matching rows: pick a topic to line up, say, everyone’s paneer dishes, and compare recipes meal by meal.</p>
      </div>
      <ChefCompare chefs={chefs} recipes={recipes} />
    </>
  );
}
