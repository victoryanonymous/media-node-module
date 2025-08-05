// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMediaNodeErrors {
    error MediaNodeAlreadyExists(string id);
    error MediaNodeAlreadyExistsWithUrl(string id, string url);
    error MediaNodeNotFound(string id);
    error MediaNodeAlreadyLeased(string id);
    error DepositFailed(string id);
    error InvalidDepositAmount(uint256 amount);
    error DepositAmountTooLow(uint256 amount);
    error UnauthorizedAccess();
    error InvalidMediaNodeFactoryAddress(address mediaNodeFactoryAddress);
    error InvalidAddress(address addr);
    error MediaNodeCurrentlyLeased();
    error RefundFailed();
    error InsufficientBalance();
}
