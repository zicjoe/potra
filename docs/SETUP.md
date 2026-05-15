# Potra local development setup

Potra is configured to run against a local Portaldot node first. The current Discord guidance for test POT is to run the local node, open Polkadot.js Apps against `ws://127.0.0.1:9944`, and fund accounts from Alice.

## 1. Start the Portaldot local node

Run this in the terminal where your Portaldot node binary is available:

```bash
portaldot_dev --dev --alice
```

Keep this terminal open.

## 2. Fund your wallet manually from Alice

Open this in your browser address bar:

```text
https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9944#/accounts
```

Then:

1. Find Alice
2. Click Send
3. Paste your wallet address
4. Enter any amount
5. Sign. No password is needed for Alice on the dev node.

## 3. Run Potra frontend

Run this in Windows PowerShell from the project root:

```powershell
cd c:\dev\potra
copy .env.example .env.local
npm install
npm run dev
```

Open the local Vite URL in your browser.

## 4. Run Potra faucet API

Run this in a second Windows PowerShell window:

```powershell
cd c:\dev\potra\backend
copy .env.example .env
npm install
npm run dev
```

The faucet API will run on:

```text
http://localhost:8787
```

The frontend will call this API when a connected wallet clicks `Claim test POT`.

## 5. Online demo path

For an online demo, `ws://127.0.0.1:9944` is not enough because it points to the visitor's own computer. The online version needs a hosted Portaldot dev node exposed through a public secure WebSocket such as:

```text
wss://rpc.potra.app
```

Then set:

```env
VITE_PORTALDOT_RPC=wss://rpc.potra.app
VITE_FAUCET_API=https://faucet.potra.app
```
