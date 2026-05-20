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
import pg from "pg";
import type { Pool as PgPool } from "pg";

const { Pool } = pg;

const PORT = Number(process.env.PORT || 8787);
const RPC = process.env.PORTALDOT_RPC_URL || process.env.PORTALDOT_RPC || "ws://127.0.0.1:9944";
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
const TX_CONFIRMATION_TIMEOUT_MS = Number(process.env.TX_CONFIRMATION_TIMEOUT_MS || 45000);
const CLAIM_PENDING_TTL_MS = Number(process.env.CLAIM_PENDING_TTL_MS || 20000);
const DATABASE_URL = process.env.DATABASE_URL || "";
const DATABASE_SSL = process.env.DATABASE_SSL !== "false";
const DATABASE_POOL_MAX = Number(process.env.DATABASE_POOL_MAX || 5);
const DATABASE_ENABLED = Boolean(DATABASE_URL);
const DATABASE_PROVIDER = DATABASE_ENABLED ? "postgres" : "memory";

const BRIDGE_ASSETS: Record<string, { assetId: number; symbol: string; name: string; decimals: number }> = {
  TESTETH: { assetId: 910001, symbol: "TESTETH", name: "Wrapped Sepolia ETH", decimals: 6 },
  TESTBNB: { assetId: 910002, symbol: "TESTBNB", name: "Wrapped BNB Testnet", decimals: 6 },
  TESTUSDT: { assetId: 910003, symbol: "TESTUSDT", name: "Wrapped Test USDT", decimals: 6 },
};

const DEFAULT_MARKETS: Array<{ assetSymbol: keyof typeof BRIDGE_ASSETS; potAmount: string; assetAmount: string }> = [
  { assetSymbol: "TESTETH", potAmount: "500", assetAmount: "250" },
  { assetSymbol: "TESTBNB", potAmount: "500", assetAmount: "500" },
  { assetSymbol: "TESTUSDT", potAmount: "500", assetAmount: "50000" },
];

const bootstrappedMarkets = new Set<number>();
let defaultMarketsBootstrapPromise: Promise<any[]> | null = null;
const signerQueues = new Map<string, Promise<unknown>>();
const pendingClaims = new Map<string, { startedAt: number }>();

type LaunchedTokenRecord = {
  assetId: number;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  owner: string;
  txHashes: string[];
  launchedAt: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
};

type LiquidityPositionRecord = {
  id: string;
  owner: string;
  poolAddress: string;
  assetId: number;
  assetName: string;
  assetSymbol: string;
  assetDecimals: number;
  potAmount: string;
  assetAmount: string;
  potTxHash: string;
  assetTxHash: string;
  createdAt: string;
  status: "funded";
  mode?: "managed-vault" | "legacy-vault" | "market-preview";
};

type SwapRecord = {
  id: string;
  wallet: string;
  direction: "potToAsset" | "assetToPot";
  assetId: number;
  assetSymbol: string;
  inputAmount: string;
  outputAmount: string;
  inputTxHash: string;
  outputTxHash: string;
  createdAt: string;
};

