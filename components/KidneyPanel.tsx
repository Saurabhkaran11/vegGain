// Server component: sodium, potassium and phosphorus for a Kidney care recipe, against NKF targets.
import Link from "next/link";
import type { Meal } from "@/lib/meals";
import { kidneyProteinNote, kidneyRows } from "@/lib/kidney";

export function KidneyPanel({ meal }: { meal: Meal }) {
  const rows = kidneyRows(meal);
  if (!rows || !meal.rn) return null;
  const kind = meal.rn.kind === "meal" ? "meal" : "snack or drink";
  return (
    <div className="kidney-box">
      <p className="eyebrow">Kidney numbers · per serving</p>
      <div className="scroll">
        <table className="kidney-table">
          <thead>
            <tr><th scope="col">Nutrient</th><th scope="col">This recipe</th><th scope="col">NKF {kind} target</th><th scope="col"><span className="sr-only">Result</span></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.label}</th>
                <td>{r.value} mg</td>
                <td>under {r.limit} mg</td>
                <td className={r.ok ? "ok" : "over"}>{r.ok ? "✓ Within" : "Above"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{kidneyProteinNote(meal)}</p>
      {meal.tip && <p><b>Kidney tip:</b> {meal.tip}</p>}
      <p className="muted small">
        Estimated from USDA FoodData Central values for each ingredient; brands vary. The potassium and phosphorus targets matter only if your care team has asked you to limit them. <Link href="/health#kidney">Kidney diet guide →</Link>
      </p>
    </div>
  );
}
