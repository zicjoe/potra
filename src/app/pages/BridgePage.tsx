import { useState } from "react";
import { ArrowRight, Info, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";

const networks = [
  { id: "sepolia", name: "Ethereum Sepolia", icon: "ETH" },
  { id: "bnb", name: "BNB Testnet", icon: "BNB" },
  { id: "portaldot", name: "Portaldot Testnet", icon: "POT" },
];

const assets = [
  { symbol: "USDT", name: "Tether USD", balance: "1,420.50" },
  { symbol: "ETH", name: "Ethereum", balance: "2.45" },
  { symbol: "BNB", name: "BNB", balance: "12.8" },
  { symbol: "POT", name: "Portaldot", balance: "1,250.00" },
];

const bridgeHistory = [
  { asset: "USDT", amount: "100", from: "Sepolia", to: "Portaldot", status: "completed", time: "2h ago" },
  { asset: "POT", amount: "50", from: "Portaldot", to: "BNB", status: "completed", time: "1d ago" },
  { asset: "ETH", amount: "0.5", from: "Sepolia", to: "Portaldot", status: "completed", time: "2d ago" },
];

export function BridgePage() {
  const [sourceNetwork, setSourceNetwork] = useState("sepolia");
  const [destNetwork, setDestNetwork] = useState("portaldot");
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [amount, setAmount] = useState("");
  const [isBridging, setIsBridging] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBridge = () => {
    setIsBridging(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsBridging(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const estimatedTime = "3-5 minutes";
  const bridgeFee = "~$2.50";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bridge</h1>
        <p className="text-muted-foreground mt-1">Transfer assets across chains seamlessly</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Bridge Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Network</Label>
                  <Select value={sourceNetwork} onValueChange={setSourceNetwork}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.filter(n => n.id !== destNetwork).map((network) => (
                        <SelectItem key={network.id} value={network.id}>
                          <div className="flex items-center gap-2">
                            <div className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-xs font-semibold">{network.icon.slice(0, 1)}</span>
                            </div>
                            <span>{network.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Destination Network</Label>
                  <Select value={destNetwork} onValueChange={setDestNetwork}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.filter(n => n.id !== sourceNetwork).map((network) => (
                        <SelectItem key={network.id} value={network.id}>
                          <div className="flex items-center gap-2">
                            <div className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-xs font-semibold">{network.icon.slice(0, 1)}</span>
                            </div>
                            <span>{network.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asset to Bridge</Label>
                <Select value={selectedAsset.symbol} onValueChange={(val) => setSelectedAsset(assets.find(a => a.symbol === val) || assets[0])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.symbol} value={asset.symbol}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-xs font-semibold">{asset.symbol.slice(0, 1)}</span>
                            </div>
                            <span>{asset.symbol}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{asset.balance}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  <span className="text-sm text-muted-foreground">Balance: {selectedAsset.balance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Button variant="outline" onClick={() => setAmount(selectedAsset.balance)}>Max</Button>
                </div>
              </div>

              {amount && !isBridging && (
                <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bridge Fee</span>
                    <span>{bridgeFee}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Time</span>
                    <span>{estimatedTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">You Will Receive</span>
                    <span className="font-medium">{amount} {selectedAsset.symbol}</span>
                  </div>
                </div>
              )}

              {isBridging && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bridging in Progress...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {progress > 0 ? <CheckCircle2 className="size-4 text-success" /> : <Clock className="size-4 text-muted-foreground" />}
                      <span className={progress > 0 ? "text-success" : "text-muted-foreground"}>Transaction submitted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {progress > 33 ? <CheckCircle2 className="size-4 text-success" /> : <Clock className="size-4 text-muted-foreground" />}
                      <span className={progress > 33 ? "text-success" : "text-muted-foreground"}>Processing on source chain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {progress > 66 ? <CheckCircle2 className="size-4 text-success" /> : <Clock className="size-4 text-muted-foreground" />}
                      <span className={progress > 66 ? "text-success" : "text-muted-foreground"}>Relaying to destination</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {progress === 100 ? <CheckCircle2 className="size-4 text-success" /> : <Clock className="size-4 text-muted-foreground" />}
                      <span className={progress === 100 ? "text-success" : "text-muted-foreground"}>Confirmed on destination</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
                size="lg"
                disabled={!amount || isBridging}
                onClick={handleBridge}
              >
                {!amount ? "Enter Amount" : isBridging ? "Bridging..." : `Bridge ${amount} ${selectedAsset.symbol}`}
                {!isBridging && <ArrowRight className="size-4" />}
              </Button>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                <Info className="size-4 text-info mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Bridge transfers take {estimatedTime}. Your funds are secured by a decentralized validator network with on-chain guarantees.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Bridge History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bridgeHistory.map((bridge, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-xs font-semibold">{bridge.asset.slice(0, 1)}</span>
                    </div>
                    <p className="text-sm font-medium">{bridge.amount} {bridge.asset}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <span>{bridge.from}</span>
                    <ArrowRight className="size-3" />
                    <span>{bridge.to}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-success" />
                      <span className="text-xs text-success">Completed</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{bridge.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
