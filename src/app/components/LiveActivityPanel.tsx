import { ArrowLeftRight, GitBranch, Rocket, TrendingUp } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

const activities = [
  { type: "swap", user: "0x742d...9a3f", action: "Swapped 50 POT for 12.5 TESTUSDT", time: "2m ago", icon: ArrowLeftRight },
  { type: "launch", user: "0x8b5c...3e2a", action: "Launched $MOON token", time: "5m ago", icon: Rocket },
  { type: "bridge", user: "0x3a1b...7c4d", action: "Bridged 100 USDT from Sepolia", time: "8m ago", icon: GitBranch },
  { type: "swap", user: "0x9e2f...1d5b", action: "Swapped 200 POT for 0.05 ETH", time: "12m ago", icon: ArrowLeftRight },
  { type: "liquidity", user: "0x4d7a...8f9c", action: "Added liquidity to POT/USDT", time: "15m ago", icon: TrendingUp },
  { type: "launch", user: "0x6c3e...2b1a", action: "Launched $STAR token", time: "18m ago", icon: Rocket },
  { type: "swap", user: "0x1f8d...4a9e", action: "Swapped 25 TESTUSDT for 100 POT", time: "22m ago", icon: ArrowLeftRight },
  { type: "bridge", user: "0x5b2c...3d7f", action: "Bridged 50 POT to BNB Testnet", time: "25m ago", icon: GitBranch },
];

export function LiveActivityPanel() {
  return (
    <aside className="w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Live Activity</h3>
        <p className="text-xs text-muted-foreground mt-1">Real-time ecosystem events</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {activities.map((activity, i) => (
            <div
              key={i}
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
