const hre = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

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
                initial_deposit_percentage: params.initial_deposit_percentage.toString(),
                min_deposit: params.min_deposit.toString(),
            });
            // Get the MediaNode contract address using getNodeDetails
            // const [owner, pricePerHour] = await mediaNodeFactory.getNodeDetails("medianode1234567890");

            // Get the MediaNode contract instance using the factory's public mapping
            const mediaNodeAddress = await mediaNodeFactory.mediaNodeContractAddressesMap("medianode1234567890");
            console.log("MediaNode contract address:", mediaNodeAddress);
            const mediaNodeContract = await hre.ethers.getContractAt("MediaNode", mediaNodeAddress);

            // Deposit 50 Wei
            const depositAmount = 50;

            // Make the deposit
            const depositTx = await mediaNodeContract.depositMediaNode({
                value: depositAmount
            });
    
            console.log("Waiting for transaction confirmation...");
            await depositTx.wait(1);
            console.log(`✅ Medianode deposit successful! Deposited ${depositAmount} WEI`);
        } catch (err) {
            console.error("❌ Factory is not initialized. Please run the instantiation script first.");
            process.exit(1);
        }

        // Prepare media node deposit payload
    } catch (error) {
        console.error("❌ Error depositing MediaNode:", error.message);
    }
}

main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});
