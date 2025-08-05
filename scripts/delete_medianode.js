const hre = require("hardhat");
require("dotenv").config();

async function main() {
    const [account] = await hre.ethers.getSigners();
    console.log(`Updating MediaNode with account: ${account.address}`);
    
    const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
    
    const MediaNodeFactory = await hre.ethers.getContractFactory("MediaNodeFactory");
    const mediaNodeFactory = await MediaNodeFactory.attach(FACTORY_ADDRESS);
    try {
        // Check if factory is instantiated
        const params = await mediaNodeFactory.getParams();
        if (!params) {
            throw new Error("Factory is not instantiated");
        }
        console.log("Factory is instantiated with params:", {
            instantiator: params.instantiator,
            creation_fee: params.creation_fee.toString(),
            min_lease_hours: params.min_lease_hours.toString(),
            max_lease_hours: params.max_lease_hours.toString(),
            initial_deposit_percentage: params.initial_deposit_percentage.toString(),
            min_deposit: params.min_deposit.toString(),
        });

        // Get MediaNode contract address
        const mediaNodeAddress = await mediaNodeFactory.mediaNodeContractAddressesMap("medianode1234567890");
        if (mediaNodeAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("MediaNode contract not found");
        }
        console.log("MediaNode contract address:", mediaNodeAddress);

        // Get MediaNode contract instance
        const mediaNodeContract = await hre.ethers.getContractAt("MediaNode", mediaNodeAddress);

        // Delete the MediaNode
        try {
            const deleteTx = await mediaNodeContract.deleteMediaNode();
            console.log("Waiting for transaction confirmation...");
            await deleteTx.wait();
            
            // Get the updated node details after deletion
            try {
                const nodeDetails = await mediaNodeContract.getMediaNodeDetails();
                console.log("Node details after deletion:", {
                    id: nodeDetails.id,
                    owner: nodeDetails.owner,
                    status: nodeDetails.status,
                    created_at: nodeDetails.created_at.toString(),
                    updated_at: nodeDetails.updated_at.toString()
                });
                console.log("Medianode deleted successfully!");
            } catch (err) {
                console.error("Error fetching node details after deletion:", err.message);
                process.exit(1);
            }
        } catch (err) {
            console.error("Error deleting MediaNode:", err.message);
            process.exit(1);
        }
    } catch (err) {
        console.error("Error:", err.message);
        if (err.message.includes("factory is not instantiated")) {
            console.error("Factory is not initialized. Please run the instantiation script first.");
        }
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
});
