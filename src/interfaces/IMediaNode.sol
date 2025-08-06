// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MediaNodeTypes} from "../types/MediaNodeTypes.sol";

interface IMediaNode {
    function initialize(
        MediaNodeTypes.MediaNode memory nodeDetails,
        address _mediaNodeFactoryAddress
    ) external;

    function updateMediaNode(
        MediaNodeTypes.UpdateMediaNodeInput calldata input
    ) external;

    function deleteMediaNode() external payable;

    function getMediaNodeDetails()
        external
        view
        returns (MediaNodeTypes.MediaNode memory);

    function depositMediaNode() external payable;
}
