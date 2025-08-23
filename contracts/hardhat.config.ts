import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    shapetestnet: {
      url: process.env.SHAPE_TESTNET_URL,
      chainId: 11011,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    sepolia: {
      url:
        process.env.SEPOLIA_RPC_URL ||
        "https://base-sepolia.g.alchemy.com/v2/jeI1pU88-tCLQA_fkkFmV",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      shapeSepolia: "abc123abc123abc123abc123abc123abc1", // 32 char dummy key, needed for hardhat verify
    },
    customChains: [
      {
        network: "shapeSepolia",
        chainId: 11011,
        urls: {
          apiURL: "https://sepolia.shapescan.xyz/api",
          browserURL: "https://sepolia.shapescan.xyz",
        },
      },
    ],
  },
};

export default config;
