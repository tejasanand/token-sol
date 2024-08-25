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
  receiver: z.string().min(2),
  addressToken: z.string().min(2),
  amount: z.coerce.number(),
});

type TransferTokenType = z.infer<typeof TransferTokenSchema>;

export function Transfer() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  // 1. Define your form.
  const form = useForm<TransferTokenType>({
    resolver: zodResolver(TransferTokenSchema),
    defaultValues: {
      receiver: "",
      addressToken: "",
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
        console.log("🚀 ~ mintToken:", mintToken);
        const recipientAddress = new PublicKey(values.receiver);
        const transactionInstructions: web3.TransactionInstruction[] = [];
        const associatedTokenFrom = await getAssociatedTokenAddress(
          mintToken,
          publicKey
        );
        console.log("🚀 ~ associatedTokenFrom:", associatedTokenFrom);

        const fromAccount = await getAccount(
          connection,
          associatedTokenFrom,
          "confirmed"
        );
        console.log("🚀 ~ fromAccount:", fromAccount);
        const associatedTokenTo = await getAssociatedTokenAddress(
          mintToken,
          recipientAddress
        );

        if (!(await connection.getAccountInfo(associatedTokenTo))) {
          transactionInstructions.push(
            createAssociatedTokenAccountInstruction(
              publicKey,
              associatedTokenTo,
              recipientAddress,
              mintToken
            )
          );
        }
        transactionInstructions.push(
          createTransferInstruction(
            fromAccount.address, // source
            associatedTokenTo, // dest
            publicKey,
            values.amount * Math.pow(10, 6)
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
            description: `Transfer successful ${signature}`,
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
          name="receiver"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receiver Address</FormLabel>
              <FormControl>
                <Input placeholder="Receiver Address" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

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
