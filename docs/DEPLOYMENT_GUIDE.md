# Potra deployment guidance

Potra’s public deployment has four moving parts:

```text
Hosted Portaldot RPC on Contabo
Neon Postgres shared registry
Railway backend
Vercel frontend
```

## 1. Hosted Portaldot RPC

Your current hosted endpoint is:

```text
wss://rpc.194-163-190-189.sslip.io
```

Keep the VPS node running through systemd:

```bash
systemctl status portaldot --no-pager
systemctl status caddy --no-pager
```

Quick WSS test from Windows PowerShell:

```powershell
node -e "const ws=new WebSocket('wss://rpc.194-163-190-189.sslip.io'); ws.onopen=()=>{console.log('WSS connected'); ws.send(JSON.stringify({jsonrpc:'2.0',id:1,method:'system_health',params:[]}));}; ws.onmessage=(e)=>{console.log(e.data); ws.close();}; ws.onerror=(e)=>{console.error('WSS failed', e);};"
```

## 2. Neon Postgres

Run the SQL in:

```text
database/schema.sql
```

Then keep this credential for Railway backend variables only:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
DATABASE_SSL=true
DATABASE_POOL_MAX=5
```

Never put the database URL in Vercel or frontend code.

Full guide: `docs/NEON_SETUP.md`

## 3. Railway backend deployment

Railway root directory:

```text
backend
```

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Railway variables:

```env
PORT=8787
PORTALDOT_RPC_URL=wss://rpc.194-163-190-189.sslip.io
PORTALDOT_RPC=wss://rpc.194-163-190-189.sslip.io
FAUCET_SEED=YOUR_TESTNET_FAUCET_SEED_OR_DEV_SEED
POTRA_POOL_SEED=YOUR_TESTNET_POOL_SEED_OR_DEV_SEED
FAUCET_AMOUNT_POT=100
POT_DECIMALS=14
SS58_FORMAT=42
CORS_ORIGIN=http://localhost:5173,https://YOUR_VERCEL_DOMAIN
CLAIM_COOLDOWN_SECONDS=3600
TX_CONFIRMATION_TIMEOUT_MS=45000
CLAIM_PENDING_TTL_MS=20000
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
DATABASE_SSL=true
DATABASE_POOL_MAX=5
SEPOLIA_RPC_URL=https://YOUR_SEPOLIA_RPC
BNB_TESTNET_RPC_URL=https://YOUR_BNB_TESTNET_RPC
SEPOLIA_BRIDGE_VAULT=0xYOUR_SEPOLIA_VAULT
BNB_BRIDGE_VAULT=0xYOUR_BNB_TESTNET_VAULT
BRIDGE_CONFIRMATIONS=1
```

After Railway deploys, open in browser address bar:

```text
https://YOUR_RAILWAY_BACKEND/health
```

Expected shape:

```json
{
  "ok": true,
  "database": {
    "configured": true,
    "provider": "postgres"
  }
}
```

## 4. Vercel frontend deployment

Vercel root directory:

```text
.
```

Build command:

```bash
npm install && npm run build
```

Output directory:

```text
dist
```

Vercel variables:

```env
VITE_CHAIN_ENV=hosted
VITE_PORTALDOT_RPC_URL=wss://rpc.194-163-190-189.sslip.io
VITE_PORTALDOT_RPC=wss://rpc.194-163-190-189.sslip.io
VITE_PORTALDOT_EXPLORER=https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.194-163-190-189.sslip.io#/explorer
VITE_FAUCET_API=https://YOUR_RAILWAY_BACKEND
VITE_POT_DECIMALS=14
VITE_SS58_FORMAT=42
VITE_SEPOLIA_BRIDGE_VAULT=0xYOUR_SEPOLIA_VAULT
VITE_BNB_BRIDGE_VAULT=0xYOUR_BNB_TESTNET_VAULT
VITE_SEPOLIA_RPC_URL=https://YOUR_SEPOLIA_RPC
VITE_BNB_TESTNET_RPC_URL=https://YOUR_BNB_TESTNET_RPC
```

## 5. Final online smoke test

Open the deployed Vercel URL and test:

```text
Connect wallet
Claim test POT
Launch token
Refresh app
Confirm launched token still appears
Open another browser
Confirm launched token appears there too
Add liquidity
Confirm pool appears in Swap
Swap POT against the created token
Open Railway health endpoint
Check Neon tables for records
```

## Security checklist

Do not commit:

```text
.env
.env.local
backend/.env
evm/.env
private keys
database URLs
seed phrases
node_modules
dist
Hardhat artifacts/cache
```

Use testnet-only wallets and seeds for this hackathon deployment.
