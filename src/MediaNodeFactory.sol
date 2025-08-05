// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import {IMediaNodeFactoryEvents} from "./interfaces/IMediaNodeFactoryEvents.sol";
import {IMediaNodeFactoryErrors} from "./interfaces/IMediaNodeFactoryErrors.sol";
import {MediaNodeFactoryTypes} from "./types/MediaNodeFactoryTypes.sol";
import {IMediaNodeEvents} from "./interfaces/IMediaNodeEvents.sol";
import {MediaNodeTypes} from "./types/MediaNodeTypes.sol";
import {IMediaNode} from "./interfaces/IMediaNode.sol";
import {DecimalMath, Decimal} from "./lib/math/DecimalMath.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

contract MediaNodeFactory is
    IMediaNodeFactoryEvents,
    IMediaNodeFactoryErrors,
    IMediaNodeEvents
{
    address public immutable contractOwner;
    address public mediaNodeImplementation;
    bool private _instantiated;

    MediaNodeFactoryTypes.Params public params;

    mapping(uint256 => address) public mediaNodeOwnersMap;
    mapping(string => uint256) public mediaNodeUrlsMap;
    mapping(string => address) public mediaNodeContractAddressesMap;
    mapping(string => MediaNodeTypes.MediaNode) public nodes;

    uint256 public mediaNodeCount = 0;

    modifier onlyOwner() {
        require(
            msg.sender == contractOwner,
            IMediaNodeFactoryErrors.UnauthorizedAccess()
        );
        _;
    }

    modifier isNotInstantiated() {
        require(!_instantiated, IMediaNodeFactoryErrors.AlreadyInstantiated());
        _;
    }

    constructor(address _contractOwner, address _mediaNodeImplementation) {
        contractOwner = _contractOwner;
        mediaNodeImplementation = _mediaNodeImplementation;
        _instantiated = false;
    }

    function Instantiate(
        uint256 creation_fee,
        uint256 min_lease_hours,
        uint256 max_lease_hours,
        uint256 initial_deposit_percentage,
        uint256 min_deposit
    ) external onlyOwner isNotInstantiated {
        if (creation_fee == 0) {
            revert IMediaNodeFactoryErrors.InvalidCreationFee(creation_fee);
        }
        if (min_lease_hours == 0) {
            revert IMediaNodeFactoryErrors.InvalidMinLeaseHours(
                min_lease_hours
            );
        }
        if (max_lease_hours == 0) {
            revert IMediaNodeFactoryErrors.InvalidMaxLeaseHours(
                max_lease_hours
            );
        }
        if (
            initial_deposit_percentage == 0 || initial_deposit_percentage > 100
        ) {
            revert IMediaNodeFactoryErrors.InvalidInitialDepositPercentage(
                initial_deposit_percentage
            );
        }
        if (min_lease_hours > max_lease_hours) {
            revert IMediaNodeFactoryErrors.InvalidMinLeaseHours(
                min_lease_hours
            );
        }
        if (min_deposit == 0) {
            revert IMediaNodeFactoryErrors.InvalidMinDeposit(min_deposit);
        }

        params = MediaNodeFactoryTypes.Params({
            instantiator: msg.sender,
            creation_fee: creation_fee,
            min_lease_hours: min_lease_hours,
            max_lease_hours: max_lease_hours,
            initial_deposit_percentage: initial_deposit_percentage,
            min_deposit: min_deposit
        });

        _instantiated = true;

        emit MediaNodeFactoryInstantiated(params);
    }

    function registerMediaNode(
        MediaNodeFactoryTypes.NewMediaNodeRegistration calldata input
    ) public payable {
        _validateRegistrationInput(input);
        _checkUrlExists(input.url);

        string calldata id = input.id;
        MediaNodeTypes.MediaNodeStatus status = _determineStatus(msg.value);

        MediaNodeTypes.MediaNode memory nodeDetails = _createNodeDetails(
            input,
            id,
            status
        );

        address nodeAddress = _deployAndInitializeNode(nodeDetails);
        mediaNodeContractAddressesMap[id] = nodeAddress;
        _updateMappings(input.url, msg.sender);

        _transferFunds(nodeAddress);
        nodes[id] = nodeDetails;

        _emitEvents(id, input, status, nodeDetails.deposits);
    }

    function _validateRegistrationInput(
        MediaNodeFactoryTypes.NewMediaNodeRegistration calldata input
    ) private view {
        uint256 min_required_deposit = uint256(params.creation_fee) /
            uint256(params.initial_deposit_percentage);
        if (msg.value < min_required_deposit) {
            revert IMediaNodeFactoryErrors.InvalidDeposit(msg.value);
        }
        if (bytes(input.id).length == 0) {
            revert IMediaNodeFactoryErrors.InvalidId(input.id);
        }
        if (mediaNodeContractAddressesMap[input.id] != address(0)) {
            revert IMediaNodeFactoryErrors.MediaNodeIdAlreadyExists(input.id);
        }
        if (bytes(input.name).length == 0) {
            revert IMediaNodeFactoryErrors.InvalidName(input.name);
        }
        if (bytes(input.description).length == 0) {
            revert IMediaNodeFactoryErrors.InvalidDescription(
                input.description
            );
        }
        if (bytes(input.url).length == 0) {
            revert IMediaNodeFactoryErrors.InvalidUrl(input.url);
        }
        if (input.price_per_hour == 0) {
            revert IMediaNodeFactoryErrors.InvalidPricePerHour(
                input.price_per_hour
            );
        }
        if (input.hardware_specs.cpu == 0) {
            revert IMediaNodeFactoryErrors.InvalidCpu(input.hardware_specs.cpu);
        }
        if (input.hardware_specs.ram_in_gb == 0) {
            revert IMediaNodeFactoryErrors.InvalidRam(
                input.hardware_specs.ram_in_gb
            );
        }
        if (input.hardware_specs.storage_in_gb == 0) {
            revert IMediaNodeFactoryErrors.InvalidStorage(
                input.hardware_specs.storage_in_gb
            );
        }
    }

    function _checkUrlExists(string calldata url) private view {
        if (mediaNodeUrlsMap[url] != 0) {
            revert IMediaNodeFactoryErrors.UrlAlreadyExists(url);
        }
    }

    function _determineStatus(
        uint256 value
    ) private view returns (MediaNodeTypes.MediaNodeStatus) {
        if (value >= params.creation_fee) {
            return MediaNodeTypes.MediaNodeStatus.ACTIVE;
        }
        return MediaNodeTypes.MediaNodeStatus.DEPOSIT;
    }

    function _createNodeDetails(
        MediaNodeFactoryTypes.NewMediaNodeRegistration calldata input,
        string calldata id,
        MediaNodeTypes.MediaNodeStatus status
    ) private view returns (MediaNodeTypes.MediaNode memory) {
        MediaNodeTypes.Deposit[] memory deposits = new MediaNodeTypes.Deposit[](
            1
        );
        deposits[0] = MediaNodeTypes.Deposit({
            amount: msg.value,
            sender: msg.sender,
            deposited_at: block.timestamp
        });

        return
            MediaNodeTypes.MediaNode({
                id: id,
                price_per_hour: input.price_per_hour,
                name: input.name,
                description: input.description,
                url: input.url,
                hardware_specs: input.hardware_specs,
                status: status,
                owner: msg.sender,
                leased: false,
                created_at: block.timestamp,
                updated_at: block.timestamp,
                deposits: deposits
            });
    }

    function _deployAndInitializeNode(
        MediaNodeTypes.MediaNode memory nodeDetails
    ) private returns (address) {
        address initiator = Clones.clone(mediaNodeImplementation);
        IMediaNode node = IMediaNode(initiator);
        node.initialize(nodeDetails, address(this));
        return initiator;
    }

    function _updateMappings(string calldata url, address owner) private {
        mediaNodeOwnersMap[mediaNodeCount] = owner;
        mediaNodeUrlsMap[url] = mediaNodeCount;
        mediaNodeCount++;
    }

    function _transferFunds(address nodeAddress) private {
        (bool success, ) = payable(nodeAddress).call{value: msg.value}("");
        if (!success) {
            revert IMediaNodeFactoryErrors.TransferFailed();
        }
    }

    function _emitEvents(
        string calldata id,
        MediaNodeFactoryTypes.NewMediaNodeRegistration calldata input,
        MediaNodeTypes.MediaNodeStatus status,
        MediaNodeTypes.Deposit[] memory deposits
    ) private {
        emit IMediaNodeFactoryEvents.MediaNodeRegistered(
            id,
            input.price_per_hour,
            input.name,
            input.description,
            input.url,
            msg.sender,
            status,
            deposits,
            block.timestamp,
            block.timestamp
        );
        emit IMediaNodeEvents.MediaNodeSpecs(
            input.hardware_specs.cpu,
            input.hardware_specs.ram_in_gb,
            input.hardware_specs.storage_in_gb
        );
    }

    function getParams()
        public
        view
        returns (MediaNodeFactoryTypes.Params memory)
    {
        return params;
    }

    function getNodeDetails(
        string memory id
    )
        public
        view
        returns (
            address owner,
            uint256 price_per_hour,
            string memory name,
            string memory description,
            string memory url,
            bool leased,
            uint64 cpu,
            uint64 ram_in_gb,
            uint256 storage_in_gb,
            MediaNodeTypes.MediaNodeStatus status,
            uint256 created_at,
            uint256 updated_at,
            MediaNodeTypes.Deposit[] memory deposits
        )
    {
        if (mediaNodeContractAddressesMap[id] == address(0)) {
            revert IMediaNodeFactoryErrors.NodeNotFound(id);
        }

        // Get the MediaNode contract instance
        address mediaNodeAddress = mediaNodeContractAddressesMap[id];
        IMediaNode mediaNodeContract = IMediaNode(mediaNodeAddress);

        // Get the node details from the MediaNode contract
        MediaNodeTypes.MediaNode memory node = mediaNodeContract
            .getMediaNodeDetails();

        return (
            node.owner,
            node.price_per_hour,
            node.name,
            node.description,
            node.url,
            node.leased,
            node.hardware_specs.cpu,
            node.hardware_specs.ram_in_gb,
            node.hardware_specs.storage_in_gb,
            node.status,
            node.created_at,
            node.updated_at,
            node.deposits
        );
    }

    function getInstantiatedStatus() public view returns (bool) {
        return _instantiated;
    }
}
