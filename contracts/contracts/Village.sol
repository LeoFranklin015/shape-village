// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Character.sol";

contract Village is Ownable {
    string public metadataURI;
    uint256 public nextCharacterId;
    mapping(uint256 => address) public characters;

    constructor(string memory _metadataURI, address creator) Ownable(creator) {
        metadataURI = _metadataURI;
        _transferOwnership(creator);
    }

    function addCharacter(string memory name, string memory symbol, string memory charMetadata, address[] memory parents) external onlyOwner returns (address) {
        uint256 charId = nextCharacterId++;
        Character character = new Character(name, symbol, charMetadata, address(this), parents);
        characters[charId] = address(character);
        return address(character);
    }

    function sellCharacter(uint256 charId, address to) external onlyOwner {
        require(characters[charId] != address(0), "Character does not exist");
        Character(characters[charId]).transferOwnership(to);
    }
}
