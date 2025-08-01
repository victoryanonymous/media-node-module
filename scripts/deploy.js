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
    const depositAmount = ethers.parseEther("0.1");
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
        medianode.target,
        depositAmount,
        { value: depositAmount }
    );
    // console.log('medianodeRegisterTx: ', medianodeRegisterTx)
    await medianodeRegisterTx.wait(1)
    console.log('medianode nodes: ', await medianode.getNodes())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });