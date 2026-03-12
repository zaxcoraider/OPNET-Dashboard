"use client";

import React from "react";
import { WalletConnectProvider, useWalletConnect } from "@btc-vision/walletconnect";
import { WalletContext } from "@/contexts/WalletContext";

// Bridge: reads wallet state from WalletConnectProvider and exposes it
// through our own plain WalletContext so no other file needs to import
// from @btc-vision/walletconnect directly.
function WalletBridge({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletState = useWalletConnect() as any;
  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
}

export default function WalletProviderInner({ children }: { children: React.ReactNode }) {
  return (
    <WalletConnectProvider theme="dark">
      <WalletBridge>{children}</WalletBridge>
    </WalletConnectProvider>
  );
}
