// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MediaNodeTypes} from "./MediaNodeTypes.sol";

library MediaNodeFactoryTypes {
    struct Params {
        address instantiator;
        uint256 creation_fee;
        uint256 min_lease_hours;
        uint256 max_lease_hours;
        uint256 initial_deposit_percentage;
        uint256 min_deposit;
    }

    struct NewMediaNodeRegistration {
        string id;
        uint256 price_per_hour;
        string name;
        string description;
        string url;
        MediaNodeTypes.HardwareSpecs hardware_specs;
    }
}
