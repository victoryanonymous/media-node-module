const hre = require("hardhat");
require("dotenv").config();

async function main() {
    const [account] = await hre.ethers.getSigners();
    console.log(`Updating MediaNode with account: ${account.address}`);

    // Get the factory contract
    const MediaNodeFactory = await hre.ethers.getContractFactory("MediaNodeFactory");
    const mediaNodeFactory = MediaNodeFactory.attach(process.env.FACTORY_ADDRESS);

    // Get factory params
    const params = await mediaNodeFactory.getParams();
    console.log("Factory is instantiated with params:", params);

    try {
        // Get the MediaNode contract address
        const mediaNodeAddress = await mediaNodeFactory.mediaNodeContractAddressesMap("medianode1234567890");
        if (mediaNodeAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("MediaNode contract not found");
        }

        // Get the MediaNode contract instance
        const MediaNode = await hre.ethers.getContractFactory("MediaNode");
        const mediaNodeContract = MediaNode.attach(mediaNodeAddress);

        // Get current node details from MediaNode contract
        const currentNode = await mediaNodeContract.getMediaNodeDetails();
        console.log("Current Node details:", {
            id: currentNode.id,
            owner: currentNode.owner,
            price_per_hour: currentNode.price_per_hour.toString(),
            name: currentNode.name,
            description: currentNode.description,
            url: currentNode.url,
            status: currentNode.status,
            created_at: currentNode.created_at.toString(),
            updated_at: currentNode.updated_at.toString(),
            cpu: currentNode.hardware_specs.cpu.toString(),
            ram_in_gb: currentNode.hardware_specs.ram_in_gb.toString(),
            storage_in_gb: currentNode.hardware_specs.storage_in_gb.toString()
        });

        // Prepare update data
        const updateData = {
            price_per_hour: 200,
            name: "Updated MediaNode Testing #1",
            description: "Updated MediaNode Description",
            url: "https://www.google.com",
            cpu: 8,
            ram_in_gb: 16,
            storage_in_gb: 128
        };

        console.log("Updating MediaNode with:", updateData);
        const updateTx = await mediaNodeContract.updateMediaNode(updateData);
        console.log("Waiting for transaction confirmation...");
        await updateTx.wait();

        // Get updated node details
        const updatedNode = await mediaNodeContract.getMediaNodeDetails();
        console.log("Updated Node details:", {
            id: updatedNode.id,
            owner: updatedNode.owner,
            price_per_hour: updatedNode.price_per_hour.toString(),
            name: updatedNode.name,
            description: updatedNode.description,
            url: updatedNode.url,
            status: updatedNode.status,
            created_at: updatedNode.created_at.toString(),
            updated_at: updatedNode.updated_at.toString(),
            cpu: updatedNode.hardware_specs.cpu.toString(),
            ram_in_gb: updatedNode.hardware_specs.ram_in_gb.toString(),
            storage_in_gb: updatedNode.hardware_specs.storage_in_gb.toString()
        });
    } catch (err) {
        console.error(" Error updating MediaNode:", err.message);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(" Script failed:", error);
    process.exit(1);
});