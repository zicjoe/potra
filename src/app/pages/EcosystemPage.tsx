import { Search, TrendingUp, Flame, Clock, Droplet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const trendingTokens = [
  { symbol: "MOON", name: "Moon Token", price: "$0.0537", change: "+24.5%", volume: "$42K", liquidity: "$125K", holders: "1.2K" },
  { symbol: "STAR", name: "Star Token", price: "$0.124", change: "+18.2%", volume: "$38K", liquidity: "$98K", holders: "890" },
  { symbol: "GEMS", name: "Gems Token", price: "$1.45", change: "+12.8%", volume: "$125K", liquidity: "$420K", holders: "2.4K" },
  { symbol: "NOVA", name: "Nova Protocol", price: "$2.84", change: "+8.4%", volume: "$86K", liquidity: "$280K", holders: "1.8K" },
  { symbol: "ORBIT", name: "Orbit DAO", price: "$0.89", change: "+5.6%", volume: "$64K", liquidity: "$195K", holders: "1.5K" },
];

const newTokens = [
  { symbol: "PULSE", name: "Pulse Finance", price: "$0.045", change: "+142.5%", launched: "2h ago", liquidity: "$12K" },
  { symbol: "WAVE", name: "Wave Protocol", price: "$0.082", change: "+89.2%", launched: "5h ago", liquidity: "$24K" },
  { symbol: "ECHO", name: "Echo Network", price: "$0.156", change: "+64.8%", launched: "8h ago", liquidity: "$38K" },
  { symbol: "FLUX", name: "Flux Token", price: "$0.234", change: "+45.2%", launched: "12h ago", liquidity: "$56K" },
];

const liquidityPools = [
  { pair: "POT/TESTUSDT", liquidity: "$842K", volume24h: "$124K", apr: "18.2%", fees24h: "$248" },
  { pair: "GEMS/POT", liquidity: "$420K", volume24h: "$86K", apr: "24.6%", fees24h: "$172" },
  { pair: "TESTETH/POT", liquidity: "$328K", volume24h: "$64K", apr: "21.4%", fees24h: "$128" },
  { pair: "MOON/POT", liquidity: "$125K", volume24h: "$42K", apr: "32.4%", fees24h: "$84" },
  { pair: "STAR/TESTUSDT", liquidity: "$98K", volume24h: "$38K", apr: "28.8%", fees24h: "$76" },
];

const featuredProjects = [
  {
    name: "Moon Finance",
    symbol: "MOON",
    description: "Decentralized lending protocol for Portaldot ecosystem",
    category: "DeFi",
    tvl: "$125K",
    tokens: "MOON"
  },
  {
    name: "Gems Swap",
    symbol: "GEMS",
    description: "Advanced DEX aggregator with optimal routing",
    category: "DEX",
    tvl: "$420K",
    tokens: "GEMS"
  },
  {
    name: "Nova Protocol",
    symbol: "NOVA",
    description: "Cross-chain bridge aggregator and liquidity layer",
    category: "Infrastructure",
    tvl: "$280K",
    tokens: "NOVA"
  },
];

export function EcosystemPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ecosystem</h1>
          <p className="text-muted-foreground mt-1">Explore projects building on Portaldot</p>
        </div>
        <div className="w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search tokens, projects..." className="pl-10" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">128</p>
            <p className="text-sm text-muted-foreground mt-1">+12 this week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-chart-3/10 border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal">Total TVL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$4.2M</p>
            <p className="text-sm text-success mt-1">+18.5% this week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-2/10 to-chart-3/10 border-chart-2/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal">24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$892K</p>
            <p className="text-sm text-muted-foreground mt-1">Across all pools</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-4/10 to-chart-5/10 border-chart-4/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12.4K</p>
            <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trending" className="gap-2">
            <Flame className="size-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-2">
            <Clock className="size-4" />
            New Launches
          </TabsTrigger>
          <TabsTrigger value="liquidity" className="gap-2">
            <Droplet className="size-4" />
            Liquidity Pools
          </TabsTrigger>
          <TabsTrigger value="projects">Featured Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Trending Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingTokens.map((token, index) => (
                  <div key={token.symbol} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                      <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="font-semibold">{token.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{token.symbol}</p>
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="size-3 mr-1" />
                            {token.change}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-medium">{token.price}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volume</p>
                        <p className="font-medium">{token.volume}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Liquidity</p>
                        <p className="font-medium">{token.liquidity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Holders</p>
                        <p className="font-medium">{token.holders}</p>
                      </div>
                      <Button variant="outline" size="sm">Trade</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Recently Launched</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {newTokens.map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                        <span className="font-semibold">{token.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{token.symbol}</p>
                          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                            New
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="size-3 mr-1" />
                            {token.change}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div>
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-medium">{token.price}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Liquidity</p>
                        <p className="font-medium">{token.liquidity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Launched</p>
                        <p className="font-medium">{token.launched}</p>
                      </div>
                      <Button variant="outline" size="sm">Trade</Button>
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
              <CardTitle>Top Liquidity Pools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liquidityPools.map((pool, index) => (
                  <div key={pool.pair} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                      <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-sm font-semibold">LP</span>
                      </div>
                      <div>
                        <p className="font-semibold">{pool.pair}</p>
                        <p className="text-sm text-muted-foreground">Liquidity Pool</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div>
                        <p className="text-muted-foreground">TVL</p>
                        <p className="font-medium">{pool.liquidity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">24h Volume</p>
                        <p className="font-medium">{pool.volume24h}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">APR</p>
                        <p className="font-medium text-success">{pool.apr}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">24h Fees</p>
                        <p className="font-medium">{pool.fees24h}</p>
                      </div>
                      <Button variant="outline" size="sm">Add Liquidity</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {featuredProjects.map((project) => (
              <Card key={project.symbol} className="bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="font-bold">{project.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{project.category}</Badge>
                        <span className="text-xs text-muted-foreground">{project.tokens}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Value Locked</p>
                      <p className="text-lg font-bold">{project.tvl}</p>
                    </div>
                    <Button variant="outline" size="sm">View Project</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
