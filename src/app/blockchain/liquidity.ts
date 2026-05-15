import { web3FromSource } from "@polkadot/extension-dapp";
import { BN } from "@polkadot/util";
import { blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";
import { potraConfig } from "../config/env";
import { parseUnits } from "./format";
import { getPortaldotApi } from "./portaldot";
import type { LaunchAssetResult, WalletAccount } from "./assets";

export type LiquidityAsset = LaunchAssetResult;

export type CreateLiquidityParams = {
  account: WalletAccount;
  asset: LiquidityAsset;
  potAmount: string;
  assetAmount: string;
};

export type LiquidityProgress = {
  step: "potDeposit" | "assetDeposit";
  status: "signing" | "broadcast" | "inBlock" | "finalized";
  txHash?: string;
};

export type LiquidityPosition = {
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
};

const LIQUIDITY_REGISTRY_KEY = "potra.liquidityPositions.v1";
const MAX_U64 = new BN("18446744073709551615");

function normalizeAmount(value: string, decimals: number, label: string) {
  const clean = value.trim().replace(/,/g, "");
  if (!clean || Number(clean) <= 0) {
    throw new Error(`Enter a valid ${label} amount`);
  }
  if (!/^\d+(\.\d+)?$/.test(clean)) {
    throw new Error(`${label} amount must be a positive number`);
  }

  const raw = parseUnits(clean, decimals).toString();
  const amount = new BN(raw);
  if (amount.lte(new BN(0))) {
    throw new Error(`${label} amount must be greater than zero`);
  }
  if (amount.gt(MAX_U64)) {
    throw new Error(`${label} amount is too large for this local Portaldot asset flow`);
  }
  return amount;
}

export function buildPoolAddress(assetId: number) {
  const seed = `potra:vault:pot:${assetId}:${potraConfig.chainEnv}`;
  const publicKey = blake2AsU8a(seed, 256);
  return encodeAddress(publicKey, potraConfig.ss58Format);
}

async function signAndWait(tx: any, account: WalletAccount, step: LiquidityProgress["step"], onProgress?: (progress: LiquidityProgress) => void) {
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
          unsub?.();
          reject(new Error(failure.toString()));
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

export async function createLiquidityPosition(params: CreateLiquidityParams, onProgress?: (progress: LiquidityProgress) => void): Promise<LiquidityPosition> {
  const api = await getPortaldotApi();
  const assetSymbol = params.asset.symbol.trim().toUpperCase();
  const assetId = params.asset.assetId;
  const poolAddress = buildPoolAddress(assetId);

  const potAmount = normalizeAmount(params.potAmount, potraConfig.potDecimals, "POT");
  const assetAmount = normalizeAmount(params.assetAmount, params.asset.decimals, assetSymbol);

  const potTx = api.tx.balances.transferKeepAlive(poolAddress, potAmount);
  const potTxHash = await signAndWait(potTx, params.account, "potDeposit", onProgress);

  const assetTx = api.tx.assets.transfer(assetId, poolAddress, assetAmount);
  const assetTxHash = await signAndWait(assetTx, params.account, "assetDeposit", onProgress);

  const position: LiquidityPosition = {
    id: `POT-${assetId}-${Date.now()}`,
    owner: params.account.address,
    poolAddress,
    assetId,
    assetName: params.asset.name,
    assetSymbol,
    assetDecimals: params.asset.decimals,
    potAmount: params.potAmount,
    assetAmount: params.assetAmount,
    potTxHash,
    assetTxHash,
    createdAt: new Date().toISOString(),
    status: "funded",
  };

  saveLiquidityPosition(position);
  return position;
}

export function getLiquidityPositions(): LiquidityPosition[] {
  try {
    const raw = localStorage.getItem(LIQUIDITY_REGISTRY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLiquidityPosition(position: LiquidityPosition) {
  const existing = getLiquidityPositions();
  const next = [position, ...existing.filter((item) => item.id !== position.id)].slice(0, 50);
  localStorage.setItem(LIQUIDITY_REGISTRY_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("potra:liquidity-created", { detail: position }));
}
