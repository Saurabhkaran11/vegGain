// Tiny .env loader: each agent reads agents/<name>/.env (falls back to .env.example), then process.env overrides.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export function loadAgentEnv(dir) {
  const pick = ["." + "env", ".env.example"].map((f) => path.join(dir, f)).find(existsSync);
  const vars = {};
  if (pick) {
    for (const line of readFileSync(pick, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      vars[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  for (const k of Object.keys(vars)) if (process.env[k]) vars[k] = process.env[k];
  return { vars, file: pick ? path.basename(pick) : null };
}

export const num = (v, d) => (v === undefined || v === "" || isNaN(Number(v)) ? d : Number(v));
export const bool = (v, d) => (v === undefined || v === "" ? d : /^(1|true|yes|on)$/i.test(v));
