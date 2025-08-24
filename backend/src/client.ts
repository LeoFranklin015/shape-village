import {
  createPublicClient,
  createWalletClient,
  http,
  type WalletClient,
} from "viem";
import { shapeSepolia } from "viem/chains";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

// Create public client that works on server and client
export const client = createPublicClient({
  chain: shapeSepolia,
  transport: http((process.env["SHAPE_SEPOLIA_URL"] as string) || ""),
});

// Safely create wallet client only in browser environment
