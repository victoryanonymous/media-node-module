// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Medianode {
    uint256 public constant MIN_DEPOSIT = 10;
    address public immutable i_owner;

    constructor() {
        i_owner = msg.sender;
    }

    struct Deposit {
        address depositer;
        uint256 amount;
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
        HardwareSpecs hardware_specs;
        address contract_address;
        bool is_active;
    }
    mapping(address => Node) public nodes;

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
        require(
            bytes(id).length >= 10,
            "ID must be at least 10 characters long"
        );
        require(
            keccak256(abi.encodePacked(substr(id, 0, 9))) ==
                keccak256(abi.encodePacked("medianode")),
            "ID must start with 'medianode'"
        );
        _;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == i_owner, "Not the owner");
        _;
    }

    // Helper function to get substring
    function substr(
        string memory str,
        uint start,
        uint length
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
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
        address contract_address,
        uint256 deposit
    ) public payable onlyOwner validateId(id) returns (Node memory) {
        if (msg.value < deposit) {
            revert NotEnoughBalance("Not enough balance!");
        }
        if (deposit < MIN_DEPOSIT) {
            revert NotEnoughDeposit(
                "Not enough deposit! ",
                deposit,
                "required",
                MIN_DEPOSIT
            );
        }
        Deposit[] memory deposits = new Deposit[](1);
        deposits[0] = Deposit({depositer: msg.sender, amount: deposit});
        Node memory node = Node({
            id: id,
            owner: msg.sender,
            price_per_hour: price_per_hour,
            name: name,
            description: description,
            url: url,
            deposits: deposits,
            leased: false,
            hardware_specs: hardware_specs,
            contract_address: contract_address,
            is_active: false
        });
        nodes[msg.sender] = node;
        return node;
    }

    function getNodes() public view returns (Node[] memory) {
        Node[] memory nodesArray = new Node[](1);
        nodesArray[0] = nodes[msg.sender];
        return nodesArray;
    }
}
