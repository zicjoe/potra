import { useEffect, useState } from "react";
import { ExternalLink, Rocket, Droplets, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { usePortaldot } from "../providers/PortaldotProvider";
import { getLaunchedAssets, LaunchAssetResult } from "../blockchain/assets";
import { getLiquidityPositions, LiquidityPosition } from "../blockchain/liquidity";
import { shortAddress } from "../config/env";

export function PortfolioPage() {
  const { selectedAccount, potBalance } = usePortaldot();
  const [assets, setAssets] = useState<LaunchAssetResult[]>([]);
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);

  useEffect(() => {
    const refresh = () => {
      setAssets(getLaunchedAssets());
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground mt-1">Track wallet balance, launched assets, and funded liquidity positions</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Wallet</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold font-mono">{selectedAccount ? shortAddress(selectedAccount.address, 8, 6) : "Not connected"}</p><p className="text-sm text-muted-foreground mt-2">Active account</p></CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">POT Balance</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{potBalance}</p><p className="text-sm text-muted-foreground mt-2">Native balance</p></CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Created Assets</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{assets.length}</p><p className="text-sm text-muted-foreground mt-2">Assets pallet</p></CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">LP Positions</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{positions.length}</p><p className="text-sm text-muted-foreground mt-2">Onchain vaults</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="holdings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity Pools</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader><CardTitle>Token Holdings</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4"><div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><Wallet className="size-5 text-primary" /></div><div><p className="font-semibold">POT</p><p className="text-sm text-muted-foreground">Portaldot native token</p></div></div>
                  <div className="text-right"><p className="font-semibold">{potBalance}</p><p className="text-sm text-muted-foreground">Native balance</p></div>
                </div>
                {assets.map((asset) => (
                  <div key={asset.assetId} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4"><div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><span className="font-semibold">{asset.symbol.slice(0, 2)}</span></div><div><div className="flex items-center gap-2"><p className="font-semibold">{asset.symbol}</p><Badge variant="outline">#{asset.assetId}</Badge></div><p className="text-sm text-muted-foreground">{asset.name}</p></div></div>
                    <div className="text-right"><p className="font-semibold">{Number(asset.totalSupply).toLocaleString()}</p><p className="text-sm text-muted-foreground">Minted supply</p></div>
                  </div>
                ))}
                {assets.length === 0 && <div className="p-6 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground">No launched assets recorded yet.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader><CardTitle>Your Liquidity Positions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {positions.length === 0 ? <div className="p-6 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground">No liquidity positions recorded yet.</div> : positions.map((position) => (
                  <div key={position.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3"><div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><Droplets className="size-5 text-primary" /></div><div><p className="font-semibold">POT / {position.assetSymbol}</p><p className="text-sm text-muted-foreground">Vault {shortAddress(position.poolAddress)}</p></div></div>
                      <Badge variant="outline" className="text-success border-success/30">Funded</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50 text-sm">
                      <div><p className="text-xs text-muted-foreground">POT</p><p className="font-medium">{position.potAmount}</p></div>
                      <div><p className="text-xs text-muted-foreground">{position.assetSymbol}</p><p className="font-medium">{position.assetAmount}</p></div>
                      <div className="text-right"><Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(position.poolAddress)}>Copy vault</Button></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div key={`asset-${asset.assetId}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3"><div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><Rocket className="size-4 text-primary" /></div><div><p className="font-medium">Token Launch</p><p className="text-sm text-muted-foreground">Created {asset.symbol}</p></div></div>
                    <div className="text-right flex items-center gap-4"><div><p className="font-medium">Asset #{asset.assetId}</p><p className="text-sm text-muted-foreground">{new Date(asset.launchedAt).toLocaleString()}</p></div><Button variant="ghost" size="icon"><ExternalLink className="size-4" /></Button></div>
                  </div>
                ))}
                {positions.map((position) => (
                  <div key={`lp-${position.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3"><div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><Droplets className="size-4 text-primary" /></div><div><p className="font-medium">Liquidity Funding</p><p className="text-sm text-muted-foreground">POT/{position.assetSymbol}</p></div></div>
                    <div className="text-right flex items-center gap-4"><div><p className="font-medium">{position.potAmount} POT</p><p className="text-sm text-muted-foreground">{new Date(position.createdAt).toLocaleString()}</p></div><Button variant="ghost" size="icon"><ExternalLink className="size-4" /></Button></div>
                  </div>
                ))}
                {assets.length === 0 && positions.length === 0 && <div className="p-6 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground">No transactions recorded yet.</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
