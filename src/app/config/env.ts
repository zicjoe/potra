export const potraConfig = {
  appName: "Potra",
  chainEnv: import.meta.env.VITE_CHAIN_ENV || "local",
  rpcUrl: import.meta.env.VITE_PORTALDOT_RPC || "ws://127.0.0.1:9944",
  explorerUrl: import.meta.env.VITE_PORTALDOT_EXPLORER || "",
  faucetApi: import.meta.env.VITE_FAUCET_API || "http://localhost:8787",
  potDecimals: Number(import.meta.env.VITE_POT_DECIMALS || 14),
  ss58Format: Number(import.meta.env.VITE_SS58_FORMAT || 42),
  evmBridge: {
    sepoliaVault: import.meta.env.VITE_SEPOLIA_BRIDGE_VAULT || "",
    bnbVault: import.meta.env.VITE_BNB_BRIDGE_VAULT || "",
    sepoliaRpc: import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    bnbRpc: import.meta.env.VITE_BNB_TESTNET_RPC_URL || "https://bsc-testnet.publicnode.com",
  },
  contracts: {
    tokenFactory: import.meta.env.VITE_POTRA_FACTORY_CONTRACT || "",
    router: import.meta.env.VITE_POTRA_ROUTER_CONTRACT || "",
    poolFactory: import.meta.env.VITE_POTRA_POOL_FACTORY_CONTRACT || "",
  },
};

export function shortAddress(address?: string, prefix = 6, suffix = 4) {
  if (!address) return "";
  if (address.length <= prefix + suffix) return address;
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

export function hasDexContracts() {
  return Boolean(potraConfig.contracts.router && potraConfig.contracts.poolFactory);
}
