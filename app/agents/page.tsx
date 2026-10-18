import type { Metadata } from "next";
import { agentStatus, fmtDate } from "@/lib/data";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Data agents", description: "The data agents that refresh chef videos, nutrition, exchange rates and photo credits every time VegGain 8 starts." };

const INFO: Record<string, { title: string; does: string; env: string[]; output: string; usedOn: string }> = {
  chefs: { title: "Chefs agent", does: "Fetches each chef’s latest YouTube videos and keeps only vegetarian ones (no meat, fish or eggs). Topics listed in lib/hidden-topics.json are left out.", env: ["CHEFS_YOUTUBE_API_KEY (optional)", "CHEFS_MAX_VIDEOS", "CHEFS_VEG_ONLY", "CHEFS_EXCLUDE_TERMS", "CHEFS_TTL_HOURS"], output: "data/chefs.json", usedOn: "Chefs pages, recipe video links" },
  nutrition: { title: "Nutrition agent", does: "Pulls protein, calories, iron, calcium, zinc and vitamin C per 100 g for the core vegetarian protein foods.", env: ["NUTRITION_USDA_API_KEY", "NUTRITION_MAX_SEARCHES", "NUTRITION_TTL_HOURS"], output: "data/nutrition.json", usedOn: "Health page protein table" },
  currency: { title: "Currency agent", does: "Gets today’s USD exchange rates so US prices can be shown in rupees.", env: ["CURRENCY_BASE", "CURRENCY_TARGETS", "CURRENCY_TTL_HOURS"], output: "data/currency.json", usedOn: "Recipe cost section, Shop page" },
  photos: { title: "Photos agent", does: "Re-checks every photo credit on Wikimedia Commons and finds, crops and credits a photo for any new recipe.", env: ["PHOTOS_VERIFY_CREDITS", "PHOTOS_TTL_HOURS"], output: "public/meals/*.webp, lib/photo-credits.json", usedOn: "Every recipe card and page, Credits page" },
};

export default function AgentsPage() {
  const agents = agentStatus.agents ?? {};
  return (
    <>
      <PageHead
        eyebrow="Behind the scenes"
        title="Data agents"
        intro={`Four agents run automatically before the site builds (npm run app / npm run dev / npm run build). Each has its own settings file in agents/<name>/.env. Last run: ${fmtDate(agentStatus.lastRun)}.`}
      />
      <div className="agent-grid">
        {Object.entries(INFO).map(([key, info]) => {
          const s = agents[key];
          const state = !s ? "never" : s.ok ? (s.warnings?.length ? "warn" : "ok") : "fail";
          return (
            <section key={key} className="panel agent">
              <div className="agent-head">
                <h2>{info.title}</h2>
                <span className={`status ${state}`}>{state === "ok" ? "Healthy" : state === "warn" ? "Partial" : state === "fail" ? "Failed" : "Not run yet"}</span>
              </div>
              <p>{info.does}</p>
              <dl className="facts">
                <div><dt>Last result</dt><dd>{s?.ok ? s.summary : s?.error ?? "—"}</dd></div>
                <div><dt>Last success</dt><dd>{fmtDate(s?.lastSuccess)}</dd></div>
                <div><dt>Settings</dt><dd><code>agents/{key}/.env</code> ({info.env.join(", ")})</dd></div>
                <div><dt>Writes</dt><dd><code>{info.output}</code></dd></div>
                <div><dt>Used on</dt><dd>{info.usedOn}</dd></div>
              </dl>
              {!!s?.warnings?.length && (
                <details className="warns"><summary>{s.warnings.length} notes from the last run</summary><ul>{s.warnings.slice(0, 12).map((w) => <li key={w}>{w}</li>)}</ul></details>
              )}
              <h3>Resources used</h3>
              <ul className="res">
                {(s?.resources ?? []).map((r) => (
                  <li key={r.name}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a> <span className="pill">{r.cost}</span><br /><small>{r.type}{r.note ? ` · ${r.note}` : ""}</small></li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <section className="block">
        <div className="panel">
          <h2>Run the agents yourself</h2>
          <pre>{`npm run agents         # refresh (respects each agent's TTL)
npm run agents:force   # refresh everything now
node agents/run.mjs --only=chefs,currency`}</pre>
          <p className="muted">A failing agent never stops the site: it keeps its last good data and the error shows here.</p>
        </div>
      </section>
    </>
  );
}
