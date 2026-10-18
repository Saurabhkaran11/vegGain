// Fetch helpers with timeout + retries. Uses Node 18+ global fetch.
export const UA_BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
export const UA_BOT = "VegGain8-data-agents/1.0 (personal nutrition site)";

export async function getText(url, { headers = {}, timeout = 20000, retries = 2 } = {}) {
  let last;
  for (let a = 0; a <= retries; a++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true });
      return await res.text();
    } catch (e) {
      last = e;
      if (e.fatal) break;
      await new Promise((r) => setTimeout(r, (String(e.message).includes("429") ? 4000 : 800) * (a + 1)));
    }
  }
  throw last;
}
export const getJSON = async (url, opts) => JSON.parse(await getText(url, opts));

/** Run async fn over items with limited concurrency. */
export async function pool(items, size, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}
