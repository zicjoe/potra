import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Droplets, ExternalLink, Info, Loader2, Plus, ShieldCheck, Wallet } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { usePortaldot } from "../providers/PortaldotProvider";
import { getLaunchedAssets, LaunchAssetResult } from "../blockchain/assets";
import { buildPoolAddress, getLiquidityPositions, LiquidityPosition } from "../blockchain/liquidity";
import { shortAddress } from "../config/env";

function AssetDropdown({
  value,
  assets,
  onChange,
}: {
  value?: LaunchAssetResult;
  assets: LaunchAssetResult[];
  onChange: (asset: LaunchAssetResult) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-40 justify-between">
          <span>{value ? value.symbol : "Select asset"}</span>
          <Droplets className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {assets.map((asset) => (
          <DropdownMenuItem key={asset.assetId} onClick={() => onChange(asset)}>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold">{asset.symbol.slice(0, 2)}</span>
              </div>
              <div>
                <p className="font-medium">{asset.symbol}</p>
                <p className="text-xs text-muted-foreground">Asset #{asset.assetId}</p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LiquidityPage() {
  const { selectedAccount, potBalance, status, createLiquidity, isCreatingLiquidity } = usePortaldot();
  const [assets, setAssets] = useState<LaunchAssetResult[]>([]);
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<LaunchAssetResult>();
  const [potAmount, setPotAmount] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [latestPosition, setLatestPosition] = useState<LiquidityPosition | null>(null);

  useEffect(() => {
    const refresh = () => {
      const nextAssets = getLaunchedAssets();
      setAssets(nextAssets);
      setSelectedAsset((current) => current || nextAssets[0]);
      setPositions(getLiquidityPositions());
    };

    refresh();
    window.addEventListener("potra:asset-launched", refresh);
    window.addEventListener("potra:liquidity-created", refresh);
    return () => {
      window.removeEventListener("potra:asset-launched", refresh);
      window.removeEventListener("potra:liquidity-created", refresh);
    };
  }, []);

  const poolAddress = selectedAsset ? buildPoolAddress(selectedAsset.assetId) : "";

  const startingPrice = useMemo(() => {
    const pot = Number(potAmount || 0);
    const asset = Number(assetAmount || 0);
    if (!pot || !asset) return "—";
    return (pot / asset).toFixed(8);
  }, [potAmount, assetAmount]);

  const canSubmit = Boolean(
    selectedAccount &&
    status === "connected" &&
    selectedAsset &&
    Number(potAmount) > 0 &&
    Number(assetAmount) > 0 &&
    !isCreatingLiquidity,
  );

  const buttonLabel = !selectedAccount
    ? "Connect wallet to continue"
    : status !== "connected"
      ? "Start Portaldot local node"
      : !selectedAsset
        ? "Launch a token first"
        : isCreatingLiquidity
          ? "Creating onchain pool..."
          : "Create onchain liquidity pool";

  const handleCreateLiquidity = async () => {
    if (!selectedAsset) {
      toast.error("Launch or select a token before creating liquidity");
      return;
    }

    try {
      const result = await createLiquidity({
        asset: selectedAsset,
        potAmount,
        assetAmount,
      });
      setLatestPosition(result);
      setPositions(getLiquidityPositions());
      setSuccessOpen(true);
      setPotAmount("");
      setAssetAmount("");
      toast.success(`${result.assetSymbol}/POT pool funded onchain`, {
        description: shortAddress(result.poolAddress),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Liquidity creation failed");
    }
  };

  const copyPoolAddress = async () => {
    if (!latestPosition?.poolAddress) return;
    await navigator.clipboard.writeText(latestPosition.poolAddress);
    toast.success("Pool vault address copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Liquidity</h1>
          <p className="text-muted-foreground mt-1">
            Fund real Portaldot pool vaults with POT and your launched assets.
          </p>
        </div>
        <Badge variant="outline" className="gap-2 border-success/30 bg-success/10 text-success">
          <ShieldCheck className="size-4" /> Real onchain deposits
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Create Liquidity Pool</CardTitle>
            <p className="text-sm text-muted-foreground">
              Potra creates a deterministic pool vault and funds it with two signed transactions: one POT deposit and one asset deposit.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {assets.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-center">
                <Droplets className="size-10 mx-auto text-primary mb-3" />
                <h3 className="text-lg font-semibold">Launch an asset before creating liquidity</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Liquidity pools are created against Portaldot-native assets launched through Potra.
                </p>
                <Button asChild className="mt-5 bg-gradient-to-r from-primary to-chart-2">
                  <Link to="/app/launch">Launch Token</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>POT side</Label>
                    <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <Button variant="outline" className="gap-2 min-w-32 justify-between" disabled>
                          <span>POT</span>
                          <Wallet className="size-4 opacity-60" />
                        </Button>
                        <span className="text-xs text-muted-foreground">Balance: {potBalance}</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="100"
                        value={potAmount}
                        onChange={(event) => setPotAmount(event.target.value)}
                        disabled={isCreatingLiquidity}
                        className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Asset side</Label>
                    <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <AssetDropdown value={selectedAsset} assets={assets} onChange={setSelectedAsset} />
                        <span className="text-xs text-muted-foreground">Portaldot asset</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="10000"
                        value={assetAmount}
                        onChange={(event) => setAssetAmount(event.target.value)}
                        disabled={isCreatingLiquidity}
                        className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="size-4 text-info" />
                    Onchain pool preview
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Pair</p>
                      <p className="font-medium">POT / {selectedAsset?.symbol}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Starting price</p>
                      <p className="font-medium">1 {selectedAsset?.symbol} = {startingPrice} POT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pool vault</p>
                      <p className="font-medium font-mono">{shortAddress(poolAddress)}</p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
                  size="lg"
                  disabled={!canSubmit}
                  onClick={handleCreateLiquidity}
                >
                  {isCreatingLiquidity ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {buttonLabel}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
            <CardHeader>
              <CardTitle>Pool Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet</span>
                <span className={selectedAccount ? "text-success" : "text-warning"}>{selectedAccount ? "Connected" : "Required"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RPC</span>
                <span className={status === "connected" ? "text-success" : "text-warning"}>{status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assets available</span>
                <span className={assets.length ? "text-success" : "text-warning"}>{assets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit mode</span>
                <span className="text-success">Onchain vault</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold">1</div>
                <p>Select a launched Portaldot-native asset.</p>
              </div>
              <div className="flex gap-3">
                <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold">2</div>
                <p>Deposit POT and the asset into a deterministic pool vault.</p>
              </div>
              <div className="flex gap-3">
                <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold">3</div>
                <p>Potra records the funded pool for the swap contract integration phase.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Your Onchain Liquidity Pools</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="p-6 rounded-xl bg-muted/20 border border-border/50 text-center text-sm text-muted-foreground">
              No liquidity pools created from this browser yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50">
              <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
                <span>Pair</span>
                <span>POT</span>
                <span>Asset</span>
                <span>Vault</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              {positions.map((position) => (
                <div key={position.id} className="grid grid-cols-6 gap-4 px-4 py-4 border-t border-border/50 items-center text-sm">
                  <span className="font-medium">POT / {position.assetSymbol}</span>
                  <span>{position.potAmount}</span>
                  <span>{position.assetAmount} {position.assetSymbol}</span>
                  <span className="font-mono text-muted-foreground">{shortAddress(position.poolAddress)}</span>
                  <span className="text-success">Funded</span>
                  <div className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(position.poolAddress).then(() => toast.success("Pool vault copied"))}>
                      Copy vault
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              Liquidity funded on Portaldot
            </DialogTitle>
          </DialogHeader>

          {latestPosition && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">POT/{latestPosition.assetSymbol} pool created</h3>
                <p className="text-muted-foreground">
                  The pool vault received real POT and {latestPosition.assetSymbol} deposits on the local Portaldot chain.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Pool vault</span>
                  <span className="font-mono text-right">{shortAddress(latestPosition.poolAddress, 8, 8)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">POT deposit</span>
                  <span>{latestPosition.potAmount} POT</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Asset deposit</span>
                  <span>{latestPosition.assetAmount} {latestPosition.assetSymbol}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">POT tx</span>
                  <span className="font-mono text-xs text-right">{shortAddress(latestPosition.potTxHash, 10, 8)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Asset tx</span>
                  <span className="font-mono text-xs text-right">{shortAddress(latestPosition.assetTxHash, 10, 8)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2" onClick={copyPoolAddress}>
                  <Copy className="size-4" /> Copy vault
                </Button>
                <Button asChild className="gap-2 bg-gradient-to-r from-primary to-chart-2">
                  <Link to="/app/swap"><ExternalLink className="size-4" /> Open Swap</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
