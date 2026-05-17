import { getLaunchedAssets } from "./assets";
import { getSupportedLiquidityAssets, type LiquidityAsset } from "./liquidity";

export type TradeTokenOption = {
  symbol: string;
  name: string;
  decimals: number;
  assetId?: number;
  asset?: LiquidityAsset;
  isPot?: boolean;
  source: "native" | "bridge" | "launched";
};

export const POT_TOKEN: TradeTokenOption = {
  symbol: "POT",
  name: "Portaldot",
  decimals: 14,
  isPot: true,
  source: "native",
};

export const TOKEN_REGISTRY_EVENTS = [
  "potra:asset-launched",
  "potra:liquidity-created",
  "potra:liquidity-updated",
  "potra:swap-executed",
] as const;

export function tokenKey(token?: TradeTokenOption) {
  if (!token) return "";
  return token.isPot ? "POT" : `ASSET-${token.assetId ?? token.asset?.assetId ?? token.symbol}`;
}

export function sameToken(a?: TradeTokenOption, b?: TradeTokenOption) {
  return Boolean(a && b && tokenKey(a) === tokenKey(b));
}

export function getTradeTokens(): TradeTokenOption[] {
  const launchedAssets = getLaunchedAssets();
  const liquidityAssets = getSupportedLiquidityAssets(launchedAssets);

  const listedAssets = liquidityAssets.map((asset) => {
    const isBridgeAsset = asset.launchedAt === "protocol" || asset.owner === "Potra bridge authority";

    return {
      symbol: asset.symbol,
      name: asset.name,
      decimals: asset.decimals,
      assetId: asset.assetId,
      asset,
      source: isBridgeAsset ? "bridge" : "launched",
    } satisfies TradeTokenOption;
  });

  return [POT_TOKEN, ...listedAssets];
}

export function getDefaultPairToken(tokens: TradeTokenOption[]) {
  return tokens.find((token) => !token.isPot);
}

export function findMatchingToken(tokens: TradeTokenOption[], token?: TradeTokenOption) {
  if (!token) return undefined;
  return tokens.find((item) => sameToken(item, token));
}
