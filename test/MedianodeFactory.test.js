const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MediaNodeFactory", function () {
    let mediaNodeFactory;
    let mediaNodeImplementation;
    let owner;
    let otherAccount;

    const instantiateParams = {
        creation_fee: 100,
        min_lease_hours: 1,
        max_lease_hours: 24,
        initial_deposit_percentage: 10,
        min_deposit: 50
    };

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();

        const MediaNode = await ethers.getContractFactory("MediaNode");
        mediaNodeImplementation = await MediaNode.deploy();
        await mediaNodeImplementation.waitForDeployment();

        const MediaNodeFactory = await ethers.getContractFactory("MediaNodeFactory");
        mediaNodeFactory = await MediaNodeFactory.deploy(owner.address, mediaNodeImplementation.target);
        await mediaNodeFactory.waitForDeployment();
    });

    describe("Instantiate", function () {
        it("should allow the owner to instantiate the factory with valid parameters", async function () {
            expect(await mediaNodeFactory.getInstantiatedStatus()).to.be.false;

            await mediaNodeFactory.Instantiate(
                instantiateParams.creation_fee,
                instantiateParams.min_lease_hours,
                instantiateParams.max_lease_hours,
                instantiateParams.initial_deposit_percentage,
                instantiateParams.min_deposit
            );

            expect(await mediaNodeFactory.getInstantiatedStatus()).to.be.true;

            const params = await mediaNodeFactory.getParams();
            expect(params.instantiator).to.equal(owner.address);
            expect(params.creation_fee).to.equal(instantiateParams.creation_fee);
            expect(params.min_lease_hours).to.equal(instantiateParams.min_lease_hours);
            expect(params.max_lease_hours).to.equal(instantiateParams.max_lease_hours);
            expect(params.initial_deposit_percentage).to.equal(instantiateParams.initial_deposit_percentage);
            expect(params.min_deposit).to.equal(instantiateParams.min_deposit);
        });

        it("should emit a MediaNodeFactoryInstantiated event on success", async function () {
            await expect(mediaNodeFactory.Instantiate(
                instantiateParams.creation_fee,
                instantiateParams.min_lease_hours,
                instantiateParams.max_lease_hours,
                instantiateParams.initial_deposit_percentage,
                instantiateParams.min_deposit
            ))
            .to.emit(mediaNodeFactory, "MediaNodeFactoryInstantiated")
            .withArgs(
                [
                    owner.address,
                    instantiateParams.creation_fee,
                    instantiateParams.min_lease_hours,
                    instantiateParams.max_lease_hours,
                    instantiateParams.initial_deposit_percentage,
                    instantiateParams.min_deposit
                ]
            );
        });

        it("should revert with UnauthorizedAccess error if caller is not the contract owner", async function () {
            await expect(
                mediaNodeFactory.connect(otherAccount).Instantiate(
                    instantiateParams.creation_fee,
                    instantiateParams.min_lease_hours,
                    instantiateParams.max_lease_hours,
                    instantiateParams.initial_deposit_percentage,
                    instantiateParams.min_deposit
                )
            ).to.be.revertedWithCustomError(mediaNodeFactory, "UnauthorizedAccess");
        });

        it("should revert with AlreadyInstantiated error if called more than once", async function () {
            await mediaNodeFactory.Instantiate(
                instantiateParams.creation_fee,
                instantiateParams.min_lease_hours,
                instantiateParams.max_lease_hours,
                instantiateParams.initial_deposit_percentage,
                instantiateParams.min_deposit
            );

            await expect(mediaNodeFactory.Instantiate(
                instantiateParams.creation_fee,
                instantiateParams.min_lease_hours,
                instantiateParams.max_lease_hours,
                instantiateParams.initial_deposit_percentage,
                instantiateParams.min_deposit
            )).to.be.revertedWithCustomError(mediaNodeFactory, "AlreadyInstantiated");
        });

        // Test cases for invalid parameters
        it("should revert for invalid creation_fee (0)", async function () {
            await expect(mediaNodeFactory.Instantiate(0, 1, 24, 10, 50)).to.be.revertedWithCustomError(mediaNodeFactory, "InvalidCreationFee").withArgs(0);
        });

        it("should revert for invalid min_lease_hours (0)", async function () {
            await expect(mediaNodeFactory.Instantiate(100, 0, 24, 10, 50)).to.be.revertedWithCustomError(mediaNodeFactory, "InvalidMinLeaseHours").withArgs(0);
        });

        it("should revert for invalid max_lease_hours (0)", async function () {
            await expect(mediaNodeFactory.Instantiate(100, 1, 0, 10, 50)).to.be.revertedWithCustomError(mediaNodeFactory, "InvalidMaxLeaseHours").withArgs(0);
        });

        it("should revert if min_lease_hours is greater than max_lease_hours", async function () {
            await expect(mediaNodeFactory.Instantiate(100, 25, 24, 10, 50)).to.be.revertedWithCustomError(mediaNodeFactory, "InvalidMinLeaseHours").withArgs(25);
        });

        it("should revert if initial_deposit_percentage is 0", async function () {
            await expect(mediaNodeFactory.Instantiate(100, 1, 24, 0, 50)).to.be.revertedWithCustomError(mediaNodeFactory, "InvalidInitialDepositPercentage").withArgs(0);
        });

        it("should revert if initial_deposit_percentage is greater than 100", async function () {
            await expect(mediaNodeFactory.Instantiate(100, 1, 24, 101, 50)).to.be.revertedWithCustomError(mediaNodeFactory, "InvalidInitialDepositPercentage").withArgs(101);
        });

        it("should revert if min_deposit is 0", async function () {
            await expect(mediaNodeFactory.Instantiate(100, 1, 24, 10, 0)).to.be.revertedWithCustomError(mediaNodeFactory, "InvalidMinDeposit").withArgs(0);
        });
    });
});