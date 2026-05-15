import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady, decodeAddress } from "@polkadot/util-crypto";

const PORT = Number(process.env.PORT || 8787);
const RPC = process.env.PORTALDOT_RPC || "ws://127.0.0.1:9944";
const FAUCET_SEED = process.env.FAUCET_SEED || "//Alice";
const POOL_SEED = process.env.POTRA_POOL_SEED || "//Alice//PotraPool";
const FAUCET_AMOUNT_POT = process.env.FAUCET_AMOUNT_POT || "100";
const POT_DECIMALS = Number(process.env.POT_DECIMALS || 14);
const SS58_FORMAT = Number(process.env.SS58_FORMAT || 42);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const CLAIM_COOLDOWN_SECONDS = Number(process.env.CLAIM_COOLDOWN_SECONDS || 3600);

const claims = new Map<string, number>();
let apiPromise: Promise<ApiPromise> | null = null;
let keyringPromise: Promise<Keyring> | null = null;

function parseUnits(value: string, decimals: number) {
  const [whole, fraction = ""] = value.trim().split(".");
  const normalizedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(normalizedFraction || "0");
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
});
