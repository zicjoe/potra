import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady, decodeAddress } from "@polkadot/util-crypto";
import { formatEther, Interface, JsonRpcProvider } from "ethers";

const PORT = Number(process.env.PORT || 8787);
const RPC = process.env.PORTALDOT_RPC || "ws://127.0.0.1:9944";
const FAUCET_SEED = process.env.FAUCET_SEED || "//Alice";
const POOL_SEED = process.env.POTRA_POOL_SEED || "//Alice//PotraPool";
const FAUCET_AMOUNT_POT = process.env.FAUCET_AMOUNT_POT || "100";
const POT_DECIMALS = Number(process.env.POT_DECIMALS || 14);
const SS58_FORMAT = Number(process.env.SS58_FORMAT || 42);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const CLAIM_COOLDOWN_SECONDS = Number(process.env.CLAIM_COOLDOWN_SECONDS || 3600);
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const BNB_TESTNET_RPC_URL = process.env.BNB_TESTNET_RPC_URL || "";
const SEPOLIA_BRIDGE_VAULT = (process.env.SEPOLIA_BRIDGE_VAULT || "").toLowerCase();
const BNB_BRIDGE_VAULT = (process.env.BNB_BRIDGE_VAULT || "").toLowerCase();
const BRIDGE_CONFIRMATIONS = Number(process.env.BRIDGE_CONFIRMATIONS || 1);

const BRIDGE_ASSETS: Record<string, { assetId: number; symbol: string; name: string; decimals: number }> = {
  TESTETH: { assetId: 910001, symbol: "TESTETH", name: "Wrapped Sepolia ETH", decimals: 6 },
  TESTBNB: { assetId: 910002, symbol: "TESTBNB", name: "Wrapped BNB Testnet", decimals: 6 },
  TESTUSDT: { assetId: 910003, symbol: "TESTUSDT", name: "Wrapped Test USDT", decimals: 6 },
};

const EVM_BRIDGE_CONFIG: Record<string, { name: string; rpcUrl: string; vault: string; assetSymbol: "TESTETH" | "TESTBNB" }> = {
  sepolia: { name: "Ethereum Sepolia", rpcUrl: SEPOLIA_RPC_URL, vault: SEPOLIA_BRIDGE_VAULT, assetSymbol: "TESTETH" },
  "bnb-testnet": { name: "BNB Testnet", rpcUrl: BNB_TESTNET_RPC_URL, vault: BNB_BRIDGE_VAULT, assetSymbol: "TESTBNB" },
};

const evmBridgeInterface = new Interface([
  "event PotraBridgeDeposit(address indexed depositor,string portaldotRecipient,string assetSymbol,uint256 amount,uint256 nonce)",
]);

const claims = new Map<string, number>();
const processedEvmDeposits = new Set<string>();
let apiPromise: Promise<ApiPromise> | null = null;
let keyringPromise: Promise<Keyring> | null = null;

function parseUnits(value: string, decimals: number) {
  const [whole, fraction = ""] = value.trim().split(".");
  const normalizedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(normalizedFraction || "0");
}

function parseAssetUnits(value: string, decimals: number) {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(normalized) || Number(normalized) <= 0) {
    throw new Error("Enter a valid bridge amount");
  }
  const [whole, fraction = ""] = normalized.split(".");
  const normalizedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return (BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(normalizedFraction || "0")).toString();
}

function nativeWeiToPortaldotAssetRaw(amountWei: bigint, decimals: number) {
  const raw = (amountWei * 10n ** BigInt(decimals)) / 10n ** 18n;
  if (raw <= 0n) {
    throw new Error("Bridge amount is too small for wrapped asset precision");
  }
  return raw.toString();
}

async function getApi() {
  if (!apiPromise) {
    const provider = new WsProvider(RPC);
    apiPromise = ApiPromise.create({ provider });
  }
  return apiPromise;
}

async function getKeyring() {
  if (!keyringPromise) {
    keyringPromise = cryptoWaitReady().then(() => new Keyring({ type: "sr25519", ss58Format: SS58_FORMAT }));
  }
  return keyringPromise;
}

