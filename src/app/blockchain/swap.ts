import { web3FromSource } from "@polkadot/extension-dapp";
import { BN } from "@polkadot/util";
import { potraConfig } from "../config/env";
import { parseUnits } from "./format";
import { getPortaldotApi } from "./portaldot";
import { humanizeTxError } from "./txErrors";
import type { WalletAccount } from "./assets";
import type { LiquidityPosition } from "./liquidity";
import { updateLiquidityPosition } from "./liquidity";

export type SwapDirection = "potToAsset" | "assetToPot";

export type SwapQuote = {
  inputAmount: string;
  outputAmount: string;
  minOutputAmount: string;
  priceImpactPercent: string;
  feePercent: string;
  routeLabel: string;
};

export type ExecuteSwapParams = {
  account: WalletAccount;
  pool: LiquidityPosition;
  direction: SwapDirection;
  inputAmount: string;
  slippagePercent: number;
};

export type SwapProgress = {
  step: "inputDeposit" | "vaultSettlement" | "localSync";
  status: "signing" | "broadcast" | "inBlock" | "finalized" | "submitted";
  txHash?: string;
};

export type SwapResult = {
  id: string;
  direction: SwapDirection;
  assetId: number;
  assetSymbol: string;
  inputAmount: string;
  outputAmount: string;
  inputTxHash: string;
  outputTxHash: string;
  createdAt: string;
};

const SWAP_HISTORY_KEY = "potra.swapHistory.v1";

async function postSwapResult(result: SwapResult & { wallet?: string }) {
  if (!potraConfig.faucetApi) return;

  try {
    await fetch(`${potraConfig.faucetApi}/api/registry/swaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...result, wallet: result.wallet || "" }),
    });
  } catch {
    // Local storage remains the immediate fallback if the shared registry is unavailable.
  }
}

export async function syncSwapHistoryFromBackend(wallet?: string) {
  if (!potraConfig.faucetApi) return getSwapHistory();
  const suffix = wallet ? `?wallet=${encodeURIComponent(wallet)}` : "";
  const response = await fetch(`${potraConfig.faucetApi}/api/registry/swaps${suffix}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok || !Array.isArray(data.swaps)) {
    throw new Error(data.error || "Unable to load swaps");
  }

  const existing = getSwapHistory();
  const incomingIds = new Set(data.swaps.map((item: SwapResult) => item.id));
  const next = [...data.swaps, ...existing.filter((item) => !incomingIds.has(item.id))].slice(0, 100);
  localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("potra:swap-executed", { detail: data.swaps[0] }));
  return getSwapHistory();
}

const FEE_RATE = 0.003;
const MAX_U64 = new BN("18446744073709551615");

function cleanNumber(value: string) {
  return value.trim().replace(/,/g, "");
}

function assertPositiveAmount(value: string, label: string) {
  const clean = cleanNumber(value);
  if (!clean || Number(clean) <= 0 || !/^\d+(\.\d+)?$/.test(clean)) {
    throw new Error(`Enter a valid ${label} amount`);
  }
  return clean;
}

function toRaw(value: string, decimals: number, label: string) {
  const clean = assertPositiveAmount(value, label);
  const raw = new BN(parseUnits(clean, decimals).toString());
  if (raw.lte(new BN(0))) throw new Error(`${label} amount must be greater than zero`);
  if (raw.gt(MAX_U64)) throw new Error(`${label} amount is too large for this Portaldot asset flow`);
  return raw;
}

function formatOutput(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 1) return value.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export function getSwapQuote(pool: LiquidityPosition, direction: SwapDirection, inputAmount: string, slippagePercent = 0.5): SwapQuote | null {
  const input = Number(cleanNumber(inputAmount));
  const potReserve = Number(pool.potAmount || 0);
  const assetReserve = Number(pool.assetAmount || 0);

  if (!input || input <= 0 || !potReserve || !assetReserve) return null;

  const inputAfterFee = input * (1 - FEE_RATE);
  const inputReserve = direction === "potToAsset" ? potReserve : assetReserve;
  const outputReserve = direction === "potToAsset" ? assetReserve : potReserve;
  const output = (outputReserve * inputAfterFee) / (inputReserve + inputAfterFee);

  if (!Number.isFinite(output) || output <= 0) return null;

  const spotOutput = input * (outputReserve / inputReserve);
  const priceImpact = Math.max(0, ((spotOutput - output) / spotOutput) * 100);
  const minOutput = output * (1 - slippagePercent / 100);

  return {
    inputAmount: formatOutput(input),
    outputAmount: formatOutput(output),
    minOutputAmount: formatOutput(minOutput),
    priceImpactPercent: priceImpact.toFixed(2),
    feePercent: "0.30",
    routeLabel: `POT/${pool.assetSymbol} managed vault`,
  };
}

