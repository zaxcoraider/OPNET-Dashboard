/**
 * NFT market data — Ordzaar API (primary) + Magic Eden fallback for activity.
 */

const ME_BASE       = 'https://api-mainnet.magiceden.dev/v2/ord/btc';
const ORDZAAR_BASE  = 'https://ordzaar.com/api';

/* ── Types ─────────────────────────────────────────────────────────────── */

export type NftNetwork = 'ordinals' | 'opnet';

export interface NftCollection {
  slug: string;          // Magic Eden / internal symbol
  ordzaarSlug?: string;  // Ordzaar collection slug (may differ from slug)
  name: string;
  description: string;
  category: string;
  color: string;
  bgPattern: string;
  network: NftNetwork;
  image?: string;        // Live image URL from Ordzaar or CDN
  // Live-fetched fields (undefined until loaded)
  floorSats?: number;
  floorBTC?: string;
  volume7dSats?: number;
  volume7dBTC?: string;
  supply?: number;
  totalListed?: number;
  owners?: number;
  floorChange24h?: number;
}

export interface NftActivity {
  id: string;
  kind: 'buy' | 'sell' | 'list' | 'delist' | 'transfer';
  tokenId: string;
  priceSats?: number;
  priceDisplay?: string;
  from?: string;
  to?: string;
  date: string;
  txId?: string;
}

/* ── Curated collection catalog ─────────────────────────────────────────── */

export const COLLECTIONS: NftCollection[] = [
  {
    slug: 'motocat_racing',
    ordzaarSlug: 'motocats',
    name: 'Motocat Racing Club',
    description: 'Mascots of Bitcoin-native DeFi. 10,000 on-chain cats racing into the Motoswap era of yield farming, staking, and more — all on Bitcoin Layer 1!',
    category: 'OPNet PFP',
    color: '#f7931a',
    bgPattern: 'from-orange-900/40 to-yellow-950/10',
    network: 'opnet',
    image: 'https://creator-hub-prod.s3.us-east-2.amazonaws.com/ord-motocats_pfp_1754578871657.png',
    supply: 10000,
  },
  {
    slug: 'nodemonkes',
    ordzaarSlug: 'nodemonkes',
    name: 'NodeMonkes',
    description: 'The first 10k collection inscribed on Bitcoin block data.',
    category: 'PFP',
    color: '#7b3fe4',
    bgPattern: 'from-purple-900/30 to-purple-950/10',
    network: 'ordinals',
  },
  {
    slug: 'bitcoin-puppets',
    ordzaarSlug: 'bitcoin-puppets',
    name: 'Bitcoin Puppets',
    description: 'Chaotic hand-drawn puppets. One of the largest Ordinals collections.',
    category: 'PFP',
    color: '#e879f9',
    bgPattern: 'from-pink-900/30 to-pink-950/10',
    network: 'ordinals',
  },
  {
    slug: 'quantum_cats',
    ordzaarSlug: 'quantum_cats',
    name: 'Quantum Cats',
    description: 'Schrodinger\'s cats inscribed on Bitcoin — pioneering OP_CAT advocacy.',
    category: 'Art',
    color: '#22d3ee',
    bgPattern: 'from-cyan-900/30 to-cyan-950/10',
    network: 'ordinals',
  },
  {
    slug: 'bitcoin-frogs',
    ordzaarSlug: 'bitcoin-frogs',
    name: 'Bitcoin Frogs',
    description: '10,000 frogs sitting on the Bitcoin blockchain.',
    category: 'PFP',
    color: '#34d399',
    bgPattern: 'from-green-900/30 to-green-950/10',
    network: 'ordinals',
  },
  {
    slug: 'taproot_wizards',
    ordzaarSlug: 'taproot_wizards',
    name: 'Taproot Wizards',
    description: 'Magical wizards pushing the boundaries of what\'s possible on Bitcoin.',
    category: 'Art',
    color: '#a78bfa',
    bgPattern: 'from-violet-900/30 to-violet-950/10',
    network: 'ordinals',
  },
  {
    slug: 'honey_badgers',
    ordzaarSlug: 'honey_badgers',
    name: 'Honey Badgers',
    description: 'Fearless honey badgers on Bitcoin. The OG Bitcoin spirit animal.',
    category: 'PFP',
    color: '#f59e0b',
    bgPattern: 'from-amber-900/30 to-amber-950/10',
    network: 'ordinals',
  },
  {
    slug: 'bitcoin-wizards',
    ordzaarSlug: 'bitcoin-wizards',
    name: 'Bitcoin Wizards',
    description: '1,338 wizards living on the Bitcoin blockchain since the early days.',
    category: 'Art',
    color: '#60a5fa',
    bgPattern: 'from-blue-900/30 to-blue-950/10',
    network: 'ordinals',
  },
  {
    slug: 'bitcoinshrooms',
    ordzaarSlug: 'bitcoinshrooms',
    name: 'Bitcoin Shrooms',
    description: 'Rare psychedelic mushrooms inscribed on Bitcoin. One of the highest floor collections.',
    category: 'Art',
    color: '#86efac',
    bgPattern: 'from-green-900/30 to-emerald-950/10',
    network: 'ordinals',
  },
  {
    slug: 'ordzaarpass',
    ordzaarSlug: 'ordzaarpass',
    name: 'Ordzaar Pass',
    description: 'Official Ordzaar marketplace access pass — holder perks and fee discounts.',
    category: 'Utility',
    color: '#fb923c',
    bgPattern: 'from-orange-900/30 to-orange-950/10',
    network: 'ordinals',
  },
  {
    slug: 'opium',
    ordzaarSlug: 'opium',
    name: 'O.P.I.U.M.',
    description: '777 iconic pieces — one of the most exclusive fine art collections on Ordinals.',
    category: 'Art',
    color: '#f43f5e',
    bgPattern: 'from-rose-900/30 to-rose-950/10',
    network: 'ordinals',
  },
  {
    slug: 'ordinalpunks',
    name: 'OrdinalPunks',
    description: 'The OG 100 hand-made punks inscribed in the first 650 blocks.',
    category: 'PFP',
    color: '#ef4444',
    bgPattern: 'from-red-900/30 to-red-950/10',
    network: 'ordinals',
  },
];

