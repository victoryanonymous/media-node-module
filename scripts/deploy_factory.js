const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MediaNode implementation contract first
  const MediaNode = await hre.ethers.getContractFactory("MediaNode");
  const mediaNodeImplementation = await MediaNode.deploy();
  await mediaNodeImplementation.waitForDeployment();
  const mediaNodeImplementationAddress = await mediaNodeImplementation.getAddress();
  console.log("MediaNode implementation deployed to:", mediaNodeImplementationAddress);

  // Deploy MediaNodeFactory with the implementation address
  const MediaNodeFactory = await hre.ethers.getContractFactory("MediaNodeFactory");
  const mediaNodeFactory = await MediaNodeFactory.deploy(deployer.address, mediaNodeImplementationAddress);
  await mediaNodeFactory.waitForDeployment();
  const mediaNodeFactoryAddress = await mediaNodeFactory.getAddress();
  console.log("MediaNodeFactory deployed to:", mediaNodeFactoryAddress);

  // ✅ Instantiate the factory with valid values
  const creation_fee = 100;
  const min_lease_hours = 1;
  const max_lease_hours = 24;
  const initial_deposit_percentage = 10;
  const min_deposit = 50;

  const instantiateTx = await mediaNodeFactory.Instantiate(
    creation_fee,
    min_lease_hours,
    max_lease_hours,
    initial_deposit_percentage,
    min_deposit
  );
  await instantiateTx.wait();
  console.log("✅ MediaNodeFactory instantiated successfully!");
  console.log("Deployment and initialization completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
