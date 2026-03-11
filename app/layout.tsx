import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/components/providers/WalletProvider";

export const metadata: Metadata = {
  title: "OP Dashboard — Bitcoin L1 Analytics",
  description: "Real-time analytics dashboard for the OPNet Protocol on Bitcoin L1. Track addresses, tokens, NFTs, DeFi, and smart contracts.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="antialiased bg-[#0d0d0d] text-white">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
