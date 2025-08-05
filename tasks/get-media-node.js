const { task } = require("hardhat/config");

task("get-media-node", "Get MediaNode details").setAction(async (taskArgs, hre) => {
    const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
    if (!FACTORY_ADDRESS) {
        console.error("Factory address not found");
        process.exit(1);
    }
    const mediaNodeFactory = await hre.ethers.getContractFactory("MediaNodeFactory");
    const mediaNodeFactoryInstance = await mediaNodeFactory.attach(FACTORY_ADDRESS);
    const mediaNodeAddress = await mediaNodeFactoryInstance.mediaNodeContractAddressesMap("medianode1234567890");
    const mediaNode = await hre.ethers.getContractFactory("MediaNode");
    const mediaNodeInstance = await mediaNode.attach(mediaNodeAddress);
    const mediaNodeDetails = await mediaNodeInstance.getMediaNodeDetails();
    console.log(mediaNodeDetails);
});
