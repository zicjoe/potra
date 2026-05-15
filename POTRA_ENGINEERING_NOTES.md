# Potra replacement v1

This version keeps the original Vite/Figma look and prepares the app for real Portaldot integration.

## Added

- Standard Vite entry files: `index.html`, `src/main.tsx`
- Local environment config: `.env.example`
- Portaldot RPC service layer
- Polkadot wallet provider layer
- Real faucet client hook-up
- Backend faucet API that signs real POT transfers from a funded dev account
- Liquidity page and sidebar route
- Chain status in header and sidebar
- Wallet connection modal for SubWallet, Polkadot.js, and Talisman
- Setup guide

## Current engineering state

The app is ready to connect to a local Portaldot node at:

```text
ws://127.0.0.1:9944
```

The faucet API is ready to fund connected wallets using `//Alice` on the local dev node.

The liquidity interface is added now. The next step is deploying or wiring the actual pool factory/router contracts.
