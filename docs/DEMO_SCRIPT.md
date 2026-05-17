# Potra demo script

## Opening line

Potra is the easiest way to launch, bridge, swap, and provide liquidity inside the Portaldot economy.

## Scene 1 — Landing page

Show the landing page.

Say:

Potra gives Portaldot users a simple trading and launch surface. It is built to feel like a real product from day one, not a developer console.

## Scene 2 — Swap opens first

Click **Launch App**.

Expected result: the app opens `/app/swap`.

Say:

The app opens straight into Swap because that is the action most users understand first. POT is pinned at the top, and bridge assets plus launched tokens appear in the selector automatically.

## Scene 3 — Connect wallet and claim POT

Connect a Polkadot-compatible wallet, then claim test POT.

Say:

The faucet is backed by the local Portaldot node. This is not just UI state. The backend submits a real transfer from the configured faucet account.

## Scene 4 — Launch a token

Open **Launch** and create a token.

Suggested values:

- Name: Demo Token
- Symbol: DEMO
- Supply: 1000000
- Decimals: 6

Say:

Token launch uses the Portaldot Assets pallet. Potra creates the asset, sets metadata, and mints supply through signed wallet transactions.

## Scene 5 — Token appears in Swap and Liquidity

Go back to **Swap** and open the token selector.

Expected result: the new token appears automatically.

Then open **Liquidity** and open the selector there too.

Say:

Created tokens automatically become tradable candidates across the app. Users do not need a manual refresh or a separate listing process.

## Scene 6 — Add liquidity

Open **Liquidity**.

Create a `POT / DEMO` pool by entering both amounts and clicking **Add liquidity**.

Say:

Liquidity funding is real. POT and the launched asset are transferred into the managed pool address on Portaldot.

## Scene 7 — Swap

Open **Swap**.

Select `POT` and `DEMO`, enter an amount, then swap.

Say:

The swap uses the funded market. Potra deposits the input asset, requests managed-vault settlement from the backend, and records the swap result locally for the demo flow.

## Scene 8 — Bridge

Open **Bridge**.

Show Sepolia or bridge authority mode depending on what is configured.

Say:

Potra also includes the bridge architecture for testnet EVM deposits. The Sepolia vault deployment flow has already been added under the EVM workspace.

## Closing line

Potra turns Portaldot from a raw chain environment into a usable economy surface: launch, bridge, swap, and liquidity in one clean app.
