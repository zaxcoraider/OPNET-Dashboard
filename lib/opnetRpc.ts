/**
 * Lightweight OPNet JSON-RPC client using fetch().
 * Avoids importing the opnet SDK directly which has SSR complications.
 */

export const RPC_URLS: Record<string, string> = {
  "btc-mainnet": "https://mainnet.opnet.org/api/v1/json-rpc",
  "opnet-testnet": "https://testnet.opnet.org/api/v1/json-rpc",
};

interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

let _id = 1;

export async function rpc<T = unknown>(
  network: "btc-mainnet" | "opnet-testnet",
  method: string,
  params: unknown[] = []
): Promise<T> {
  const url = RPC_URLS[network];
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: _id++ }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: JsonRpcResponse<T> = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}

/** Batch multiple calls in a single HTTP request */
export async function rpcBatch<T = unknown[]>(
  network: "btc-mainnet" | "opnet-testnet",
  calls: { method: string; params?: unknown[] }[]
): Promise<T[]> {
  const url = RPC_URLS[network];
  const payloads = calls.map((c, i) => ({
    jsonrpc: "2.0",
    method: c.method,
    params: c.params ?? [],
    id: _id + i,
  }));
  _id += calls.length;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payloads),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const results: JsonRpcResponse<T>[] = await res.json();
  return results.map((r) => {
    if (r.error) throw new Error(r.error.message);
    return r.result as T;
  });
}

/* ── Helpers ── */

export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

export function formatSats(sats: number): string {
  return (sats / 1e8).toFixed(4) + " BTC";
}

export function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
