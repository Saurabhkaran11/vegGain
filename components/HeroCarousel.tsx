"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { photoSrc } from "@/lib/photo-src";
import { AddDayButton } from "./AddDayButton";

export type Slide = { id: string; name: string; kicker: string; p: number; kcal: number; time: string; usd: number; vegan: boolean; desc: string };

const DELAY = 6000;

/** Netflix-style hero: featured dishes that slide by themselves; pauses on hover, swipe or arrows to move. */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false); // reduced motion: no autoplay
  const touch = useRef<number | null>(null);
  const n = slides.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);
  // Load each photo once it is current or next, then keep it so the cross-fade has both images.
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0, 1]));
  useEffect(() => setLoaded((l) => (l.has(i) && l.has((i + 1) % n) ? l : new Set([...l, i, (i + 1) % n]))), [i, n]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(mq.matches);
    const on = () => setStill(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    if (paused || still || n < 2) return;
    const t = setTimeout(() => go(i + 1), DELAY);
    return () => clearTimeout(t);
  }, [i, paused, still, n, go]);
  // Stop sliding while the tab is hidden.
  useEffect(() => {
    const v = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", v);
    return () => document.removeEventListener("visibilitychange", v);
  }, []);

  const s = slides[i];
  return (
    <section
      className={`billboard hero-car${paused || still ? " is-paused" : ""}`}
      aria-roledescription="carousel" aria-label="Featured dishes"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      {slides.map((x, k) => (
        <div key={x.id} className={`hc-slide${k === i ? " on" : ""}`} aria-hidden={k !== i}>
          {loaded.has(k) && (
            <Image src={photoSrc(x.id)} alt="" fill priority={k === 0} sizes="(max-width: 1240px) 100vw, 1240px" className="bb-img" />
          )}
        </div>
      ))}
      <div className="bb-shade" />
      <div className="bb-body" key={s.id} aria-live={paused ? "polite" : "off"}>
        <p className="bb-kicker">{s.kicker}</p>
        <h1>{s.name}</h1>
        <p className="bb-facts">
          <span className="bb-match">{s.p} g protein</span>
          <span>{s.kcal} kcal</span><span>{s.time}</span><span>${s.usd.toFixed(2)}</span>
          {s.vegan && <span className="bb-pill">Vegan</span>}
        </p>
        <p className="bb-desc">{s.desc}</p>
        <div className="bb-actions">
          <Link className="btn bb-play" href={`/menu/${s.id}`}>▶ Cook it</Link>
          <AddDayButton key={s.id} id={s.id} className="btn bb-ghost" />
          <Link className="btn bb-ghost" href="/plan#targets">My 7-day plan</Link>
        </div>
      </div>
      {n > 1 && (
        <>
          <button type="button" className="hc-arrow prev" onClick={() => go(i - 1)} aria-label="Previous dish">‹</button>
          <button type="button" className="hc-arrow next" onClick={() => go(i + 1)} aria-label="Next dish">›</button>
          <div className="hc-dots" role="tablist" aria-label="Choose a featured dish">
            {slides.map((x, k) => (
              <button key={x.id} type="button" role="tab" aria-selected={k === i} aria-label={x.name} className={k === i ? "on" : k < i ? "done" : ""} onClick={() => go(k)}>
                <i style={k === i ? { animationDuration: `${DELAY}ms` } : undefined} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
