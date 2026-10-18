// Photo credits as a static JSON file, fetched by recipe pop-ups only when one is opened
// (keeps the 68 KB credits list out of every page's JavaScript).
import credits from "@/lib/photo-credits.json";

export const dynamic = "force-static";
export function GET() {
  return Response.json(credits, { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } });
}
