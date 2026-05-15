import { potraConfig } from "../config/env";
import { formatUnits } from "./format";

let apiPromise: Promise<any> | null = null;

export async function getPortaldotApi() {
  if (!apiPromise) {
    apiPromise = (async () => {
      const { ApiPromise, WsProvider } = await import("@polkadot/api");
      const provider = new WsProvider(potraConfig.rpcUrl);
      return ApiPromise.create({ provider });
    })();
  }
  return apiPromise;
}

export async function disconnectPortaldotApi() {
  if (!apiPromise) return;
  const api = await apiPromise;
  await api.disconnect();
  apiPromise = null;
}

export async function readPotBalance(address: string) {
  const api = await getPortaldotApi();
  const account = await api.query.system.account(address);
  const free = account.data.free.toString();
  return { raw: free, human: formatUnits(free, potraConfig.potDecimals, 4) };
}

export async function readChainInfo() {
  const api = await getPortaldotApi();
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);
  return {
    chain: chain.toString(),
    nodeName: nodeName.toString(),
    nodeVersion: nodeVersion.toString(),
  };
}

export async function createNativeAssetDraft(params: {
  assetId: number;
  admin: string;
  minBalance?: string;
}) {
  const api = await getPortaldotApi();
  return api.tx.assets.create(params.assetId, params.admin, params.minBalance || "1");
}

export async function setNativeAssetMetadataDraft(params: {
  assetId: number;
  name: string;
  symbol: string;
  decimals?: number;
}) {
  const api = await getPortaldotApi();
  return api.tx.assets.setMetadata(params.assetId, params.name, params.symbol, params.decimals ?? 12);
}
