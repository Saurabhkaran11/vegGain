import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import { PlannerProvider } from "@/components/PlannerProvider";
import { Header } from "@/components/Header";
import { CategoryDrawer } from "@/components/CategoryDrawer";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// next/font self-hosts the fonts at build time: no layout shift and no browser requests to Google.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--f-bricolage", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--f-instrument", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["700"], variable: "--f-fraunces", display: "swap", preload: false });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "VegGain 8 — High-protein vegetarian & vegan meal plan", template: "%s · VegGain 8" },
  description:
    "Easy high-protein vegetarian and vegan recipes from 8 cuisines, plus drinks and fruit bowls, with cost, YouTube guides, Bay Area shopping and an 8-week plan for muscle, weight, focus and skin.",
  openGraph: { title: "VegGain 8", description: "High-protein vegetarian & vegan meal plan for 8 weeks.", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${fraunces.variable} ${mono.variable}`} suppressHydrationWarning>
      <body data-style="bento">
        <PlannerProvider>
          <div className="art" aria-hidden="true"><i /><i /><i /></div>
          <a className="skip" href="#main">Skip to content</a>
          <Header />
          <CategoryDrawer />
          <main id="main" className="wrap">{children}</main>
          <Footer />
        </PlannerProvider>
      </body>
    </html>
  );
}
