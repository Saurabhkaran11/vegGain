#!/usr/bin/env node
/**
 * VegGain 8 data agents runner.
 * Runs every agent in agents/<name>/agent.mjs in parallel, each with its own env file,
 * writes fresh results to data/<name>.json and a status report to data/agents-status.json.
 * A failing agent never blocks the app: its last good data file is kept.
 *
 *   node agents/run.mjs            run all agents (respecting each agent's TTL)
 *   node agents/run.mjs --force    ignore TTLs and refresh everything
 *   node agents/run.mjs --only=chefs,currency
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAgentEnv, num } from "./_lib/env.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const AGENTS = ["currency", "nutrition", "chefs", "photos"];
const args = process.argv.slice(2);
const force = args.includes("--force");
const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);

const readJSON = async (f, d) => { try { return JSON.parse(await readFile(f, "utf8")); } catch { return d; } };
const log = (name, msg) => console.log(`  ${name.padEnd(10)} ${msg}`);

async function runAgent(name, status) {
  const dir = path.join(ROOT, "agents", name);
  const resources = await readJSON(path.join(dir, "resources.json"), []);
  const { vars, file } = loadAgentEnv(dir);
  const prefix = name.toUpperCase();
  const ttlH = num(vars[`${prefix}_TTL_HOURS`], 0);
  const timeoutMs = num(vars[`${prefix}_TIMEOUT_MS`], 90000);
  const prev = status.agents?.[name];
  const outFile = path.join(DATA, `${name}.json`);

  if (!force && prev?.ok && ttlH > 0 && existsSync(outFile) && Date.now() - Date.parse(prev.lastSuccess) < ttlH * 3600e3) {
    log(name, `fresh (updated ${prev.lastSuccess}, TTL ${ttlH} h) — skipped`);
    return { ...prev, skipped: true, resources, envFile: file };
  }
  const started = Date.now();
  try {
    const mod = await import(path.join(dir, "agent.mjs"));
    const previous = await readJSON(outFile, null);
    let timer;
    const result = await Promise.race([
      mod.run({ env: vars, root: ROOT, previous, log: (m) => log(name, m) }),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`timed out after ${timeoutMs / 1000}s`)), timeoutMs); }),
    ]).finally(() => clearTimeout(timer));
    const updatedAt = new Date().toISOString();
    if (result.data !== undefined) await writeFile(outFile, JSON.stringify({ updatedAt, ...result.data }, null, 1));
    log(name, `✓ ${result.summary} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    return { ok: true, lastRun: updatedAt, lastSuccess: updatedAt, summary: result.summary, warnings: result.warnings || [], durationMs: Date.now() - started, resources, envFile: file };
  } catch (e) {
    log(name, `✗ ${e.message} — keeping previous data`);
    return { ...(prev || {}), ok: false, lastRun: new Date().toISOString(), error: String(e.message || e), durationMs: Date.now() - started, resources, envFile: file };
  }
}

async function main() {
  await mkdir(DATA, { recursive: true });
  const statusFile = path.join(DATA, "agents-status.json");
  const status = await readJSON(statusFile, { agents: {} });
  const list = only.length ? AGENTS.filter((a) => only.includes(a)) : AGENTS;
  console.log(`\n▶ VegGain data agents: ${list.join(", ")}${force ? " (forced)" : ""}`);
  const results = await Promise.all(list.map((n) => runAgent(n, status)));
  list.forEach((n, i) => (status.agents[n] = results[i]));
  status.lastRun = new Date().toISOString();
  await writeFile(statusFile, JSON.stringify(status, null, 1));
  console.log("✔ Agents finished. Data in data/*.json\n");
  process.exit(0); // don't wait for slow requests from an agent that already timed out
}

main().catch((e) => { console.error("Agent runner error (app will still start):", e.message); process.exit(0); });
