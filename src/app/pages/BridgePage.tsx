import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, ExternalLink, Info, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  bridgeAssets,
  bridgeIntoPortaldot,
  bridgeNetworks,
  BridgeRecord,
  BridgeAssetSymbol,
  depositToEvmBridge,
  evmBridgeNetworks,
  getBridgeRecords,
  getEvmBridgeNetwork,
  hasConfiguredEvmVault,
  settleEvmBridgeDeposit,
} from "../blockchain/bridge";
import { shortAddress } from "../config/env";
import { usePortaldot } from "../providers/PortaldotProvider";

const authoritySourceNetworks = bridgeNetworks.filter((network) => network.id !== "portaldot-local");

type BridgeModeTab = "real" | "authority";

function relativeTime(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BridgePage() {
  const { selectedAccount, status, refreshBalance } = usePortaldot();
  const [mode, setMode] = useState<BridgeModeTab>("real");
  const [sourceNetwork, setSourceNetwork] = useState("sepolia");
  const [assetSymbol, setAssetSymbol] = useState<BridgeAssetSymbol>("TESTETH");
  const [amount, setAmount] = useState("0.01");
  const [isBridging, setIsBridging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [records, setRecords] = useState<BridgeRecord[]>([]);
  const [latest, setLatest] = useState<BridgeRecord | null>(null);
  const [sourceTxHash, setSourceTxHash] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setRecords(getBridgeRecords());
    refresh();
    window.addEventListener("potra:bridge-completed", refresh);
    return () => window.removeEventListener("potra:bridge-completed", refresh);
  }, []);

  useEffect(() => {
    if (mode === "real") {
      const evmNetwork = getEvmBridgeNetwork(sourceNetwork);
      setAssetSymbol(evmNetwork.assetSymbol);
      setAmount(evmNetwork.assetSymbol === "TESTBNB" ? "0.01" : "0.01");
    }
  }, [mode, sourceNetwork]);

  const selectedAsset = useMemo(() => bridgeAssets.find((asset) => asset.symbol === assetSymbol) || bridgeAssets[0], [assetSymbol]);
  const selectedAuthoritySource = useMemo(() => authoritySourceNetworks.find((network) => network.id === sourceNetwork) || authoritySourceNetworks[0], [sourceNetwork]);
  const selectedEvmSource = useMemo(() => getEvmBridgeNetwork(sourceNetwork), [sourceNetwork]);
  const sourceVaultReady = hasConfiguredEvmVault(sourceNetwork);

  const canBridge = Boolean(selectedAccount && status === "connected" && amount && Number(amount) > 0 && !isBridging);
  const buttonLabel = !selectedAccount
    ? "Connect Portaldot wallet to bridge"
    : status !== "connected"
      ? "Start Portaldot local node"
      : isBridging
        ? mode === "real" ? "Depositing and settling bridge..." : "Bridging into Portaldot..."
        : mode === "real"
          ? sourceVaultReady
            ? `Deposit ${amount || "0"} ${selectedEvmSource.nativeCurrency.symbol} and mint ${assetSymbol}`
            : "Deploy and configure source vault first"
          : `Bridge ${amount || "0"} ${assetSymbol} into Portaldot`;

  const handleAuthorityBridge = async () => {
    if (!selectedAccount?.address) {
      toast.error("Connect a Portaldot wallet before bridging assets");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid bridge amount");
      return;
    }

    setIsBridging(true);
    setProgress(15);
    setLatest(null);
    setSourceTxHash(null);

    try {
      const timer = window.setInterval(() => {
        setProgress((value) => Math.min(value + 16, 84));
      }, 450);

      const result = await bridgeIntoPortaldot({
        recipient: selectedAccount.address,
        assetSymbol,
        amount,
        sourceNetwork: selectedAuthoritySource.name,
      });

      window.clearInterval(timer);
      setProgress(100);
      setLatest(result);
      await refreshBalance();
      toast.success(`${result.assetSymbol} bridged into Portaldot`, { description: shortAddress(result.mintTxHash) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bridge failed");
    } finally {
      window.setTimeout(() => {
        setIsBridging(false);
        setProgress(0);
      }, 900);
    }
  };

  const handleRealBridge = async () => {
    if (!selectedAccount?.address) {
      toast.error("Connect a Portaldot wallet before bridging assets");
      return;
    }
    if (!sourceVaultReady) {
      toast.error(`${selectedEvmSource.name} vault is not configured`, { description: "Deploy PotraBridgeVault.sol and add the contract address to your env files." });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid source-chain deposit amount");
      return;
    }

    setIsBridging(true);
    setProgress(8);
    setLatest(null);
    setSourceTxHash(null);

    try {
      toast.message("Confirm source-chain deposit in MetaMask");
      setProgress(18);
      const sourceDeposit = await depositToEvmBridge({
        sourceNetwork,
        recipient: selectedAccount.address,
        amount,
      });
      setSourceTxHash(sourceDeposit.txHash);
      setProgress(58);
      toast.success("Source-chain deposit confirmed", { description: shortAddress(sourceDeposit.txHash, 12, 10) });

      const result = await settleEvmBridgeDeposit({
        recipient: selectedAccount.address,
        sourceNetwork,
        sourceTxHash: sourceDeposit.txHash,
        sourceSender: sourceDeposit.sender,
        assetSymbol: sourceDeposit.assetSymbol,
      });

      setProgress(100);
      setLatest(result);
      await refreshBalance();
      toast.success(`${result.assetSymbol} minted on Portaldot`, { description: shortAddress(result.mintTxHash, 12, 10) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Real bridge failed");
    } finally {
      window.setTimeout(() => {
        setIsBridging(false);
        setProgress(0);
      }, 900);
    }
  };

  const handleBridge = mode === "real" ? handleRealBridge : handleAuthorityBridge;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bridge</h1>
          <p className="text-muted-foreground mt-1">Move testnet assets into Portaldot and mint wrapped native assets onchain</p>
        </div>
        <Badge variant="outline" className="gap-2 border-success/30 bg-success/10 text-success">
          <ShieldCheck className="size-4" /> Real testnet path enabled
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Bridge Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={mode} onValueChange={(value) => setMode(value as BridgeModeTab)}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="real">Real Testnet Deposit</TabsTrigger>
                  <TabsTrigger value="authority">Authority Mint</TabsTrigger>
                </TabsList>

                <TabsContent value="real" className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source Network</Label>
                      <Select value={sourceNetwork} onValueChange={setSourceNetwork}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {evmBridgeNetworks.map((network) => (
                            <SelectItem key={network.id} value={network.id}>
                              <div className="flex items-center gap-2">
                                <div className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                  <span className="text-xs font-semibold">{network.nativeCurrency.symbol.slice(0, 1)}</span>
                                </div>
                                <span>{network.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Destination</Label>
                      <div className="h-10 rounded-md border border-border/50 bg-muted/20 px-3 flex items-center gap-2 text-sm">
                        <div className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold">P</span>
                        </div>
                        Portaldot Local Devnet
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source Deposit</Label>
                      <Input type="number" min="0" step="0.000001" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Paid from MetaMask on {selectedEvmSource.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Minted Asset</Label>
                      <div className="h-10 rounded-md border border-border/50 bg-muted/20 px-3 flex items-center justify-between text-sm">
                        <span>{selectedEvmSource.assetSymbol}</span>
                        <Badge variant="outline">Wrapped on Portaldot</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{selectedAsset.description}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Source Vault</span>
                      <span className={sourceVaultReady ? "font-mono" : "text-warning"}>{sourceVaultReady ? shortAddress(selectedEvmSource.contractAddress, 10, 8) : "Not configured"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bridge Mode</span>
                      <span>Deposit proof + Portaldot mint</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">You Receive</span>
                      <span className="font-medium">{amount || "0"} {selectedEvmSource.assetSymbol}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="authority" className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source Network</Label>
                      <Select value={sourceNetwork} onValueChange={setSourceNetwork}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {authoritySourceNetworks.map((network) => (
                            <SelectItem key={network.id} value={network.id}>{network.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Destination</Label>
                      <div className="h-10 rounded-md border border-border/50 bg-muted/20 px-3 flex items-center gap-2 text-sm">Portaldot Local Devnet</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Asset to Bridge</Label>
                    <Select value={assetSymbol} onValueChange={(val) => setAssetSymbol(val as BridgeAssetSymbol)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {bridgeAssets.map((asset) => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            <div className="flex flex-col">
                              <span>{asset.symbol}</span>
                              <span className="text-xs text-muted-foreground">{asset.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{selectedAsset.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" min="0" step="0.000001" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                      <Button variant="outline" onClick={() => setAmount(assetSymbol === "TESTUSDT" ? "100" : "1")}>Demo Amount</Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                    <Info className="size-4 text-info mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Authority mode is still available for local demos, but the real bridge path now supports Sepolia ETH and BNB Testnet deposits through a source-chain vault.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {isBridging && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{mode === "real" ? "Verifying source deposit and minting on Portaldot" : "Bridging into Portaldot"}</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="space-y-2 text-sm">
                    {mode === "real" ? (
                      <>
                        <Step done={progress > 8} label="MetaMask deposit request opened" />
                        <Step done={progress > 32} label="Source-chain vault deposit confirmed" />
                        <Step done={progress > 58} label="Backend verified deposit event" />
                        <Step done={progress === 100} label="Wrapped asset minted on Portaldot" />
                      </>
                    ) : (
                      <>
                        <Step done={progress > 10} label="Bridge request accepted" />
                        <Step done={progress > 40} label="Wrapped asset verified on Portaldot" />
                        <Step done={progress > 70} label="Mint transaction submitted" />
                        <Step done={progress === 100} label="Confirmed in local Portaldot block" />
                      </>
                    )}
                  </div>
                  {sourceTxHash && <p className="text-xs font-mono text-muted-foreground">Source tx: {shortAddress(sourceTxHash, 12, 10)}</p>}
                </div>
              )}

              {latest && !isBridging && (
                <div className="p-4 rounded-lg bg-success/5 border border-success/20 space-y-2">
                  <div className="flex items-center gap-2 text-success font-medium"><CheckCircle2 className="size-4" /> Bridge completed</div>
                  <p className="text-sm text-muted-foreground">{latest.amount} {latest.assetSymbol} was minted to {shortAddress(latest.recipient)}.</p>
                  {latest.sourceTxHash && <p className="text-xs font-mono text-muted-foreground">Source tx: {shortAddress(latest.sourceTxHash, 12, 10)}</p>}
                  <p className="text-xs font-mono text-muted-foreground">Portaldot mint tx: {shortAddress(latest.mintTxHash, 12, 10)}</p>
                </div>
              )}

              <Button className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90" size="lg" disabled={!canBridge || (mode === "real" && !sourceVaultReady)} onClick={handleBridge}>
                {isBridging && <Loader2 className="size-4 animate-spin" />}
                {!isBridging && mode === "real" && <Wallet className="size-4" />}
                {buttonLabel}
                {!isBridging && <ArrowRight className="size-4" />}
              </Button>

              {mode === "real" && !sourceVaultReady && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <Info className="size-4 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Deploy <span className="font-mono">contracts/evm/PotraBridgeVault.sol</span>, then add the vault address to <span className="font-mono">VITE_SEPOLIA_BRIDGE_VAULT</span> or <span className="font-mono">VITE_BNB_BRIDGE_VAULT</span> and the matching backend env key.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-border/50">
          <CardHeader><CardTitle>Bridge History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground">No bridge activity yet.</div>
              ) : records.map((bridge) => (
                <div key={bridge.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-xs font-semibold">{bridge.assetSymbol.slice(4, 5) || bridge.assetSymbol.slice(0, 1)}</span>
                    </div>
                    <p className="text-sm font-medium">{bridge.amount} {bridge.assetSymbol}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <span>{bridge.sourceNetwork}</span>
                    <ArrowRight className="size-3" />
                    <span>Portaldot</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1"><CheckCircle2 className="size-3 text-success" /><span className="text-xs text-success">Completed</span></div>
                    <span className="text-xs text-muted-foreground">{relativeTime(bridge.createdAt)}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {bridge.sourceTxHash && <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">Source {shortAddress(bridge.sourceTxHash, 8, 6)} <ExternalLink className="size-3" /></p>}
                    <p className="text-xs font-mono text-muted-foreground">Mint {shortAddress(bridge.mintTxHash, 8, 6)}</p>
                    <Badge variant="outline" className="text-[10px]">{bridge.mode === "evm-deposit-relay" ? "Real deposit relay" : "Authority mint"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {done ? <CheckCircle2 className="size-4 text-success" /> : <Clock className="size-4 text-muted-foreground" />}
      <span className={done ? "text-success" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
