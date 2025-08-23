// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./Character.sol";

contract Village is Ownable,ERC721Holder {
    string public metadataURI;
    uint256 public nextCharacterId;
    mapping(uint256 => address) public characters;


    event CharacterAdded(
        uint256 indexed characterId,
        address indexed characterAddress,
        string name,
        string symbol,
        string charMetadata,
        address indexed village,
        address[] parents,
        uint256 timestamp
    );

    event CharacterSold(
        uint256 indexed characterId,
        address indexed from,
        address indexed to,
        address characterAddress,
        uint256 timestamp
    );

    event VillageMetadataUpdated(
        address indexed villageAddress,
        string oldMetadataURI,
        string newMetadataURI,
        address indexed updater,
        uint256 timestamp
    );

    event VillageOwnershipTransferred(
        address indexed villageAddress,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );

    constructor(string memory _metadataURI, address creator) Ownable(creator) {
        metadataURI = _metadataURI;
        _transferOwnership(creator);

    }

    function addCharacter(string memory name, string memory symbol, string memory charMetadata, address[] memory parents) external onlyOwner returns (address) {
        uint256 charId = nextCharacterId++;
        Character character = new Character(name, symbol, charMetadata, address(this), parents);
        address characterAddress = address(character);
        characters[charId] = characterAddress;
        
        // Emit event for indexing
        emit CharacterAdded(
            charId,
            characterAddress,
            name,
            symbol,
            charMetadata,
            address(this),
            parents,
            block.timestamp
        );
        
        return characterAddress;
    }

    function sellCharacter(uint256 charId, address to) external onlyOwner {
        require(characters[charId] != address(0), "Character does not exist");
        address characterAddress = characters[charId];
        address from = owner();
        
        // Transfer the ERC721 token instead of ownership
        Character(characterAddress).transferFrom(from, to, 1);
        
        // Emit event for indexing
        emit CharacterSold(
            charId,
            from,
            to,
            characterAddress,
            block.timestamp
        );
    }

    // Override transferOwnership to emit custom event
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        address oldOwner = owner();
        super.transferOwnership(newOwner);
        
        // Emit custom ownership transfer event
        emit VillageOwnershipTransferred(
            address(this),
            oldOwner,
            newOwner,
            block.timestamp
        );
    }

    // Function to update village metadata (only owner)
    function updateMetadata(string memory newMetadataURI) external onlyOwner {
        string memory oldMetadataURI = metadataURI;
        metadataURI = newMetadataURI;
        
        // Emit metadata update event
        emit VillageMetadataUpdated(
            address(this),
            oldMetadataURI,
            newMetadataURI,
            msg.sender,
            block.timestamp
        );
    }
}
