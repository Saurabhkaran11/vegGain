import type { Metadata } from "next";
import { Chefs, LearnEarn, RunDeploy } from "@/components/content/Learn";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Learn & earn", description: "Indian vegetarian chefs, YouTube cooking channels, YouTube monetization, business ideas and how to deploy this site." };

export default function LearnPage() {
  return (
    <>
      <PageHead eyebrow="Learn & earn" title="Cook along, then turn it into income" />
      <Chefs />
      <LearnEarn />
      <RunDeploy />
    </>
  );
}
