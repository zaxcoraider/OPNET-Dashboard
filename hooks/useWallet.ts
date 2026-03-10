"use client";

import { useContext } from "react";
import { WalletConnectContext, useWalletConnect } from "@btc-vision/walletconnect";

export type NetworkType = "btc-mainnet" | "opnet-testnet" | "unknown";

type WalletState = ReturnType<typeof useWalletConnect>;

/** Disconnected defaults — returned during SSR / before WalletConnectProvider mounts */
const DISCONNECTED: WalletState = {
  allWallets: [],
  walletType: null,
  walletAddress: null,
  walletInstance: null,
  network: null,
  publicKey: null,
  address: null,
  connecting: false,
  provider: null,
  signer: null,
  walletBalance: null,
  mldsaPublicKey: null,
  hashedMLDSAKey: null,
  openConnectModal: () => {},
  connectToWallet: () => {},
  disconnect: () => {},
  signMLDSAMessage: async () => null,
  verifyMLDSASignature: async () => false,
};

/**
 * Safe wallet hook — returns DISCONNECTED defaults instead of throwing
 * when called outside WalletConnectProvider (SSR / first paint).
 */
export function useWallet(): WalletState {
  const ctx = useContext(WalletConnectContext as React.Context<WalletState | undefined>);
  return ctx ?? DISCONNECTED;
}
