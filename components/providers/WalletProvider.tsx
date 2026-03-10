"use client";

import React, { useEffect, useState } from "react";
import { WalletConnectProvider } from "@btc-vision/walletconnect";

/**
 * Wraps children with WalletConnectProvider.
 * Deferred until client-side mount to avoid SSR issues with
 * window / localStorage / wallet extension injection.
 */
export default function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render children without wallet context during SSR / first paint
    return <>{children}</>;
  }

  return (
    <WalletConnectProvider theme="dark">
      {children}
    </WalletConnectProvider>
  );
}
