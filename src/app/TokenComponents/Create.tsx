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
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";

import * as web3 from "@solana/web3.js";
import {
  SignerWalletAdapterProps,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import { toast } from "@/components/ui/use-toast";
import { sliceAddressWallet } from "@/app/utils/helper";

const CreateTokenSchema = z.object({
  tokenName: z.string().min(2),
  symbol: z.string().min(2),
  amount: z.coerce.number(),
  decimals: z.coerce.number(),
});

type CreateTokenType = z.infer<typeof CreateTokenSchema>;

export function Create() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  // 1. Define your form.
  const form = useForm<CreateTokenType>({
    resolver: zodResolver(CreateTokenSchema),
    defaultValues: {
      tokenName: "",
      symbol: "",
      amount: 0,
      decimals: 6,
    },
  });

  const handleCreateToken = useCallback(
    async (values: CreateTokenType) => {
      try {
        if (!publicKey || !signTransaction) {
          throw new WalletNotConnectedError();
        }
        const lamports = await getMinimumBalanceForRentExemptMint(connection);
        const mintKeypair = Keypair.generate();
        const tokenATA = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          publicKey
        );

        const createNewTokenTransaction = new Transaction().add(
          SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: lamports,
            programId: TOKEN_PROGRAM_ID,
          }),
          createInitializeMintInstruction(
            mintKeypair.publicKey,
            values.decimals,
            publicKey,
            publicKey,
            TOKEN_PROGRAM_ID
          ),
          createAssociatedTokenAccountInstruction(
            publicKey,
            tokenATA,
            publicKey,
            mintKeypair.publicKey
          ),
          createMintToInstruction(
            mintKeypair.publicKey,
            tokenATA,
            publicKey,
            values.amount * Math.pow(10, values.decimals)
          )
        );
        const result = await sendTransaction(
          createNewTokenTransaction,
          connection,
          { signers: [mintKeypair] }
        );
        console.log("🚀 ~ result:", result);
        if (result) {
          toast({
            description: `Create Token Successful ${result}`,
          });
        }
      } catch (error) {
        console.log("🚀 ~ onClick ~ error:", error);
      }
    },
    [publicKey, connection, signTransaction, sendTransaction]
  );

  // 2. Define a submit handler.
  function onSubmit(values: CreateTokenType) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    handleCreateToken(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 w-[400px]"
      >
        <FormField
          control={form.control}
          name="tokenName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token Name</FormLabel>
              <FormControl>
                <Input placeholder="Token Name" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input placeholder="Symbol" {...field} />
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
        <FormField
          control={form.control}
          name="decimals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Decimals</FormLabel>
              <FormControl>
                <Input disabled={true} type="number" {...field} />
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
