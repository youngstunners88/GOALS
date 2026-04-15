// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SoccerSoulsNFT
 * @dev Main NFT contract for Soccer Souls player cards with AI agent integration
 */
contract SoccerSoulsNFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    Pausable, 
    Ownable, 
    ERC721Burnable 
{
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // Rarity levels
    enum Rarity { COMMON, RARE, EPIC, LEGENDARY }

    // Player attributes
    struct PlayerStats {
        uint8 pace;
        uint8 shooting;
        uint8 passing;
        uint8 dribbling;
        uint8 defense;
        uint8 physical;
        uint8 overall;
    }

    // Token metadata
    struct TokenData {
        string playerName;
        string position;
        Rarity rarity;
        PlayerStats stats;
        uint256 mintTimestamp;
        uint256 gamesPlayed;
        uint256 goalsScored;
        address agentWallet;
        bool agentEnabled;
    }

    // Mappings
    mapping(uint256 => TokenData) public tokenData;
    mapping(address => bool) public authorizedMinters;
    mapping(Rarity => uint256) public rarityPrices;
    mapping(Rarity => uint256) public maxSupply;
    mapping(Rarity => uint256) public currentSupply;

    // Events
    event PlayerMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string playerName,
        Rarity rarity
    );
    event AgentEnabled(uint256 indexed tokenId, address indexed agentWallet);
    event AgentDisabled(uint256 indexed tokenId);
    event StatsUpdated(uint256 indexed tokenId, PlayerStats newStats);
    event MatchPlayed(uint256 indexed tokenId, bool won, uint256 goals);

    // Constants
    uint256 public constant MAX_MINT_PER_TX = 10;
    uint256 public constant ROYALTY_PERCENTAGE = 500; // 5%
    address public royaltyRecipient;

    constructor(
        address _royaltyRecipient
    ) ERC721("Soccer Souls", "SOULS") {
        royaltyRecipient = _royaltyRecipient;
        
        // Set rarity prices (in wei)
        rarityPrices[Rarity.COMMON] = 0.01 ether;
        rarityPrices[Rarity.RARE] = 0.05 ether;
        rarityPrices[Rarity.EPIC] = 0.2 ether;
        rarityPrices[Rarity.LEGENDARY] = 1 ether;
        
        // Set max supply per rarity
        maxSupply[Rarity.COMMON] = 5000;
        maxSupply[Rarity.RARE] = 2000;
        maxSupply[Rarity.EPIC] = 500;
        maxSupply[Rarity.LEGENDARY] = 100;
    }

    // Modifiers
    modifier onlyAuthorizedMinter() {
        require(
            authorizedMinters[msg.sender] || msg.sender == owner(),
            "Not authorized to mint"
        );
        _;
    }

    modifier validRarity(Rarity _rarity) {
        require(
            currentSupply[_rarity] < maxSupply[_rarity],
            "Rarity supply exhausted"
        );
        _;
    }

    // Core functions

    /**
     * @dev Mint a new player NFT
     */
    function mintPlayer(
        string memory _playerName,
        string memory _position,
        Rarity _rarity,
        PlayerStats memory _stats,
        string memory _uri
    ) public payable whenNotPaused validRarity(_rarity) returns (uint256) {
        require(
            msg.value >= rarityPrices[_rarity],
            "Insufficient payment"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);

        tokenData[tokenId] = TokenData({
            playerName: _playerName,
            position: _position,
            rarity: _rarity,
            stats: _stats,
            mintTimestamp: block.timestamp,
            gamesPlayed: 0,
            goalsScored: 0,
            agentWallet: address(0),
            agentEnabled: false
        });

        currentSupply[_rarity]++;

        emit PlayerMinted(tokenId, msg.sender, _playerName, _rarity);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple players
     */
    function batchMint(
        string[] memory _playerNames,
        string[] memory _positions,
        Rarity[] memory _rarities,
        PlayerStats[] memory _stats,
        string[] memory _uris
    ) public payable whenNotPaused returns (uint256[] memory) {
        require(
            _playerNames.length <= MAX_MINT_PER_TX,
            "Exceeds max mint per transaction"
        );
        require(
            _playerNames.length == _positions.length &&
            _playerNames.length == _rarities.length &&
            _playerNames.length == _stats.length &&
            _playerNames.length == _uris.length,
            "Array length mismatch"
        );

        uint256 totalCost = 0;
        for (uint i = 0; i < _rarities.length; i++) {
            totalCost += rarityPrices[_rarities[i]];
        }
        require(msg.value >= totalCost, "Insufficient payment");

        uint256[] memory tokenIds = new uint256[](_playerNames.length);

        for (uint i = 0; i < _playerNames.length; i++) {
            tokenIds[i] = mintPlayer(
                _playerNames[i],
                _positions[i],
                _rarities[i],
                _stats[i],
                _uris[i]
            );
        }

        return tokenIds;
    }

    /**
     * @dev Enable AI agent for a token
     */
    function enableAgent(
        uint256 _tokenId,
        address _agentWallet
    ) public {
        require(
            ownerOf(_tokenId) == msg.sender,
            "Not token owner"
        );
        require(
            _agentWallet != address(0),
            "Invalid agent wallet"
        );

        tokenData[_tokenId].agentWallet = _agentWallet;
        tokenData[_tokenId].agentEnabled = true;

        emit AgentEnabled(_tokenId, _agentWallet);
    }

    /**
     * @dev Disable AI agent for a token
     */
    function disableAgent(uint256 _tokenId) public {
        require(
            ownerOf(_tokenId) == msg.sender,
            "Not token owner"
        );

        tokenData[_tokenId].agentEnabled = false;

        emit AgentDisabled(_tokenId);
    }

    /**
     * @dev Update player stats (for game integration)
     */
    function updateStats(
        uint256 _tokenId,
        PlayerStats memory _newStats
    ) public onlyOwner {
        require(_exists(_tokenId), "Token does not exist");

        tokenData[_tokenId].stats = _newStats;

        emit StatsUpdated(_tokenId, _newStats);
    }

    /**
     * @dev Record a match result
     */
    function recordMatch(
        uint256 _tokenId,
        bool _won,
        uint256 _goals
    ) public onlyOwner {
        require(_exists(_tokenId), "Token does not exist");

        tokenData[_tokenId].gamesPlayed++;
        tokenData[_tokenId].goalsScored += _goals;

        emit MatchPlayed(_tokenId, _won, _goals);
    }

    /**
     * @dev Get token data
     */
    function getTokenData(uint256 _tokenId) 
        public 
        view 
        returns (TokenData memory) 
    {
        require(_exists(_tokenId), "Token does not exist");
        return tokenData[_tokenId];
    }

    /**
     * @dev Get tokens owned by address with agent enabled
     */
    function getAgentEnabledTokens(address _owner) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256 tokenCount = balanceOf(_owner);
        uint256[] memory agentTokens = new uint256[](tokenCount);
        uint256 agentTokenCount = 0;

        for (uint256 i = 0; i < tokenCount; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(_owner, i);
            if (tokenData[tokenId].agentEnabled) {
                agentTokens[agentTokenCount] = tokenId;
                agentTokenCount++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](agentTokenCount);
        for (uint256 i = 0; i < agentTokenCount; i++) {
            result[i] = agentTokens[i];
        }

        return result;
    }

    // Admin functions

    function setRarityPrice(Rarity _rarity, uint256 _price) public onlyOwner {
        rarityPrices[_rarity] = _price;
    }

    function setMaxSupply(Rarity _rarity, uint256 _supply) public onlyOwner {
        maxSupply[_rarity] = _supply;
    }

    function setAuthorizedMinter(address _minter, bool _authorized) public onlyOwner {
        authorizedMinters[_minter] = _authorized;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    // Royalty info (EIP-2981)
    function royaltyInfo(
        uint256 /* _tokenId */,
        uint256 _salePrice
    ) external view returns (address receiver, uint256 royaltyAmount) {
        return (
            royaltyRecipient,
            (_salePrice * ROYALTY_PERCENTAGE) / 10000
        );
    }

    // Required overrides

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
