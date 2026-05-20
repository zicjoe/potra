import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Copy, ExternalLink, Globe, Loader2, Rocket, Send, ShieldCheck, Twitter, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { usePortaldot } from "../providers/PortaldotProvider";
import { DEFAULT_ASSET_DECIMALS, LaunchAssetResult, getLaunchedAssets, syncLaunchedAssetsFromBackend } from "../blockchain/assets";
import { shortAddress } from "../config/env";

export function LaunchPage() {
  const { selectedAccount, status, launchAsset, isLaunchingAsset, potBalance } = usePortaldot();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [telegram, setTelegram] = useState("");
  const [withLiquidity, setWithLiquidity] = useState(true);
  const [liquidityAmount, setLiquidityAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [launchedAsset, setLaunchedAsset] = useState<LaunchAssetResult | null>(null);
  const [recentLaunches, setRecentLaunches] = useState<LaunchAssetResult[]>([]);
  const [isLaunchSubmitting, setIsLaunchSubmitting] = useState(false);
  const launchLockRef = useRef(false);

  useEffect(() => {
    setRecentLaunches(getLaunchedAssets());
    syncLaunchedAssetsFromBackend().then(() => setRecentLaunches(getLaunchedAssets())).catch(() => undefined);
    const handler = () => setRecentLaunches(getLaunchedAssets());
    window.addEventListener("potra:asset-launched", handler);
    return () => window.removeEventListener("potra:asset-launched", handler);
  }, []);

  const liquidityTokenAmount = useMemo(() => {
    const supply = Number(totalSupply || 0);
    if (!Number.isFinite(supply) || supply <= 0) return "0";
    return Math.max(supply * 0.01, 1).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [totalSupply]);

  const startingPrice = useMemo(() => {
    const pot = Number(liquidityAmount || 0);
    const supply = Number(totalSupply || 0) * 0.01;
    if (!pot || !supply) return "—";
    return (pot / supply).toFixed(8);
  }, [liquidityAmount, totalSupply]);

  const canLaunch = Boolean(
    selectedAccount &&
    status === "connected" &&
    tokenName.trim() &&
    tokenSymbol.trim() &&
    Number(totalSupply) > 0,
  );

  const launchBusy = isLaunchingAsset || isLaunchSubmitting;

  const resetForm = () => {
    setTokenName("");
    setTokenSymbol("");
    setTotalSupply("");
    setDescription("");
    setTwitter("");
    setWebsite("");
    setTelegram("");
    setLiquidityAmount("");
  };

  const handleLaunch = async () => {
    if (launchLockRef.current || launchBusy) {
      toast.message("Token launch already in progress. Wait for the wallet transaction to finish.");
      return;
    }

    if (!canLaunch) {
      toast.error(selectedAccount ? "Complete the required token fields" : "Connect your wallet first");
      return;
    }

    launchLockRef.current = true;
    setIsLaunchSubmitting(true);

    try {
      const result = await launchAsset({
        name: tokenName,
        symbol: tokenSymbol,
        totalSupply,
        description,
        website,
        twitter,
        telegram,
        decimals: DEFAULT_ASSET_DECIMALS,
      });
      setLaunchedAsset(result);
      setShowSuccessModal(true);
      setRecentLaunches(getLaunchedAssets());
      resetForm();
      toast.success(`${result.symbol} launched on Portaldot`, { description: `Asset ID ${result.assetId}` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Token launch failed");
    } finally {
      launchLockRef.current = false;
      setIsLaunchSubmitting(false);
    }
  };

  const copyAssetId = async () => {
    if (!launchedAsset) return;
    await navigator.clipboard.writeText(String(launchedAsset.assetId));
    toast.success("Asset ID copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Launch Token</h1>
          <p className="text-muted-foreground mt-1">
            Create a real Portaldot-native asset through the Assets pallet.
          </p>
        </div>
        <Badge variant="outline" className="gap-2 border-success/30 bg-success/10 text-success">
          <ShieldCheck className="size-4" /> Real onchain launch
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Token Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenName">Token Name</Label>
                  <Input
                    id="tokenName"
                    placeholder="e.g., Game Credit"
                    value={tokenName}
                    onChange={(event) => setTokenName(event.target.value)}
                    disabled={launchBusy}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenSymbol">Token Symbol</Label>
                  <Input
                    id="tokenSymbol"
                    placeholder="e.g., GAME"
                    value={tokenSymbol}
                    maxLength={12}
                    onChange={(event) => setTokenSymbol(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    disabled={launchBusy}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalSupply">Total Supply</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  min="1"
                  placeholder="1000000"
                  value={totalSupply}
                  onChange={(event) => setTotalSupply(event.target.value)}
                  disabled={launchBusy}
                />
                <p className="text-xs text-muted-foreground">
                  The supply is minted to your connected wallet after the asset is created.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this asset is used for inside the Portaldot economy..."
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={launchBusy}
                />
              </div>

              <div className="space-y-4">
                <Label>Token Logo</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Logo upload will be stored as metadata in the next metadata service pass.</p>
                  <p className="text-xs text-muted-foreground mt-1">For this onchain pass, the asset itself launches first.</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Social Links</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center"><Twitter className="size-4" /></div>
                    <Input placeholder="https://x.com/yourtoken" value={twitter} onChange={(event) => setTwitter(event.target.value)} disabled={launchBusy} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center"><Globe className="size-4" /></div>
                    <Input placeholder="https://yourtoken.com" value={website} onChange={(event) => setWebsite(event.target.value)} disabled={launchBusy} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center"><Send className="size-4" /></div>
                    <Input placeholder="https://t.me/yourtoken" value={telegram} onChange={(event) => setTelegram(event.target.value)} disabled={launchBusy} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Initial Liquidity Plan</CardTitle>
                <Switch checked={withLiquidity} onCheckedChange={setWithLiquidity} disabled={launchBusy} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                After launch, use the Liquidity page to fund a real POT pair for this asset.
              </p>
            </CardHeader>
            {withLiquidity && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>POT Amount</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={liquidityAmount}
                    onChange={(event) => setLiquidityAmount(event.target.value)}
                    disabled={launchBusy}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your current POT balance: {potBalance}. Use this as your suggested POT amount when you create the liquidity pool.
                  </p>
                </div>

                {liquidityAmount && totalSupply && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Planned Pool</span>
                      <span className="font-medium">{liquidityAmount} POT + {liquidityTokenAmount} {tokenSymbol || "TOKEN"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Starting Price</span>
                      <span>1 {tokenSymbol || "TOKEN"} ≈ {startingPrice} POT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pool status</span>
                      <span className="text-success">Ready for Liquidity page</span>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          <Button
            className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
            size="lg"
            disabled={!canLaunch || launchBusy}
            onClick={handleLaunch}
          >
            {launchBusy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            {launchBusy ? "Launching on Portaldot..." : "Launch Token"}
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
            <CardHeader>
              <CardTitle>Launch Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="size-16 rounded-xl bg-card border border-border flex items-center justify-center mx-auto">
                {tokenSymbol ? <span className="text-2xl font-bold">{tokenSymbol.slice(0, 2)}</span> : <Upload className="size-8 text-muted-foreground" />}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold">{tokenName || "Token Name"}</h3>
                <p className="text-sm text-muted-foreground">{tokenSymbol || "SYMBOL"}</p>
              </div>

              <div className="p-3 rounded-lg bg-card/50 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Total Supply</span><span className="font-medium">{totalSupply ? Number(totalSupply).toLocaleString() : "—"}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Network</span><span className="font-medium">Portaldot Local</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Wallet</span><span className="font-medium">{selectedAccount ? shortAddress(selectedAccount.address) : "Not connected"}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Pallet</span><span className="font-medium">Assets</span></div>
              </div>

              <div className="p-3 rounded-lg border border-border/50 bg-muted/20 text-xs text-muted-foreground leading-relaxed">
                Potra creates the asset, records its metadata, and mints the supply to your wallet.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Recent Onchain Launches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLaunches.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/20 text-sm text-muted-foreground">
                  No token launches recorded on this browser yet.
                </div>
              ) : recentLaunches.slice(0, 5).map((launch) => (
                <div key={launch.assetId} className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{launch.symbol}</p>
                      <p className="text-xs text-muted-foreground">{launch.name}</p>
                    </div>
                    <Badge variant="outline">#{launch.assetId}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Supply: {Number(launch.totalSupply).toLocaleString()}</span>
                    <span>Owner: {shortAddress(launch.owner)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              Token launched on Portaldot
            </DialogTitle>
          </DialogHeader>

          {launchedAsset && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{launchedAsset.symbol} is live</h3>
                <p className="text-muted-foreground">
                  Asset #{launchedAsset.assetId} was created, configured, and minted on Portaldot.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{launchedAsset.name}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Symbol</span><span className="font-medium">{launchedAsset.symbol}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Asset ID</span><span className="font-mono text-xs">{launchedAsset.assetId}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Owner</span><span className="font-mono text-xs">{shortAddress(launchedAsset.owner)}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Tx count</span><span>{launchedAsset.txHashes.length}</span></div>
              </div>

              <div className="space-y-2">
                {launchedAsset.txHashes.map((hash, index) => (
                  <div key={`${hash}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-card/70 border border-border/50 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">Tx {index + 1}</span>
                    <span className="font-mono truncate">{hash}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2" onClick={copyAssetId}>
                  <Copy className="size-4" /> Copy Asset ID
                </Button>
                <Button asChild className="gap-2 bg-gradient-to-r from-primary to-chart-2">
                  <Link to="/app/liquidity"><ExternalLink className="size-4" /> Create Liquidity</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
