const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Registering MediaNode with account:", deployer.address);

  const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;

  try {
    const MediaNodeFactory = await hre.ethers.getContractFactory("MediaNodeFactory");
    const mediaNodeFactory = await MediaNodeFactory.attach(FACTORY_ADDRESS);

    // Check if factory is instantiated
    try {
      const params = await mediaNodeFactory.getParams();
      console.log("Factory is instantiated with params:");
      console.log({
        instantiator: params.instantiator,
        creation_fee: params.creation_fee.toString(),
        min_lease_hours: params.min_lease_hours.toString(),
        max_lease_hours: params.max_lease_hours.toString(),
        initial_deposit_percentage: params.initial_deposit_percentage,
        min_deposit: params.min_deposit.toString(),
      });
    } catch (err) {
      console.error("❌ Factory is not initialized. Please run the instantiation script first.");
      process.exit(1);
    }

    // Prepare media node registration payload
    const mediaNodeId = "medianode1234567890";
    const registerTx = await mediaNodeFactory.registerMediaNode({
      id: mediaNodeId,
      price_per_hour: 100,
      name: "MediaNode Testing",
      description: "MediaNode Description",
      url: "https://www.google.com",
      hardware_specs: {
        cpu: 4,
        ram_in_gb: 8,
        storage_in_gb: 64,
      },
    }, { value: 10 } );

    console.log("Waiting for transaction confirmation...");
    const receipt = await registerTx.wait(1);
    console.log('registerTx', receipt);
    console.log("✅ Medianode registered successfully!");
    const node = await mediaNodeFactory.getNodeDetails(mediaNodeId);
    const nodeAddress = await mediaNodeFactory.mediaNodeContractAddressesMap(mediaNodeId);
    console.log("Node address:", nodeAddress);
    console.log("Node details:", node);
  } catch (error) {
    console.error("❌ Error registering MediaNode:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});

