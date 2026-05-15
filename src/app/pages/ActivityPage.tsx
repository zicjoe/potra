import { ArrowLeftRight, GitBranch, Rocket, Droplet, ExternalLink, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const allActivity = [
  {
    type: "swap",
    icon: ArrowLeftRight,
    user: "0x742d...9a3f",
    action: "Swapped 50 POT for 12.5 TESTUSDT",
    value: "$12.50",
    time: "2m ago",
    txHash: "0x8a3f...d1c9"
  },
  {
    type: "launch",
    icon: Rocket,
    user: "0x8b5c...3e2a",
    action: "Launched PULSE token with $12K liquidity",
    value: "—",
    time: "5m ago",
    txHash: "0x4b2e...9a7c"
  },
  {
    type: "bridge",
    icon: GitBranch,
    user: "0x3a1b...7c4d",
    action: "Bridged 100 USDT from Ethereum Sepolia",
    value: "$100.00",
    time: "8m ago",
    txHash: "0x7d9a...3f2b"
  },
  {
    type: "liquidity",
    icon: Droplet,
    user: "0x4d7a...8f9c",
    action: "Added liquidity to POT/TESTUSDT pool",
    value: "$8,420.00",
    time: "12m ago",
    txHash: "0x2c8e...6b4a"
  },
  {
    type: "swap",
    icon: ArrowLeftRight,
    user: "0x9e2f...1d5b",
    action: "Swapped 200 POT for 0.05 TESTETH",
    value: "$125.00",
    time: "15m ago",
    txHash: "0x5a1c...8d3f"
  },
  {
    type: "launch",
    icon: Rocket,
    user: "0x6c3e...2b1a",
    action: "Launched WAVE token with $24K liquidity",
    value: "—",
    time: "18m ago",
    txHash: "0x9f7b...2e5d"
  },
  {
    type: "swap",
    icon: ArrowLeftRight,
    user: "0x1f8d...4a9e",
    action: "Swapped 25 TESTUSDT for 100 POT",
    value: "$25.00",
    time: "22m ago",
    txHash: "0x3d6a...7c1b"
  },
  {
    type: "bridge",
    icon: GitBranch,
    user: "0x5b2c...3d7f",
    action: "Bridged 50 POT to BNB Testnet",
    value: "$500.00",
    time: "25m ago",
    txHash: "0x8e4d...9a2c"
  },
  {
    type: "liquidity",
    icon: Droplet,
    user: "0x7a3f...5c9d",
    action: "Removed liquidity from GEMS/POT pool",
    value: "$4,200.00",
    time: "28m ago",
    txHash: "0x1b5e...4f8a"
  },
  {
    type: "swap",
    icon: ArrowLeftRight,
    user: "0x2d9b...6e1a",
    action: "Swapped 0.1 TESTETH for 500 MOON",
    value: "$250.00",
    time: "32m ago",
    txHash: "0x6c2d...3a7f"
  },
];

const typeColors: Record<string, string> = {
  swap: "bg-primary/10 border-primary/20 text-primary",
  launch: "bg-chart-4/10 border-chart-4/20 text-chart-4",
  bridge: "bg-chart-2/10 border-chart-2/20 text-chart-2",
  liquidity: "bg-success/10 border-success/20 text-success",
};

export function ActivityPage() {
  const swaps = allActivity.filter(a => a.type === "swap");
  const launches = allActivity.filter(a => a.type === "launch");
  const bridges = allActivity.filter(a => a.type === "bridge");
  const liquidity = allActivity.filter(a => a.type === "liquidity");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Feed</h1>
          <p className="text-muted-foreground mt-1">Real-time ecosystem transactions</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="size-4" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">128,492</p>
            <p className="text-sm text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">24h Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">2,847</p>
            <p className="text-sm text-success mt-1">+12.5% vs yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$892K</p>
            <p className="text-sm text-success mt-1">+8.3% vs yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">432</p>
            <p className="text-sm text-muted-foreground mt-1">Users online</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Activity
            <Badge variant="secondary" className="ml-2">{allActivity.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="swaps">
            Swaps
            <Badge variant="secondary" className="ml-2">{swaps.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="launches">
            Launches
            <Badge variant="secondary" className="ml-2">{launches.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bridges">
            Bridges
            <Badge variant="secondary" className="ml-2">{bridges.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="liquidity">
            Liquidity
            <Badge variant="secondary" className="ml-2">{liquidity.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ActivityList activities={allActivity} />
        </TabsContent>

        <TabsContent value="swaps">
          <ActivityList activities={swaps} />
        </TabsContent>

        <TabsContent value="launches">
          <ActivityList activities={launches} />
        </TabsContent>

        <TabsContent value="bridges">
          <ActivityList activities={bridges} />
        </TabsContent>

        <TabsContent value="liquidity">
          <ActivityList activities={liquidity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityList({ activities }: { activities: typeof allActivity }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {activities.map((activity, i) => (
            <div
              key={i}
              className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`size-12 rounded-full border flex items-center justify-center ${typeColors[activity.type]}`}>
                  <activity.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {activity.type}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">{activity.user}</span>
                  </div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <span className="font-mono">{activity.txHash}</span>
                      <ExternalLink className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{activity.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
