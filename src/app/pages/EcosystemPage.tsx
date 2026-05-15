import { useEffect, useState } from "react";
import { Clock, Droplet, Search, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { getLaunchedAssets, LaunchAssetResult } from "../blockchain/assets";
import { getLiquidityPositions, LiquidityPosition } from "../blockchain/liquidity";
import { shortAddress } from "../config/env";

export function EcosystemPage() {
  const [assets, setAssets] = useState<LaunchAssetResult[]>([]);
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [query, setQuery] = useState("");

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

  const filteredAssets = assets.filter((asset) => `${asset.name} ${asset.symbol} ${asset.assetId}`.toLowerCase().includes(query.toLowerCase()));
  const filteredPools = positions.filter((pool) => `${pool.assetSymbol} ${pool.assetId}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ecosystem</h1>
          <p className="text-muted-foreground mt-1">Discover assets and liquidity created through Potra</p>
        </div>
        <div className="w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search assets or pools..." className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal">Launched Assets</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{assets.length}</p><p className="text-sm text-muted-foreground mt-1">Assets pallet</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/10 to-chart-3/10 border-success/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal">Funded Pools</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{positions.length}</p><p className="text-sm text-muted-foreground mt-1">Pool vaults</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-2/10 to-chart-3/10 border-chart-2/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal">Native Pair</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">POT</p><p className="text-sm text-muted-foreground mt-1">Base asset</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-chart-4/10 to-chart-5/10 border-chart-4/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal">Environment</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">Local</p><p className="text-sm text-muted-foreground mt-1">Portaldot node</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assets" className="gap-2"><Clock className="size-4" /> New Assets</TabsTrigger>
          <TabsTrigger value="liquidity" className="gap-2"><Droplet className="size-4" /> Liquidity Pools</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader><CardTitle>Portaldot-Native Assets</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAssets.length === 0 ? <div className="p-6 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground">No assets found. Launch one from the Launch page.</div> : filteredAssets.map((asset) => (
                  <div key={asset.assetId} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><span className="font-semibold">{asset.symbol.slice(0, 2)}</span></div>
                      <div><div className="flex items-center gap-2"><p className="font-semibold">{asset.symbol}</p><Badge variant="outline">Asset #{asset.assetId}</Badge></div><p className="text-sm text-muted-foreground">{asset.name}</p></div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div><p className="text-muted-foreground">Supply</p><p className="font-medium">{Number(asset.totalSupply).toLocaleString()}</p></div>
                      <div><p className="text-muted-foreground">Owner</p><p className="font-medium font-mono">{shortAddress(asset.owner)}</p></div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader><CardTitle>Funded Liquidity Pools</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPools.length === 0 ? <div className="p-6 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground">No pools found. Fund a pool from the Liquidity page.</div> : filteredPools.map((pool, index) => (
                  <div key={pool.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                      <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><span className="text-sm font-semibold">LP</span></div>
                      <div><p className="font-semibold">POT / {pool.assetSymbol}</p><p className="text-sm text-muted-foreground">Vault {shortAddress(pool.poolAddress)}</p></div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div><p className="text-muted-foreground">POT</p><p className="font-medium">{pool.potAmount}</p></div>
                      <div><p className="text-muted-foreground">{pool.assetSymbol}</p><p className="font-medium">{pool.assetAmount}</p></div>
                      <div><p className="text-muted-foreground">Status</p><p className="font-medium text-success">Funded</p></div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
