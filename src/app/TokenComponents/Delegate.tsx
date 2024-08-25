"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { symbol, z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  createBurnCheckedInstruction,
  createApproveCheckedInstruction,
} from "@solana/spl-token";

import * as web3 from "@solana/web3.js";
import {
  SignerWalletAdapterProps,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import { toast } from "@/components/ui/use-toast";
import {
  configureAndSendCurrentTransaction,
  sliceAddressWallet,
} from "@/app/utils/helper";

const TransferTokenSchema = z.object({
  addressToken: z.string().min(2),
  delegateAddress: z.string().min(2),
  amount: z.coerce.number(),
});

type TransferTokenType = z.infer<typeof TransferTokenSchema>;

export function Delegate() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  // 1. Define your form.
  const form = useForm<TransferTokenType>({
    resolver: zodResolver(TransferTokenSchema),
    defaultValues: {
      addressToken: "",
      delegateAddress: "",
      amount: 0,
    },
  });

  const handleTransferToken = useCallback(
    async (values: TransferTokenType) => {
      try {
        if (!publicKey || !signTransaction) {
          throw new WalletNotConnectedError();
        }
        const mintToken = new PublicKey(values.addressToken);
        const delegatePublickey = new PublicKey(values.delegateAddress);

        console.log("🚀 ~ mintToken:", mintToken);
        const transactionInstructions: web3.TransactionInstruction[] = [];
        const associatedTokenFrom = await getAssociatedTokenAddress(
          mintToken,
          publicKey
        );

        transactionInstructions.push(
          createApproveCheckedInstruction(
            associatedTokenFrom, // source
            mintToken, // dest
            delegatePublickey,
            publicKey,
            values.amount * Math.pow(10, 6),
            6
          )
        );
        const transaction = new web3.Transaction().add(
          ...transactionInstructions
        );
        const signature = await configureAndSendCurrentTransaction(
          transaction,
          connection,
          publicKey,
          signTransaction
        );
        if (signature) {
          toast({
            description: `Delegate transaction ${values.amount} successful ${signature}`,
          });
        }
        console.log("🚀 ~ signature:", signature);
      } catch (error) {
        console.log("🚀 ~ onClick ~ error:", error);
      }
    },
    [publicKey, connection, signTransaction]
  );

  // 2. Define a submit handler.
  function onSubmit(values: TransferTokenType) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    handleTransferToken(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 w-[400px]"
      >
        <FormField
          control={form.control}
          name="addressToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Address</FormLabel>
              <FormControl>
                <Input placeholder="Token Address" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="delegateAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delegate Address</FormLabel>
              <FormControl>
                <Input placeholder="Delegate Address" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
