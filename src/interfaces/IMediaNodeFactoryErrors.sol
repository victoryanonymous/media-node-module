// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Decimal} from "../lib/math/DecimalMath.sol";

interface IMediaNodeFactoryErrors {
    error UnauthorizedAccess();
    error AlreadyInstantiated();
    error InvalidCreationFee(uint256 creation_fee);
    error InvalidMinDeposit(uint256 min_deposit);
    error InvalidMinLeaseHours(uint256 min_lease_hours);
    error InvalidMaxLeaseHours(uint256 max_lease_hours);
    error InvalidInitialDepositPercentage(uint256 initial_deposit_percentage);
    error UrlAlreadyExists(string url);
    error MediaNodeIdAlreadyExists(string id);
    error InvalidName(string name);
    error InvalidDescription(string description);
    error InvalidUrl(string url);
    error InvalidPricePerHour(uint256 price_per_hour);
    error InvalidCpu(uint256 cpu);
    error InvalidRam(uint256 ram_in_gb);
    error InvalidStorage(uint256 storage_in_gb);
    error InvalidId(string id);
    error NodeNotFound(string id);
    error InvalidDeposit(uint256 deposit);
    error TransferFailed();
}
