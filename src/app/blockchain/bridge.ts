import { BrowserProvider, Contract, parseEther } from "ethers";
import { potraConfig } from "../config/env";

export type BridgeAssetSymbol = "TESTETH" | "TESTBNB" | "TESTUSDT";
export type BridgeMode = "portaldot-bridge-authority" | "evm-deposit-relay";

export type BridgeRecord = {
  id: string;
  sourceNetwork: string;
  destinationNetwork: string;
  assetId: number;
  assetSymbol: BridgeAssetSymbol;
  assetName: string;
  amount: string;
  decimals: number;
  recipient: string;
  mode: BridgeMode;
  txHashes: string[];
  mintTxHash: string;
  sourceTxHash?: string;
  sourceSender?: string;
  createdAt: string;
};

export const BRIDGE_RECORDS_KEY = "potra.bridgeRecords.v1";

export const bridgeAssets: Array<{ symbol: BridgeAssetSymbol; name: string; description: string }> = [
  { symbol: "TESTETH", name: "Wrapped Sepolia ETH", description: "Sepolia ETH represented as a Portaldot native asset" },
  { symbol: "TESTBNB", name: "Wrapped BNB Testnet", description: "BNB Testnet native coin represented as a Portaldot native asset" },
  { symbol: "TESTUSDT", name: "Wrapped Test USDT", description: "Test stable asset represented on Portaldot through authority mode" },
];

export const bridgeNetworks = [
  { id: "sepolia", name: "Ethereum Sepolia", icon: "ETH" },
  { id: "bnb-testnet", name: "BNB Testnet", icon: "BNB" },
  { id: "portaldot-local", name: "Portaldot Local Devnet", icon: "POT" },
];

export const evmBridgeNetworks = [
  {
    id: "sepolia",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: potraConfig.evmBridge.sepoliaRpc,
    explorerUrl: "https://sepolia.etherscan.io",
    contractAddress: potraConfig.evmBridge.sepoliaVault,
    assetSymbol: "TESTETH" as BridgeAssetSymbol,
  },
  {
    id: "bnb-testnet",
    name: "BNB Testnet",
    chainId: 97,
    chainIdHex: "0x61",
    nativeCurrency: { name: "BNB", symbol: "tBNB", decimals: 18 },
    rpcUrl: potraConfig.evmBridge.bnbRpc,
    explorerUrl: "https://testnet.bscscan.com",
    contractAddress: potraConfig.evmBridge.bnbVault,
    assetSymbol: "TESTBNB" as BridgeAssetSymbol,
  },
];

const POTRA_BRIDGE_VAULT_ABI = [
  "function depositNative(string portaldotRecipient,string assetSymbol) payable",
  "event PotraBridgeDeposit(address indexed depositor,string portaldotRecipient,string assetSymbol,uint256 amount,uint256 nonce)",
];

export function getBridgeRecords(): BridgeRecord[] {
  try {
    const raw = localStorage.getItem(BRIDGE_RECORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveBridgeRecord(record: BridgeRecord) {
  const existing = getBridgeRecords();
  const next = [record, ...existing.filter((item) => item.id !== record.id)].slice(0, 50);
  localStorage.setItem(BRIDGE_RECORDS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("potra:bridge-completed", { detail: record }));
}

export function getEvmBridgeNetwork(sourceNetwork: string) {
  return evmBridgeNetworks.find((network) => network.id === sourceNetwork) || evmBridgeNetworks[0];
}

export function hasConfiguredEvmVault(sourceNetwork: string) {
  const network = getEvmBridgeNetwork(sourceNetwork);
  return Boolean(network.contractAddress && network.contractAddress.startsWith("0x"));
}

async function ensureEvmNetwork(network: ReturnType<typeof getEvmBridgeNetwork>) {
  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error("MetaMask or another EVM wallet is required for real source-chain deposits");
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainIdHex }],
    });
  } catch (error: any) {
    if (error?.code !== 4902) throw error;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: network.chainIdHex,
        chainName: network.name,
        nativeCurrency: network.nativeCurrency,
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerUrl],
      }],
    });
  }
}

export async function depositToEvmBridge(params: {
  sourceNetwork: string;
  recipient: string;
  amount: string;
}) {
  const network = getEvmBridgeNetwork(params.sourceNetwork);
  if (!network.contractAddress) {
    throw new Error(`${network.name} bridge vault is not configured yet`);
  }

  await ensureEvmNetwork(network);
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const sender = await signer.getAddress();
  const contract = new Contract(network.contractAddress, POTRA_BRIDGE_VAULT_ABI, signer);

  const tx = await contract.depositNative(params.recipient, network.assetSymbol, {
    value: parseEther(params.amount),
  });
  const receipt = await tx.wait();

  return {
    txHash: receipt?.hash || tx.hash,
    sender,
    sourceNetwork: network.name,
    assetSymbol: network.assetSymbol,
  };
}

export async function settleEvmBridgeDeposit(params: {
  recipient: string;
  assetSymbol: BridgeAssetSymbol;
  sourceNetwork: string;
  sourceTxHash: string;
  sourceSender?: string;
}): Promise<BridgeRecord> {
  const response = await fetch(`${potraConfig.faucetApi}/api/bridge/settle-evm-deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Bridge settlement failed");
  }

  const record: BridgeRecord = {
    id: `EVM-BRIDGE-${Date.now()}`,
    sourceNetwork: data.sourceNetwork,
    destinationNetwork: data.destinationNetwork,
    assetId: data.assetId,
    assetSymbol: data.assetSymbol,
    assetName: data.assetName,
    amount: data.amount,
    decimals: data.decimals,
    recipient: data.recipient,
    mode: data.mode,
    txHashes: data.txHashes || [data.sourceTxHash, data.mintTxHash].filter(Boolean),
    sourceTxHash: data.sourceTxHash,
    sourceSender: data.sourceSender || params.sourceSender,
    mintTxHash: data.mintTxHash,
    createdAt: new Date().toISOString(),
  };

  saveBridgeRecord(record);
  return record;
}

export async function bridgeIntoPortaldot(params: {
  recipient: string;
  assetSymbol: BridgeAssetSymbol;
  amount: string;
  sourceNetwork: string;
}): Promise<BridgeRecord> {
  const response = await fetch(`${potraConfig.faucetApi}/api/bridge/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Bridge claim failed");
  }

  const record: BridgeRecord = {
    id: `BRIDGE-${Date.now()}`,
    sourceNetwork: data.sourceNetwork,
    destinationNetwork: data.destinationNetwork,
    assetId: data.assetId,
    assetSymbol: data.assetSymbol,
    assetName: data.assetName,
    amount: data.amount,
    decimals: data.decimals,
    recipient: data.recipient,
    mode: data.mode,
    txHashes: data.txHashes || [data.mintTxHash],
    mintTxHash: data.mintTxHash,
    createdAt: new Date().toISOString(),
  };

  saveBridgeRecord(record);
  return record;
}
