"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** A Netflix-style row: a title, then cards that slide sideways (swipe on touch, arrows on desktop). */
export function Rail({ id, title, sub, href, top = false, children }: {
  id: string; title: string; sub?: string; href?: string; top?: boolean; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className="rail" aria-labelledby={id}>
      <div className="rail-head">
        <h2 id={id}>{title}</h2>
        {sub && <span className="rail-sub">{sub}</span>}
        {href && <Link className="rail-more" href={href}>See all <span aria-hidden="true">›</span></Link>}
      </div>
      <div className="rail-wrap">
        <button type="button" className="rail-btn prev" hidden={edge.start} onClick={() => go(-1)} aria-label={`Scroll ${title} back`}>‹</button>
        <div className={`rail-track${top ? " is-top" : ""}`} ref={ref} role="list" tabIndex={0} aria-label={title}>
          {children}
        </div>
        <button type="button" className="rail-btn next" hidden={edge.end} onClick={() => go(1)} aria-label={`Scroll ${title} forward`}>›</button>
      </div>
    </section>
  );
}
