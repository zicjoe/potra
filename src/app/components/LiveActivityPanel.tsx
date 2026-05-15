import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Droplets, Rocket } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { getLaunchedAssets } from "../blockchain/assets";
import { getLiquidityPositions } from "../blockchain/liquidity";
import { getSwapHistory } from "../blockchain/swap";
import { shortAddress } from "../config/env";

type ActivityItem = {
  type: "launch" | "liquidity" | "bridge" | "swap";
  user: string;
  action: string;
  time: string;
  icon: typeof Rocket;
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

export function LiveActivityPanel() {
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

  const activities = useMemo<ActivityItem[]>(() => {
    void tick;
    const launches = getLaunchedAssets().map((asset) => ({
      type: "launch" as const,
      user: shortAddress(asset.owner),
      action: `Launched ${asset.symbol} on Portaldot`,
      time: relativeTime(asset.launchedAt),
      icon: Rocket,
    }));

    const liquidity = getLiquidityPositions().map((position) => ({
      type: "liquidity" as const,
      user: shortAddress(position.owner),
      action: `Funded POT/${position.assetSymbol} liquidity`,
      time: relativeTime(position.createdAt),
      icon: Droplets,
    }));

    const swaps = getSwapHistory().map((swap) => ({
      type: "swap" as const,
      user: "Potra",
      action: `Swapped ${swap.inputAmount} for ${swap.outputAmount} via POT/${swap.assetSymbol}`,
      time: relativeTime(swap.createdAt),
      icon: ArrowLeftRight,
    }));

    return [...swaps, ...liquidity, ...launches].slice(0, 12);
  }, [tick]);

  return (
    <aside className="w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Live Activity</h3>
        <p className="text-xs text-muted-foreground mt-1">Local Portaldot activity from this workspace</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {activities.length === 0 ? (
            <div className="p-4 rounded-lg bg-card/80 border border-border/50 text-sm text-muted-foreground">
              Launch a token or fund liquidity to create the first recorded Potra activity.
            </div>
          ) : activities.map((activity, i) => (
            <div
              key={`${activity.type}-${i}`}
              className="p-3 rounded-lg bg-card/80 border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <activity.icon className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-mono mb-1">{activity.user}</p>
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
