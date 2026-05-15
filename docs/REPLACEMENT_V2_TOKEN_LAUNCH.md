# Replacement V2: Real Portaldot Asset Launch

This replacement turns the Launch Token page from a UI-only flow into a real onchain Portaldot asset launch flow.

## What is real in this version

- Wallet signs real Portaldot extrinsics through Polkadot-compatible browser extensions.
- The app uses the Portaldot local RPC from `.env.local`.
- Token launch uses the runtime `assets` pallet:
  - `assets.create`
  - `assets.setMetadata`
  - `assets.mint`
- Each launched asset is recorded in the local Potra browser registry for discovery inside the app.

## What is intentionally not faked

Initial liquidity execution is not marked as completed yet. The launch page stores a liquidity plan, but the actual AMM pool contract comes in the next contract pass.

## Required setup

1. Portaldot local node running in Ubuntu/WSL.
2. Potra frontend running in Windows PowerShell.
3. Faucet backend running in another Windows PowerShell window.
4. Wallet funded with test POT from the faucet or Alice.

## Test path

1. Connect wallet.
2. Claim test POT.
3. Go to Launch Token.
4. Fill name, symbol, and supply.
5. Click `Launch Token Onchain`.
6. Approve each wallet signing prompt.
7. Confirm the success modal shows the Asset ID and transaction hashes.
