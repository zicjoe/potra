# Potra judge brief

Potra is a Portaldot economy app for launching tokens, bridging test assets, swapping, and creating liquidity.

## Why it matters

New chains often have raw infrastructure but weak user flow. Potra packages the core economy actions into one clean app so a user can go from zero to token launch, liquidity, and swap without touching low-level chain tools.

## What to test

1. Start the Portaldot local node.
2. Start the Potra backend.
3. Start the Potra frontend.
4. Open `/app/swap`.
5. Connect a Polkadot-compatible wallet.
6. Claim test POT.
7. Launch a token.
8. Confirm the token appears in Swap and Liquidity selectors.
9. Add liquidity for `POT / created token`.
10. Swap through the created market.

## Onchain proof points

- Faucet claim submits a real local-chain POT transfer.
- Token launch uses real Assets pallet extrinsics.
- Liquidity funding moves real POT and asset balances to a managed pool address.
- Swap flow uses a real input transaction and backend managed-vault settlement.
- Bridge tooling includes a real EVM testnet vault workflow under `evm/`.

## UX proof points

- Launch App opens Swap by default.
- Swap is simple: You pay, Select token, You receive, Select token, Swap.
- Liquidity is simple: First token, Select token, Second token, Select token, Add liquidity.
- POT is pinned at the top.
- `TESTETH`, `TESTBNB`, `TESTUSDT`, and created tokens appear in selectors.
- No private keys or local env files are committed.
