// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MediaNodeTypes} from "../types/MediaNodeTypes.sol";
import {Decimal} from "../lib/math/DecimalMath.sol";

interface IMediaNodeEvents {
    event MediaNodeUpdated(
        string id,
        uint256 price_per_hour,
        string name,
        string description,
        string url,
        MediaNodeTypes.HardwareSpecs hardware_specs,
        MediaNodeTypes.MediaNodeStatus status,
        uint256 created_at,
        uint256 updated_at
    );
    event MediaNodeSpecs(uint64 cpu, uint64 ram_in_gb, uint256 storage_in_gb);
    event MediaNodeDeposited(
        string id,
        uint256 amount,
        address sender,
        MediaNodeTypes.MediaNodeStatus status
    );
    event MediaNodeDeleted(
        string id,
        address owner,
        uint256 successful_refunds,
        uint256 total_refunds,
        MediaNodeTypes.MediaNodeStatus status,
        uint256 updated_at
    );
    event DebugRefundAttempt(
        string id,
        address recipient,
        uint256 amount,
        uint256 timestamp
    );
    event DepositRefunded(
        string id,
        address recipient,
        uint256 amount,
        uint256 timestamp
    );
    event PartialRefund(
        string id,
        uint256 remaining_refunds,
        uint256 timestamp
    );
}
