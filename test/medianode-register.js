const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Medianode", function () {
    let medianode;
    beforeEach(async function () {
        medianode = await ethers.getContractFactory("Medianode");
        medianode = await medianode.deploy();
    });
    describe("registerMediaNode", function () {
        it('should revert with NotEnoughDeposit error if deposit is less than MIN_DEPOSIT', async function () {
            await expect(
                medianode.registerMediaNode(
                    "medianode1234567890",
                    100,
                    "test",
                    "test",
                    "test",
                    {
                        cpu: 4,
                        ram_in_gb: 8,
                        storage_in_gb: 64
                    },
                    medianode.target,
                    ethers.parseEther("0")
                )
            ).to.be.revertedWithCustomError(
                medianode,
                "NotEnoughDeposit"
            );
        });
        it('should register a node', async function () {
            const depositAmount = ethers.parseEther("10");
            const medianodeRegisterTx = await medianode.registerMediaNode(
                "medianode1234567890",
                100,
                "test",
                "test",
                "test",
                {
                    cpu: 4,
                    ram_in_gb: 8,
                    storage_in_gb: 64
                },
                medianode.target,
                depositAmount,
                { value: depositAmount }
            );
            expect(await medianode.getNodes()).to.have.lengthOf(1);
        });
        it('should revert if balance is not enough to deposit', async function () {
            await expect(
                medianode.registerMediaNode(
                    "medianode1234567890",
                    100,
                    "test",
                    "test",
                    "test",
                    {
                        cpu: 4,
                        ram_in_gb: 8,
                        storage_in_gb: 64
                    },
                    medianode.target,
                    ethers.parseEther("10"),
                    { value: ethers.parseEther("5") }
                )
            ).to.be.revertedWithCustomError(
                medianode,
                "NotEnoughBalance"
            );
        });
    });
    describe("getNodes", function () {
        it('should return an empty array if no nodes are registered', async function () {
            expect(await medianode.getNodes()).to.have.lengthOf(1);
        });
    });
});