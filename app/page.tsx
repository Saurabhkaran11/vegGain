import { Billboard, BrowseRows } from "@/components/content/Browse";
import { ExploreTiles, HowItWorks } from "@/components/content/Home";

export default function HomePage() {
  return (
    <>
      <Billboard />
      <BrowseRows />
      <HowItWorks />
      <ExploreTiles />
    </>
  );
}
