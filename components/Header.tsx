"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESIGN_STYLES, type DesignStyle } from "@/lib/meal-meta";
import { PAGES } from "@/lib/site";
import { usePlanner } from "./PlannerProvider";

export function Header() {
  const { style, setStyle, currency, setCurrency, drawerOpen, setDrawerOpen } = usePlanner();
  const pathname = usePathname();
  return (
    <header>
      <div className="wrap bar">
        <div className="brand">
          <button
            className="burger"
            aria-label="Open categories and pages"
            aria-controls="categories"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span className="burger-ico" aria-hidden="true"><i /><i /><i /></span>
          </button>
          <Link href="/" className="logo">Veg<b>Gain</b>&nbsp;8 <small>8-WEEK PLAN</small></Link>
        </div>
        <nav className="jump" aria-label="Pages">
          {PAGES.slice(1).filter((p) => p.href !== "/agents").map((p) => (
            <Link key={p.href} href={p.href} aria-current={pathname === p.href ? "page" : undefined}>{p.label}</Link>
          ))}
        </nav>
        <div className="ctrls">
          <label htmlFor="style">Design</label>
          <span className="selwrap">
            <select id="style" value={style} onChange={(e) => setStyle(e.target.value as DesignStyle)}>
              {DESIGN_STYLES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </span>
          <span className="seg" role="group" aria-label="Currency">
            <button className="chip" aria-pressed={currency === "USD"} onClick={() => setCurrency("USD")}>USD $</button>
            <button className="chip" aria-pressed={currency === "INR"} onClick={() => setCurrency("INR")}>INR ₹</button>
          </span>
        </div>
      </div>
    </header>
  );
}
