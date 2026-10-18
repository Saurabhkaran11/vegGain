import type { Metadata } from "next";
import { chefsUpdatedAt, fmtDate } from "@/lib/data";
import { chefSummaries } from "@/lib/chef-data";
import { PageHead } from "@/components/PageHead";
import { ChefDirectory } from "@/components/ChefDirectory";

export const metadata: Metadata = {
  title: "Chefs",
  description: "20 Indian and world YouTube chefs who cook vegetarian food. Open a chef to see all their latest videos and VegGain recipes, or compare 2–4 chefs side by side.",
};

export default function ChefsPage() {
  const { chefs } = chefSummaries();
  const videos = chefs.reduce((a, c) => a + c.videos.length, 0);
  return (
    <>
      <PageHead
        eyebrow="Chefs"
        title="Cook along with your favorite chefs"
        intro={`${chefs.length} chefs and ${videos} of their latest vegetarian videos (updated ${fmtDate(chefsUpdatedAt)}; meat, fish and egg dishes filtered out). Open a chef to see everything they have, or pick a few to compare side by side.`}
      />
      <ChefDirectory chefs={chefs} />
    </>
  );
}