async function signAndWait(tx: any, account: WalletAccount, onProgress?: (progress: SwapProgress) => void) {
  if (!account.meta?.source) {
    throw new Error("Wallet source missing. Reconnect your wallet and try again.");
  }

  const injector = await web3FromSource(account.meta.source);

  return new Promise<string>((resolve, reject) => {
    let unsub: undefined | (() => void);
    let resolved = false;

    tx.signAndSend(account.address, { signer: injector.signer, nonce: -1 }, (result: any) => {
      const txHash = tx.hash?.toString?.() || result.txHash?.toString?.();

      if (result.status?.isBroadcast) onProgress?.({ step: "inputDeposit", status: "broadcast", txHash });
      if (result.status?.isInBlock) onProgress?.({ step: "inputDeposit", status: "inBlock", txHash });

      if (result.status?.isFinalized || result.status?.isInBlock) {
        const failure = result.dispatchError;
        if (failure) {
          unsub?.();
          reject(humanizeTxError(failure.toString()));
          return;
        }

        if (!resolved) {
          resolved = true;
          onProgress?.({ step: "inputDeposit", status: result.status.isFinalized ? "finalized" : "inBlock", txHash });
          unsub?.();
          resolve(txHash || "submitted");
        }
      }
    }).then((cleanup: () => void) => {
      unsub = cleanup;
      onProgress?.({ step: "inputDeposit", status: "signing" });
    }).catch((error: unknown) => reject(humanizeTxError(error)));
  });
}

async function requestVaultSettlement(payload: {
  recipient: string;
  assetId: number;
  direction: SwapDirection;
  outputRaw: string;
  poolAddress: string;
  inputTxHash: string;
}) {
  const response = await fetch(`${potraConfig.faucetApi}/api/swap/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Pool vault settlement failed");
  }

  return data as { txHash: string; blockHash?: string };
}

export async function executeManagedSwap(params: ExecuteSwapParams, onProgress?: (progress: SwapProgress) => void): Promise<SwapResult> {
  if (params.pool.mode !== "managed-vault") {
    throw new Error("This pool was created before managed swap vaults were enabled. Create fresh liquidity for this asset first.");
  }

  const quote = getSwapQuote(params.pool, params.direction, params.inputAmount, params.slippagePercent);
  if (!quote) throw new Error("Unable to quote this swap");

  const api = await getPortaldotApi();
  const inputDecimals = params.direction === "potToAsset" ? potraConfig.potDecimals : params.pool.assetDecimals;
  const outputDecimals = params.direction === "potToAsset" ? params.pool.assetDecimals : potraConfig.potDecimals;
  const inputLabel = params.direction === "potToAsset" ? "POT" : params.pool.assetSymbol;

  const inputRaw = toRaw(params.inputAmount, inputDecimals, inputLabel);
  const outputRaw = toRaw(quote.outputAmount, outputDecimals, "output");

  const inputTx = params.direction === "potToAsset"
    ? api.tx.balances.transferKeepAlive(params.pool.poolAddress, inputRaw)
    : api.tx.assets.transfer(params.pool.assetId, params.pool.poolAddress, inputRaw);

  const inputTxHash = await signAndWait(inputTx, params.account, onProgress);

  onProgress?.({ step: "vaultSettlement", status: "submitted" });
  const settlement = await requestVaultSettlement({
    recipient: params.account.address,
    assetId: params.pool.assetId,
    direction: params.direction,
    outputRaw: outputRaw.toString(),
    poolAddress: params.pool.poolAddress,
    inputTxHash,
  });
  onProgress?.({ step: "vaultSettlement", status: "inBlock", txHash: settlement.txHash });

  const input = Number(cleanNumber(params.inputAmount));
  const output = Number(quote.outputAmount);
  const updatedPool: LiquidityPosition = params.direction === "potToAsset"
    ? { ...params.pool, potAmount: formatOutput(Number(params.pool.potAmount) + input), assetAmount: formatOutput(Math.max(0, Number(params.pool.assetAmount) - output)) }
    : { ...params.pool, assetAmount: formatOutput(Number(params.pool.assetAmount) + input), potAmount: formatOutput(Math.max(0, Number(params.pool.potAmount) - output)) };

  updateLiquidityPosition(updatedPool);
  onProgress?.({ step: "localSync", status: "finalized" });

  const result: SwapResult = {
    id: `SWAP-${Date.now()}`,
    direction: params.direction,
    assetId: params.pool.assetId,
    assetSymbol: params.pool.assetSymbol,
    inputAmount: params.inputAmount,
    outputAmount: quote.outputAmount,
    inputTxHash,
    outputTxHash: settlement.txHash,
    createdAt: new Date().toISOString(),
  };

  saveSwapResult(result, params.account.address);
  return result;
}

export function getSwapHistory(): SwapResult[] {
  try {
    const raw = localStorage.getItem(SWAP_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSwapResult(result: SwapResult, wallet?: string) {
  const existing = getSwapHistory();
  const next = [result, ...existing.filter((item) => item.id !== result.id)].slice(0, 50);
  localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(next));
  if (wallet) void postSwapResult({ ...result, wallet });
  window.dispatchEvent(new CustomEvent("potra:swap-executed", { detail: result }));
}
