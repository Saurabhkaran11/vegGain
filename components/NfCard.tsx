import Image from "next/image";
import Link from "next/link";
import { photoSrc } from "@/lib/photo-src";

export type CardMeal = { id: string; name: string; p: number; kcal: number; time: string; tag?: string };

/** Poster card for the browse rows: photo with the name over it; grows and shows details on hover. */
export function NfCard({ m, rank, priority = false }: { m: CardMeal; rank?: number; priority?: boolean }) {
  return (
    <div role="listitem" className={`nf-item${rank ? " ranked" : ""}`}>
      {rank && <span className="nf-rank" aria-hidden="true">{rank}</span>}
      <Link href={`/menu/${m.id}`} className="nf-card">
        <Image src={photoSrc(m.id)} alt="" fill sizes="(max-width: 640px) 46vw, 250px" priority={priority} />
        {m.tag && <span className="nf-tag">{m.tag}</span>}
        <span className="nf-info">
          <b>{m.name}</b>
          <small><span className="nf-p">{m.p} g protein</span> · {m.kcal} kcal · {m.time.replace(/\s*\(.*\)/, "")}</small>
        </span>
      </Link>
    </div>
  );
}
