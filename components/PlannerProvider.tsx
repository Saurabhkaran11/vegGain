"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DESIGN_STYLES, SAMPLE_INDIAN_DAY, type CuisineFilter, type Diet, type DesignStyle, type Slot, type ViewMode } from "@/lib/meal-meta";
import { DEFAULT_PROFILE, computeTargets, sanitize, type Profile, type Targets } from "@/lib/targets";

type Currency = "USD" | "INR";

type PlannerState = {
  style: DesignStyle;
  setStyle: (s: DesignStyle) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  day: string[];
  setDay: (d: string[]) => void;
  addToDay: (id: string) => void;
  removeFromDay: (index: number) => void;
  slot: "all" | Slot;
  setSlot: (s: "all" | Slot) => void;
  diet: "all" | Diet;
  setDiet: (d: "all" | Diet) => void;
  cuisine: CuisineFilter;
  setCuisine: (c: CuisineFilter) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  favs: string[];
  toggleFav: (id: string) => void;
  drawerOpen: boolean;
  setDrawerOpen: (o: boolean) => void;
  profile: Profile;
  setProfile: (p: Profile) => void;
  targets: Targets;
  /** True once saved settings have been read from this browser (targets before that are the defaults). */
  ready: boolean;
};

const PlannerContext = createContext<PlannerState | null>(null);

// localStorage can throw (private windows, blocked storage); never let that break the page.
export function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem("vg8." + key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}
export function write(key: string, value: unknown) {
  try {
    localStorage.setItem("vg8." + key, JSON.stringify(value));
  } catch {}
}

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyleState] = useState<DesignStyle>("bento");
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [day, setDayState] = useState<string[]>(SAMPLE_INDIAN_DAY);
  const [slot, setSlot] = useState<"all" | Slot>("all");
  const [diet, setDiet] = useState<"all" | Diet>("all");
  const [cuisine, setCuisine] = useState<CuisineFilter>("all");
  const [view, setViewState] = useState<ViewMode>("grid");
  const [favs, setFavs] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);

  // Restore saved preferences after hydration (keeps server and client HTML identical).
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const fromHash = DESIGN_STYLES.find((d) => d.value === hash)?.value;
    setStyleState(fromHash ?? read<DesignStyle>("style", "bento"));
    setCurrencyState(read<Currency>("cur", "USD"));
    setDayState(read<string[]>("day", SAMPLE_INDIAN_DAY));
    setViewState(read<ViewMode>("view", "grid"));
    setFavs(read<string[]>("favs", []));
    setProfileState(sanitize(read<Partial<Profile> | null>("profile", null)));
    setReady(true);
  }, []);

  // The whole page is themed by body[data-style].
  useEffect(() => {
    document.body.dataset.style = style;
  }, [style]);

  const setStyle = useCallback((s: DesignStyle) => { setStyleState(s); write("style", s); }, []);
  const setCurrency = useCallback((c: Currency) => { setCurrencyState(c); write("cur", c); }, []);
  const setDay = useCallback((d: string[]) => { setDayState(d); write("day", d); }, []);
  const addToDay = useCallback((id: string) => {
    setDayState((d) => { const next = [...d, id]; write("day", next); return next; });
  }, []);
  const setView = useCallback((v: ViewMode) => { setViewState(v); write("view", v); }, []);
  const toggleFav = useCallback((id: string) => {
    setFavs((f) => { const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; write("favs", next); return next; });
  }, []);
  const setProfile = useCallback((p: Profile) => { const v = sanitize(p); setProfileState(v); write("profile", v); }, []);
  const targets = useMemo(() => computeTargets(profile), [profile]);
  const removeFromDay = useCallback((index: number) => {
    setDayState((d) => { const next = d.filter((_, i) => i !== index); write("day", next); return next; });
  }, []);

  // Memoized so components only re-render when a value they read actually changes.
  const value = useMemo(
    () => ({ style, setStyle, currency, setCurrency, day, setDay, addToDay, removeFromDay, slot, setSlot, diet, setDiet, cuisine, setCuisine, view, setView, favs, toggleFav, drawerOpen, setDrawerOpen, profile, setProfile, targets, ready }),
    [style, setStyle, currency, setCurrency, day, setDay, addToDay, removeFromDay, slot, diet, cuisine, view, setView, favs, toggleFav, drawerOpen, profile, setProfile, targets, ready]
  );

  return (
    <PlannerContext.Provider value={value}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside <PlannerProvider>");
  return ctx;
}
