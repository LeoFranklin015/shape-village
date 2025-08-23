import { createPublicClient, createWalletClient, custom, http } from "viem";
import { shapeSepolia } from "viem/chains";

// Create public client that works on server and client
export const client = createPublicClient({
  chain: shapeSepolia,
  transport: http((process.env.NEXT_PUBLIC_SHAPE_SEPOLIA_URL as string) || ""),
});

// Safely create wallet client only in browser environment
export const walletClient =
  typeof window !== "undefined"
    ? createWalletClient({
        chain: shapeSepolia,
        transport: custom(window.ethereum),
      })
    : null;
