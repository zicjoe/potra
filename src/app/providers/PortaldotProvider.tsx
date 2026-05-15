import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { claimTestPot } from "../blockchain/faucetClient";
import { getPortaldotApi, readChainInfo, readPotBalance } from "../blockchain/portaldot";
import { LaunchAssetParams, LaunchAssetResult, launchNativeAsset } from "../blockchain/assets";
import { CreateLiquidityParams, LiquidityPosition, createLiquidityPosition } from "../blockchain/liquidity";

type Account = { address: string; meta?: { name?: string; source?: string } };
type ChainStatus = "connecting" | "connected" | "offline";

type PortaldotContextValue = {
  status: ChainStatus;
  chainInfo?: { chain: string; nodeName: string; nodeVersion: string };
  error?: string;
  accounts: Account[];
  selectedAccount?: Account;
  potBalance: string;
  rawPotBalance: string;
  connectWallet: () => Promise<void>;
  selectAccount: (account: Account) => void;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  claimFaucet: () => Promise<void>;
  isClaimingFaucet: boolean;
  launchAsset: (params: Omit<LaunchAssetParams, "account">) => Promise<LaunchAssetResult>;
  isLaunchingAsset: boolean;
  createLiquidity: (params: Omit<CreateLiquidityParams, "account">) => Promise<LiquidityPosition>;
  isCreatingLiquidity: boolean;
};

const PortaldotContext = createContext<PortaldotContextValue | undefined>(undefined);

export function PortaldotProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ChainStatus>("connecting");
  const [chainInfo, setChainInfo] = useState<PortaldotContextValue["chainInfo"]>();
  const [error, setError] = useState<string>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account>();
  const [potBalance, setPotBalance] = useState("0");
  const [rawPotBalance, setRawPotBalance] = useState("0");
  const [isClaimingFaucet, setIsClaimingFaucet] = useState(false);
  const [isLaunchingAsset, setIsLaunchingAsset] = useState(false);
  const [isCreatingLiquidity, setIsCreatingLiquidity] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setStatus("connecting");
        await getPortaldotApi();
        const info = await readChainInfo();
        if (!mounted) return;
        setChainInfo(info);
        setStatus("connected");
        setError(undefined);
      } catch (err) {
        if (!mounted) return;
        setStatus("offline");
        setError(err instanceof Error ? err.message : "Unable to connect to Portaldot RPC");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!selectedAccount?.address) return;
    const balance = await readPotBalance(selectedAccount.address);
    setPotBalance(balance.human);
    setRawPotBalance(balance.raw);
  }, [selectedAccount?.address]);

  useEffect(() => {
    refreshBalance().catch(() => undefined);
  }, [refreshBalance]);

  const connectWallet = useCallback(async () => {
    try {
      const { web3Accounts, web3Enable } = await import("@polkadot/extension-dapp");
      const extensions = await web3Enable("Potra");
      if (!extensions.length) {
        throw new Error("No Polkadot-compatible wallet extension approved Potra");
      }
      const injectedAccounts = await web3Accounts();
      if (!injectedAccounts.length) {
        throw new Error("No accounts found in your wallet extension");
      }
      const normalized = injectedAccounts.map((account: any) => ({
        address: account.address,
        meta: account.meta,
      }));
      setAccounts(normalized);
      setSelectedAccount(normalized[0]);
      toast.success("Wallet connected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wallet connection failed");
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccounts([]);
    setSelectedAccount(undefined);
    setPotBalance("0");
    setRawPotBalance("0");
    toast.message("Wallet disconnected");
  }, []);

  const selectAccount = useCallback((account: Account) => {
    setSelectedAccount(account);
  }, []);

  const claimFaucet = useCallback(async () => {
    if (!selectedAccount?.address) {
      toast.error("Connect a wallet before claiming test POT");
      return;
    }
    setIsClaimingFaucet(true);
    try {
      const result = await claimTestPot(selectedAccount.address);
      toast.success(`Claimed ${result.amount} POT`, { description: result.txHash });
      await refreshBalance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Faucet claim failed");
    } finally {
      setIsClaimingFaucet(false);
    }
  }, [refreshBalance, selectedAccount?.address]);


  const launchAsset = useCallback(async (params: Omit<LaunchAssetParams, "account">) => {
    if (!selectedAccount?.address) {
      throw new Error("Connect a wallet before launching a token");
    }

    setIsLaunchingAsset(true);
    try {
      const asset = await launchNativeAsset({ ...params, account: selectedAccount }, (progress) => {
        const labels = { create: "Creating asset", metadata: "Setting metadata", mint: "Minting supply" } as const;
        if (progress.status === "inBlock") {
          toast.success(`${labels[progress.step]} confirmed`, { description: progress.txHash });
        }
      });
      await refreshBalance();
      return asset;
    } finally {
      setIsLaunchingAsset(false);
    }
  }, [refreshBalance, selectedAccount]);



  const createLiquidity = useCallback(async (params: Omit<CreateLiquidityParams, "account">) => {
    if (!selectedAccount?.address) {
      throw new Error("Connect a wallet before creating a liquidity pool");
    }

    setIsCreatingLiquidity(true);
    try {
      const position = await createLiquidityPosition({ ...params, account: selectedAccount }, (progress) => {
        const labels = { potDeposit: "Depositing POT", assetDeposit: "Depositing asset" } as const;
        if (progress.status === "inBlock") {
          toast.success(`${labels[progress.step]} confirmed`, { description: progress.txHash });
        }
      });
      await refreshBalance();
      return position;
    } finally {
      setIsCreatingLiquidity(false);
    }
  }, [refreshBalance, selectedAccount]);

  const value = useMemo<PortaldotContextValue>(() => ({
    status, chainInfo, error, accounts, selectedAccount, potBalance, rawPotBalance,
    connectWallet, selectAccount, disconnectWallet, refreshBalance, claimFaucet, isClaimingFaucet, launchAsset, isLaunchingAsset, createLiquidity, isCreatingLiquidity,
  }), [accounts, chainInfo, claimFaucet, connectWallet, createLiquidity, disconnectWallet, error, isClaimingFaucet, isCreatingLiquidity, isLaunchingAsset, launchAsset, potBalance, rawPotBalance, refreshBalance, selectAccount, selectedAccount, status]);

  return <PortaldotContext.Provider value={value}>{children}</PortaldotContext.Provider>;
}

export function usePortaldot() {
  const context = useContext(PortaldotContext);
  if (!context) throw new Error("usePortaldot must be used inside PortaldotProvider");
  return context;
}
