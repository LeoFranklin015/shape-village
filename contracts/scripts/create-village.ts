// scripts/createVillage.ts
import { ethers } from "hardhat";
import { Contract, ContractTransactionReceipt, EventLog } from "ethers";

const FACTORY_NAME = "VillageFactory";

// Event signature (must match your Solidity event exactly)
const VILLAGE_CREATED_SIG =
  "event VillageCreated(uint256 indexed villageId, address indexed creator, address indexed villageAddress, string metadataURI, uint256 timestamp)";

function getEventIface() {
  return new ethers.Interface([VILLAGE_CREATED_SIG]);
}

async function main() {
  console.log("🏘️  Starting village creation script...");

  // --- Config ---
  const VILLAGE_FACTORY_ADDRESS =
    process.env.VILLAGE_FACTORY_ADDRESS ||
    "0x57223AABb448F552Bd69cd48e4bCA980aDa9EAaB";

  const METADATA_URI =
    process.env.METADATA_URI || "ipfs://QmYourMetadataHashHere";

  if (!VILLAGE_FACTORY_ADDRESS) {
    console.error("❌ Missing VILLAGE_FACTORY_ADDRESS");
    process.exit(1);
  }

  // Skeptical check: basic URI sanity (optional)
  if (!/^ipfs:\/\//.test(METADATA_URI)) {
    console.warn(
      "⚠️ METADATA_URI does not look like an ipfs:// URI:",
      METADATA_URI
    );
  }

  // --- Signer / network info ---
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`📝 Using account: ${signer.address}`);
  console.log(`🌐 Network: ${network.name} (chainId=${network.chainId})`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  // --- Connect to factory ---
  const factory = await ethers.getContractAt(
    FACTORY_NAME,
    VILLAGE_FACTORY_ADDRESS,
    signer
  );
  console.log(`🔗 Connected to ${FACTORY_NAME} at ${factory.target as string}`);

  // --- Gas estimation (defensive) ---
  try {
    const est = await factory.createVillage.estimateGas(METADATA_URI);
    console.log(`⛽ Estimated gas: ${est.toString()}`);
  } catch (e) {
    console.warn("⚠️ Gas estimation failed (may still succeed on-chain):", e);
  }

  // --- Send tx ---
  console.log(`🚀 Sending createVillage("${METADATA_URI}") ...`);
  const tx = await factory.createVillage(METADATA_URI);
  console.log(`⏳ Tx sent: ${tx.hash}`);

  // --- Wait for mining ---
  const receipt: ContractTransactionReceipt | null = await tx.wait();
  if (!receipt) {
    console.error("❌ No receipt returned. Node may be out of sync.");
    process.exit(1);
  }
  console.log(
    `✅ Mined in block ${receipt.blockNumber} (status=${receipt.status})`
  );

  // --- Decode VillageCreated from logs ---
  const iface = getEventIface();
  let decoded: {
    villageId: bigint;
    creator: string;
    villageAddress: string;
    metadataURI: string;
    timestamp: bigint;
  } | null = null;

  for (const log of receipt.logs) {
    // We only attempt to parse logs from the factory
    if (
      (log as EventLog).address?.toLowerCase() !==
      VILLAGE_FACTORY_ADDRESS.toLowerCase()
    ) {
      continue;
    }
    try {
      const parsed = iface.parseLog(log as EventLog);
      if (parsed?.name === "VillageCreated") {
        const [villageId, creator, villageAddress, metadataURI, timestamp] =
          parsed.args;
        decoded = {
          villageId: villageId as bigint,
          creator: (creator as string).toLowerCase(),
          villageAddress: (villageAddress as string).toLowerCase(),
          metadataURI: metadataURI as string,
          timestamp: timestamp as bigint,
        };
        break;
      }
    } catch {
      // not our event; ignore
    }
  }

  if (!decoded) {
    console.error("❌ VillageCreated event not found in receipt logs.");
    console.error(
      "   Verify the contract address and ABI, and ensure the tx succeeded."
    );
    process.exit(1);
  }

  // --- Success output ---
  console.log("🎉 Village created!");
  console.log(`   🆔 villageId:       ${decoded.villageId.toString()}`);
  console.log(`   🏠 villageAddress:  ${decoded.villageAddress}`);
  console.log(`   👤 creator:         ${decoded.creator}`);
  console.log(`   📝 metadataURI:     ${decoded.metadataURI}`);
  console.log(`   ⏱️  timestamp:       ${decoded.timestamp.toString()}`);

  // Tip: if you use a subgraph with a Village template, this event is what triggers indexing.
}

// Run
main()
  .then(() => {
    console.log("\n✨ Script completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n💥 Script failed:", err);
    process.exit(1);
  });

