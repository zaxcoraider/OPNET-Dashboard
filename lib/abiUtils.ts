/**
 * Minimal ABI encoding/decoding utilities for OPNet contract calls.
 * OPNet uses Ethereum-compatible keccak256 method selectors with 32-byte OPNet addresses.
 */

/* ── Bech32/Bech32m decoder ─────────────────────────────────────────────── */

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let chk = 1;
  for (const v of values) {
    const b = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      chk ^= (b >>> i) & 1 ? GENERATOR[i] : 0;
    }
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >>> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
  return ret;
}

/** Decode a bech32/bech32m address → { version, program } */
export function decodeBech32(
  address: string,
): { version: number; program: Uint8Array } | null {
  const lc = address.toLowerCase();
  const sep = lc.lastIndexOf('1');
  if (sep < 1 || sep + 7 > lc.length) return null;

  const hrp = lc.slice(0, sep);
  const data: number[] = [];
  for (let i = sep + 1; i < lc.length; i++) {
    const d = CHARSET.indexOf(lc[i]);
    if (d === -1) return null;
    data.push(d);
  }

  const exp = hrpExpand(hrp);
  const pc = polymod([...exp, ...data]);
  if (pc !== 1 && pc !== 0x2bc830a3) return null; // neither bech32 nor bech32m

  const version  = data[0];
  const data5bit = data.slice(1, -6); // strip version byte + 6-char checksum

  // Convert 5-bit groups → 8-bit bytes
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const d of data5bit) {
    value = (value << 5) | d;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }
  if (bytes.length < 2 || bytes.length > 40) return null;
  return { version, program: new Uint8Array(bytes) };
}

/** Convert any bech32 address to a 32-byte Uint8Array suitable for calldata */
export function addressToBytes32(address: string): Uint8Array | null {
  const decoded = decodeBech32(address.trim());
  if (!decoded) return null;

  const { program } = decoded;
  const result = new Uint8Array(32);

  if (program.length === 32) {
    result.set(program, 0);
  } else if (program.length === 20) {
    // P2WPKH (bc1q): left-pad 12 zero bytes
    result.set(program, 12);
  } else {
    return null;
  }
  return result;
}

/** Convert bech32 address to 0x-prefixed 64-char hex contract address */
export function addressToHex(address: string): string | null {
  const decoded = decodeBech32(address.trim());
  if (!decoded) return null;
  const { program } = decoded;
  if (program.length !== 32) return null;
  return '0x' + Array.from(program).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Calldata encoding ──────────────────────────────────────────────────── */

// Ethereum-compatible keccak256 selectors (OPNet uses the same for OP20/OP721)
export const SEL = {
  name:        '06fdde03',
  symbol:      '95d89b41',
  decimals:    '313ce567',
  totalSupply: '18160ddd',
  balanceOf:   '70a08231', // balanceOf(address)
} as const;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Encode balanceOf(address) calldata – 4-byte selector + 32-byte address */
export function encodeBalanceOf(addr32: Uint8Array): string {
  const buf = new Uint8Array(36);
  buf[0] = 0x70; buf[1] = 0xa0; buf[2] = 0x82; buf[3] = 0x31;
  buf.set(addr32, 4);
  return toHex(buf);
}

/* ── Response decoding ──────────────────────────────────────────────────── */

/** Decode base64 → Uint8Array */
export function fromBase64(b64: string): Uint8Array {
  try {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return new Uint8Array(0);
  }
}

/** Decode OPNet u256 response (32 bytes big-endian) → bigint */
export function decodeBigInt256(bytes: Uint8Array): bigint {
  const slice = bytes.length >= 32 ? bytes.slice(bytes.length - 32) : bytes;
  let result = 0n;
  for (const b of slice) result = (result << 8n) | BigInt(b);
  return result;
}

/** Decode OPNet string response (u32 length prefix + UTF-8) */
export function decodeOPNetString(bytes: Uint8Array): string {
  if (bytes.length < 4) return '';
  const len = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  if (len <= 0 || len > bytes.length - 4) return '';
  return new TextDecoder().decode(bytes.slice(4, 4 + len));
}

/** Decode OPNet u8 response */
export function decodeU8(bytes: Uint8Array): number {
  return bytes.length > 0 ? bytes[bytes.length - 1] : 0;
}

/** Format a bigint token balance given decimals */
export function formatTokenBalance(balance: bigint, decimals: number, symbol: string): string {
  if (balance === 0n) return `0 ${symbol}`;
  const d = BigInt(10 ** decimals);
  const whole = balance / d;
  const frac  = balance % d;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '') || '0';
  return `${whole.toLocaleString()}.${fracStr} ${symbol}`;
}
