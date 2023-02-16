// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNFT is ERC721 {
    uint256 private s_tokenCounter;
    string public constant TOKEN_URI =
        "ipfs://bafybeibubvfa3fpq4ogd2g3feuyhg43o5nqrkeefjwlwn2tu5h6drvd3qm/";

    constructor() ERC721("Doggie", "DOG") {
        s_tokenCounter = 0;
    }

    function mintNft() public returns (uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        return s_tokenCounter;
    }

    function tokenURI(
        uint256 /* tokenId */
    ) public pure override returns (string memory) {
        return TOKEN_URI;
    }

    function getTokenCOunter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