type ActivityRecord = {
  id: string;
  type: "faucet" | "token_launch" | "liquidity" | "swap" | "bridge" | "market";
  wallet?: string;
  title: string;
  description?: string;
  txHash?: string;
  assetId?: number;
  assetSymbol?: string;
  createdAt: string;
  payload?: Record<string, unknown>;
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
const memoryTokens = new Map<number, LaunchedTokenRecord>();
const memoryLiquidityPositions = new Map<string, LiquidityPositionRecord>();
const memorySwaps = new Map<string, SwapRecord>();
const memoryActivity: ActivityRecord[] = [];
let databasePool: PgPool | null = null;
let apiPromise: Promise<ApiPromise> | null = null;
let keyringPromise: Promise<Keyring> | null = null;


function getDatabasePool() {
  if (!DATABASE_ENABLED) return null;
  if (!databasePool) {
    databasePool = new Pool({
      connectionString: DATABASE_URL,
      max: DATABASE_POOL_MAX,
      ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false,
    });
  }
  return databasePool;
}

async function queryDatabase(text: string, params: unknown[] = []) {
  const pool = getDatabasePool();
  if (!pool) return null;
  return pool.query(text, params as any[]);
}

function databaseStatus() {
  return { configured: DATABASE_ENABLED, provider: DATABASE_PROVIDER };
}

function activityId(type: ActivityRecord["type"], key: string) {
  return `${type}-${key}`.replace(/[^a-zA-Z0-9:-]/g, "").slice(0, 120);
}

function recordMemoryActivity(activity: ActivityRecord) {
  const existingIndex = memoryActivity.findIndex((item) => item.id === activity.id);
  if (existingIndex >= 0) {
    memoryActivity.splice(existingIndex, 1, activity);
  } else {
    memoryActivity.unshift(activity);
  }
  memoryActivity.splice(100);
}

async function recordActivity(activity: ActivityRecord) {
  recordMemoryActivity(activity);
  try {
    await queryDatabase(
      `insert into activity_events (
        id, event_type, wallet_address, title, description, tx_hash, asset_id, asset_symbol, payload, created_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
      on conflict (id) do update set
        event_type = excluded.event_type,
        wallet_address = excluded.wallet_address,
        title = excluded.title,
        description = excluded.description,
        tx_hash = excluded.tx_hash,
        asset_id = excluded.asset_id,
        asset_symbol = excluded.asset_symbol,
        payload = excluded.payload,
        created_at = excluded.created_at`,
      [
        activity.id,
        activity.type,
        activity.wallet || null,
        activity.title,
        activity.description || null,
        activity.txHash || null,
        activity.assetId || null,
        activity.assetSymbol || null,
        JSON.stringify(activity.payload || {}),
        activity.createdAt,
      ]
    );
  } catch (error) {
    console.warn("Potra activity persistence failed:", error instanceof Error ? error.message : String(error));
  }
}

function normalizeTokenRecord(input: LaunchedTokenRecord): LaunchedTokenRecord {
  return {
    assetId: Number(input.assetId),
    name: String(input.name),
    symbol: String(input.symbol).toUpperCase(),
    totalSupply: String(input.totalSupply),
    decimals: Number(input.decimals),
    owner: String(input.owner),
    txHashes: Array.isArray(input.txHashes) ? input.txHashes.map(String) : [],
    launchedAt: input.launchedAt || new Date().toISOString(),
    description: input.description || undefined,
    website: input.website || undefined,
    twitter: input.twitter || undefined,
    telegram: input.telegram || undefined,
  };
}

function tokenFromDbRow(row: any): LaunchedTokenRecord {
  return normalizeTokenRecord({
    assetId: row.asset_id,
    name: row.name,
    symbol: row.symbol,
    totalSupply: row.total_supply,
    decimals: row.decimals,
    owner: row.owner_address,
    txHashes: row.tx_hashes || [],
    launchedAt: row.launched_at instanceof Date ? row.launched_at.toISOString() : row.launched_at,
    description: row.description || undefined,
    website: row.website || undefined,
    twitter: row.twitter || undefined,
    telegram: row.telegram || undefined,
  });
}

async function upsertTokenRecord(token: LaunchedTokenRecord) {
  const normalized = normalizeTokenRecord(token);
  memoryTokens.set(normalized.assetId, normalized);

  const result = await queryDatabase(
    `insert into launched_tokens (
      asset_id, name, symbol, total_supply, decimals, owner_address, tx_hashes, launched_at, description, website, twitter, telegram
    ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12)
    on conflict (asset_id) do update set
      name = excluded.name,
      symbol = excluded.symbol,
      total_supply = excluded.total_supply,
      decimals = excluded.decimals,
      owner_address = excluded.owner_address,
      tx_hashes = excluded.tx_hashes,
      launched_at = excluded.launched_at,
      description = excluded.description,
      website = excluded.website,
      twitter = excluded.twitter,
      telegram = excluded.telegram,
      updated_at = now()
    returning *`,
    [
      normalized.assetId,
      normalized.name,
      normalized.symbol,
      normalized.totalSupply,
      normalized.decimals,
      normalized.owner,
      JSON.stringify(normalized.txHashes),
      normalized.launchedAt,
      normalized.description || null,
      normalized.website || null,
      normalized.twitter || null,
      normalized.telegram || null,
    ]
  );

  const saved = result?.rows?.[0] ? tokenFromDbRow(result.rows[0]) : normalized;

  await recordActivity({
    id: activityId("token_launch", String(saved.assetId)),
    type: "token_launch",
    wallet: saved.owner,
    title: `${saved.symbol} launched`,
    description: `${saved.name} was created on Portaldot`,
    txHash: saved.txHashes[0],
    assetId: saved.assetId,
    assetSymbol: saved.symbol,
    createdAt: saved.launchedAt,
    payload: saved as unknown as Record<string, unknown>,
  });

  return saved;
}

async function listTokenRecords() {
  const result = await queryDatabase(`select * from launched_tokens order by launched_at desc limit 100`);
  if (!result) {
    return Array.from(memoryTokens.values()).sort((a, b) => Date.parse(b.launchedAt) - Date.parse(a.launchedAt));
  }
  return result.rows.map(tokenFromDbRow);
}

function normalizeLiquidityRecord(input: LiquidityPositionRecord): LiquidityPositionRecord {
  return {
    id: String(input.id),
    owner: String(input.owner),
    poolAddress: String(input.poolAddress),
    assetId: Number(input.assetId),
    assetName: String(input.assetName),
    assetSymbol: String(input.assetSymbol).toUpperCase(),
    assetDecimals: Number(input.assetDecimals),
    potAmount: String(input.potAmount),
    assetAmount: String(input.assetAmount),
    potTxHash: String(input.potTxHash),
    assetTxHash: String(input.assetTxHash),
    createdAt: input.createdAt || new Date().toISOString(),
    status: "funded",
    mode: input.mode || "managed-vault",
  };
}

function liquidityFromDbRow(row: any): LiquidityPositionRecord {
  return normalizeLiquidityRecord({
    id: row.id,
    owner: row.owner_address,
    poolAddress: row.pool_address,
    assetId: row.asset_id,
    assetName: row.asset_name,
    assetSymbol: row.asset_symbol,
    assetDecimals: row.asset_decimals,
    potAmount: row.pot_amount,
    assetAmount: row.asset_amount,
    potTxHash: row.pot_tx_hash,
    assetTxHash: row.asset_tx_hash,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    status: "funded",
    mode: row.mode,
  });
}

async function upsertLiquidityRecord(position: LiquidityPositionRecord, writeActivity = true) {
  const normalized = normalizeLiquidityRecord(position);
  memoryLiquidityPositions.set(normalized.id, normalized);

  const result = await queryDatabase(
    `insert into liquidity_positions (
      id, owner_address, pool_address, asset_id, asset_name, asset_symbol, asset_decimals,
      pot_amount, asset_amount, pot_tx_hash, asset_tx_hash, created_at, status, mode
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    on conflict (id) do update set
      owner_address = excluded.owner_address,
      pool_address = excluded.pool_address,
      asset_id = excluded.asset_id,
      asset_name = excluded.asset_name,
      asset_symbol = excluded.asset_symbol,
      asset_decimals = excluded.asset_decimals,
      pot_amount = excluded.pot_amount,
      asset_amount = excluded.asset_amount,
      pot_tx_hash = excluded.pot_tx_hash,
      asset_tx_hash = excluded.asset_tx_hash,
      created_at = excluded.created_at,
      status = excluded.status,
      mode = excluded.mode,
      updated_at = now()
    returning *`,
    [
      normalized.id,
      normalized.owner,
      normalized.poolAddress,
      normalized.assetId,
      normalized.assetName,
      normalized.assetSymbol,
      normalized.assetDecimals,
      normalized.potAmount,
      normalized.assetAmount,
      normalized.potTxHash,
      normalized.assetTxHash,
      normalized.createdAt,
      normalized.status,
      normalized.mode || "managed-vault",
    ]
  );

  const saved = result?.rows?.[0] ? liquidityFromDbRow(result.rows[0]) : normalized;

  if (writeActivity) {
    await recordActivity({
      id: activityId("liquidity", saved.id),
      type: "liquidity",
      wallet: saved.owner,
      title: `POT / ${saved.assetSymbol} liquidity added`,
      description: `${saved.potAmount} POT and ${saved.assetAmount} ${saved.assetSymbol}`,
      txHash: saved.assetTxHash,
      assetId: saved.assetId,
      assetSymbol: saved.assetSymbol,
      createdAt: saved.createdAt,
      payload: saved as unknown as Record<string, unknown>,
    });
  }

  return saved;
}

async function listLiquidityRecords() {
  const result = await queryDatabase(`select * from liquidity_positions order by created_at desc limit 100`);
  if (!result) {
    return Array.from(memoryLiquidityPositions.values()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
  return result.rows.map(liquidityFromDbRow);
}

function normalizeSwapRecord(input: SwapRecord): SwapRecord {
  return {
    id: String(input.id),
    wallet: String(input.wallet),
    direction: input.direction,
    assetId: Number(input.assetId),
    assetSymbol: String(input.assetSymbol).toUpperCase(),
    inputAmount: String(input.inputAmount),
    outputAmount: String(input.outputAmount),
    inputTxHash: String(input.inputTxHash),
    outputTxHash: String(input.outputTxHash),
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function swapFromDbRow(row: any): SwapRecord {
  return normalizeSwapRecord({
    id: row.id,
    wallet: row.wallet_address,
    direction: row.direction,
    assetId: row.asset_id,
    assetSymbol: row.asset_symbol,
    inputAmount: row.input_amount,
    outputAmount: row.output_amount,
    inputTxHash: row.input_tx_hash,
    outputTxHash: row.output_tx_hash,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  });
}

async function upsertSwapRecord(swap: SwapRecord) {
  const normalized = normalizeSwapRecord(swap);
  memorySwaps.set(normalized.id, normalized);

  const result = await queryDatabase(
    `insert into swap_transactions (
      id, wallet_address, direction, asset_id, asset_symbol, input_amount, output_amount, input_tx_hash, output_tx_hash, created_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    on conflict (id) do update set
      wallet_address = excluded.wallet_address,
      direction = excluded.direction,
      asset_id = excluded.asset_id,
      asset_symbol = excluded.asset_symbol,
      input_amount = excluded.input_amount,
      output_amount = excluded.output_amount,
      input_tx_hash = excluded.input_tx_hash,
      output_tx_hash = excluded.output_tx_hash,
      created_at = excluded.created_at
    returning *`,
    [
      normalized.id,
      normalized.wallet,
      normalized.direction,
      normalized.assetId,
      normalized.assetSymbol,
      normalized.inputAmount,
      normalized.outputAmount,
      normalized.inputTxHash,
      normalized.outputTxHash,
      normalized.createdAt,
    ]
  );

  const saved = result?.rows?.[0] ? swapFromDbRow(result.rows[0]) : normalized;

  await recordActivity({
    id: activityId("swap", saved.id),
    type: "swap",
    wallet: saved.wallet,
    title: `${saved.assetSymbol} swap completed`,
    description: `${saved.inputAmount} in, ${saved.outputAmount} out`,
    txHash: saved.outputTxHash,
    assetId: saved.assetId,
    assetSymbol: saved.assetSymbol,
    createdAt: saved.createdAt,
    payload: saved as unknown as Record<string, unknown>,
  });

  return saved;
}

async function listSwapRecords(wallet?: string) {
  const params: unknown[] = [];
  let where = "";
  if (wallet) {
    params.push(wallet);
    where = "where wallet_address = $1";
  }

  const result = await queryDatabase(`select * from swap_transactions ${where} order by created_at desc limit 100`, params);
  if (!result) {
    return Array.from(memorySwaps.values())
      .filter((item) => !wallet || item.wallet === wallet)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
  return result.rows.map(swapFromDbRow);
}

async function listActivityRecords(wallet?: string) {
  const params: unknown[] = [];
  let where = "";
  if (wallet) {
    params.push(wallet);
    where = "where wallet_address = $1";
  }

  const result = await queryDatabase(`select * from activity_events ${where} order by created_at desc limit 100`, params);
  if (!result) {
    return memoryActivity
      .filter((item) => !wallet || item.wallet === wallet)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  return result.rows.map((row: any) => ({
    id: row.id,
    type: row.event_type,
    wallet: row.wallet_address || undefined,
    title: row.title,
    description: row.description || undefined,
    txHash: row.tx_hash || undefined,
    assetId: row.asset_id || undefined,
    assetSymbol: row.asset_symbol || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    payload: row.payload || {},
  })) as ActivityRecord[];
}

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

function buildPotTransferTx(api: ApiPromise, address: string, amount: string) {
  const balances = api.tx.balances as any;
  const transfer = balances.transferAllowDeath || balances.transferKeepAlive;
  if (!transfer) {
    throw new Error("This Portaldot runtime does not expose a supported balances transfer call");
  }
  return transfer(address, amount);
}

async function transferPot(address: string) {
  const api = await getApi();
  const keyring = await getKeyring();
  const faucet = keyring.addFromUri(FAUCET_SEED);
  const amount = parseUnits(FAUCET_AMOUNT_POT, POT_DECIMALS).toString();

  return submitSignedTx(buildPotTransferTx(api, address, amount), faucet, { mode: "submitOnly" });
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

    const metadata = await submitSignedTx(api.tx.assets.setMetadata(asset.assetId, asset.name, asset.symbol, asset.decimals), bridgeAuthority);
    txHashes.push(metadata.txHash);
  }

  return { bridgeAuthority, txHashes };
}

async function getPoolPair(assetId: number) {
  const keyring = await getKeyring();
  return keyring.addFromUri(`${POOL_SEED}//${assetId}`);
}

async function getNativeFreeBalance(address: string) {
  const api = await getApi();
  const account = await api.query.system.account(address);
  return BigInt((account as any).data.free.toString());
}

async function getAssetFreeBalance(assetId: number, address: string) {
  const api = await getApi();
  const account = await api.query.assets.account(assetId, address);
  if (!(account as any).isSome) return 0n;
  return BigInt((account as any).unwrap().balance.toString());
}

async function bootstrapDefaultMarket(market: { assetSymbol: keyof typeof BRIDGE_ASSETS; potAmount: string; assetAmount: string }) {
  const api = await getApi();
  const keyring = await getKeyring();
  const faucet = keyring.addFromUri(FAUCET_SEED);
  const asset = BRIDGE_ASSETS[market.assetSymbol];
  const pool = await getPoolPair(asset.assetId);
  const { bridgeAuthority, txHashes } = await ensureBridgeAsset(asset);

  const potRaw = parseUnits(market.potAmount, POT_DECIMALS).toString();
  const assetRaw = parseAssetUnits(market.assetAmount, asset.decimals);

  const existingPot = await getNativeFreeBalance(pool.address);
  const existingAsset = await getAssetFreeBalance(asset.assetId, pool.address);
  const alreadyFunded = existingPot > 0n && existingAsset > 0n;

  if (!bootstrappedMarkets.has(asset.assetId) && !alreadyFunded) {
    const potSeed = await submitSignedTx(api.tx.balances.transferKeepAlive(pool.address, potRaw), faucet);
    const assetSeed = await submitSignedTx(api.tx.assets.mint(asset.assetId, pool.address, assetRaw), bridgeAuthority);
    txHashes.push(potSeed.txHash, assetSeed.txHash);
  }

  bootstrappedMarkets.add(asset.assetId);

  return {
    id: `SYSTEM-POT-${asset.assetId}`,
    owner: bridgeAuthority.address,
    poolAddress: pool.address,
    assetId: asset.assetId,
    assetName: asset.name,
    assetSymbol: asset.symbol,
    assetDecimals: asset.decimals,
    potAmount: market.potAmount,
    assetAmount: market.assetAmount,
    potTxHash: txHashes[txHashes.length - 2] || "protocol-seeded",
    assetTxHash: txHashes[txHashes.length - 1] || "protocol-seeded",
    createdAt: new Date().toISOString(),
    status: "funded",
    mode: "managed-vault",
  };
}

function isTxPoolPriorityError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /priority is too low|too low priority|already in the pool|1014:/i.test(message);
}

function cleanBackendTxError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (isTxPoolPriorityError(message)) {
    return new Error("Portaldot is still processing a previous transaction from the same signer. Wait a few seconds, then try again.");
  }
  return error instanceof Error ? error : new Error(message || "Portaldot transaction failed");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function nextSignerNonce(api: ApiPromise, address: string) {
  return (await api.rpc.system.accountNextIndex(address)).toString();
}

function clearStalePendingClaim(address: string) {
  const pending = pendingClaims.get(address);
  if (pending && Date.now() - pending.startedAt > CLAIM_PENDING_TTL_MS) {
    pendingClaims.delete(address);
  }
}

function queueSignerTx<T>(address: string, run: () => Promise<T>) {
  const previous = signerQueues.get(address) || Promise.resolve();
  const next = previous.then(run, run);
  signerQueues.set(address, next.catch(() => undefined));
  return next;
}

type SubmitMode = "watch" | "submitOnly";

type SubmittedTxResult = {
  txHash: string;
  blockHash?: string;
  status?: string;
};

type SubmitSignedTxOptions = {
  mode?: SubmitMode;
  timeoutMs?: number;
};

async function submitSignedTx(tx: any, signer: any, options: SubmitSignedTxOptions = {}): Promise<SubmittedTxResult> {
  const address = signer.address;
  const mode = options.mode || "watch";
  const timeoutMs = options.timeoutMs || TX_CONFIRMATION_TIMEOUT_MS;

  return queueSignerTx<SubmittedTxResult>(address, async () => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        if (mode === "submitOnly") {
          // For faucet UX, return as soon as the node accepts the extrinsic.
          // `nonce: -1` makes polkadot-js ask system.accountNextIndex, which includes pending pool txs.
          const hash = await tx.signAndSend(signer, { nonce: -1 });
          return { txHash: hash?.toString?.() || String(hash || "submitted"), status: "submitted" };
        }

        return await new Promise<{ txHash: string; blockHash?: string; status?: string }>((resolve, reject) => {
          let settled = false;
          let unsub: undefined | (() => void);
          let timer: ReturnType<typeof setTimeout>;

          const finish = (fn: () => void) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try { unsub?.(); } catch { /* noop */ }
            fn();
          };

          timer = setTimeout(() => {
            finish(() => reject(new Error("Portaldot did not confirm this transaction in time. Refresh the app, check your balance, then try again if it was not applied.")));
          }, timeoutMs);

          tx.signAndSend(signer, { nonce: -1 }, (result: any) => {
            const txHash = result.txHash?.toString?.() || tx.hash?.toString?.() || "submitted";

            if (result.dispatchError) {
              finish(() => reject(new Error(result.dispatchError.toString())));
              return;
            }

            if (result.status.isInvalid || result.status.isDropped || result.status.isUsurped) {
              finish(() => reject(new Error(result.status.toString())));
              return;
            }

            if (result.status.isInBlock || result.status.isFinalized) {
              finish(() => resolve({
                txHash,
                status: result.status.type,
                blockHash: result.status.asFinalized?.toString?.() || result.status.asInBlock?.toString?.(),
              }));
            }
          }).then((cleanup: () => void) => {
            if (settled) {
              try { cleanup(); } catch { /* noop */ }
            } else {
              unsub = cleanup;
            }
          }).catch((error: unknown) => {
            finish(() => reject(error));
          });
        });
      } catch (error) {
        lastError = error;
        if (!isTxPoolPriorityError(error) || attempt === 3) {
          throw cleanBackendTxError(error);
        }

        await wait(2000 * attempt);
      }
    }

    throw cleanBackendTxError(lastError);
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
const allowedOrigins = CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed by Potra API CORS"));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 60 }));

app.get("/health", async (_req, res) => {
  try {
    const api = await getApi();
    const [chain, nodeName] = await Promise.all([api.rpc.system.chain(), api.rpc.system.name()]);
    res.json({ ok: true, chain: chain.toString(), nodeName: nodeName.toString(), rpc: RPC, database: databaseStatus() });
  } catch (error) {
    res.status(503).json({ ok: false, error: error instanceof Error ? error.message : "RPC unavailable" });
  }
});


const launchedTokenSchema = z.object({
  assetId: z.number().int().positive(),
  name: z.string().min(1).max(80),
  symbol: z.string().min(1).max(16),
  totalSupply: z.string().min(1),
  decimals: z.number().int().min(0).max(18),
  owner: z.string().min(20),
  txHashes: z.array(z.string()).default([]),
  launchedAt: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
});

const liquidityRecordSchema = z.object({
  id: z.string().min(3),
  owner: z.string().min(3),
  poolAddress: z.string().min(3),
  assetId: z.number().int().positive(),
  assetName: z.string().min(1),
  assetSymbol: z.string().min(1),
  assetDecimals: z.number().int().min(0).max(18),
  potAmount: z.string().min(1),
  assetAmount: z.string().min(1),
  potTxHash: z.string().min(3),
  assetTxHash: z.string().min(3),
  createdAt: z.string().optional(),
  status: z.literal("funded").default("funded"),
  mode: z.enum(["managed-vault", "legacy-vault", "market-preview"]).optional(),
});

const swapRecordSchema = z.object({
  id: z.string().min(3),
  wallet: z.string().min(20),
  direction: z.enum(["potToAsset", "assetToPot"]),
  assetId: z.number().int().positive(),
  assetSymbol: z.string().min(1),
  inputAmount: z.string().min(1),
  outputAmount: z.string().min(1),
  inputTxHash: z.string().min(3),
  outputTxHash: z.string().min(3),
  createdAt: z.string().optional(),
});

app.get("/api/registry/tokens", async (_req, res) => {
  try {
    const tokens = await listTokenRecords();
    res.json({ ok: true, database: DATABASE_PROVIDER, tokens });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unable to load tokens" });
  }
});

app.post("/api/registry/tokens", async (req, res) => {
  const parsed = launchedTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid launched token payload" });
    return;
  }

  try {
    decodeAddress(parsed.data.owner);
    const token = await upsertTokenRecord({ ...parsed.data, launchedAt: parsed.data.launchedAt || new Date().toISOString() });
    res.json({ ok: true, token });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unable to save launched token" });
  }
});

app.get("/api/registry/liquidity", async (_req, res) => {
  try {
    const positions = await listLiquidityRecords();
    res.json({ ok: true, database: DATABASE_PROVIDER, positions });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unable to load liquidity" });
  }
});

app.post("/api/registry/liquidity", async (req, res) => {
  const parsed = liquidityRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid liquidity payload" });
    return;
  }

  try {
    const position = await upsertLiquidityRecord({ ...parsed.data, createdAt: parsed.data.createdAt || new Date().toISOString() });
    res.json({ ok: true, position });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unable to save liquidity" });
  }
});

app.get("/api/registry/swaps", async (req, res) => {
  try {
    const wallet = typeof req.query.wallet === "string" ? req.query.wallet : undefined;
    const swaps = await listSwapRecords(wallet);
    res.json({ ok: true, database: DATABASE_PROVIDER, swaps });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unable to load swaps" });
  }
});

app.post("/api/registry/swaps", async (req, res) => {
  const parsed = swapRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: "Invalid swap payload" });
    return;
  }

  try {
    decodeAddress(parsed.data.wallet);
    const swap = await upsertSwapRecord({ ...parsed.data, createdAt: parsed.data.createdAt || new Date().toISOString() });
    res.json({ ok: true, swap });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unable to save swap" });
  }
});

