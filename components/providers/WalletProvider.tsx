"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the inner provider (which imports @btc-vision/walletconnect)
// so the entire btc-vision bundle lands in a separate async chunk and never
// touches the main bundle's webpack scope.
const WalletProviderInner = dynamic(
  () => import("./WalletProviderInner"),
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

  return <WalletProviderInner>{children}</WalletProviderInner>;
}
