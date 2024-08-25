"use client";

import { endpoint } from "@/app/utils/helper";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { ReactNode, useMemo } from "react";
// require('@solana/wallet-adapter-react-ui/styles.css');


export default function SolWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  const network = WalletAdapterNetwork.Devnet;

  const wallets = useMemo(
    () => [
      new TrustWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
