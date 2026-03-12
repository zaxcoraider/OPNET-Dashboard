"use client";

import React from "react";

export interface WalletState {
  allWallets: unknown[];
  walletType: unknown;
  walletAddress: string | null;
  walletInstance: unknown;
  network: unknown;
  publicKey: unknown;
  address: unknown;
  connecting: boolean;
  provider: unknown;
  signer: unknown;
  walletBalance: unknown;
  mldsaPublicKey: unknown;
  hashedMLDSAKey: unknown;
  openConnectModal: () => void;
  connectToWallet: (...args: unknown[]) => void;
  disconnect: () => void;
  signMLDSAMessage: (...args: unknown[]) => Promise<unknown>;
  verifyMLDSASignature: (...args: unknown[]) => Promise<boolean>;
}

export const DISCONNECTED: WalletState = {
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

export const WalletContext = React.createContext<WalletState>(DISCONNECTED);
