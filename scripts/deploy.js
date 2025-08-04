const { ethers, run, network } = require("hardhat");

async function main() {
    const MedianodeFactory = await ethers.getContractFactory("Medianode");
    console.log("Deploying contract...");
    const medianode = await MedianodeFactory.deploy();
    console.log("Deployment transaction sent. Waiting for 1 confirmation...");
    const deploymentReceipt = await medianode.deploymentTransaction().wait(1);
    console.log(`Contract deployed to address: ${medianode.target}`);
    console.log(`Transaction hash: ${deploymentReceipt.hash}`);
    console.log(`Gas used: ${deploymentReceipt.gasUsed.toString()}`);
    console.log('network: ', network.config)
    console.log('medianode: ', medianode)
    const medianodeRegisterTx = await medianode.registerMediaNode(
        "medianode1234567890",
        100,
        "MediaNode Testing",
        "MediaNode Description",
        "https://www.google.com",
        {
            cpu: 4,
            ram_in_gb: 8,
            storage_in_gb: 64
        },
        medianode.target  // "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    );
    await medianodeRegisterTx.wait(1)
    const node1 = await medianode.getNodeById("medianode1234567890");
    console.log("Node active status:", node1.is_active);
    const depositAmount = ethers.parseEther("9");
    const depositTx = await medianode.depositMediaNode("medianode1234567890", {
        value: depositAmount
    });
    await depositTx.wait(1);
    console.log("Deposit done", depositTx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });