# Potra V7 — Deploy Real EVM Bridge Vaults

This step deploys the source-chain vault contracts used by Potra's real bridge flow.

The bridge path is:

```text
MetaMask deposit on Sepolia or BNB Testnet
→ PotraBridgeVault emits a deposit event
→ Potra backend verifies the source-chain transaction
→ Potra mints wrapped TESTETH or TESTBNB on Portaldot local devnet
```

## Security rule

Use a fresh MetaMask test wallet that holds only testnet ETH/BNB. Do not use any wallet that holds real funds.

## 1. Prepare deployer environment

Run in **Windows PowerShell**:

```powershell
cd c:\dev\potra\evm
copy .env.example .env
npm install
```

Open this file in VS Code:

```text
c:\dev\potra\evm\.env
```

Add your fresh test wallet private key:

```env
DEPLOYER_PRIVATE_KEY=your_test_wallet_private_key_here
```

## 2. Fund deployer wallet

Fund the deployer wallet with:

```text
Sepolia test ETH for Ethereum Sepolia deployment
BNB Testnet BNB for BNB Testnet deployment
```

## 3. Compile contract

Run in **Windows PowerShell**:

```powershell
cd c:\dev\potra\evm
npm run compile
```

## 4. Deploy to Sepolia

Run:

```powershell
npm run deploy:sepolia
```

Copy the printed contract address into:

```text
c:\dev\potra\.env.local
c:\dev\potra\backend\.env
```

Use:

```env
VITE_SEPOLIA_BRIDGE_VAULT=0xYourDeployedSepoliaVault
SEPOLIA_BRIDGE_VAULT=0xYourDeployedSepoliaVault
```

The first line goes into `.env.local`.
The second line goes into `backend/.env`.

## 5. Deploy to BNB Testnet

Run:

```powershell
npm run deploy:bnb
```

Copy the printed contract address into:

```text
c:\dev\potra\.env.local
c:\dev\potra\backend\.env
```

Use:

```env
VITE_BNB_BRIDGE_VAULT=0xYourDeployedBnbVault
BNB_BRIDGE_VAULT=0xYourDeployedBnbVault
```

## 6. Restart Potra

Restart the frontend and backend after editing env files.

Frontend, **Windows PowerShell**:

```powershell
cd c:\dev\potra
npm run dev
```

Backend, second **Windows PowerShell**:

```powershell
cd c:\dev\potra\backend
npm run dev
```

Portaldot node, **Ubuntu terminal**:

```bash
cd ~/portaldot/portaldot-testnet-ubuntu
./portaldot_dev --dev --alice
```

## 7. Test real bridge

In Potra:

```text
Bridge → Real Testnet Deposit → Ethereum Sepolia → TESTETH → amount → Bridge into Portaldot
```

Expected result:

```text
1. MetaMask signs Sepolia deposit
2. Source transaction confirms
3. Potra backend verifies the deposit
4. Backend mints wrapped TESTETH on Portaldot
5. Bridge history, portfolio, and activity feed update
```
