"use client";

import { useWalletMultiButton } from "@solana/wallet-adapter-base-ui";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { sliceAddressWallet } from "@/app/utils/helper";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";


export default function WalletMenuButton() {
  const { setVisible: setModalVisible } = useWalletModal();
  const { publicKey, onDisconnect } = useWalletMultiButton({
    onSelectWallet() {
      setModalVisible(true);
    },
  });
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {publicKey ? (
            <Button variant="outline">
              {" "}
              {publicKey && sliceAddressWallet(publicKey)}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setModalVisible(true)}>
              {" "}
              Connect wallet
            </Button>
          )}
        </DropdownMenuTrigger>
        {publicKey && (
          <DropdownMenuContent className="w-56 ">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async () => {
                if (publicKey) {
                  await navigator.clipboard.writeText(publicKey.toBase58());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 400);
                }
              }}
            >
              <span>{copied ? "Copied" : "Copy Address"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setModalVisible(true);
              }}
            >
              <span> Change wallet</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={onDisconnect}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}
