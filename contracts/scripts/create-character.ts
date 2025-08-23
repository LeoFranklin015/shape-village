// scripts/createCharacter.ts
import { ethers } from "hardhat";
import { Contract, ContractTransactionReceipt, EventLog } from "ethers";

const VILLAGE_NAME = "Village";

// Event signature for CharacterAdded (must match your Solidity event exactly)
const CHARACTER_ADDED_SIG =
  "event CharacterAdded(uint256 indexed characterId, address indexed characterAddress, string name, string symbol, string charMetadata, address indexed village, address[] parents, uint256 timestamp)";

function getEventIface() {
  return new ethers.Interface([CHARACTER_ADDED_SIG]);
}

async function main() {
  console.log("👤 Starting character creation script...");

  // --- Config ---
  const VILLAGE_ADDRESS = "0x9f0bdbb6961f7e7b7b414868fdf9833c72421c6c"; // Replace with actual village address

  const CHARACTER_NAME = process.env.CHARACTER_NAME || "Hero";
  const CHARACTER_SYMBOL = process.env.CHARACTER_SYMBOL || "HERO";
  const CHARACTER_METADATA_URI =
    process.env.CHARACTER_METADATA_URI || "ipfs://QmTest123"; // Simplified test URI

  // Parents array - can be empty for first generation characters
  const PARENTS: string[] = [
    "0xa912Df82B8b1521ac707fa323fC47c3Dbc20CF9c",
    "0xa912Df82B8b1521ac707fa323fC47c3Dbc20CF9c",
  ]; // Empty array for first generation characters

  // Validate metadata URI
  if (CHARACTER_METADATA_URI.length === 0) {
    console.error("❌ CHARACTER_METADATA_URI cannot be empty");
    process.exit(1);
  }

  // Skeptical check: basic URI sanity (optional)
  if (!/^ipfs:\/\//.test(CHARACTER_METADATA_URI)) {
    console.warn(
      "⚠️ CHARACTER_METADATA_URI does not look like an ipfs:// URI:",
      CHARACTER_METADATA_URI
    );
  }

  // --- Signer / network info ---
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`📝 Using account: ${signer.address}`);
  console.log(`🌐 Network: ${network.name} (chainId=${network.chainId})`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  // --- Connect to village ---
  const village = await ethers.getContractAt(
    VILLAGE_NAME,
    VILLAGE_ADDRESS,
    signer
  );
  console.log(`🔗 Connected to ${VILLAGE_NAME} at ${village.target as string}`);

  // --- Debug: Check contract code and functions ---
  try {
    const code = await ethers.provider.getCode(VILLAGE_ADDRESS);
    if (code === "0x") {
      console.error("❌ No contract code found at this address");
      process.exit(1);
    }
    console.log(`✅ Contract has code (${code.length} bytes)`);

    // Check if addCharacter function exists
    const addCharacterFunction = village.interface.getFunction("addCharacter");
    console.log(
      `✅ addCharacter function found: ${addCharacterFunction.format()}`
    );

    // Debug: Check Village contract state
    try {
      const nextCharId = await village.nextCharacterId();
      console.log(`📊 Current nextCharacterId: ${nextCharId.toString()}`);

      const metadataURI = await village.metadataURI();
      console.log(`📝 Village metadataURI: ${metadataURI}`);

      const owner = await village.owner();
      console.log(`👑 Village owner: ${owner}`);

      // Check if there are any existing characters
      if (nextCharId > 0n) {
        const lastCharAddress = await village.characters(nextCharId - 1n);
        console.log(`👤 Last character address: ${lastCharAddress}`);
      } else {
        console.log(`👤 No characters created yet`);
      }
    } catch (stateError) {
      console.warn("⚠️ Could not read Village contract state:", stateError);
    }

    // Debug: Check if Character contract can be deployed manually
    console.log("🔍 Checking Character contract deployment...");
    try {
      const CharacterFactory = await ethers.getContractFactory("Character");
      console.log("✅ Character contract factory created successfully");
      console.log("✅ Character contract bytecode is valid");

      // Try to manually deploy a Character to test if the issue is in the constructor
      console.log("🧪 Testing manual Character deployment...");
      try {
        const testChar = await CharacterFactory.deploy(
          "TestChar",
          "TEST",
          "ipfs://test",
          VILLAGE_ADDRESS,
          []
        );
        console.log("✅ Manual Character deployment successful!");
        console.log(`   Test character address: ${testChar.target}`);
      } catch (deployError) {
        console.error("❌ Manual Character deployment failed:", deployError);
      }
    } catch (charError) {
      console.error(
        "❌ Character contract deployment check failed:",
        charError
      );
    }
  } catch (e) {
    console.error("❌ Failed to verify contract:", e);
    process.exit(1);
  }

  // --- Check if signer is village owner ---
  try {
    const villageOwner = await village.owner();
    if (villageOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error(
        "❌ Signer is not the village owner. Only village owners can add characters."
      );
      process.exit(1);
    }
    console.log(`✅ Signer is village owner`);
  } catch (e) {
    console.error("❌ Failed to check village ownership:", e);
    process.exit(1);
  }

  // --- Gas estimation (defensive) ---
  try {
    const est = await village.addCharacter.estimateGas(
      CHARACTER_NAME,
      CHARACTER_SYMBOL,
      CHARACTER_METADATA_URI,
      PARENTS
    );
    console.log(`⛽ Estimated gas: ${est.toString()}`);
  } catch (e) {
    console.warn("⚠️ Gas estimation failed (may still succeed on-chain):", e);
    // Try to get more detailed error information
    if (e instanceof Error && e.message.includes("execution reverted")) {
      console.log("🔍 Attempting to get detailed revert reason...");
      try {
        // Try to call the function with a static call to get revert reason
        await village.addCharacter.staticCall(
          CHARACTER_NAME,
          CHARACTER_SYMBOL,
          CHARACTER_METADATA_URI,
          PARENTS
        );
      } catch (staticError) {
        console.log("📋 Static call error details:", staticError);
      }
    }
  }

  // --- Send tx ---
  console.log(`🚀 Sending addCharacter with parameters:`);
  console.log(`   Name: "${CHARACTER_NAME}"`);
  console.log(`   Symbol: "${CHARACTER_SYMBOL}"`);
  console.log(`   Metadata URI: "${CHARACTER_METADATA_URI}"`);
  console.log(
    `   Parents: [${PARENTS.join(", ")}] (${PARENTS.length} parents)`
  );

  const tx = await village.addCharacter(
    CHARACTER_NAME,
    CHARACTER_SYMBOL,
    CHARACTER_METADATA_URI,
    PARENTS
  );
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

  // --- Decode CharacterAdded from logs ---
  const iface = getEventIface();
  let decoded: {
    characterId: bigint;
    characterAddress: string;
    name: string;
    symbol: string;
    charMetadata: string;
    village: string;
    parents: string[];
    timestamp: bigint;
  } | null = null;

  for (const log of receipt.logs) {
    // We only attempt to parse logs from the village
    if (
      (log as EventLog).address?.toLowerCase() !== VILLAGE_ADDRESS.toLowerCase()
    ) {
      continue;
    }
    try {
      const parsed = iface.parseLog(log as EventLog);
      if (parsed?.name === "CharacterAdded") {
        const [
          characterId,
          characterAddress,
          name,
          symbol,
          charMetadata,
          village,
          parents,
          timestamp,
        ] = parsed.args;
        decoded = {
          characterId: characterId as bigint,
          characterAddress: (characterAddress as string).toLowerCase(),
          name: name as string,
          symbol: symbol as string,
          charMetadata: charMetadata as string,
          village: (village as string).toLowerCase(),
          parents: parents as string[],
          timestamp: timestamp as bigint,
        };
        break;
      }
    } catch {
      // not our event; ignore
    }
  }

  if (!decoded) {
    console.error("❌ CharacterAdded event not found in receipt logs.");
    console.error(
      "   Verify the contract address and ABI, and ensure the tx succeeded."
    );
    process.exit(1);
  }

  // --- Success output ---
  console.log("🎉 Character created!");
  console.log(`   🆔 characterId:       ${decoded.characterId.toString()}`);
  console.log(`   👤 characterAddress:  ${decoded.characterAddress}`);
  console.log(`   📛 name:              ${decoded.name}`);
  console.log(`   🏷️  symbol:            ${decoded.symbol}`);
  console.log(`   📝 charMetadata:      ${decoded.charMetadata}`);
  console.log(`   🏘️  village:           ${decoded.village}`);
  console.log(`   👨‍👩‍👧‍👦 parents:          [${decoded.parents.join(", ")}]`);
  console.log(`   ⏱️  timestamp:         ${decoded.timestamp.toString()}`);

  // Tip: if you use a subgraph with a Character template, this event is what triggers indexing.
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