async function transferPot(address: string) {
  const api = await getApi();
  const keyring = await getKeyring();
  const faucet = keyring.addFromUri(FAUCET_SEED);
  const amount = parseUnits(FAUCET_AMOUNT_POT, POT_DECIMALS).toString();

  return submitSignedTx(api.tx.balances.transferKeepAlive(address, amount), faucet);
}

async function ensureBridgeAsset(asset: { assetId: number; symbol: string; name: string; decimals: number }) {
  const api = await getApi();
  const keyring = await getKeyring();
  const bridgeAuthority = keyring.addFromUri(FAUCET_SEED);

  const maybeAsset = await api.query.assets.asset(asset.assetId);
  const exists = Boolean((maybeAsset as any).isSome);

  const txHashes: string[] = [];
  if (!exists) {
    const created = await submitSignedTx(api.tx.assets.create(asset.assetId, bridgeAuthority.address, "1"), bridgeAuthority);
    txHashes.push(created.txHash);
  }

  const metadata = await submitSignedTx(api.tx.assets.setMetadata(asset.assetId, asset.name, asset.symbol, asset.decimals), bridgeAuthority);
  txHashes.push(metadata.txHash);

  return { bridgeAuthority, txHashes };
}

async function getPoolPair(assetId: number) {
  const keyring = await getKeyring();
  return keyring.addFromUri(`${POOL_SEED}//${assetId}`);
}

async function submitSignedTx(tx: any, signer: any) {
  return new Promise<{ txHash: string; blockHash?: string }>((resolve, reject) => {
    let settled = false;
    tx.signAndSend(signer, (result: any) => {
      if (result.dispatchError && !settled) {
        settled = true;
        reject(new Error(result.dispatchError.toString()));
        return;
      }

      if ((result.status.isInBlock || result.status.isFinalized) && !settled) {
        settled = true;
        resolve({
          txHash: result.txHash.toString(),
          blockHash: result.status.asInBlock?.toString?.() || result.status.asFinalized?.toString?.(),
        });
      }
    }).catch(reject);
  });
}

async function verifyEvmDeposit(params: { sourceNetwork: string; txHash: string; recipient: string; assetSymbol: string }) {
  const config = EVM_BRIDGE_CONFIG[params.sourceNetwork];
  if (!config) throw new Error("Unsupported source network");
  if (!config.rpcUrl || !config.vault) throw new Error(`${config.name} bridge vault is not configured`);
  if (params.assetSymbol !== config.assetSymbol) throw new Error(`${config.name} only supports ${config.assetSymbol} deposits in this build`);

  const depositKey = `${params.sourceNetwork}:${params.txHash.toLowerCase()}`;
  if (processedEvmDeposits.has(depositKey)) throw new Error("This source-chain deposit has already been settled");

  const provider = new JsonRpcProvider(config.rpcUrl);
  const receipt = await provider.getTransactionReceipt(params.txHash);
  if (!receipt) throw new Error("Source-chain transaction receipt not found yet");
  if (receipt.status !== 1) throw new Error("Source-chain deposit transaction failed");

  const currentBlock = await provider.getBlockNumber();
  const confirmations = Math.max(0, currentBlock - receipt.blockNumber + 1);
  if (confirmations < BRIDGE_CONFIRMATIONS) {
    throw new Error(`Waiting for source-chain confirmations: ${confirmations}/${BRIDGE_CONFIRMATIONS}`);
  }

  let parsedDeposit: any = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== config.vault) continue;
    try {
      const parsed = evmBridgeInterface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === "PotraBridgeDeposit") {
        parsedDeposit = parsed;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!parsedDeposit) throw new Error("No PotraBridgeDeposit event found in the source transaction");

  const depositor = String(parsedDeposit.args.depositor);
  const portaldotRecipient = String(parsedDeposit.args.portaldotRecipient);
  const assetSymbol = String(parsedDeposit.args.assetSymbol);
  const amountWei = BigInt(parsedDeposit.args.amount.toString());

  if (portaldotRecipient !== params.recipient) throw new Error("Source deposit recipient does not match connected Portaldot wallet");
  if (assetSymbol !== params.assetSymbol) throw new Error("Source deposit asset does not match bridge request");
  if (amountWei <= 0n) throw new Error("Source deposit amount is zero");

  processedEvmDeposits.add(depositKey);
  return {
    config,
    depositor,
    amountWei,
    amount: formatEther(amountWei),
    rawAmount: nativeWeiToPortaldotAssetRaw(amountWei, BRIDGE_ASSETS[assetSymbol].decimals),
  };
}

