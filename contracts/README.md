# Potra contracts plan

This folder is reserved for the next onchain phase.

The product needs four onchain modules:

1. Faucet funding flow
   - The backend already supports real POT transfers from a funded account.

2. Token launch
   - First path: Portaldot Assets pallet through `assets.create`, `assets.setMetadata`, and `assets.mint`.
   - Second path: PSP22 token factory if the DEX pool contracts need token-contract compatibility.

3. Liquidity pool
   - Simple constant-product AMM pool.
   - No leverage, no farming, no advanced routing.

4. Router
   - Routes direct pairs first.
   - Multi-hop routing is not needed for the first MVP.

The frontend now has the correct screens and configuration slots for these contracts:

```env
VITE_POTRA_FACTORY_CONTRACT=
VITE_POTRA_ROUTER_CONTRACT=
VITE_POTRA_POOL_FACTORY_CONTRACT=
```
