// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Medianode {
    uint256 public constant MIN_DEPOSIT = 10 ether;
    address public immutable i_owner;

    constructor() {
        i_owner = msg.sender;
    }

    struct Deposit {
        address depositor;
        uint256 amount;
        uint256 depositedAt;
    }

    struct HardwareSpecs {
        uint64 cpu;
        uint64 ram_in_gb;
        uint256 storage_in_gb;
    }
    struct Node {
        string id;
        address owner;
        uint256 price_per_hour;
        string name;
        string description;
        string url;
        Deposit[] deposits;
        bool leased;
        uint256 totalDeposit;
        HardwareSpecs hardware_specs;
        address contract_address;
        bool is_active;
    }

    // Events
    event MediaNodeRegistered(string indexed nodeId, address indexed owner);
    event MediaNodeDeposit(
        string indexed nodeId,
        address indexed depositor,
        uint256 amount
    );
    event MediaNodeActivated(string indexed nodeId);

    mapping(string => Node) public nodes;
    mapping(address => string[]) public userNodeIds;

    // Errors
    error NotEnoughDeposit(
        string message,
        uint256 amount,
        string required,
        uint256 min_deposit
    );
    error NotEnoughBalance(string message);

    // validation Errors
    modifier validateId(string memory id) {
        require(bytes(id).length >= 10, "ID must be at least 10 chars");
        require(
            keccak256(abi.encodePacked(substr(id, 0, 9))) ==
                keccak256(abi.encodePacked("medianode")),
            "ID must start with 'medianode'"
        );
        _;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == i_owner, "Not the contract owner");
        _;
    }

    modifier nodeExists(string memory id) {
        require(nodes[id].owner != address(0), "Media node does not exist");
        _;
    }

    // Helper function to get substring
    function substr(
        string memory str,
        uint start,
        uint length
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(start + length <= strBytes.length, "Invalid substring range");
        bytes memory result = new bytes(length);
        for (uint i = 0; i < length; i++) {
            result[i] = strBytes[i + start];
        }
        return string(result);
    }

    function registerMediaNode(
        string memory id,
        uint256 price_per_hour,
        string memory name,
        string memory description,
        string memory url,
        HardwareSpecs memory hardware_specs,
        address contract_address
    ) external validateId(id) returns (Node memory) {
        require(nodes[id].owner == address(0), "Node already exists");

        Node storage node = nodes[id];
        node.id = id;
        node.owner = msg.sender;
        node.price_per_hour = price_per_hour;
        node.name = name;
        node.description = description;
        node.url = url;
        node.contract_address = contract_address;
        node.hardware_specs = hardware_specs;
        node.is_active = false;
        node.leased = false;
        node.totalDeposit = 0;

        userNodeIds[msg.sender].push(id);

        emit MediaNodeRegistered(id, msg.sender);
        return node;
    }

    function depositMediaNode(
        string memory id
    ) external payable nodeExists(id) {
        require(msg.value > 0, "Deposit amount must be > 0");

        Node storage node = nodes[id];

        // Append deposit
        node.deposits.push(
            Deposit({
                depositor: msg.sender,
                amount: msg.value,
                depositedAt: block.timestamp
            })
        );

        node.totalDeposit += msg.value;

        // Activate if minimum met
        if (!node.is_active && node.totalDeposit >= MIN_DEPOSIT) {
            node.is_active = true;
            emit MediaNodeActivated(id);
        }

        emit MediaNodeDeposit(id, msg.sender, msg.value);
    }

    function getMyNodes() external view returns (Node[] memory) {
        string[] memory ids = userNodeIds[msg.sender];
        Node[] memory result = new Node[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            result[i] = nodes[ids[i]];
        }
        return result;
    }

    function getNodeById(string memory id) external view returns (Node memory) {
        return nodes[id];
    }
}