app.get("/api/activity", async (req, res) => {
  try {
    const wallet = typeof req.query.wallet === "string" ? req.query.wallet : undefined;
    const activity = await listActivityRecords(wallet);
    res.json({ ok: true, database: DATABASE_PROVIDER, activity });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Unable to load activity" });
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

  clearStalePendingClaim(address);

  const pendingClaim = pendingClaims.get(address);
  if (pendingClaim) {
    const waitSeconds = Math.max(1, Math.ceil((CLAIM_PENDING_TTL_MS - (Date.now() - pendingClaim.startedAt)) / 1000));
    res.status(409).json({ ok: false, error: `A faucet claim for this wallet is already being processed. Wait about ${waitSeconds} seconds, refresh your balance, then try again if the balance did not update.` });
    return;
  }

  pendingClaims.set(address, { startedAt: Date.now() });
  try {
    const result = await transferPot(address);
    claims.set(address, now);
    await recordActivity({
      id: activityId("faucet", `${address}-${result.txHash}`),
      type: "faucet",
      wallet: address,
      title: "Test POT claimed",
      description: `${FAUCET_AMOUNT_POT} POT sent from Potra faucet`,
      txHash: result.txHash,
      createdAt: new Date().toISOString(),
      payload: { amount: FAUCET_AMOUNT_POT, status: result.status },
    });
    res.json({ ok: true, amount: FAUCET_AMOUNT_POT, ...result });
  } catch (error) {
    const clean = cleanBackendTxError(error);
    res.status(500).json({ ok: false, error: clean.message || "Transfer failed" });
  } finally {
    pendingClaims.delete(address);
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

app.get("/api/markets/defaults", async (_req, res) => {
  try {
    if (!defaultMarketsBootstrapPromise) {
      defaultMarketsBootstrapPromise = (async () => {
        const markets = [];
        for (const market of DEFAULT_MARKETS) {
          markets.push(await bootstrapDefaultMarket(market));
        }
        return markets;
      })();
    }

    const markets = await defaultMarketsBootstrapPromise;
    for (const market of markets) {
      await upsertLiquidityRecord(market, false);
    }
    res.json({ ok: true, mode: "protocol-seeded-markets", markets });
  } catch (error) {
    defaultMarketsBootstrapPromise = null;
    const message = error instanceof Error ? error.message : "Unable to load default markets";
    const clean = cleanBackendTxError(error);
    res.status(500).json({ ok: false, error: clean.message || message });
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

    await recordActivity({
      id: activityId("bridge", `${recipient}-${minted.txHash}`),
      type: "bridge",
      wallet: recipient,
      title: `${asset.symbol} bridge claim settled`,
      description: `${amount} ${asset.symbol} minted on Portaldot`,
      txHash: minted.txHash,
      assetId: asset.assetId,
      assetSymbol: asset.symbol,
      createdAt: new Date().toISOString(),
      payload: { sourceNetwork, recipient, amount, rawAmount },
    });

    res.json({
      ok: true,
      mode: "portaldot-bridge-authority",
      sourceNetwork,
      destinationNetwork: "Portaldot Test Network",
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
    const clean = cleanBackendTxError(error);
    res.status(500).json({ ok: false, error: clean.message || "Bridge claim failed" });
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

    await recordActivity({
      id: activityId("bridge", `${sourceTxHash}-${recipient}`),
      type: "bridge",
      wallet: recipient,
      title: `${asset.symbol} EVM deposit settled`,
      description: `${verified.amount} ${asset.symbol} minted on Portaldot`,
      txHash: minted.txHash,
      assetId: asset.assetId,
      assetSymbol: asset.symbol,
      createdAt: new Date().toISOString(),
      payload: { sourceNetwork, sourceTxHash, sourceSender: sourceSender || verified.depositor, recipient, amount: verified.amount },
    });

    res.json({
      ok: true,
      mode: "evm-deposit-relay",
      sourceNetwork: verified.config.name,
      destinationNetwork: "Portaldot Test Network",
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
    const clean = cleanBackendTxError(error);
    res.status(500).json({ ok: false, error: clean.message || "EVM bridge settlement failed" });
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
    const clean = cleanBackendTxError(error);
    res.status(500).json({ ok: false, error: clean.message || "Swap settlement failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Potra API running on http://localhost:${PORT}`);
  console.log(`Connected RPC target: ${RPC}`);
  console.log("Faucet mode: real Portaldot POT transfers");
  console.log("Swap mode: protocol-seeded markets + managed-vault two-leg onchain settlement");
  console.log("Bridge mode: EVM testnet deposit relay + Portaldot authority mint");
  console.log(`Database mode: ${DATABASE_ENABLED ? "Postgres" : "memory fallback"}`);
});
