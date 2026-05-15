import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, CheckCircle2, Info, Loader2, Settings, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Slider } from "../components/ui/slider";
import { Badge } from "../components/ui/badge";
import { getLiquidityPositions, isManagedLiquidityPosition, LiquidityPosition } from "../blockchain/liquidity";
import { getSwapQuote, SwapResult } from "../blockchain/swap";
import { usePortaldot } from "../providers/PortaldotProvider";
import { shortAddress } from "../config/env";

export function SwapPage() {
  const { selectedAccount, status, executeSwap, isExecutingSwap } = usePortaldot();
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [selectedPool, setSelectedPool] = useState<LiquidityPosition>();
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState([0.5]);
  const [direction, setDirection] = useState<"potToAsset" | "assetToPot">("potToAsset");
  const [successOpen, setSuccessOpen] = useState(false);
  const [latestSwap, setLatestSwap] = useState<SwapResult | null>(null);

  useEffect(() => {
    const refresh = () => {
      const next = getLiquidityPositions();
      setPositions(next);
      setSelectedPool((current) => {
        if (current) {
          return next.find((pool) => pool.id === current.id) || next[0];
        }
        return next[0];
      });
    };
    refresh();
    window.addEventListener("potra:liquidity-created", refresh);
    window.addEventListener("potra:liquidity-updated", refresh);
    window.addEventListener("potra:swap-executed", refresh);
    return () => {
      window.removeEventListener("potra:liquidity-created", refresh);
      window.removeEventListener("potra:liquidity-updated", refresh);
      window.removeEventListener("potra:swap-executed", refresh);
    };
  }, []);

  const quote = useMemo(() => {
    if (!selectedPool) return null;
    return getSwapQuote(selectedPool, direction, fromAmount, slippage[0]);
  }, [direction, fromAmount, selectedPool, slippage]);

  const fromSymbol = direction === "potToAsset" ? "POT" : selectedPool?.assetSymbol || "ASSET";
  const toSymbol = direction === "potToAsset" ? selectedPool?.assetSymbol || "ASSET" : "POT";
  const selectedPoolIsManaged = selectedPool ? isManagedLiquidityPosition(selectedPool) : false;

  const canSwap = Boolean(
    selectedAccount &&
    status === "connected" &&
    selectedPool &&
    selectedPoolIsManaged &&
    quote &&
    Number(fromAmount) > 0 &&
    !isExecutingSwap,
  );

  const swapButtonLabel = !selectedAccount
    ? "Connect wallet to swap"
    : status !== "connected"
      ? "Start Portaldot local node"
      : !selectedPool
        ? "Create liquidity first"
        : !selectedPoolIsManaged
          ? "Create fresh managed liquidity for swaps"
          : isExecutingSwap
            ? "Executing onchain swap..."
            : quote
              ? `Swap ${fromAmount || "0"} ${fromSymbol} for ${quote.outputAmount} ${toSymbol}`
              : "Enter an amount";

  const handleSwap = async () => {
    if (!selectedPool) {
      toast.error("Select a funded pool before swapping");
      return;
    }

    try {
      const result = await executeSwap({
        pool: selectedPool,
        direction,
        inputAmount: fromAmount,
        slippagePercent: slippage[0],
      });
      setLatestSwap(result);
      setSuccessOpen(true);
      setFromAmount("");
      toast.success(`${result.assetSymbol}/POT swap completed onchain`, {
        description: shortAddress(result.outputTxHash),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Swap failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Swap</h1>
          <p className="text-muted-foreground mt-1">Execute two-leg onchain swaps through Potra managed pool vaults</p>
        </div>
        <Badge variant="outline" className="gap-2 border-success/30 bg-success/10 text-success">
          <ShieldCheck className="size-4" /> Real onchain settlement
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Swap</CardTitle>
              <Dialog>
                <DialogTrigger asChild><Button variant="ghost" size="icon"><Settings className="size-4" /></Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Swap Settings</DialogTitle></DialogHeader>
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
            <CardContent className="space-y-4">
              {positions.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-center">
                  <h3 className="text-lg font-semibold">No funded pools yet</h3>
                  <p className="text-sm text-muted-foreground mt-2">Create liquidity before executing swaps.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Pool</Label>
                    <div className="grid gap-2">
                      {positions.map((pool) => {
                        const managed = isManagedLiquidityPosition(pool);
                        return (
                          <button key={pool.id} onClick={() => setSelectedPool(pool)} className={`p-3 rounded-lg border text-left transition-colors ${selectedPool?.id === pool.id ? "border-primary bg-primary/10" : "border-border/50 bg-muted/20 hover:bg-muted/30"}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">POT / {pool.assetSymbol}</span>
                              <Badge variant="outline" className={managed ? "border-success/30 text-success" : "border-warning/30 text-warning"}>{managed ? "Swap ready" : "Legacy"}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{pool.potAmount} POT + {pool.assetAmount} {pool.assetSymbol}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between"><Label>From</Label><span className="text-sm text-muted-foreground">{fromSymbol}</span></div>
                    <Input type="number" placeholder="0.00" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} disabled={isExecutingSwap} className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto" />
                  </div>

                  <div className="flex justify-center -my-2 relative z-10">
                    <Button variant="outline" size="icon" onClick={() => setDirection(direction === "potToAsset" ? "assetToPot" : "potToAsset")} disabled={isExecutingSwap} className="rounded-full size-10 bg-card border-2"><ArrowDownUp className="size-4" /></Button>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between"><Label>To</Label><span className="text-sm text-muted-foreground">{toSymbol}</span></div>
                    <Input type="number" placeholder="0.00" value={quote?.outputAmount || ""} readOnly className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto" />
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Route</span><span>{quote?.routeLabel || `POT/${selectedPool?.assetSymbol} managed vault`}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Minimum received</span><span>{quote ? `${quote.minOutputAmount} ${toSymbol}` : "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Pool fee</span><span>{quote?.feePercent || "0.30"}%</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Price impact</span><span>{quote ? `${quote.priceImpactPercent}%` : "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Execution</span><span className="text-success">Two signed onchain legs</span></div>
                  </div>

                  <Button className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90" size="lg" disabled={!canSwap} onClick={handleSwap}>
                    {isExecutingSwap && <Loader2 className="size-4 animate-spin" />}
                    {swapButtonLabel}
                  </Button>
                </>
              )}

              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                <Info className="size-4 text-info mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">This version performs real onchain settlement using a managed pool vault. The next phase can replace the managed vault with an ink! AMM contract when we package contracts for deployment.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-border/50">
          <CardHeader><CardTitle>Funded Pools</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {positions.length === 0 ? <div className="p-4 rounded-lg bg-muted/20 text-sm text-muted-foreground">No pools yet.</div> : positions.map((pool) => (
                <div key={pool.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">POT / {pool.assetSymbol}</p>
                    <Badge variant="outline" className={isManagedLiquidityPosition(pool) ? "text-success" : "text-warning"}>{isManagedLiquidityPosition(pool) ? "Ready" : "Legacy"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pool.potAmount} POT + {pool.assetAmount} {pool.assetSymbol}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">{shortAddress(pool.poolAddress)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              Swap settled on Portaldot
            </DialogTitle>
          </DialogHeader>

          {latestSwap && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{fromSymbol} → {toSymbol}</h3>
                <p className="text-muted-foreground">Potra completed the input deposit and vault settlement on the local Portaldot chain.</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Input</span><span>{latestSwap.inputAmount}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Output</span><span>{latestSwap.outputAmount}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Input tx</span><span className="font-mono text-xs text-right">{shortAddress(latestSwap.inputTxHash, 10, 8)}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Settlement tx</span><span className="font-mono text-xs text-right">{shortAddress(latestSwap.outputTxHash, 10, 8)}</span></div>
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-chart-2" onClick={() => setSuccessOpen(false)}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
