import { SignerWalletAdapterProps, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import * as anchor from "@project-serum/anchor";

import {
  web3,
  AnchorProvider,
  Program,
  BN,
  utils,
} from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SOL_NETWORK } from "@/app/configs/env.config";

export const solNetwork = () => {
  switch (SOL_NETWORK) {
    case "mainnet":
      return WalletAdapterNetwork.Mainnet;
    case "testnet":
      return WalletAdapterNetwork.Testnet;
    default:
      return WalletAdapterNetwork.Devnet;
  }
};

export let RETAILER = anchor.web3.Keypair.generate();
export let ORDER = anchor.web3.Keypair.generate();
export let BID_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export let BID_TOTAL = new anchor.BN(100000000);
export let BID_POINT = new anchor.BN(1000);
export let ASK_AMOUNT = new anchor.BN(100000000);
export let ASK_POINT = new anchor.BN(1000);

export const endpoint = anchor.web3.clusterApiUrl(solNetwork());

export const PROGRAM_ACCOUNTS = {
  rent: web3.SYSVAR_RENT_PUBKEY,
  systemProgram: web3.SystemProgram.programId,
  associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
  tokenProgram: utils.token.TOKEN_PROGRAM_ID,
};

export const asyncWait = (s: number) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000));

export const getCurrentTimestamp = () => Math.floor(Number(new Date()) / 1000);

export const initializeMint = async (
  decimals: number,
  token: web3.Keypair,
  splProgram: Program<any>
) => {
  const ix = await (splProgram.account as any).mint.createInstruction(token);
  const tx = new web3.Transaction().add(ix);
  const provider = splProgram.provider as AnchorProvider;
  await provider.sendAndConfirm(tx, [token]);
  return await splProgram.rpc.initializeMint(
    decimals,
    provider.wallet.publicKey,
    provider.wallet.publicKey,
    {
      accounts: {
        mint: token.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [],
    }
  );
};

export const transferLamports = async (
  lamports: number,
  dstAddress: string,
  provider: AnchorProvider
) => {
  const ix = web3.SystemProgram.transfer({
    fromPubkey: provider.wallet.publicKey,
    toPubkey: new web3.PublicKey(dstAddress),
    lamports: Number(lamports),
  });
  const tx = new web3.Transaction().add(ix);
  return await provider.sendAndConfirm(tx);
};

export const mintTo = async (
  amount: BN,
  mintPublicKey: web3.PublicKey,
  provider: AnchorProvider,
  spl: Program<any>
) => {
  const associatedAddress = await utils.token.associatedAddress({
    mint: mintPublicKey,
    owner: provider.wallet.publicKey,
  });
  const txId = await spl.rpc.mintTo(amount, {
    accounts: {
      mint: mintPublicKey,
      to: associatedAddress,
      authority: provider.wallet.publicKey,
    },
    signers: [],
  });
  return { txId };
};

export const initAccountToken = async (
  token: web3.PublicKey,
  provider: AnchorProvider
) => {
  const associatedTokenAccount = await utils.token.associatedAddress({
    mint: token,
    owner: provider.wallet.publicKey,
  });
  const ix = new web3.TransactionInstruction({
    keys: [
      {
        pubkey: provider.wallet.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: associatedTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: provider.wallet.publicKey,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: token,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: web3.SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: utils.token.TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: web3.SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: utils.token.ASSOCIATED_PROGRAM_ID,
    data: Buffer.from([]),
  });
  const tx = new web3.Transaction().add(ix);
  return await provider.sendAndConfirm(tx);
};
export const sliceAddressWallet = (publicKey: any) => {
  const base58 = publicKey.toBase58();
  const address = base58.slice(0, 2) + ".." + base58.slice(-4);
  return address;
};


export const configureAndSendCurrentTransaction = async (
  transaction: web3.Transaction,
  connection: web3.Connection,
  feePayer: web3.PublicKey,
  signTransaction: SignerWalletAdapterProps["signTransaction"]
) => {
  const blockHash = await connection.getLatestBlockhash();
  transaction.feePayer = feePayer;
  transaction.recentBlockhash = blockHash.blockhash;
  const signed = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
    signature,
  });
  return signature;
};