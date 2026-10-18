import Image from "next/image";
import type { Meal } from "@/lib/meal-meta";
import { photoSrc } from "@/lib/photo-src";

type Props = { meal: Meal; sizes?: string; eager?: boolean; className?: string };

/** Real photo of the dish (Wikimedia Commons / Openverse, credited on /credits). */
export function MealPhoto({ meal, sizes = "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw", eager = false, className = "" }: Props) {
  return (
    <figure className={`photo ${className}`}>
      <Image
        src={photoSrc(meal.id)}
        alt={meal.name}
        width={800}
        height={600}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
      />
    </figure>
  );
}

