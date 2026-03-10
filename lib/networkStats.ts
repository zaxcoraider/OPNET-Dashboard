/**
 * Live Bitcoin network stats from mempool.space public API.
 * Used by NetworkActivity, Tokens, and DeFi tabs.
 */

const MEMPOOL = 'https://mempool.space/api';

export interface BtcNetworkStats {
  blockHeight: number;
  mempoolTxCount: number;
  mempoolVsize: number;   // vbytes
  feesFast: number;       // sat/vB
  feesMid: number;
  feesEco: number;
  hashrateEHs: number;    // EH/s
  difficultyTrillion: number;
  nextDifficultyAdjustment: number; // estimated blocks
  btcPriceUSD: number;
}

async function mget<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${MEMPOOL}${path}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchBtcNetworkStats(): Promise<BtcNetworkStats> {
  const [heightR, feesR, mempoolR, miningR, priceR] = await Promise.allSettled([
    mget<number>('/blocks/tip/height'),
    mget<{ fastestFee: number; halfHourFee: number; economyFee: number }>('/v1/fees/recommended'),
    mget<{ count: number; vsize: number }>('/mempool'),
    mget<{ currentHashrate: number; currentDifficulty: number }>('/v1/mining/hashrate/1w'),
    mget<{ USD: number }>('/v1/prices'),
  ]);

  const blockHeight  = heightR.status === 'fulfilled'  && heightR.value  != null ? heightR.value                  : 892_441;
  const fees         = feesR.status === 'fulfilled'    && feesR.value            ? feesR.value                    : null;
  const mempool      = mempoolR.status === 'fulfilled' && mempoolR.value         ? mempoolR.value                 : null;
  const mining       = miningR.status === 'fulfilled'  && miningR.value          ? miningR.value                  : null;
  const priceData    = priceR.status === 'fulfilled'   && priceR.value           ? priceR.value                   : null;

  const feesFast = fees?.fastestFee  ?? 42;
  const feesMid  = fees?.halfHourFee ?? 28;
  const feesEco  = fees?.economyFee  ?? 12;

  const hashrateEHs       = mining?.currentHashrate
    ? +(mining.currentHashrate / 1e18).toFixed(1)
    : 620;
  const difficultyTrillion = mining?.currentDifficulty
    ? +(mining.currentDifficulty / 1e12).toFixed(1)
    : 88.1;

  const mempoolTxCount = mempool?.count    ?? 4_821;
  const mempoolVsize   = mempool?.vsize    ?? 0;

  const btcPriceUSD = priceData?.USD ?? 62_840;

  // Bitcoin adjusts difficulty every 2016 blocks
  const nextDifficultyAdjustment = 2016 - (blockHeight % 2016);

  return {
    blockHeight,
    mempoolTxCount,
    mempoolVsize,
    feesFast,
    feesMid,
    feesEco,
    hashrateEHs,
    difficultyTrillion,
    nextDifficultyAdjustment,
    btcPriceUSD,
  };
}

/** Lightweight single-value fetch for current BTC price (USD). */
export async function fetchBtcPrice(): Promise<number | null> {
  const data = await mget<{ USD: number }>('/v1/prices');
  return data?.USD ?? null;
}

/** Fetch mempool-based fee estimates */
export async function fetchFeeEstimates(): Promise<{ fast: number; mid: number; eco: number }> {
  const data = await mget<{ fastestFee: number; halfHourFee: number; economyFee: number }>('/v1/fees/recommended');
  return {
    fast: data?.fastestFee  ?? 42,
    mid:  data?.halfHourFee ?? 28,
    eco:  data?.economyFee  ?? 12,
  };
}

/** Last N confirmed blocks (for live feed). */
export async function fetchLatestBlocks(n = 5): Promise<Array<{ height: number; tx_count: number; timestamp: number }>> {
  try {
    const res = await fetch(`${MEMPOOL}/blocks`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const blocks: Array<{ height: number; tx_count: number; timestamp: number }> = await res.json();
    return blocks.slice(0, n);
  } catch {
    return [];
  }
}
