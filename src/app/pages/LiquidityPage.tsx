import { useMemo, useState } from "react";
import { ArrowRight, Droplets, Info, Plus, Search, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { usePortaldot } from "../providers/PortaldotProvider";
import { hasDexContracts } from "../config/env";

const tokens = [
  { symbol: "POT", name: "Portaldot", balance: "0" },
  { symbol: "TESTUSDT", name: "Test USDT", balance: "0" },
  { symbol: "TESTETH", name: "Test ETH", balance: "0" },
  { symbol: "TESTBNB", name: "Test BNB", balance: "0" },
];

const pools = [
  { pair: "POT / TESTUSDT", tvl: "12,450 POT", volume: "2,140 POT", apr: "Ready", share: "0%" },
  { pair: "POT / TESTETH", tvl: "7,820 POT", volume: "1,022 POT", apr: "Ready", share: "0%" },
  { pair: "POT / TESTBNB", tvl: "5,610 POT", volume: "812 POT", apr: "Ready", share: "0%" },
];

function TokenDropdown({ value, onChange }: { value: typeof tokens[number]; onChange: (token: typeof tokens[number]) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-36 justify-between">
          <span>{value.symbol}</span>
          <ArrowRight className="size-4 rotate-90 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {tokens.map((token) => (
          <DropdownMenuItem key={token.symbol} onClick={() => onChange(token)}>
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold">{token.symbol.slice(0, 2)}</span>
              </div>
              <div>
                <p className="font-medium">{token.symbol}</p>
                <p className="text-xs text-muted-foreground">{token.name}</p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LiquidityPage() {
  const { selectedAccount, potBalance, status } = usePortaldot();
  const [tokenA, setTokenA] = useState(tokens[0]);
  const [tokenB, setTokenB] = useState(tokens[1]);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  const contractsReady = hasDexContracts();
  const canSubmit = Boolean(selectedAccount && status === "connected" && amountA && amountB && tokenA.symbol !== tokenB.symbol && contractsReady);

  const poolPrice = useMemo(() => {
    if (!amountA || !amountB || Number(amountB) === 0) return "—";
    return (Number(amountA) / Number(amountB)).toFixed(6);
  }, [amountA, amountB]);

  const buttonLabel = !selectedAccount
    ? "Connect wallet to continue"
    : !contractsReady
      ? "Pool contracts not deployed yet"
      : "Add liquidity";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liquidity</h1>
          <p className="text-muted-foreground mt-1">Create and manage trading depth for Portaldot assets</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
          <Droplets className="size-4 text-primary" />
          <span className="text-sm">POT balance: {potBalance}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Add Liquidity</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pair POT or test assets to create the trading depth that powers swaps inside Potra.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="add" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add">Add liquidity</TabsTrigger>
                <TabsTrigger value="create">Create pool</TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First asset</Label>
                    <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                      <div className="flex justify-between">
                        <TokenDropdown value={tokenA} onChange={setTokenA} />
                        <span className="text-xs text-muted-foreground">Balance: {tokenA.symbol === "POT" ? potBalance : tokenA.balance}</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amountA}
                        onChange={(event) => setAmountA(event.target.value)}
                        className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Second asset</Label>
                    <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                      <div className="flex justify-between">
                        <TokenDropdown value={tokenB} onChange={setTokenB} />
                        <span className="text-xs text-muted-foreground">Balance: {tokenB.symbol === "POT" ? potBalance : tokenB.balance}</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amountB}
                        onChange={(event) => setAmountB(event.target.value)}
                        className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="size-4 text-info" />
                    Pool preview
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Pair</p>
                      <p className="font-medium">{tokenA.symbol} / {tokenB.symbol}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Starting price</p>
                      <p className="font-medium">1 {tokenB.symbol} = {poolPrice} {tokenA.symbol}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">LP ownership</p>
                      <p className="font-medium">New pool: 100%</p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
                  size="lg"
                  disabled={!canSubmit}
                  onClick={() => setSuccessOpen(true)}
                >
                  <Plus className="size-4" />
                  {buttonLabel}
                </Button>
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <div className="p-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-center">
                  <Droplets className="size-10 mx-auto text-primary mb-3" />
                  <h3 className="text-lg font-semibold">Create a new market</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    Select two assets, seed both sides, then Potra will list the pair for swapping once the pool factory is deployed.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
            <CardHeader>
              <CardTitle>Liquidity Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet</span>
                <span className={selectedAccount ? "text-success" : "text-warning"}>{selectedAccount ? "Connected" : "Required"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RPC</span>
                <span className={status === "connected" ? "text-success" : "text-warning"}>{status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool contracts</span>
                <span className={contractsReady ? "text-success" : "text-warning"}>{contractsReady ? "Configured" : "Next deployment"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5" /> Active Pools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pools.map((pool) => (
                <div key={pool.pair} className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{pool.pair}</p>
                    <span className="text-xs text-success">{pool.apr}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-muted-foreground">
                    <span>Depth: {pool.tvl}</span>
                    <span>Volume: {pool.volume}</span>
                    <span>Share: {pool.share}</span>
                    <span>Network: POT</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pool Directory</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search pairs" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/30 text-xs text-muted-foreground">
              <span>Pair</span><span>Depth</span><span>24h Volume</span><span>Your Share</span><span className="text-right">Action</span>
            </div>
            {pools.map((pool) => (
              <div key={pool.pair} className="grid grid-cols-5 gap-4 px-4 py-4 border-t border-border/50 items-center">
                <span className="font-medium">{pool.pair}</span>
                <span>{pool.tvl}</span>
                <span>{pool.volume}</span>
                <span>{pool.share}</span>
                <div className="text-right">
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liquidity transaction prepared</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              The interface is ready for the pool factory contract. Once deployed, this action will submit a signed liquidity transaction from your connected wallet.
            </p>
            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              {amountA} {tokenA.symbol} + {amountB} {tokenB.symbol}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