/* ── Ordzaar API types ─────────────────────────────────────────────────── */

interface OrdzaarCollection {
  slug: string;
  name: string;
  image?: string;
  imageURI?: string;
  supply?: number;
  floorPrice?: number;   // sats
  volume?: number;       // current period
  volumeTotal?: number;  // all-time
  listed?: number;
  owners?: number;
  verified?: boolean;
}

interface OrdzaarResponse {
  success: boolean;
  data: {
    collections: OrdzaarCollection[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/* ── Ordzaar API helper ──────────────────────────────────────────────────── */

async function fetchOrdzaarCollections(page = 1, limit = 100): Promise<OrdzaarCollection[]> {
  try {
    const res = await fetch(
      `${ORDZAAR_BASE}/collections?page=${page}&limit=${limit}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return [];
    const data = await res.json() as OrdzaarResponse;
    return data.data?.collections ?? [];
  } catch {
    return [];
  }
}

/* ── Magic Eden API helpers ──────────────────────────────────────────────── */

interface MEStats {
  floorPrice?: number;
  totalVolume?: number;
  volume24h?: number;
  volume7d?: number;
  listedCount?: number;
  ownerCount?: number;
  totalItems?: number;
  floorPriceChange24h?: number;
}

interface MEActivity {
  kind: string;
  tokenInscriptionNumber?: string | number;
  tokenMint?: string;
  price?: number;
  buyer?: string;
  seller?: string;
  source?: string;
  blockTime?: number;
  txId?: string;
  listedPrice?: number;
}

async function meGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${ME_BASE}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function satsToBTC(sats: number): string {
  return (sats / 1e8).toFixed(4);
}

function shortenAddr(addr: string): string {
  if (!addr || addr.length <= 16) return addr;
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

/* ── Live stats for one Ordinals collection (Magic Eden fallback) ────────── */

export async function fetchCollectionStats(slug: string): Promise<Partial<NftCollection>> {
  const stats = await meGet<MEStats>(`/collections/${slug}/stats`);
  if (!stats) return {};
  return {
    floorSats: stats.floorPrice,
    floorBTC: stats.floorPrice != null ? satsToBTC(stats.floorPrice) : undefined,
    volume7dSats: stats.volume7d ?? stats.totalVolume,
    volume7dBTC: (stats.volume7d ?? stats.totalVolume) != null
      ? satsToBTC((stats.volume7d ?? stats.totalVolume)!)
      : undefined,
    totalListed: stats.listedCount,
    owners: stats.ownerCount,
    supply: stats.totalItems,
    floorChange24h: stats.floorPriceChange24h,
  };
}

/* ── Batch load stats — Ordzaar primary, Magic Eden fallback ─────────────── */

export async function enrichCollections(
  collections: NftCollection[],
): Promise<NftCollection[]> {
  // Fetch first 2 pages from Ordzaar (up to 200 collections) to cover our list
  const [page1, page2] = await Promise.all([
    fetchOrdzaarCollections(1, 100),
    fetchOrdzaarCollections(2, 100),
  ]);
  const ordzaarData = [...page1, ...page2];

  // Build a lookup map by slug
  const ordzaarMap = new Map<string, OrdzaarCollection>();
  for (const c of ordzaarData) {
    ordzaarMap.set(c.slug, c);
  }

  const enriched = await Promise.all(
    collections.map(async (col): Promise<NftCollection> => {
      // Try Ordzaar first
      const oz = ordzaarMap.get(col.ordzaarSlug ?? col.slug);
      if (oz) {
        const floorSats = oz.floorPrice && oz.floorPrice > 0 ? oz.floorPrice : undefined;
        return {
          ...col,
          image: oz.image ?? oz.imageURI ?? col.image,
          floorSats,
          floorBTC: floorSats != null ? satsToBTC(floorSats) : col.floorBTC,
          supply: oz.supply ?? col.supply,
          totalListed: oz.listed ?? col.totalListed,
          owners: oz.owners && oz.owners > 0 ? oz.owners : col.owners,
          volume7dSats: oz.volume && oz.volume > 0 ? oz.volume : col.volume7dSats,
          volume7dBTC: oz.volume && oz.volume > 0 ? satsToBTC(oz.volume) : col.volume7dBTC,
        };
      }

      // Fallback: Magic Eden for ordinals
      if (col.network === 'ordinals') {
        const extra = await fetchCollectionStats(col.slug);
        return { ...col, ...extra };
      }

      return col;
    }),
  );

  return enriched;
}

/* ── Activity for a collection ───────────────────────────────────────────── */

export async function fetchCollectionActivity(
  col: NftCollection,
  limit = 30,
): Promise<NftActivity[]> {
  if (col.network === 'ordinals') {
    return fetchOrdinalsActivity(col.slug, limit);
  }
  return generateOpNetActivity(col.name, limit);
}

async function fetchOrdinalsActivity(
  slug: string,
  limit: number,
): Promise<NftActivity[]> {
  const data = await meGet<MEActivity[]>(
    `/activities?collectionSymbol=${slug}&limit=${limit}` +
    `&kind[]=buying_broadcasted&kind[]=list&kind[]=delist`,
  );
  if (!data || !Array.isArray(data)) return generateFallbackActivity(slug, limit);

  return data.map((item, i): NftActivity => {
    const rawKind = item.kind ?? '';
    const kind: NftActivity['kind'] =
      rawKind === 'buying_broadcasted' ? 'buy'
      : rawKind === 'list' ? 'list'
      : rawKind === 'delist' ? 'delist'
      : rawKind === 'sale' ? 'sell'
      : 'transfer';

    const price = item.price ?? item.listedPrice;
    const date = item.blockTime
      ? new Date(item.blockTime * 1000).toLocaleString('en-US', {
          month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
        })
      : 'Pending';

    const tokenId = item.tokenInscriptionNumber != null
      ? `#${item.tokenInscriptionNumber}`
      : item.tokenMint
        ? item.tokenMint.slice(0, 8) + '…'
        : `#${i + 1}`;

    return {
      id: `${item.txId ?? i}-${i}`,
      kind,
      tokenId,
      priceSats: price,
      priceDisplay: price != null ? `${satsToBTC(price)} BTC` : undefined,
      from: item.seller ? shortenAddr(item.seller) : undefined,
      to: item.buyer ? shortenAddr(item.buyer) : undefined,
      date,
      txId: item.txId,
    };
  });
}

/* ── Fallback / OPNet simulated activity ────────────────────────────────── */

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateOpNetActivity(collectionName: string, limit: number): NftActivity[] {
  const rng = seededRng(collectionName.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const kinds: NftActivity['kind'][] = ['buy', 'sell', 'list', 'list', 'buy', 'buy', 'delist', 'transfer'];
  const now = Date.now();

  return Array.from({ length: limit }, (_, i): NftActivity => {
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const priceSats = Math.floor(rng() * 8_000_000 + 500_000);
    const ago = Math.floor(rng() * 7 * 24 * 3600 * 1000);
    const date = new Date(now - ago).toLocaleString('en-US', {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    const from = `opt1${Array.from({ length: 8 }, () => '0123456789abcdef'[Math.floor(rng() * 16)]).join('')}`;
    const to   = `opt1${Array.from({ length: 8 }, () => '0123456789abcdef'[Math.floor(rng() * 16)]).join('')}`;

    return {
      id: `opnet-${i}`,
      kind,
      tokenId: `#${Math.floor(rng() * 9999) + 1}`,
      priceSats: kind === 'transfer' ? undefined : priceSats,
      priceDisplay: kind === 'transfer' ? undefined : `${satsToBTC(priceSats)} BTC`,
      from: kind === 'buy' ? shortenAddr(from) : shortenAddr(to),
      to: kind === 'buy' ? shortenAddr(to) : shortenAddr(from),
      date,
    };
  });
}

function generateFallbackActivity(slug: string, limit: number): NftActivity[] {
  return generateOpNetActivity(slug, limit);
}

/* ── Aggregate top-level stats ───────────────────────────────────────────── */

export interface MarketStats {
  totalCollections: number;
  totalVolume7d: string;
  totalListed: number;
  topFloor: string;
}

export function computeMarketStats(cols: NftCollection[]): MarketStats {
  let vol = 0;
  let listed = 0;
  let topFloor = 0;

  for (const c of cols) {
    if (c.volume7dSats)  vol    += c.volume7dSats;
    if (c.totalListed)   listed += c.totalListed;
    if (c.floorSats && c.floorSats > topFloor) topFloor = c.floorSats;
  }

  return {
    totalCollections: cols.length,
    totalVolume7d: vol > 0 ? `${satsToBTC(vol)} BTC` : '—',
    totalListed: listed,
    topFloor: topFloor > 0 ? `${satsToBTC(topFloor)} BTC` : '—',
  };
}
