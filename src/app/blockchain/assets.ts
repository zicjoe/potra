import { web3FromSource } from "@polkadot/extension-dapp";
import { BN } from "@polkadot/util";
import { potraConfig } from "../config/env";
import { getPortaldotApi } from "./portaldot";

export type WalletAccount = {
  address: string;
  meta?: { name?: string; source?: string };
};

export type LaunchAssetParams = {
  account: WalletAccount;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals?: number;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
};

export type LaunchAssetResult = {
  assetId: number;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  owner: string;
  txHashes: string[];
  launchedAt: string;
};

export const DEFAULT_ASSET_DECIMALS = 6;
const MAX_ASSET_BALANCE = new BN("18446744073709551615");

type TxProgress = {
  step: "create" | "metadata" | "mint";
  status: "signing" | "broadcast" | "inBlock" | "finalized";
  txHash?: string;
};

const ASSET_REGISTRY_KEY = "potra.launchedAssets.v1";

function maxHumanSupply(decimals: number) {
  const divisor = new BN(10).pow(new BN(decimals));
  return MAX_ASSET_BALANCE.div(divisor);
}

function normalizeAmount(value: string, decimals: number) {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed || Number(trimmed) <= 0) {
    throw new Error("Enter a valid total supply");
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Total supply must be a positive number");
  }

  const [wholePart, decimalPart = ""] = trimmed.split(".");
  const cleanWhole = wholePart || "0";
  const cleanDecimal = decimalPart.slice(0, decimals).padEnd(decimals, "0");
  const raw = `${cleanWhole}${cleanDecimal}`.replace(/^0+(?=\d)/, "");
  const amount = new BN(raw || "0");

  if (amount.gt(MAX_ASSET_BALANCE)) {
    const max = maxHumanSupply(decimals).toString();
    throw new Error(`Supply is too large for Portaldot assets. Use ${max} or less with ${decimals} decimals.`);
  }

  return amount;
}

function buildAssetId() {
  // Local dev chain friendly asset id. Low collision risk for a hackathon local/devnet flow.
  return Math.floor(Date.now() / 1000) % 2_000_000_000;
}

async function signAndWait(tx: any, account: WalletAccount, step: TxProgress["step"], onProgress?: (progress: TxProgress) => void) {
  if (!account.meta?.source) {
    throw new Error("Wallet source missing. Reconnect your wallet and try again.");
  }

  const injector = await web3FromSource(account.meta.source);

  return new Promise<string>((resolve, reject) => {
    let unsub: undefined | (() => void);
    let resolved = false;

    tx.signAndSend(account.address, { signer: injector.signer }, (result: any) => {
      const txHash = tx.hash?.toString?.() || result.txHash?.toString?.();

      if (result.status?.isBroadcast) {
        onProgress?.({ step, status: "broadcast", txHash });
      }

      if (result.status?.isInBlock) {
        onProgress?.({ step, status: "inBlock", txHash });
      }

      if (result.status?.isFinalized || result.status?.isInBlock) {
        const failure = result.dispatchError;
        if (failure) {
          let message = failure.toString();
          if (failure.isModule) {
            try {
              const api = tx.registry?.metadata ? undefined : undefined;
              void api;
            } catch {
              // Keep raw module error fallback.
            }
          }
          unsub?.();
          reject(new Error(message));
          return;
        }

        if (!resolved) {
          resolved = true;
          onProgress?.({ step, status: result.status.isFinalized ? "finalized" : "inBlock", txHash });
          unsub?.();
          resolve(txHash || "submitted");
        }
      }
    }).then((cleanup: () => void) => {
      unsub = cleanup;
      onProgress?.({ step, status: "signing" });
    }).catch(reject);
  });
}

export async function launchNativeAsset(params: LaunchAssetParams, onProgress?: (progress: TxProgress) => void): Promise<LaunchAssetResult> {
  const api = await getPortaldotApi();
  const decimals = params.decimals ?? DEFAULT_ASSET_DECIMALS;
  const assetId = buildAssetId();
  const symbol = params.symbol.trim().toUpperCase();
  const name = params.name.trim();

  if (!name) throw new Error("Token name is required");
  if (!symbol) throw new Error("Token symbol is required");
  if (symbol.length > 12) throw new Error("Token symbol should be 12 characters or less");

  const supply = normalizeAmount(params.totalSupply, decimals);
  const txHashes: string[] = [];

  const createTx = api.tx.assets.create(assetId, params.account.address, "1");
  txHashes.push(await signAndWait(createTx, params.account, "create", onProgress));

  const metadataTx = api.tx.assets.setMetadata(assetId, name, symbol, decimals);
  txHashes.push(await signAndWait(metadataTx, params.account, "metadata", onProgress));

  const mintTx = api.tx.assets.mint(assetId, params.account.address, supply);
  txHashes.push(await signAndWait(mintTx, params.account, "mint", onProgress));

  const result: LaunchAssetResult = {
    assetId,
    name,
    symbol,
    totalSupply: params.totalSupply,
    decimals,
    owner: params.account.address,
    txHashes,
    launchedAt: new Date().toISOString(),
  };

  saveLaunchedAsset(result);
  return result;
}

export function getLaunchedAssets(): LaunchAssetResult[] {
  try {
    const raw = localStorage.getItem(ASSET_REGISTRY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLaunchedAsset(asset: LaunchAssetResult) {
  const existing = getLaunchedAssets();
  const next = [asset, ...existing.filter((item) => item.assetId !== asset.assetId)].slice(0, 25);
  localStorage.setItem(ASSET_REGISTRY_KEY, JSON.stringify(next));

  window.dispatchEvent(new CustomEvent("potra:asset-launched", { detail: asset }));
}

export function assetExplorerUrl(assetId: number) {
  if (!potraConfig.explorerUrl) return "";
  return potraConfig.explorerUrl;
}
