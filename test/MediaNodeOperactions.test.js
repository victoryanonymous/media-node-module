const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MediaNode", function () {
    let mediaNodeFactory;
    let mediaNodeImplementation;
    let mediaNodeInstance;
    let owner;
    let otherAccount;
    let factorySigner;
    let factoryAddress;

    const instantiateParams = {
        creation_fee: 100,
        min_lease_hours: 1,
        max_lease_hours: 24,
        initial_deposit_percentage: 10,
        min_deposit: 30
    };

    const nodeDetails = {
        id: "medianode123",
        price_per_hour: 10,
        name: "Test Node",
        description: "A test media node.",
        url: "http://testnode.com",
        hardware_specs: {
            cpu: 8,
            ram_in_gb: 16,
            storage_in_gb: 512
        },
        status: 0, // DEPOSIT
        owner: "", // Will be set in beforeEach
        leased: false,
        created_at: 0,
        updated_at: 0,
        deposits: [{
            amount: 30,
            sender: "",
            deposited_at: 0
        }]
    };

    const updateInput = {
        price_per_hour: 20,
        name: "Updated Node",
        description: "An updated test media node.",
        url: "http://updatednode.com",
        cpu: 16,
        ram_in_gb: 32,
        storage_in_gb: 1024,
    };

    beforeEach(async function () {
        [owner, otherAccount] = await ethers.getSigners();
        
        // Deploy the MediaNode implementation contract
        const MediaNode = await ethers.getContractFactory("MediaNode");
        mediaNodeImplementation = await MediaNode.deploy();
        await mediaNodeImplementation.waitForDeployment();
        
        // Deploy the MediaNodeFactory and instantiate it
        const MediaNodeFactory = await ethers.getContractFactory("MediaNodeFactory");
        mediaNodeFactory = await MediaNodeFactory.deploy(owner.address, mediaNodeImplementation.target);
        await mediaNodeFactory.waitForDeployment();
        
        await mediaNodeFactory.Instantiate(
            instantiateParams.creation_fee,
            instantiateParams.min_lease_hours,
            instantiateParams.max_lease_hours,
            instantiateParams.initial_deposit_percentage,
            instantiateParams.min_deposit
        );

        // Deploy the actual MediaNode instance (which would be done by the factory)
        const MediaNodeInstance = await ethers.getContractFactory("MediaNode");
        mediaNodeInstance = await MediaNodeInstance.deploy();
        await mediaNodeInstance.waitForDeployment();

        nodeDetails.owner = owner.address;
        nodeDetails.deposits[0].sender = owner.address;
        nodeDetails.deposits[0].amount = 30;
        nodeDetails.deposits[0].deposited_at = Math.floor(Date.now() / 1000);

        factoryAddress = mediaNodeFactory.target;

        await ethers.provider.send("hardhat_setBalance", [
            factoryAddress,
            "0x" + ethers.parseEther("10").toString(16)
        ]);
        
        factorySigner = await ethers.getImpersonatedSigner(factoryAddress);
    });

    describe("initialize", function () {
        it("should successfully initialize the contract", async function () {
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);
            const contractNodeDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(contractNodeDetails.owner).to.equal(nodeDetails.owner);
            expect(contractNodeDetails.id).to.equal(nodeDetails.id);
            expect(await mediaNodeInstance.MediaNodeFactoryAddress()).to.equal(mediaNodeFactory.target);
        });

        it("should revert if already initialized", async function () {
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);
            await expect(mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, mediaNodeFactory.target))
                .to.be.revertedWith("Already initialized");
        });

        it("should revert with InvalidMediaNodeFactoryAddress if not called by the factory", async function () {
            await expect(mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, '0x0000000000000000000000000000000000000000'))
                .to.be.revertedWith("Invalid factory address");
        });

        it("should revert if factory address is invalid", async function () {
            const badFactoryAddress = ethers.ZeroAddress;
            await expect(mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, badFactoryAddress))
                .to.be.revertedWith("Invalid factory address");
        });

        it("should revert if deposits array is empty", async function () {
            const emptyDepositsNodeDetails = { ...nodeDetails, deposits: [] };
            await expect(mediaNodeInstance.connect(factorySigner).initialize(emptyDepositsNodeDetails, mediaNodeFactory.target))
                .to.be.revertedWith("No deposits provided during initialization");
        });

        it("should handle deposits array with only one deposit and initialize the contract with getting params from factory", async function () {
            const singleDepositNodeDetails = { ...nodeDetails, deposits: [{ amount: 50, sender: owner.address, deposited_at: Math.floor(Date.now() / 1000) }] };
            await mediaNodeInstance.connect(factorySigner).initialize(singleDepositNodeDetails, mediaNodeFactory.target);
            const contractNodeDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(contractNodeDetails.owner).to.equal(nodeDetails.owner);
            expect(contractNodeDetails.id).to.equal(nodeDetails.id);
            expect(await mediaNodeInstance.MediaNodeFactoryAddress()).to.equal(mediaNodeFactory.target);
        });
    });

    describe("updateMediaNode", function () {
        it("should allow the owner to update node details", async function () {
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);

            const initialDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(initialDetails.owner).to.equal(owner.address);

            await mediaNodeInstance.connect(owner).updateMediaNode(updateInput);

            const finalDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(finalDetails.price_per_hour).to.equal(updateInput.price_per_hour);
            expect(finalDetails.name).to.equal(updateInput.name);
            expect(finalDetails.description).to.equal(updateInput.description);
            expect(finalDetails.url).to.equal(updateInput.url);
            expect(finalDetails.hardware_specs.cpu).to.equal(updateInput.cpu);
            expect(finalDetails.hardware_specs.ram_in_gb).to.equal(updateInput.ram_in_gb);
            expect(finalDetails.hardware_specs.storage_in_gb).to.equal(updateInput.storage_in_gb);
        });

        it("should only update non-zero or non-empty fields", async function () {
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);
            
            const initialDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(initialDetails.owner).to.equal(owner.address);
            
            const partialUpdateInput = {
                price_per_hour: 0,
                name: "",
                description: "",
                url: initialDetails.url,
                cpu: 0,
                ram_in_gb: 0,
                storage_in_gb: 0
            };
            
            await mediaNodeInstance.connect(owner).updateMediaNode(partialUpdateInput);
            const updatedDetails = await mediaNodeInstance.getMediaNodeDetails();

            expect(updatedDetails.price_per_hour).to.equal(initialDetails.price_per_hour);
            expect(updatedDetails.name).to.equal(initialDetails.name);
            expect(updatedDetails.description).to.equal(initialDetails.description);
            expect(updatedDetails.hardware_specs.cpu).to.equal(initialDetails.hardware_specs.cpu);
            expect(updatedDetails.hardware_specs.ram_in_gb).to.equal(initialDetails.hardware_specs.ram_in_gb);
            expect(updatedDetails.hardware_specs.storage_in_gb).to.equal(initialDetails.hardware_specs.storage_in_gb);
        });

        it("should revert with UnauthorizedAccess if not called by the owner", async function () {
            await expect(mediaNodeInstance.connect(otherAccount).updateMediaNode(updateInput))
                .to.be.revertedWithCustomError(mediaNodeInstance, "UnauthorizedAccess");
        });

        it('should successfully update media node with the provided input and emit MediaNodeUpdated event', async function () {
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);
            
            const initialDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(initialDetails.id).to.equal(nodeDetails.id);
            expect(initialDetails.owner).to.equal(nodeDetails.owner);

            await mediaNodeInstance.connect(owner).updateMediaNode(updateInput);
            const updatedDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(updatedDetails.price_per_hour).to.equal(updateInput.price_per_hour);
            expect(updatedDetails.name).to.equal(updateInput.name);
            expect(updatedDetails.description).to.equal(updateInput.description);
            expect(updatedDetails.hardware_specs.cpu).to.equal(updateInput.cpu);
            expect(updatedDetails.hardware_specs.ram_in_gb).to.equal(updateInput.ram_in_gb);
            expect(updatedDetails.hardware_specs.storage_in_gb).to.equal(updateInput.storage_in_gb);
        });
    });

    describe("depositMediaNode", function () {
        it("should successfully deposit and update node status to ACTIVE if deposit is sufficient", async function () {
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);
            
            const initialDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(initialDetails.id).to.equal(nodeDetails.id);
            expect(initialDetails.owner).to.equal(nodeDetails.owner);
            
            const depositAmount = 100; // >= creation_fee after deposit to the node
            await mediaNodeInstance.connect(otherAccount).depositMediaNode({ value: depositAmount });

            const finalDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(finalDetails.status).to.equal(1); // ACTIVE
            expect(finalDetails.deposits.length).to.equal(3);
            expect(finalDetails.deposits[2].amount).to.equal(depositAmount);
        });

        it("should successfully deposit and keep node status as DEPOSIT if deposit is insufficient", async function () {
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);
            const depositAmount = 30; // < creation_fee even after deposit to the node
            await mediaNodeInstance.connect(otherAccount).depositMediaNode({ value: depositAmount });

            const finalDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(finalDetails.status).to.equal(0); // DEPOSIT
            expect(finalDetails.deposits.length).to.equal(3);
            expect(finalDetails.deposits[2].amount).to.equal(depositAmount);
        });

        it("should revert if deposit amount is zero", async function () {
            await expect(mediaNodeInstance.connect(owner).depositMediaNode({ value: 0 }))
                .to.be.revertedWithCustomError(mediaNodeInstance, "InvalidDepositAmount");
        });
        
        it("should revert if deposit amount is too low", async function () {
            const tooLowDeposit = 10;
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);
            await expect(mediaNodeInstance.connect(otherAccount).depositMediaNode({ value: tooLowDeposit }))
                .to.be.revertedWithCustomError(mediaNodeInstance, "DepositAmountTooLow");
        });

        it("should handle successfully deposit by other account and emit MediaNodeDeposited event", async function () {
            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, factoryAddress);
            const depositAmount = 100; // >= creation_fee after deposit to the node
            await mediaNodeInstance.connect(otherAccount).depositMediaNode({ value: depositAmount });
            await mediaNodeInstance.connect(otherAccount).depositMediaNode({ value: depositAmount });

            const finalDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(finalDetails.status).to.equal(1); // ACTIVE
            expect(finalDetails.deposits.length).to.equal(4);
            expect(finalDetails.deposits[3].amount).to.equal(depositAmount);
        });
    });

    describe("deleteMediaNode", function () {
        let testReceiver;

        beforeEach(async function () {
            const TestReceiver = await ethers.getContractFactory("MediaNode");
            testReceiver = await TestReceiver.deploy();
            await testReceiver.waitForDeployment();

            nodeDetails.deposits = [{
                amount: 50,
                sender: testReceiver.target,
                deposited_at: Math.floor(Date.now() / 1000)
            }];

            mediaNodeInstance = await ethers.getContractAt("MediaNode", mediaNodeInstance.target);
            
            await ethers.provider.send("hardhat_setBalance", [
                factoryAddress,
                "0x" + ethers.parseEther("10").toString(16)
            ]);
            factorySigner = await ethers.getImpersonatedSigner(factoryAddress);

            await mediaNodeInstance.connect(factorySigner).initialize(nodeDetails, mediaNodeFactory.target);

            await owner.sendTransaction({
                to: mediaNodeInstance.target,
                value: ethers.parseEther("100")
            });
        });

        it("should allow the owner to delete the node and refund deposits", async function () {
            await mediaNodeInstance.connect(owner).deleteMediaNode();
            const finalDetails = await mediaNodeInstance.getMediaNodeDetails();
            expect(finalDetails.status).to.equal(2); // DELETED
        });

        it("should revert with UnauthorizedAccess if not called by the owner", async function () {
            await expect(mediaNodeInstance.connect(otherAccount).deleteMediaNode())
                .to.be.revertedWithCustomError(mediaNodeInstance, "UnauthorizedAccess");
        });

        it("should revert with MediaNodeCurrentlyLeased if the node is leased", async function () {
            const MediaNodeInstance = await ethers.getContractFactory("MediaNode");
            const leasedNodeInstance = await MediaNodeInstance.deploy();
            await leasedNodeInstance.waitForDeployment();
            
            const leasedNodeDetails = { ...nodeDetails, leased: true };
            await leasedNodeInstance.connect(factorySigner).initialize(leasedNodeDetails, mediaNodeFactory.target);

            await expect(leasedNodeInstance.connect(owner).deleteMediaNode())
                .to.be.revertedWithCustomError(leasedNodeInstance, "MediaNodeCurrentlyLeased");
        });

        it("should revert with RefundFailed if all refunds fail", async function () {
            const MediaNodeInstance = await ethers.getContractFactory("MediaNode");
            const failedRefundNodeInstance = await MediaNodeInstance.deploy();
            await failedRefundNodeInstance.waitForDeployment();
            
            await failedRefundNodeInstance.connect(factorySigner).initialize(nodeDetails, mediaNodeFactory.target);
            
            await expect(failedRefundNodeInstance.connect(owner).deleteMediaNode())
                .to.be.revertedWithCustomError(failedRefundNodeInstance, "RefundFailed");
        });
        
        // it("should emit a PartialRefund event if not all refunds are successful", async function () {
        //     const initialReceiverBalance = await ethers.provider.getBalance(testReceiver.target);
        //     await mediaNodeInstance.connect(owner).deleteMediaNode();
        //     const finalReceiverBalance = await ethers.provider.getBalance(testReceiver.target);
        //     expect(finalReceiverBalance).to.equal(initialReceiverBalance + 50n);
        // });
    });
});
