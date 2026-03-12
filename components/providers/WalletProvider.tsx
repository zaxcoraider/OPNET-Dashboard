"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Lazy-load WalletConnectProvider in a separate async chunk (ssr:false).
// This keeps the @btc-vision/* browser bundles out of the main webpack chunk
// so scope-hoisting / concatenateModules cannot cause "e3 already declared".
const WalletConnectProvider = dynamic(
  () =>
    import("@btc-vision/walletconnect").then((m) => ({
      default: m.WalletConnectProvider,
    })),
  { ssr: false }
);

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WalletConnectProvider theme="dark">
      {children}
    </WalletConnectProvider>
  );
}
