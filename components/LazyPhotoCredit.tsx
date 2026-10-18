"use client";

import { useEffect, useState } from "react";

type Credit = { title: string; author: string; license: string; licenseUrl: string; source: string; page: string };
let cache: Promise<Record<string, Credit>> | null = null;
const load = (): Promise<Record<string, Credit>> => (cache ??= fetch("/photo-credits.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

/** Photo credit for a recipe pop-up, loaded only when the pop-up is opened. */
export function LazyPhotoCredit({ id }: { id: string }) {
  const [c, setC] = useState<Credit | null>(null);
  useEffect(() => { let on = true; load().then((all) => on && setC(all[id] ?? null)); return () => { on = false; }; }, [id]);
  if (!c) return null;
  return (
    <p className="credit">
      Photo: <a href={c.page} target="_blank" rel="noopener noreferrer">{c.title}</a> by {c.author} ·{" "}
      {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">{c.license}</a> : c.license} · {c.source}
    </p>
  );
}
