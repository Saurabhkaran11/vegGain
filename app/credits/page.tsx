import type { Metadata } from "next";
import Link from "next/link";
import { MEALS } from "@/lib/meals";
import { photoCredit } from "@/lib/photos";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Photo credits", description: "Sources and licenses for the food photos on VegGain 8." };

export default function CreditsPage() {
  return (
    <>
      <PageHead
        eyebrow="Credits"
        title="Photo credits"
        intro="All dish photos are real photographs shared under Creative Commons licenses or in the public domain, found through Wikimedia Commons and Openverse. Photos were cropped to fit the cards."
      />
      <div className="panel scroll">
        <table>
          <thead><tr><th scope="col">Recipe</th><th scope="col">Photo</th><th scope="col">Author</th><th scope="col">License</th><th scope="col">Source</th></tr></thead>
          <tbody>
            {MEALS.map((m) => {
              const c = photoCredit(m.id);
              if (!c) return null;
              return (
                <tr key={m.id}>
                  <th scope="row"><Link href={`/menu/${m.id}`}>{m.name}</Link></th>
                  <td><a href={c.page} target="_blank" rel="noopener noreferrer">{c.title}</a></td>
                  <td>{c.author}</td>
                  <td>{c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">{c.license}</a> : c.license}</td>
                  <td>{c.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
