const { task } = require("hardhat/config");

task("accounts", "Prints the list of accounts").setAction(
    async (taskArgs, hre) => {
        const accounts = await hre.ethers.getSigners();
        for (const account of accounts) {
            console.log(account.address);
        }
    }
);