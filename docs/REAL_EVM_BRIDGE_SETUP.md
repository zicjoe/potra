# Potra V6 Real EVM Testnet Bridge Setup

This version adds a real source-chain deposit flow:

1. User deposits Sepolia ETH or BNB Testnet BNB into `PotraBridgeVault`.
2. The Solidity vault emits `PotraBridgeDeposit`.
3. Potra backend verifies the source-chain transaction receipt.
4. Potra backend mints the wrapped asset on Portaldot local devnet.

This is a real testnet bridge relay model. It is not a fully decentralized bridge network yet.

## Deploy source-chain vaults

Use Remix or your preferred Solidity deployment flow.

Contract file:

```text
contracts/evm/PotraBridgeVault.sol
```

Deploy one vault on Sepolia for TESTETH and another on BNB Testnet for TESTBNB.

## Frontend env

Add these to `.env.local`:

```env
VITE_SEPOLIA_BRIDGE_VAULT=0xYourSepoliaVault
VITE_BNB_BRIDGE_VAULT=0xYourBnbVault
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_BNB_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
```

## Backend env

Add these to `backend/.env`:

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BNB_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
SEPOLIA_BRIDGE_VAULT=0xYourSepoliaVault
BNB_BRIDGE_VAULT=0xYourBnbVault
BRIDGE_CONFIRMATIONS=1
```

## Test flow

1. Start Portaldot local node.
2. Start Potra backend.
3. Start Potra frontend.
4. Connect Portaldot wallet.
5. Open Bridge page.
6. Choose Real Testnet Deposit.
7. Deposit Sepolia ETH or BNB Testnet BNB from MetaMask.
8. Wait for source-chain confirmation.
9. Potra backend verifies the deposit and mints wrapped TESTETH or TESTBNB on Portaldot.
