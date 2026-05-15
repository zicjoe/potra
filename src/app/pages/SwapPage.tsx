import { useState } from "react";
import { ArrowDownUp, Settings, Info, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Slider } from "../components/ui/slider";

const tokens = [
  { symbol: "POT", name: "Portaldot", balance: "1,250.00" },
  { symbol: "TESTUSDT", name: "Test USDT", balance: "5,420.50" },
  { symbol: "TESTETH", name: "Test ETH", balance: "2.45" },
  { symbol: "MOON", name: "Moon Token", balance: "10,000" },
];

const recentSwaps = [
  { from: "POT", to: "TESTUSDT", fromAmount: "50", toAmount: "12.5", time: "2h ago" },
  { from: "TESTUSDT", to: "POT", fromAmount: "100", toAmount: "400", time: "1d ago" },
  { from: "TESTETH", to: "POT", fromAmount: "0.5", toAmount: "200", time: "2d ago" },
];

export function SwapPage() {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState([0.5]);

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const toAmount = fromAmount ? (parseFloat(fromAmount) * 0.25).toFixed(2) : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Swap</h1>
        <p className="text-muted-foreground mt-1">Trade tokens instantly on Portaldot</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Swap Tokens</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Swap Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-3">
                      <Label>Slippage Tolerance: {slippage[0]}%</Label>
                      <Slider value={slippage} onValueChange={setSlippage} max={5} step={0.1} />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSlippage([0.5])}>0.5%</Button>
                        <Button variant="outline" size="sm" onClick={() => setSlippage([1])}>1%</Button>
                        <Button variant="outline" size="sm" onClick={() => setSlippage([2])}>2%</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>From</Label>
                  <span className="text-sm text-muted-foreground">Balance: {fromToken.balance}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 min-w-32">
                        <div className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold">{fromToken.symbol.slice(0, 2)}</span>
                        </div>
                        <span>{fromToken.symbol}</span>
                        <ChevronDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {tokens.map((token) => (
                        <DropdownMenuItem key={token.symbol} onClick={() => setFromToken(token)}>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-xs font-semibold">{token.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="font-medium">{token.symbol}</p>
                              <p className="text-xs text-muted-foreground">{token.balance}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFlipTokens}
                  className="rounded-full size-10 bg-card border-2"
                >
                  <ArrowDownUp className="size-4" />
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>To</Label>
                  <span className="text-sm text-muted-foreground">Balance: {toToken.balance}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={toAmount}
                    readOnly
                    className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 min-w-32">
                        <div className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold">{toToken.symbol.slice(0, 2)}</span>
                        </div>
                        <span>{toToken.symbol}</span>
                        <ChevronDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {tokens.map((token) => (
                        <DropdownMenuItem key={token.symbol} onClick={() => setToToken(token)}>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-xs font-semibold">{token.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="font-medium">{token.symbol}</p>
                              <p className="text-xs text-muted-foreground">{token.balance}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {fromAmount && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate</span>
                    <span>1 {fromToken.symbol} = 0.25 {toToken.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price Impact</span>
                    <span className="text-success">{'<'}0.1%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Gas Fee</span>
                    <span>~$0.15</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Minimum Received</span>
                    <span>{(parseFloat(toAmount) * 0.995).toFixed(2)} {toToken.symbol}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
                size="lg"
                disabled={!fromAmount}
              >
                {!fromAmount ? "Enter Amount" : `Swap ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`}
              </Button>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                <Info className="size-4 text-info mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Swap executes at the current market rate with {slippage[0]}% slippage tolerance. Transaction will fail if price moves beyond this threshold.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Recent Swaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSwaps.map((swap, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-xs font-semibold">{swap.from.slice(0, 1)}</span>
                    </div>
                    <ArrowDownUp className="size-3 text-muted-foreground" />
                    <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-xs font-semibold">{swap.to.slice(0, 1)}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {swap.fromAmount} {swap.from} → {swap.toAmount} {swap.to}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{swap.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
