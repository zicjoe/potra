// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PotraBridgeVault
/// @notice Testnet-native deposit vault for Potra's real Sepolia/BNB Testnet -> Portaldot bridge flow.
/// @dev This contract holds test native coins on the source EVM testnet and emits deposit events
///      that the Potra backend relayer verifies before minting wrapped assets on Portaldot.
contract PotraBridgeVault {
    address public owner;
    bool public paused;
    uint256 public nonce;

    event PotraBridgeDeposit(
        address indexed depositor,
        string portaldotRecipient,
        string assetSymbol,
        uint256 amount,
        uint256 nonce
    );

    event VaultPaused(bool paused);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    event NativeWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function depositNative(string calldata portaldotRecipient, string calldata assetSymbol) external payable {
        require(!paused, "VAULT_PAUSED");
        require(msg.value > 0, "NO_VALUE");
        require(bytes(portaldotRecipient).length >= 20, "BAD_PORTALDOT_RECIPIENT");
        require(_isSupportedAsset(assetSymbol), "UNSUPPORTED_ASSET");

        nonce += 1;
        emit PotraBridgeDeposit(msg.sender, portaldotRecipient, assetSymbol, msg.value, nonce);
    }

    function setPaused(bool nextPaused) external onlyOwner {
        paused = nextPaused;
        emit VaultPaused(nextPaused);
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        require(nextOwner != address(0), "ZERO_OWNER");
        emit OwnerChanged(owner, nextOwner);
        owner = nextOwner;
    }

    function withdrawNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "ZERO_TO");
        require(amount <= address(this).balance, "INSUFFICIENT_BALANCE");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "WITHDRAW_FAILED");
        emit NativeWithdrawn(to, amount);
    }

    function _isSupportedAsset(string calldata assetSymbol) internal pure returns (bool) {
        bytes32 hash = keccak256(bytes(assetSymbol));
        return hash == keccak256(bytes("TESTETH")) || hash == keccak256(bytes("TESTBNB"));
    }
}
