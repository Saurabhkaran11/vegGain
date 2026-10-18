import { photoCredit } from "@/lib/photos";

/** Photo credit under a recipe photo (server component: the credits list never ships to the browser). */
export function PhotoCreditLine({ id }: { id: string }) {
  const c = photoCredit(id);
  if (!c) return null;
  return (
    <p className="credit">
      Photo: <a href={c.page} target="_blank" rel="noopener noreferrer">{c.title}</a> by {c.author} ·{" "}
      {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">{c.license}</a> : c.license} · {c.source}
    </p>
  );
}
