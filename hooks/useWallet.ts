"use client";

import { useContext } from "react";
import { WalletContext } from "@/contexts/WalletContext";
import type { WalletState } from "@/contexts/WalletContext";

export type NetworkType = "btc-mainnet" | "opnet-testnet" | "unknown";

export type { WalletState };

/**
 * Safe wallet hook — returns DISCONNECTED defaults instead of throwing
 * when called outside WalletProviderInner (SSR / first paint).
 */
export function useWallet(): WalletState {
  return useContext(WalletContext);
}
