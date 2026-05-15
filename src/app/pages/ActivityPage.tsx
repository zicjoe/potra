import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Droplets, Filter, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { getLaunchedAssets } from "../blockchain/assets";
import { getLiquidityPositions } from "../blockchain/liquidity";
import { getSwapHistory } from "../blockchain/swap";
import { shortAddress } from "../config/env";

type Activity = {
  type: "launch" | "liquidity" | "swap";
  icon: typeof Rocket;
  user: string;
  action: string;
  value: string;
  time: string;
  txHash: string;
};

const typeColors: Record<string, string> = {
  launch: "bg-chart-4/10 border-chart-4/20 text-chart-4",
  liquidity: "bg-success/10 border-success/20 text-success",
  swap: "bg-primary/10 border-primary/20 text-primary",
};

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

export function ActivityPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("potra:asset-launched", refresh);
    window.addEventListener("potra:liquidity-created", refresh);
    window.addEventListener("potra:liquidity-updated", refresh);
    window.addEventListener("potra:swap-executed", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("potra:asset-launched", refresh);
      window.removeEventListener("potra:liquidity-created", refresh);
      window.removeEventListener("potra:liquidity-updated", refresh);
      window.removeEventListener("potra:swap-executed", refresh);
      window.clearInterval(timer);
    };
  }, []);

  const allActivity = useMemo<Activity[]>(() => {
    void tick;
    const launches = getLaunchedAssets().map((asset) => ({
      type: "launch" as const,
      icon: Rocket,
      user: shortAddress(asset.owner),
      action: `Launched ${asset.symbol} native asset`,
      value: `Asset #${asset.assetId}`,
      time: relativeTime(asset.launchedAt),
      txHash: asset.txHashes[asset.txHashes.length - 1] || asset.txHashes[0] || "submitted",
    }));

    const liquidity = getLiquidityPositions().map((position) => ({
      type: "liquidity" as const,
      icon: Droplets,
      user: shortAddress(position.owner),
      action: `Funded POT/${position.assetSymbol} pool vault`,
      value: `${position.potAmount} POT`,
      time: relativeTime(position.createdAt),
      txHash: position.assetTxHash,
    }));

    const swaps = getSwapHistory().map((swap) => ({
      type: "swap" as const,
      icon: ArrowLeftRight,
      user: "Potra",
      action: `Settled POT/${swap.assetSymbol} swap`,
      value: `${swap.inputAmount} → ${swap.outputAmount}`,
      time: relativeTime(swap.createdAt),
      txHash: swap.outputTxHash,
    }));

    return [...swaps, ...liquidity, ...launches];
  }, [tick]);

  const launches = allActivity.filter((activity) => activity.type === "launch");
  const liquidity = allActivity.filter((activity) => activity.type === "liquidity");
  const swaps = allActivity.filter((activity) => activity.type === "swap");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Feed</h1>
          <p className="text-muted-foreground mt-1">Recorded Potra actions from your local Portaldot workspace</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="size-4" /> Filters
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Recorded Actions</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{allActivity.length}</p><p className="text-sm text-muted-foreground mt-1">Local browser registry</p></CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Token Launches</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{launches.length}</p><p className="text-sm text-muted-foreground mt-1">Assets pallet</p></CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Swap Settlements</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{swaps.length}</p><p className="text-sm text-muted-foreground mt-1">Onchain swap settlements</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Activity<Badge variant="secondary" className="ml-2">{allActivity.length}</Badge></TabsTrigger>
          <TabsTrigger value="launches">Launches<Badge variant="secondary" className="ml-2">{launches.length}</Badge></TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity<Badge variant="secondary" className="ml-2">{liquidity.length}</Badge></TabsTrigger>
          <TabsTrigger value="swaps">Swaps<Badge variant="secondary" className="ml-2">{swaps.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="all"><ActivityList activities={allActivity} /></TabsContent>
        <TabsContent value="launches"><ActivityList activities={launches} /></TabsContent>
        <TabsContent value="liquidity"><ActivityList activities={liquidity} /></TabsContent>
        <TabsContent value="swaps"><ActivityList activities={swaps} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No activity recorded yet. Launch a token or fund a liquidity pool to populate this feed.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {activities.map((activity, index) => (
              <div key={`${activity.type}-${index}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-full border flex items-center justify-center ${typeColors[activity.type]}`}>
                    <activity.icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">{activity.type}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">{activity.user}</span>
                    </div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground font-mono">{shortAddress(activity.txHash, 10, 8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{activity.value}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
