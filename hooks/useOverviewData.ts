"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { rpc, hexToNumber } from "@/lib/opnetRpc";
import type { NetworkType } from "@/hooks/useWallet";

export interface BlockSummary extends Record<string, unknown> {
  height: number;
  txCount: number;
  gasUsed: number;
  size: number;
  time: number;
}

export interface GasParams {
  baseGas: number;
  gasPerSat: number;
  gasUsed: number;
  btcFeeLow: number;
  btcFeeMed: number;
  btcFeeHigh: number;
}

export interface OverviewData {
  blockHeight: number;
  gasParams: GasParams | null;
  recentBlocks: BlockSummary[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface RawGas {
  blockNumber: string;
  gasUsed: string;
  baseGas: string;
  gasPerSat: string;
  bitcoin: {
    conservative: string;
    recommended: { low: string; medium: string; high: string };
  };
}

interface RawBlock {
  height: string | number;
  txCount: number;
  gasUsed: string;
  size: number;
  time: number;
}

export function useOverviewData(network: NetworkType | "disconnected"): OverviewData {
  const [data, setData] = useState<OverviewData>({
    blockHeight: 0,
    gasParams: null,
    recentBlocks: [],
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const net = network === "btc-mainnet" || network === "opnet-testnet" ? network : null;

  const fetchData = useCallback(async () => {
    if (!net) {
      setData({ blockHeight: 0, gasParams: null, recentBlocks: [], loading: false, error: null, lastUpdated: null });
      return;
    }

    setData((p) => ({ ...p, loading: true, error: null }));

    try {
      // 1. Block number
      const blockHex = await rpc<string>(net, "btc_blockNumber");
      const tipHeight = hexToNumber(blockHex);

      // 2. Gas parameters
      const gasRaw = await rpc<RawGas>(net, "btc_gas");
      const gasParams: GasParams = {
        baseGas: hexToNumber(gasRaw.baseGas),
        gasPerSat: hexToNumber(gasRaw.gasPerSat),
        gasUsed: hexToNumber(gasRaw.gasUsed),
        btcFeeLow: parseFloat(gasRaw.bitcoin.recommended.low),
        btcFeeMed: parseFloat(gasRaw.bitcoin.recommended.medium),
        btcFeeHigh: parseFloat(gasRaw.bitcoin.recommended.high),
      };

      // 3. Last 10 blocks — sequential to avoid overloading the node
      const from = Math.max(1, tipHeight - 9);
      const blockNums = Array.from({ length: tipHeight - from + 1 }, (_, i) => from + i);

      const rawBlocks = await Promise.all(
        blockNums.map((n) =>
          rpc<RawBlock>(net, "btc_getBlockByNumber", [`0x${n.toString(16)}`, false])
            .catch(() => null)
        )
      );

      const recentBlocks: BlockSummary[] = rawBlocks
        .filter((b): b is RawBlock => b !== null)
        .map((b) => ({
          height: typeof b.height === "string" ? hexToNumber(b.height) : Number(b.height),
          txCount: Number(b.txCount ?? 0),
          gasUsed: b.gasUsed ? hexToNumber(b.gasUsed) : 0,
          size: Number(b.size ?? 0),
          time: Number(b.time ?? 0),
        }));

      setData({
        blockHeight: tipHeight,
        gasParams,
        recentBlocks,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setData((p) => ({
        ...p,
        loading: false,
        error: err instanceof Error ? err.message : "Fetch failed",
      }));
    }
  }, [net]);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  return data;
}
