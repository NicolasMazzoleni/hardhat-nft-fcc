// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIPFSNFT__RangeOutOfBound();
error RandomIPFSNFT__NeedMoreETHSent();
error RandomIPFSNFT__TransferFailed();

contract RandomIPFSNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // When we mint an NFT, we will trigger a chainlink VRF call to get us a random number
    // Using that number, we will get a random NFT
    // Pub, Shib Inu, or St Bernard
    // Pug Super rare
    // Siba a bit rare
    // St. Bernard common

    // user will pay to mint an NFT
    // (Minting an NFT means converting digital data into crypto collections or digital assets recorded on the blockchain)

    // The owner of the contract can withdraw the ETH

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant c_requestConfirmations = 3;
    uint32 private constant c_numWords = 1;

    // VRF Helper
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 private constant c_maxValue = 100;
    string[] internal s_dogTokenURIs;
    uint256 internal immutable i_mintFee;

    // Type declaration
    enum Race {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    event nftRequested(uint256 requestId, address requester);
    event nftMinted(Race dogRace, address minter);

    constructor(
        address vrfCoordinatorV2,
        bytes32 keyHash,
        uint64 subId,
        uint32 callbackGasLimit,
        string[3] memory dogTokenURIs,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("RandomIPFSNFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_subId = subId;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenURIs = dogTokenURIs;
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIPFSNFT__NeedMoreETHSent();
        }

        requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subId,
            c_requestConfirmations,
            i_callbackGasLimit,
            c_numWords
        );

        s_requestIdToSender[requestId] = msg.sender;
        emit nftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address NFTOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        uint256 randomNumberForRace = randomWords[0] % c_maxValue;

        Race dogRace = getRaceFromRandomNumber(randomNumberForRace);
        _safeMint(NFTOwner, newTokenId);
                s_tokenCounter += s_tokenCounter;
        _setTokenURI(newTokenId, s_dogTokenURIs[uint256(dogRace)]);

        emit nftMinted(dogRace, NFTOwner);
    }

    function getRaceFromRandomNumber(uint256 randomNumber) public pure returns (Race) {
        uint256[3] memory chanceArray = getChanceArray();

        if (randomNumber < chanceArray[0]) {
            return Race(0);
        }

        if (randomNumber < chanceArray[1]) {
            return Race(1);
        }

        if (randomNumber < chanceArray[2]) {
            return Race(2);
        }

        revert RandomIPFSNFT__RangeOutOfBound();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, c_maxValue];
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}(""); // C'est quoi cette merde ?

        if (!success) {
            revert RandomIPFSNFT__TransferFailed();
        }
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUris(uint256 index) public view returns (string memory) {
        return s_dogTokenURIs[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