const app = express();
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 60 }));

app.get("/health", async (_req, res) => {
  try {
    const api = await getApi();
    const [chain, nodeName] = await Promise.all([api.rpc.system.chain(), api.rpc.system.name()]);
    res.json({ ok: true, chain: chain.toString(), nodeName: nodeName.toString(), rpc: RPC });
  } catch (error) {
    res.status(503).json({ ok: false, error: error instanceof Error ? error.message : "RPC unavailable" });
  }
});

app.get("/api/bridge/evm/status", (_req, res) => {
  res.json({
    ok: true,
    confirmationsRequired: BRIDGE_CONFIRMATIONS,
    networks: Object.entries(EVM_BRIDGE_CONFIG).map(([id, config]) => ({
      id,
      name: config.name,
      assetSymbol: config.assetSymbol,
      configured: Boolean(config.rpcUrl && config.vault),
      vault: config.vault,
    })),
  });
});

const claimSchema = z.object({ address: z.string().min(20) });

app.post("/api/faucet/claim", async (req, res) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid address" });
    return;
  }

  const { address } = parsed.data;
  try {
    decodeAddress(address);
  } catch {
    res.status(400).json({ ok: false, error: "Address is not a valid Substrate address" });
    return;
  }

  const now = Date.now();
  const lastClaim = claims.get(address);
  if (lastClaim && now - lastClaim < CLAIM_COOLDOWN_SECONDS * 1000) {
    const waitSeconds = Math.ceil((CLAIM_COOLDOWN_SECONDS * 1000 - (now - lastClaim)) / 1000);
    res.status(429).json({ ok: false, error: `Claim available again in ${waitSeconds} seconds` });
    return;
  }

  try {
    const result = await transferPot(address);
    claims.set(address, now);
    res.json({ ok: true, amount: FAUCET_AMOUNT_POT, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Transfer failed" });
  }
});

