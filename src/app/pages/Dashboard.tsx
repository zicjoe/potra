import { Link } from "react-router";
import { TrendingUp, TrendingDown, ArrowRight, Rocket, GitBranch, ArrowLeftRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const portfolioStats = [
  { label: "Total Balance", value: "$24,582.45", change: "+12.5%", trend: "up" },
  { label: "24h P&L", value: "+$1,245.00", change: "+5.3%", trend: "up" },
  { label: "POT Balance", value: "1,250.00", change: "-2.1%", trend: "down" },
  { label: "LP Positions", value: "3 Active", change: "$8,420 TVL", trend: "neutral" },
];

const holdings = [
  { symbol: "POT", name: "Portaldot", amount: "1,250.00", value: "$12,500.00", change: "+8.2%" },
  { symbol: "TESTUSDT", name: "Test USDT", amount: "5,420.50", value: "$5,420.50", change: "+0.1%" },
  { symbol: "TESTETH", name: "Test ETH", amount: "2.45", value: "$6,125.00", change: "+3.4%" },
  { symbol: "MOON", name: "Moon Token", amount: "10,000", value: "$537.00", change: "+24.5%" },
];

const recentSwaps = [
  { from: "POT", fromAmount: "50", to: "TESTUSDT", toAmount: "12.5", time: "2h ago" },
  { from: "TESTUSDT", fromAmount: "100", to: "POT", toAmount: "400", time: "1d ago" },
  { from: "TESTETH", fromAmount: "0.5", to: "POT", toAmount: "200", time: "2d ago" },
];

const trendingTokens = [
  { symbol: "MOON", name: "Moon Token", price: "$0.0537", change: "+24.5%", volume: "$42K" },
  { symbol: "STAR", name: "Star Token", price: "$0.124", change: "+18.2%", volume: "$38K" },
  { symbol: "GEMS", name: "Gems Token", price: "$1.45", change: "+12.8%", volume: "$125K" },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back to Potra</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app/swap">
            <Button variant="outline" className="gap-2">
              <ArrowLeftRight className="size-4" />
              Swap
            </Button>
          </Link>
          <Link to="/app/bridge">
            <Button variant="outline" className="gap-2">
              <GitBranch className="size-4" />
              Bridge
            </Button>
          </Link>
          <Link to="/app/launch">
            <Button className="gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90">
              <Rocket className="size-4" />
              Launch Token
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {portfolioStats.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {stat.trend === "up" && <TrendingUp className="size-4 text-success" />}
                {stat.trend === "down" && <TrendingDown className="size-4 text-destructive" />}
                <span className={`text-sm ${stat.trend === "up" ? "text-success" : stat.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Token Holdings</CardTitle>
            <Link to="/app/portfolio">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {holdings.map((holding) => (
                <div key={holding.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="font-semibold text-sm">{holding.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{holding.symbol}</p>
                      <p className="text-sm text-muted-foreground">{holding.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{holding.value}</p>
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-sm text-muted-foreground">{holding.amount}</p>
                      <span className="text-sm text-success">{holding.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Trending Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendingTokens.map((token) => (
                <div key={token.symbol} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold">{token.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{token.symbol}</p>
                        <p className="text-xs text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <span className="text-sm text-success">{token.change}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{token.price}</span>
                    <span>Vol {token.volume}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Swaps</CardTitle>
          <Link to="/app/activity">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSwaps.map((swap, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <ArrowLeftRight className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Swap {swap.fromAmount} {swap.from} for {swap.toAmount} {swap.to}
                    </p>
                    <p className="text-sm text-muted-foreground">{swap.time}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
