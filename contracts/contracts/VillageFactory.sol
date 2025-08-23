// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Village.sol";

contract VillageFactory  {
    uint256 public nextVillageId;
    mapping(uint256 => address) public villageContracts;


    function createVillage(string memory metadataURI) external returns (address) {
        uint256 villageId = nextVillageId++;

        Village village = new Village(metadataURI, msg.sender);
        villageContracts[villageId] = address(village);

        return address(village);
    }

    function getVillageAddress(uint256 villageId) external view returns (address) {
        return villageContracts[villageId];
    }
}
