const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MediaNodeRegister", function () {
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

    const registrationInput = {
        id: "medianode1234567890",
        name: "Test Node",
        description: "A test media node.",
        url: "http://testnode.com",
        price_per_hour: 10,
        hardware_specs: {
            cpu: 8,
            ram_in_gb: 16,
            storage_in_gb: 512
        }
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

    describe("registerMediaNode", function () {
        beforeEach(async function () {
            // Instantiate the factory first
            await mediaNodeFactory.Instantiate(
                instantiateParams.creation_fee,
                instantiateParams.min_lease_hours,
                instantiateParams.max_lease_hours,
                instantiateParams.initial_deposit_percentage,
                instantiateParams.min_deposit
            );
        });

        it("should successfully register a media node and set its status to ACTIVE", async function () {
            const depositAmount = 100; // >= creation_fee

            expect(await mediaNodeFactory.mediaNodeCount()).to.equal(0);

            await expect(mediaNodeFactory.registerMediaNode(registrationInput, { value: depositAmount }))
                .to.emit(mediaNodeFactory, "MediaNodeRegistered");

            expect(await mediaNodeFactory.mediaNodeCount()).to.equal(1);

            const nodeDetails = await mediaNodeFactory.getNodeDetails(registrationInput.id);
            expect(nodeDetails.owner).to.equal(owner.address);
            expect(nodeDetails.status).to.equal(1); // 1 = ACTIVE
            expect(nodeDetails.deposits[0].amount).to.equal(depositAmount);
        });

        it("should register a media node with status DEPOSIT if the deposit is less than the creation fee", async function () {
            const depositAmount = 50; // < creation_fee but >= min_required_deposit

            await expect(mediaNodeFactory.registerMediaNode(registrationInput, { value: depositAmount }))
                .to.emit(mediaNodeFactory, "MediaNodeRegistered");

            const nodeDetails = await mediaNodeFactory.getNodeDetails(registrationInput.id);
            expect(nodeDetails.status).to.equal(0); // 0 = DEPOSIT
            expect(nodeDetails.deposits[0].amount).to.equal(depositAmount);
        });

        it("should revert if the deposit is less than the minimum required", async function () {
            const insufficientDeposit = 1; // less than minRequiredDeposit
            await expect(mediaNodeFactory.registerMediaNode(registrationInput, { value: insufficientDeposit }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidDeposit")
                .withArgs(insufficientDeposit);
        });

        it("should revert if the media node ID already exists", async function () {
            const depositAmount = 100;

            // Register the node the first time
            await mediaNodeFactory.registerMediaNode(registrationInput, { value: depositAmount });

            // Attempt to register again with the same ID
            await expect(mediaNodeFactory.registerMediaNode(registrationInput, { value: depositAmount }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "MediaNodeIdAlreadyExists")
                .withArgs(registrationInput.id);
        });

        it("should revert if the URL already exists", async function () {
            const depositAmount = 100;

            await mediaNodeFactory.registerMediaNode(registrationInput, { value: depositAmount });

            const secondRegistrationInput = { ...registrationInput, id: "medianode1234567891" };
            await expect(mediaNodeFactory.registerMediaNode(secondRegistrationInput, { value: depositAmount }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "UrlAlreadyExists")
                .withArgs(registrationInput.url);
        });

        // Test cases for invalid registration input
        it("should revert if id is empty", async function () {
            const invalidInput = { ...registrationInput, id: "" };
            await expect(mediaNodeFactory.registerMediaNode(invalidInput, { value: ethers.parseEther("100") }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidId")
                .withArgs("");
        });

        it("should revert if name is empty", async function () {
            const invalidInput = { ...registrationInput, name: "" };
            await expect(mediaNodeFactory.registerMediaNode(invalidInput, { value: ethers.parseEther("100") }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidName")
                .withArgs("");
        });

        it("should revert if description is empty", async function () {
            const invalidInput = { ...registrationInput, description: "" };
            await expect(mediaNodeFactory.registerMediaNode(invalidInput, { value: ethers.parseEther("100") }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidDescription")
                .withArgs("");
        });

        it("should revert if url is empty", async function () {
            const invalidInput = { ...registrationInput, url: "" };
            await expect(mediaNodeFactory.registerMediaNode(invalidInput, { value: ethers.parseEther("100") }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidUrl")
                .withArgs("");
        });

        it("should revert if price_per_hour is 0", async function () {
            const invalidInput = { ...registrationInput, price_per_hour: 0 };
            await expect(mediaNodeFactory.registerMediaNode(invalidInput, { value: ethers.parseEther("100") }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidPricePerHour")
                .withArgs(0);
        });

        it("should revert if cpu is 0", async function () {
            const invalidInput = { ...registrationInput, hardware_specs: { ...registrationInput.hardware_specs, cpu: 0 } };
            await expect(mediaNodeFactory.registerMediaNode(invalidInput, { value: ethers.parseEther("100") }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidCpu")
                .withArgs(0);
        });

        it("should revert if ram_in_gb is 0", async function () {
            const invalidInput = { ...registrationInput, hardware_specs: { ...registrationInput.hardware_specs, ram_in_gb: 0 } };
            await expect(mediaNodeFactory.registerMediaNode(invalidInput, { value: ethers.parseEther("100") }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidRam")
                .withArgs(0);
        });

        it("should revert if storage_in_gb is 0", async function () {
            const invalidInput = { ...registrationInput, hardware_specs: { ...registrationInput.hardware_specs, storage_in_gb: 0 } };
            await expect(mediaNodeFactory.registerMediaNode(invalidInput, { value: ethers.parseEther("100") }))
                .to.be.revertedWithCustomError(mediaNodeFactory, "InvalidStorage")
                .withArgs(0);
        });
    });

    describe("getNodeDetails", function () {
        beforeEach(async function () {
            await mediaNodeFactory.Instantiate(
                instantiateParams.creation_fee,
                instantiateParams.min_lease_hours,
                instantiateParams.max_lease_hours,
                instantiateParams.initial_deposit_percentage,
                instantiateParams.min_deposit
            );
        });

        it("should return the details of a media node by id if it exists", async function () {
            const depositAmount = 100;

            await mediaNodeFactory.registerMediaNode(registrationInput, { value: depositAmount });
            expect(await mediaNodeFactory.mediaNodeCount()).to.equal(1);

            const nodeDetails = await mediaNodeFactory.getNodeDetails(registrationInput.id);
            expect(nodeDetails.owner).to.equal(owner.address);
            expect(nodeDetails.status).to.equal(1);
            expect(nodeDetails.deposits[0].amount).to.equal(depositAmount);
        });

        it("should revert if the media node ID does not exist", async function () {
            await expect(mediaNodeFactory.getNodeDetails("nonexistent_id"))
                .to.be.revertedWithCustomError(mediaNodeFactory, "NodeNotFound")
                .withArgs("nonexistent_id");
        });
    });
});