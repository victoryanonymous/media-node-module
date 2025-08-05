// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {IMediaNode} from "./interfaces/IMediaNode.sol";
import {IMediaNodeErrors} from "./interfaces/IMediaNodeErrors.sol";
import {MediaNodeTypes} from "./types/MediaNodeTypes.sol";
import {DecimalMath, Decimal} from "./lib/math/DecimalMath.sol";
import {MediaNodeFactory} from "./MediaNodeFactory.sol";
import {MediaNodeFactoryTypes} from "./types/MediaNodeFactoryTypes.sol";
import {IMediaNodeEvents} from "./interfaces/IMediaNodeEvents.sol";

contract MediaNode is IMediaNode, IMediaNodeErrors, IMediaNodeEvents {
    MediaNodeTypes.MediaNode public node;
    MediaNodeFactoryTypes.Params public mediaNodeFactoryParams;

    address public MediaNodeFactoryAddress;

    modifier onlyOwner() {
        require(
            msg.sender == node.owner,
            IMediaNodeErrors.UnauthorizedAccess()
        );
        _;
    }

    modifier isFactoryInitialized() {
        require(
            msg.sender == MediaNodeFactoryAddress,
            IMediaNodeErrors.InvalidMediaNodeFactoryAddress(
                MediaNodeFactoryAddress
            )
        );
        _;
    }

    constructor() {
        // Empty constructor for cloning
    }

    function getMediaNodeDetails()
        external
        view
        returns (MediaNodeTypes.MediaNode memory)
    {
        return node;
    }

    function initialize(
        MediaNodeTypes.MediaNode memory nodeDetails,
        address _MediaNodeFactoryAddress
    ) external {
        // Only allow initialization once
        require(MediaNodeFactoryAddress == address(0), "Already initialized");
        require(
            _MediaNodeFactoryAddress != address(0),
            "Invalid factory address"
        );
        require(
            nodeDetails.deposits.length > 0,
            "No deposits provided during initialization"
        );

        MediaNodeFactoryAddress = _MediaNodeFactoryAddress;
        node = nodeDetails;
        mediaNodeFactoryParams = MediaNodeFactory(MediaNodeFactoryAddress)
            .getParams();

        emit MediaNodeSpecs(
            node.hardware_specs.cpu,
            node.hardware_specs.ram_in_gb,
            node.hardware_specs.storage_in_gb
        );

        // Copy deposits from nodeDetails
        for (uint256 i = 0; i < nodeDetails.deposits.length; i++) {
            node.deposits.push(nodeDetails.deposits[i]);
        }
    }

    function updateMediaNode(
        MediaNodeTypes.UpdateMediaNodeInput calldata input
    ) external onlyOwner {
        if (input.price_per_hour != 0) {
            node.price_per_hour = input.price_per_hour;
        }
        if (bytes(input.name).length != 0) {
            node.name = input.name;
        }
        if (bytes(input.description).length != 0) {
            node.description = input.description;
        }
        if (input.cpu != 0) {
            node.hardware_specs.cpu = input.cpu;
        }
        if (input.ram_in_gb != 0) {
            node.hardware_specs.ram_in_gb = input.ram_in_gb;
        }
        if (input.storage_in_gb != 0) {
            node.hardware_specs.storage_in_gb = input.storage_in_gb;
        }
        node.updated_at = block.timestamp;

        emit IMediaNodeEvents.MediaNodeUpdated(
            node.id,
            node.price_per_hour,
            node.name,
            node.description,
            node.url,
            node.hardware_specs,
            node.status,
            node.created_at,
            node.updated_at
        );
    }

    function depositMediaNode() public payable {
        if (msg.value == 0) {
            revert IMediaNodeErrors.InvalidDepositAmount(msg.value);
        }

        if (msg.value < mediaNodeFactoryParams.min_deposit) {
            revert IMediaNodeErrors.DepositAmountTooLow(msg.value);
        }

        uint256 total_deposited_amount = 0;
        uint256 depositsLength = node.deposits.length;

        // Calculate total deposited amount using storage array directly
        for (uint256 i = 0; i < depositsLength; i++) {
            total_deposited_amount += node.deposits[i].amount;
        }

        total_deposited_amount += msg.value;

        if (total_deposited_amount >= mediaNodeFactoryParams.creation_fee) {
            node.status = MediaNodeTypes.MediaNodeStatus.ACTIVE;
        }

        MediaNodeTypes.Deposit memory deposit = MediaNodeTypes.Deposit({
            amount: msg.value,
            sender: msg.sender,
            deposited_at: block.timestamp
        });

        node.deposits.push(deposit);

        node.updated_at = block.timestamp;

        emit IMediaNodeEvents.MediaNodeDeposited(
            node.id,
            msg.value,
            msg.sender,
            node.status
        );
    }

    function deleteMediaNode() public payable onlyOwner {
        if (node.leased) {
            revert IMediaNodeErrors.MediaNodeCurrentlyLeased();
        }

        uint256 successfulRefunds = 0;
        uint256 totalRefunds = node.deposits.length;
        uint256 totalRefundAmount = 0;

        // First calculate total refund amount
        for (uint256 i = 0; i < totalRefunds; i++) {
            unchecked {
                totalRefundAmount += node.deposits[i].amount;
            }
        }

        // Check if contract has enough balance
        // if (address(this).balance < totalRefundAmount) {
        //     revert IMediaNodeErrors.InsufficientBalance();
        // }

        // Attempt refunds by iterating backwards through the array
        for (uint256 i = totalRefunds; i > 0; i--) {
            uint256 index = i - 1;
            uint256 amount = node.deposits[index].amount;
            address payable recipient = payable(node.deposits[index].sender);

            unchecked {
                totalRefundAmount -= amount;
            }

            emit IMediaNodeEvents.DebugRefundAttempt(
                node.id,
                recipient,
                amount,
                block.timestamp
            );

            (bool success, ) = recipient.call{value: amount}("");

            if (success) {
                successfulRefunds++;
                emit IMediaNodeEvents.DepositRefunded(
                    node.id,
                    recipient,
                    amount,
                    block.timestamp
                );
                // Delete from the end of the array
                delete node.deposits[index];
            }
        }

        // Handle refund results
        if (successfulRefunds == 0) {
            revert IMediaNodeErrors.RefundFailed();
        }

        if (successfulRefunds < totalRefunds) {
            emit IMediaNodeEvents.PartialRefund(
                node.id,
                totalRefunds - successfulRefunds,
                block.timestamp
            );
        }

        node.status = MediaNodeTypes.MediaNodeStatus.DELETED;
        node.updated_at = block.timestamp;

        emit IMediaNodeEvents.MediaNodeDeleted(
            node.id,
            node.owner,
            successfulRefunds,
            totalRefunds,
            node.status,
            block.timestamp
        );
    }

    receive() external payable {
        // Refund the sender
    }

    fallback() external payable {
        // Refund the sender
    }
}
