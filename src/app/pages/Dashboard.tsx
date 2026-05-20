import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeftRight, ArrowRight, Droplets, GitBranch, Rocket, Wallet } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { usePortaldot } from "../providers/PortaldotProvider";
import { getLaunchedAssets, LaunchAssetResult } from "../blockchain/assets";
import { getLiquidityPositions, LiquidityPosition } from "../blockchain/liquidity";
import { potraConfig, shortAddress } from "../config/env";

export function Dashboard() {
  const { selectedAccount, potBalance, status } = usePortaldot();
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

  const stats = [
    { label: "POT Balance", value: potBalance, helper: selectedAccount ? "Connected wallet" : "Connect wallet" },
    { label: "Launched Assets", value: String(assets.length), helper: "Portaldot native assets" },
    { label: "Funded Pools", value: String(positions.length), helper: "Onchain pool vaults" },
    { label: "RPC Status", value: status === "connected" ? "Online" : "Offline", helper: potraConfig.chainEnv === "hosted" ? "Hosted RPC" : "Local RPC" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your Portaldot workspace inside Potra</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app/swap">
            <Button variant="outline" className="gap-2"><ArrowLeftRight className="size-4" /> Swap</Button>
          </Link>
          <Link to="/app/liquidity">
            <Button variant="outline" className="gap-2"><Droplets className="size-4" /> Liquidity</Button>
          </Link>
          <Link to="/app/launch">
            <Button className="gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"><Rocket className="size-4" /> Launch Token</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-2">{stat.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Onchain Assets</CardTitle>
            <Link to="/app/launch"><Button variant="ghost" size="sm" className="gap-1">Launch<ArrowRight className="size-4" /></Button></Link>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="p-6 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground">
                No assets launched yet. Create your first Portaldot-native token to activate the ecosystem flow.
              </div>
            ) : (
              <div className="space-y-3">
                {assets.slice(0, 5).map((asset) => (
                  <div key={asset.assetId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><span className="font-semibold text-sm">{asset.symbol.slice(0, 2)}</span></div>
                      <div>
                        <p className="font-medium">{asset.symbol}</p>
                        <p className="text-sm text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">Asset #{asset.assetId}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Owner {shortAddress(asset.owner)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Execution Path</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"><Wallet className="size-4 text-primary" /> Connect wallet</div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"><Rocket className="size-4 text-primary" /> Launch native asset</div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"><Droplets className="size-4 text-primary" /> Fund liquidity vault</div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"><GitBranch className="size-4 text-primary" /> Prepare bridge gateway</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Funded Liquidity Pools</CardTitle>
          <Link to="/app/liquidity"><Button variant="ghost" size="sm" className="gap-1">Manage<ArrowRight className="size-4" /></Button></Link>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="p-6 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground">
              No pool vaults funded yet. Add liquidity after launching an asset.
            </div>
          ) : (
            <div className="space-y-3">
              {positions.slice(0, 5).map((position) => (
                <div key={position.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><Droplets className="size-4 text-primary" /></div>
                    <div>
                      <p className="font-medium">POT / {position.assetSymbol}</p>
                      <p className="text-sm text-muted-foreground">Vault {shortAddress(position.poolAddress)}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p>{position.potAmount} POT</p>
                    <p className="text-muted-foreground">{position.assetAmount} {position.assetSymbol}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
