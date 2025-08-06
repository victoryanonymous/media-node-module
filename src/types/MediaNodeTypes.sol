// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library MediaNodeTypes {
    struct MediaNode {
        string id;
        address owner;
        uint256 price_per_hour;
        string name;
        string description;
        string url;
        bool leased;
        HardwareSpecs hardware_specs;
        Deposit[] deposits;
        MediaNodeStatus status;
        uint256 created_at;
        uint256 updated_at;
    }

    enum MediaNodeStatus {
        DEPOSIT,
        ACTIVE,
        DELETED
    }

    struct Deposit {
        uint256 amount;
        address sender;
        uint256 deposited_at;
    }

    struct HardwareSpecs {
        uint64 cpu;
        uint64 ram_in_gb;
        uint256 storage_in_gb;
    }

    struct UpdateMediaNodeInput {
        uint256 price_per_hour;
        string name;
        string description;
        string url;
        uint64 cpu;
        uint64 ram_in_gb;
        uint256 storage_in_gb;
    }

    struct DepositMediaNodeInput {
        string id;
    }

    struct DeleteMediaNodeInput {
        string id;
    }

    struct GetMediaNodeInput {
        string id;
    }

    struct MediaNodeView {
        string id;
        address owner;
        uint256 price_per_hour;
        string name;
        string description;
        string url;
        bool leased;
        HardwareSpecs hardware_specs;
        MediaNodeStatus status;
        Deposit[] deposits;
        uint256 created_at;
        uint256 updated_at;
    }
}
