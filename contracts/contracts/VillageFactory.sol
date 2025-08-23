// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Village.sol";

contract VillageFactory  {
    uint256 public nextVillageId;
    mapping(uint256 => address) public villageContracts;

    // Events for proper indexing and monitoring
    event VillageCreated(
        uint256 indexed villageId,
        address indexed creator,
        address indexed villageAddress,
        string metadataURI,
        uint256 timestamp
    );

    function createVillage(string memory metadataURI) external returns (address) {
        uint256 villageId = nextVillageId++;

        Village village = new Village(metadataURI, msg.sender);
        address villageAddress = address(village);
        villageContracts[villageId] = villageAddress;

        // Emit event for indexing
        emit VillageCreated(
            villageId,
            msg.sender,
            villageAddress,
            metadataURI,
            block.timestamp
        );

        return villageAddress;
    }

    function getVillageAddress(uint256 villageId) external view returns (address) {
        return villageContracts[villageId];
    }
}
