import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of VillageFactory contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  console.log(
    `💰 Account balance: ${ethers.formatEther(
      (await deployer.provider?.getBalance(deployer.address)) || 0
    )} ETH`
  );

  try {
    // Deploy VillageFactory contract
    console.log("🏗️  Deploying VillageFactory...");
    const VillageFactory = await ethers.getContractFactory("VillageFactory");
    const villageFactory = await VillageFactory.deploy();

    // Wait for deployment to complete
    await villageFactory.waitForDeployment();
    const villageFactoryAddress = await villageFactory.getAddress();

    console.log("✅ VillageFactory deployed successfully!");
    console.log(`📍 Contract address: ${villageFactoryAddress}`);
    console.log(
      `🔗 Transaction hash: ${villageFactory.deploymentTransaction()?.hash}`
    );

    // Verify deployment by calling a view function
    const nextVillageId = await villageFactory.nextVillageId();
    console.log(`📊 Initial nextVillageId: ${nextVillageId}`);

    // Get network information
    const network = await ethers.provider.getNetwork();

    // Log deployment summary
    console.log("\n🎉 Deployment Summary:");
    console.log("========================");
    console.log(`Contract: VillageFactory`);
    console.log(`Address: ${villageFactoryAddress}`);

    console.log("🔍 You can now verify your contract on the block explorer");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle script execution
main()
  .then(() => {
    console.log("\n✨ Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment script failed:", error);
    process.exit(1);
  });
