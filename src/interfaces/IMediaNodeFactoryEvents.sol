// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MediaNodeFactoryTypes} from "../types/MediaNodeFactoryTypes.sol";
import {MediaNodeTypes} from "../types/MediaNodeTypes.sol";

interface IMediaNodeFactoryEvents {
    event MediaNodeFactoryInstantiated(MediaNodeFactoryTypes.Params params);
    event MediaNodeRegistered(
        string id,
        uint256 price_per_hour,
        string name,
        string description,
        string url,
        address owner,
        MediaNodeTypes.MediaNodeStatus status,
        MediaNodeTypes.Deposit[] deposits,
        uint256 created_at,
        uint256 updated_at
    );
    event MediaNodeDetails(
        string id,
        address owner,
        uint256 price_per_hour,
        string name,
        string description,
        string url,
        bool leased,
        uint64 cpu,
        uint64 ram_in_gb,
        uint256 storage_in_gb,
        MediaNodeTypes.MediaNodeStatus status,
        uint256 created_at,
        uint256 updated_at
    );
}
