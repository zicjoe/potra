import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const portfolioData = [
  { date: "May 1", value: 18500 },
  { date: "May 3", value: 19200 },
  { date: "May 5", value: 20100 },
  { date: "May 7", value: 19800 },
  { date: "May 9", value: 21500 },
  { date: "May 11", value: 23200 },
  { date: "May 13", value: 24582 },
];

const holdings = [
  { symbol: "POT", name: "Portaldot", amount: "1,250.00", value: "$12,500.00", allocation: "50.8%", change: "+8.2%", trend: "up" },
  { symbol: "TESTUSDT", name: "Test USDT", amount: "5,420.50", value: "$5,420.50", allocation: "22.0%", change: "+0.1%", trend: "up" },
  { symbol: "TESTETH", name: "Test ETH", amount: "2.45", value: "$6,125.00", allocation: "24.9%", change: "+3.4%", trend: "up" },
  { symbol: "MOON", name: "Moon Token", amount: "10,000", value: "$537.00", allocation: "2.2%", change: "+24.5%", trend: "up" },
];

const lpPositions = [
  { pair: "POT/TESTUSDT", liquidity: "$8,420.00", share: "2.4%", fees24h: "+$42.50", apr: "18.2%" },
  { pair: "TESTETH/POT", liquidity: "$4,200.00", share: "1.8%", fees24h: "+$28.40", apr: "24.6%" },
  { pair: "MOON/POT", liquidity: "$1,800.00", share: "12.5%", fees24h: "+$15.20", apr: "32.4%" },
];

const transactions = [
  { type: "Swap", details: "50 POT → 12.5 TESTUSDT", value: "+$12.50", time: "2h ago", status: "success" },
  { type: "Add Liquidity", details: "POT/TESTUSDT Pool", value: "$8,420.00", time: "1d ago", status: "success" },
  { type: "Bridge", details: "100 USDT from Sepolia", value: "$100.00", time: "1d ago", status: "success" },
  { type: "Swap", details: "100 TESTUSDT → 400 POT", value: "+$400.00", time: "2d ago", status: "success" },
  { type: "Launch", details: "Created MOON token", value: "—", time: "3d ago", status: "success" },
  { type: "Swap", details: "0.5 TESTETH → 200 POT", value: "+$200.00", time: "3d ago", status: "success" },
];

export function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground mt-1">Track your holdings and performance</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$24,582.45</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="size-4 text-success" />
              <span className="text-sm text-success">+12.5% ($2,745.00)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">24h Change</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">+$1,245.00</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="size-4 text-success" />
              <span className="text-sm text-success">+5.3%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4</p>
            <p className="text-sm text-muted-foreground mt-2">Tokens</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">LP Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3</p>
            <p className="text-sm text-muted-foreground mt-2">$14,420.00 TVL</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={portfolioData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a24",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  borderRadius: "8px",
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="holdings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity Pools</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Token Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {holdings.map((holding) => (
                  <div key={holding.symbol} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="font-semibold">{holding.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{holding.symbol}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {holding.allocation}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{holding.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{holding.value}</p>
                      <div className="flex items-center justify-end gap-2">
                        <p className="text-sm text-muted-foreground">{holding.amount}</p>
                        <span className="text-sm text-success">{holding.change}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Your Liquidity Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lpPositions.map((position) => (
                  <div key={position.pair} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-sm font-semibold">LP</span>
                        </div>
                        <div>
                          <p className="font-semibold">{position.pair}</p>
                          <p className="text-sm text-muted-foreground">Pool Share: {position.share}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold">{position.liquidity}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground">24h Fees Earned</p>
                        <p className="text-sm font-medium text-success">{position.fees24h}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">APR</p>
                        <p className="text-sm font-medium text-success">{position.apr}</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <div className="size-2 rounded-full bg-success" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">{tx.details}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-medium">{tx.value}</p>
                        <p className="text-sm text-muted-foreground">{tx.time}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="size-4" />
                      </Button>
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
