# Potra

Potra is a real onchain Vite + React + TypeScript app built for the Portaldot Mini Hackathon. It gives users one simple place to launch tokens, bridge test assets, swap, and create liquidity inside the Portaldot economy.

## Product summary

Potra is the easiest way to launch, bridge, swap, and provide liquidity inside the Portaldot economy.

The app is intentionally simple on the surface and real underneath. The Swap and Liquidity pages look like normal DEX flows, while token launch, liquidity funding, faucet claims, bridge settlement, and managed-vault swap settlement use real signed Portaldot transactions in the active Portaldot test environment.

## What works now

- Vite + React + TypeScript frontend
- Node backend inside `backend/`
- Hosted or local Portaldot RPC connection
- Polkadot ecosystem wallet connection
- Test POT faucet
- Real Portaldot asset launch through the Assets pallet
- System bridge assets in selectors: `TESTETH`, `TESTBNB`, `TESTUSDT`
- User-created tokens appear automatically in Swap and Liquidity selectors
- Real liquidity funding into managed pool vaults
- Managed-vault swap settlement
- Bridge authority mint flow
- Real EVM Sepolia deposit bridge architecture and deployment tooling inside `evm/`
- Neon Postgres shared registry for launched tokens, liquidity positions, swaps, and activity

## Main user flow

1. Open Potra.
2. Click **Launch App**.
3. The app opens directly to **Swap**.
4. Connect a Polkadot-compatible wallet.
5. Claim test POT from the faucet.
6. Launch a Portaldot-native token.
7. Add liquidity for `POT / token`.
8. Swap through the funded market.
9. Use Bridge to settle supported test assets into the Portaldot local environment.

## Local setup

### 1. Start the Portaldot node

Run this in **Ubuntu terminal**:

```bash
cd ~/portaldot/portaldot-testnet-ubuntu
./portaldot_dev --dev --alice
```

Leave this terminal running.

### 2. Install frontend dependencies

Run this in **Windows PowerShell**:

```powershell
cd c:\dev\potra
npm install
```

### 3. Configure frontend environment

Run this in **Windows PowerShell**:

```powershell
cd c:\dev\potra
Copy-Item .env.example .env.local
notepad .env.local
```

For the hosted Contabo node, use:

```env
VITE_CHAIN_ENV=hosted
VITE_PORTALDOT_RPC_URL=wss://rpc.194-163-190-189.sslip.io
VITE_PORTALDOT_RPC=wss://rpc.194-163-190-189.sslip.io
VITE_FAUCET_API=http://localhost:8787
```

Do not commit `.env.local`.

### 4. Install backend dependencies

Run this in **Windows PowerShell**:

```powershell
cd c:\dev\potra\backend
npm install
```

### 5. Configure backend environment

Run this in **Windows PowerShell**:

```powershell
cd c:\dev\potra\backend
Copy-Item .env.example .env
notepad .env
```

For the hosted Contabo node, use:

```env
PORTALDOT_RPC_URL=wss://rpc.194-163-190-189.sslip.io
PORTALDOT_RPC=wss://rpc.194-163-190-189.sslip.io
FAUCET_SEED=//Alice
POTRA_POOL_SEED=//Alice//PotraPool
CORS_ORIGIN=http://localhost:5173
```

Do not commit `backend/.env`.

### 6. Start the backend

Run this in **Windows PowerShell**:

```powershell
cd c:\dev\potra\backend
npm run dev
```

Leave this terminal running.

### 7. Start the frontend

Run this in a second **Windows PowerShell** window:

```powershell
cd c:\dev\potra
npm run dev
```

### 8. Open the app

Open this in your **browser address bar**:

```text
http://localhost:5173/app/swap
```

## Shared database

Potra can run locally without a database, but public deployment should use Neon Postgres so user-created tokens and markets are visible across browsers.

Run this SQL in Neon before Railway deployment:

```text
database/schema.sql
```

Add this only to the backend environment, never to frontend or Vercel:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
DATABASE_SSL=true
DATABASE_POOL_MAX=5
```

See `docs/NEON_SETUP.md` for the full setup.

## EVM bridge tooling

The EVM bridge deployment scripts are inside `evm/`.

Run this in **Windows PowerShell**:

```powershell
cd c:\dev\potra\evm
npm install
Copy-Item .env.example .env
notepad .env
```

Set `DEPLOYER_PRIVATE_KEY` only in `evm/.env`. Use a fresh wallet funded only with testnet ETH or testnet BNB. Never use a wallet with mainnet funds.

Deploy to Sepolia:

```powershell
cd c:\dev\potra\evm
npm run deploy:sepolia
```

After deployment, copy the vault address into:

- `c:\dev\potra\.env.local` as `VITE_SEPOLIA_BRIDGE_VAULT`
- `c:\dev\potra\backend\.env` as `SEPOLIA_BRIDGE_VAULT`

Restart the frontend and backend after env changes.

## Environment safety

The repo must never commit private keys or local env files.

Ignored files include:

- `.env`
- `.env.local`
- `backend/.env`
- `evm/.env`
- `node_modules/`
- `dist/`
- Hardhat artifacts and cache

## Judge notes

Potra is not a static prototype. It uses a clean DEX-style UX, but the core actions are wired to real Portaldot transactions and bridge settlement flows. The hackathon proof is that a user can claim POT, launch an asset, add liquidity, swap through a managed Portaldot market, and have the shared app registry persist those actions for other users.
