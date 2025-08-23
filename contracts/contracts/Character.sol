// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Character is ERC721 {
    uint256 public tokenId;
    string private metadataURI;
    address[] private parents;
    
    constructor(string memory _name, string memory _symbol, string memory _metadataURI, address village, address[] memory _parents) ERC721(_name, _symbol) {
        tokenId = 1;
        _safeMint(village, tokenId); // Initially owned by Village
        metadataURI = _metadataURI;
        parents = _parents;
    }

    function tokenURI(uint256) public view override returns (string memory) {
        return metadataURI;
    }
}
