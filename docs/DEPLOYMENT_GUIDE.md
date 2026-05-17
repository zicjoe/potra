# Potra deployment guidance

## Local demo deployment

Use this for judging when the Portaldot local node is required.

### Ubuntu terminal

```bash
cd ~/portaldot/portaldot-testnet-ubuntu
./portaldot_dev --dev --alice
```

### Windows PowerShell — backend

```powershell
cd c:\dev\potra\backend
npm install
Copy-Item .env.example .env
npm run dev
```

### Windows PowerShell — frontend

```powershell
cd c:\dev\potra
npm install
Copy-Item .env.example .env.local
npm run dev
```

### Browser address bar

```text
http://localhost:5173/app/swap
```

## Production-style frontend deploy

The frontend can be deployed to Vercel or another static host, but the current hackathon build still expects a reachable backend and Portaldot RPC.

Before deploying, set these frontend env values in the hosting dashboard:

```env
VITE_CHAIN_ENV=local-or-testnet
VITE_PORTALDOT_RPC=wss://YOUR_PORTALDOT_RPC
VITE_FAUCET_API=https://YOUR_BACKEND_URL
VITE_POT_DECIMALS=14
VITE_SS58_FORMAT=42
VITE_SEPOLIA_BRIDGE_VAULT=0xYOUR_SEPOLIA_VAULT
VITE_BNB_BRIDGE_VAULT=0xYOUR_BNB_TESTNET_VAULT
VITE_SEPOLIA_RPC_URL=https://YOUR_SEPOLIA_RPC
VITE_BNB_TESTNET_RPC_URL=https://YOUR_BNB_TESTNET_RPC
```

Build command:

```powershell
npm run build
```

Output directory:

```text
dist
```

## Backend deploy

The backend can run on Railway, Render, Fly, or a VPS.

Set these backend env values in the backend host:

```env
PORT=8787
PORTALDOT_RPC=wss://YOUR_PORTALDOT_RPC
FAUCET_SEED=YOUR_BACKEND_FAUCET_SEED
POTRA_POOL_SEED=YOUR_POOL_DERIVATION_SEED
FAUCET_AMOUNT_POT=100
POT_DECIMALS=14
SS58_FORMAT=42
CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN
CLAIM_COOLDOWN_SECONDS=3600
SEPOLIA_RPC_URL=https://YOUR_SEPOLIA_RPC
BNB_TESTNET_RPC_URL=https://YOUR_BNB_TESTNET_RPC
SEPOLIA_BRIDGE_VAULT=0xYOUR_SEPOLIA_VAULT
BNB_BRIDGE_VAULT=0xYOUR_BNB_TESTNET_VAULT
BRIDGE_CONFIRMATIONS=1
```

Backend build command:

```powershell
cd c:\dev\potra\backend
npm run build
```

Backend start command:

```powershell
cd c:\dev\potra\backend
npm start
```

## EVM bridge deployment

Run this in **Windows PowerShell**:

```powershell
cd c:\dev\potra\evm
npm install
Copy-Item .env.example .env
notepad .env
```

Set:

```env
DEPLOYER_PRIVATE_KEY=YOUR_TESTNET_ONLY_PRIVATE_KEY
SEPOLIA_RPC_URL=https://YOUR_SEPOLIA_RPC
BNB_TESTNET_RPC_URL=https://YOUR_BNB_TESTNET_RPC
```

Deploy Sepolia vault:

```powershell
cd c:\dev\potra\evm
npm run deploy:sepolia
```

Deploy BNB testnet vault:

```powershell
cd c:\dev\potra\evm
npm run deploy:bnb
```

After deployment, copy the vault addresses into the frontend and backend env files, then restart both services.

## Security checklist

Do not commit:

- `.env`
- `.env.local`
- `backend/.env`
- `evm/.env`
- private keys
- mnemonic phrases
- deployment wallets with mainnet funds
- `node_modules`
- `dist`
- Hardhat artifacts/cache

Use fresh testnet-only wallets for bridge deployment.
