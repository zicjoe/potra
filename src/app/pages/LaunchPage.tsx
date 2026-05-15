import { useState } from "react";
import { Rocket, Upload, Plus, Twitter, Globe, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

const recentLaunches = [
  { symbol: "MOON", name: "Moon Token", supply: "1,000,000", liquidity: "$12.5K", time: "2h ago" },
  { symbol: "STAR", name: "Star Token", supply: "500,000", liquidity: "$8.2K", time: "5h ago" },
  { symbol: "GEMS", name: "Gems Token", supply: "2,000,000", liquidity: "$24.8K", time: "1d ago" },
];

export function LaunchPage() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [description, setDescription] = useState("");
  const [withLiquidity, setWithLiquidity] = useState(true);
  const [liquidityAmount, setLiquidityAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleLaunch = () => {
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setTokenName("");
      setTokenSymbol("");
      setTotalSupply("");
      setDescription("");
      setLiquidityAmount("");
    }, 3000);
  };

  const canLaunch = tokenName && tokenSymbol && totalSupply && (!withLiquidity || liquidityAmount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Launch Token</h1>
        <p className="text-muted-foreground mt-1">Create and deploy your token on Portaldot</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Token Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenName">Token Name</Label>
                  <Input
                    id="tokenName"
                    placeholder="e.g., Moon Token"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tokenSymbol">Token Symbol</Label>
                  <Input
                    id="tokenSymbol"
                    placeholder="e.g., MOON"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalSupply">Total Supply</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  placeholder="1000000"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Initial token supply to mint</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your token and its purpose..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <Label>Token Logo (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG (max. 2MB)</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Social Links (Optional)</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Twitter className="size-4" />
                    </div>
                    <Input placeholder="https://twitter.com/yourtoken" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Globe className="size-4" />
                    </div>
                    <Input placeholder="https://yourtoken.com" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Send className="size-4" />
                    </div>
                    <Input placeholder="https://t.me/yourtoken" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Initial Liquidity</CardTitle>
                <Switch checked={withLiquidity} onCheckedChange={setWithLiquidity} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Seed initial liquidity to enable trading immediately after launch
              </p>
            </CardHeader>
            {withLiquidity && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>POT Amount</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={liquidityAmount}
                    onChange={(e) => setLiquidityAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount of POT to pair with 1% of token supply
                  </p>
                </div>

                {liquidityAmount && totalSupply && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Liquidity Pool</span>
                      <span className="font-medium">{liquidityAmount} POT + {parseInt(totalSupply) * 0.01} {tokenSymbol}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Starting Price</span>
                      <span>1 {tokenSymbol} ≈ {(parseFloat(liquidityAmount) / (parseInt(totalSupply) * 0.01)).toFixed(6)} POT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Your LP Tokens</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          <Button
            className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
            size="lg"
            disabled={!canLaunch}
            onClick={handleLaunch}
          >
            <Rocket className="size-4" />
            {withLiquidity ? `Launch Token with ${liquidityAmount} POT Liquidity` : "Launch Token"}
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
            <CardHeader>
              <CardTitle>Launch Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="size-16 rounded-xl bg-card border border-border flex items-center justify-center mx-auto">
                {tokenSymbol ? (
                  <span className="text-2xl font-bold">{tokenSymbol.slice(0, 2)}</span>
                ) : (
                  <Upload className="size-8 text-muted-foreground" />
                )}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold">{tokenName || "Token Name"}</h3>
                <p className="text-sm text-muted-foreground">{tokenSymbol || "SYMBOL"}</p>
              </div>

              <div className="p-3 rounded-lg bg-card/50 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Supply</span>
                  <span className="font-medium">{totalSupply ? parseInt(totalSupply).toLocaleString() : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">Portaldot</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">With Liquidity</span>
                  <span className="font-medium">{withLiquidity ? "Yes" : "No"}</span>
                </div>
              </div>

              {description && (
                <div className="p-3 rounded-lg bg-card/50">
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Recent Launches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLaunches.map((launch) => (
                  <div key={launch.symbol} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold">{launch.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{launch.symbol}</p>
                        <p className="text-xs text-muted-foreground">{launch.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Supply: {launch.supply}</span>
                      <span>{launch.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                <Rocket className="size-6 text-success" />
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Token Launched Successfully!</h3>
              <p className="text-muted-foreground mb-4">
                {tokenSymbol} has been deployed to Portaldot Testnet
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Token</span>
                <span className="font-medium">{tokenSymbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Supply</span>
                <span className="font-medium">{parseInt(totalSupply).toLocaleString()}</span>
              </div>
              {withLiquidity && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Initial Liquidity</span>
                  <span className="font-medium">{liquidityAmount} POT</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-mono text-xs">0x7a2d...8f3c</span>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              View on Explorer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
