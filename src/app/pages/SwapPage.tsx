import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Info, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Slider } from "../components/ui/slider";
import { Badge } from "../components/ui/badge";
import { getLiquidityPositions, LiquidityPosition } from "../blockchain/liquidity";

export function SwapPage() {
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [selectedPool, setSelectedPool] = useState<LiquidityPosition>();
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState([0.5]);
  const [direction, setDirection] = useState<"potToAsset" | "assetToPot">("potToAsset");

  useEffect(() => {
    const refresh = () => {
      const next = getLiquidityPositions();
      setPositions(next);
      setSelectedPool((current) => current || next[0]);
    };
    refresh();
    window.addEventListener("potra:liquidity-created", refresh);
    return () => window.removeEventListener("potra:liquidity-created", refresh);
  }, []);

  const estimate = useMemo(() => {
    if (!selectedPool || !fromAmount || Number(fromAmount) <= 0) return "";
    const pot = Number(selectedPool.potAmount || 0);
    const asset = Number(selectedPool.assetAmount || 0);
    if (!pot || !asset) return "";
    return direction === "potToAsset"
      ? (Number(fromAmount) * (asset / pot)).toFixed(6)
      : (Number(fromAmount) * (pot / asset)).toFixed(6);
  }, [direction, fromAmount, selectedPool]);

  const fromSymbol = direction === "potToAsset" ? "POT" : selectedPool?.assetSymbol || "ASSET";
  const toSymbol = direction === "potToAsset" ? selectedPool?.assetSymbol || "ASSET" : "POT";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Swap</h1>
        <p className="text-muted-foreground mt-1">Preview trades against funded Portaldot pool vaults</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Swap Preview</CardTitle>
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
                  <p className="text-sm text-muted-foreground mt-2">Create a liquidity pool before preparing swap execution.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Pool</Label>
                    <div className="grid gap-2">
                      {positions.map((pool) => (
                        <button key={pool.id} onClick={() => setSelectedPool(pool)} className={`p-3 rounded-lg border text-left transition-colors ${selectedPool?.id === pool.id ? "border-primary bg-primary/10" : "border-border/50 bg-muted/20 hover:bg-muted/30"}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">POT / {pool.assetSymbol}</span>
                            <Badge variant="outline">Funded</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{pool.potAmount} POT + {pool.assetAmount} {pool.assetSymbol}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between"><Label>From</Label><span className="text-sm text-muted-foreground">{fromSymbol}</span></div>
                    <Input type="number" placeholder="0.00" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto" />
                  </div>

                  <div className="flex justify-center -my-2 relative z-10">
                    <Button variant="outline" size="icon" onClick={() => setDirection(direction === "potToAsset" ? "assetToPot" : "potToAsset")} className="rounded-full size-10 bg-card border-2"><ArrowDownUp className="size-4" /></Button>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between"><Label>To</Label><span className="text-sm text-muted-foreground">{toSymbol}</span></div>
                    <Input type="number" placeholder="0.00" value={estimate} readOnly className="text-2xl font-semibold border-0 bg-transparent p-0 h-auto" />
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Route</span><span>POT/{selectedPool?.assetSymbol} vault</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Quote source</span><span>Funded local pool</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Execution</span><span className="text-warning">AMM contract next phase</span></div>
                  </div>

                  <Button className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90" size="lg" disabled>
                    Swap execution activates after pool contract deployment
                  </Button>
                </>
              )}

              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                <Info className="size-4 text-info mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">This page now reads real funded pools. The next engineering phase wires the constant-product AMM contract for signed swap execution.</p>
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
                  <p className="text-sm font-medium">POT / {pool.assetSymbol}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pool.potAmount} POT + {pool.assetAmount} {pool.assetSymbol}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