app.get("/api/pools/:assetId/address", async (req, res) => {
  const assetId = Number(req.params.assetId);
  if (!Number.isInteger(assetId) || assetId <= 0) {
    res.status(400).json({ ok: false, error: "Invalid asset id" });
    return;
  }

  try {
    const pool = await getPoolPair(assetId);
    res.json({ ok: true, assetId, address: pool.address, mode: "managed-vault" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unable to derive pool address" });
  }
});

const bridgeClaimSchema = z.object({
  recipient: z.string().min(20),
  assetSymbol: z.enum(["TESTETH", "TESTBNB", "TESTUSDT"]),
  amount: z.string().min(1),
  sourceNetwork: z.string().min(2),
});

app.post("/api/bridge/claim", async (req, res) => {
  const parsed = bridgeClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid bridge request" });
    return;
  }

  const { recipient, assetSymbol, amount, sourceNetwork } = parsed.data;
  try {
    decodeAddress(recipient);
  } catch {
    res.status(400).json({ ok: false, error: "Recipient is not a valid Substrate address" });
    return;
  }

  try {
    const api = await getApi();
    const asset = BRIDGE_ASSETS[assetSymbol];
    const rawAmount = parseAssetUnits(amount, asset.decimals);
    const { bridgeAuthority, txHashes } = await ensureBridgeAsset(asset);
    const minted = await submitSignedTx(api.tx.assets.mint(asset.assetId, recipient, rawAmount), bridgeAuthority);

    res.json({
      ok: true,
      mode: "portaldot-bridge-authority",
      sourceNetwork,
      destinationNetwork: "Portaldot Local Devnet",
      assetId: asset.assetId,
      assetSymbol: asset.symbol,
      assetName: asset.name,
      decimals: asset.decimals,
      amount,
      rawAmount,
      recipient,
      txHashes: [...txHashes, minted.txHash],
      mintTxHash: minted.txHash,
      blockHash: minted.blockHash,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Bridge claim failed" });
  }
});

const evmDepositSchema = z.object({
  recipient: z.string().min(20),
  assetSymbol: z.enum(["TESTETH", "TESTBNB"]),
  sourceNetwork: z.enum(["sepolia", "bnb-testnet"]),
  sourceTxHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  sourceSender: z.string().optional(),
});

app.post("/api/bridge/settle-evm-deposit", async (req, res) => {
  const parsed = evmDepositSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid EVM bridge settlement request" });
    return;
  }

  const { recipient, assetSymbol, sourceNetwork, sourceTxHash, sourceSender } = parsed.data;
  try {
    decodeAddress(recipient);
  } catch {
    res.status(400).json({ ok: false, error: "Recipient is not a valid Substrate address" });
    return;
  }

  try {
    const api = await getApi();
    const verified = await verifyEvmDeposit({ sourceNetwork, txHash: sourceTxHash, recipient, assetSymbol });
    const asset = BRIDGE_ASSETS[assetSymbol];
    const { bridgeAuthority, txHashes } = await ensureBridgeAsset(asset);
    const minted = await submitSignedTx(api.tx.assets.mint(asset.assetId, recipient, verified.rawAmount), bridgeAuthority);

    res.json({
      ok: true,
      mode: "evm-deposit-relay",
      sourceNetwork: verified.config.name,
      destinationNetwork: "Portaldot Local Devnet",
      sourceTxHash,
      sourceSender: sourceSender || verified.depositor,
      assetId: asset.assetId,
      assetSymbol: asset.symbol,
      assetName: asset.name,
      decimals: asset.decimals,
      amount: verified.amount,
      rawAmount: verified.rawAmount,
      recipient,
      txHashes: [sourceTxHash, ...txHashes, minted.txHash],
      mintTxHash: minted.txHash,
      blockHash: minted.blockHash,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "EVM bridge settlement failed" });
  }
});

const settleSwapSchema = z.object({
  recipient: z.string().min(20),
  assetId: z.number().int().positive(),
  direction: z.enum(["potToAsset", "assetToPot"]),
  outputRaw: z.string().regex(/^\d+$/),
  poolAddress: z.string().min(20),
  inputTxHash: z.string().min(10),
});

app.post("/api/swap/settle", async (req, res) => {
  const parsed = settleSwapSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid swap settlement request" });
    return;
  }

  const { recipient, assetId, direction, outputRaw, poolAddress, inputTxHash } = parsed.data;
  try {
    decodeAddress(recipient);
    decodeAddress(poolAddress);
  } catch {
    res.status(400).json({ ok: false, error: "Invalid recipient or pool address" });
    return;
  }

  try {
    const api = await getApi();
    const pool = await getPoolPair(assetId);

    if (pool.address !== poolAddress) {
      res.status(400).json({ ok: false, error: "Pool address does not match Potra managed vault" });
      return;
    }

    const tx = direction === "potToAsset"
      ? api.tx.assets.transfer(assetId, recipient, outputRaw)
      : api.tx.balances.transferKeepAlive(recipient, outputRaw);

    const result = await submitSignedTx(tx, pool);
    res.json({ ok: true, assetId, direction, inputTxHash, outputRaw, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Swap settlement failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Potra API running on http://localhost:${PORT}`);
  console.log(`Connected RPC target: ${RPC}`);
  console.log("Faucet mode: real local-chain POT transfers");
  console.log("Swap mode: managed-vault two-leg onchain settlement");
  console.log("Bridge mode: EVM testnet deposit relay + Portaldot authority mint");
});
