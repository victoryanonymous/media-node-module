const { task } = require("hardhat/config");

task("check-factory-params", "Checks if the factory is instantiated").setAction(
    async (taskArgs, hre) => {
        const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
        if (!FACTORY_ADDRESS) {
            console.error("Factory address not found");
            process.exit(1);
        }
        const MediaNodeFactory = await hre.ethers.getContractFactory("MediaNodeFactory");
        const mediaNodeFactory = await MediaNodeFactory.attach(FACTORY_ADDRESS);
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
            console.error("Factory is not initialized. Please run the instantiation script first.");
            process.exit(1);
        }
    }
);
