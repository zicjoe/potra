import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Copy, Droplets, ExternalLink, Loader2, Plus } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { TokenIcon } from "../components/TokenIcon";
import { usePortaldot } from "../providers/PortaldotProvider";
import { getLiquidityPositions, type LiquidityPosition } from "../blockchain/liquidity";
import { findMatchingToken, getDefaultPairToken, getTradeTokens, POT_TOKEN, sameToken, TOKEN_REGISTRY_EVENTS, tokenKey, type TradeTokenOption } from "../blockchain/tokens";
import { shortAddress } from "../config/env";

function TokenSelector({
  value,
  tokens,
  onChange,
}: {
  value: TradeTokenOption;
  tokens: TradeTokenOption[];
  onChange: (token: TradeTokenOption) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-12 gap-3 rounded-full bg-background/70 px-3 pr-4">
          <TokenIcon symbol={value.symbol} size="sm" />
          <span className="font-semibold">{value.symbol}</span>
          <ChevronDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
        {tokens.map((token) => (
          <DropdownMenuItem
            key={tokenKey(token)}
            onClick={() => onChange(token)}
            className="p-3"
          >
            <TokenIcon symbol={token.symbol} size="sm" />
            <div>
              <p className="font-medium">{token.symbol}</p>
              <p className="text-xs text-muted-foreground">{token.name}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LiquidityPage() {
  const { selectedAccount, status, createLiquidity, isCreatingLiquidity } = usePortaldot();
  const [tokens, setTokens] = useState<TradeTokenOption[]>(() => getTradeTokens());
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [tokenA, setTokenA] = useState<TradeTokenOption>(POT_TOKEN);
  const [tokenB, setTokenB] = useState<TradeTokenOption>(() => getDefaultPairToken(getTradeTokens()) || POT_TOKEN);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [latestPosition, setLatestPosition] = useState<LiquidityPosition | null>(null);

  const refresh = useCallback(() => {
    const nextTokens = getTradeTokens();
    setTokens(nextTokens);
    setPositions(getLiquidityPositions());
    setTokenA((current) => findMatchingToken(nextTokens, current) || POT_TOKEN);
    setTokenB((current) => findMatchingToken(nextTokens, current) || getDefaultPairToken(nextTokens) || POT_TOKEN);
  }, []);

  useEffect(() => {
    refresh();
    TOKEN_REGISTRY_EVENTS.forEach((eventName) => window.addEventListener(eventName, refresh));
    window.addEventListener("storage", refresh);

    return () => {
      TOKEN_REGISTRY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, refresh));
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const assetSide = useMemo(() => {
    if (tokenA.isPot && tokenB.asset) {
      return { asset: tokenB.asset, potAmount: amountA, assetAmount: amountB, pair: `POT / ${tokenB.symbol}` };
    }
    if (tokenB.isPot && tokenA.asset) {
      return { asset: tokenA.asset, potAmount: amountB, assetAmount: amountA, pair: `POT / ${tokenA.symbol}` };
    }
    return null;
  }, [amountA, amountB, tokenA, tokenB]);

  const priceText = useMemo(() => {
    if (!assetSide) return "—";
    const pot = Number(assetSide.potAmount || 0);
    const asset = Number(assetSide.assetAmount || 0);
    if (!pot || !asset) return "—";
    return `1 ${assetSide.asset.symbol} = ${(pot / asset).toFixed(8)} POT`;
  }, [assetSide]);

  const canSubmit = Boolean(
    selectedAccount &&
    status === "connected" &&
    assetSide &&
    !sameToken(tokenA, tokenB) &&
    Number(assetSide.potAmount) > 0 &&
    Number(assetSide.assetAmount) > 0 &&
    !isCreatingLiquidity,
  );

  const buttonLabel = !selectedAccount
    ? "Connect wallet"
    : status !== "connected"
      ? "Start Portaldot node"
      : sameToken(tokenA, tokenB)
        ? "Select different tokens"
        : !assetSide
          ? "Select a POT market"
          : !Number(assetSide.potAmount) || !Number(assetSide.assetAmount)
            ? "Enter amounts"
            : isCreatingLiquidity
              ? "Adding liquidity..."
              : "Add liquidity";

  const selectTokenA = (token: TradeTokenOption) => {
    if (sameToken(token, tokenB)) {
      setTokenB(tokenA);
    }
    if (!token.isPot && !tokenB.isPot) {
      setTokenB(POT_TOKEN);
    }
    setTokenA(token);
  };

  const selectTokenB = (token: TradeTokenOption) => {
    if (sameToken(token, tokenA)) {
      setTokenA(tokenB || POT_TOKEN);
    }
    if (!token.isPot && !tokenA.isPot) {
      setTokenA(POT_TOKEN);
    }
    setTokenB(token);
  };

  const handleCreateLiquidity = async () => {
    if (!assetSide) return;

    try {
      const result = await createLiquidity({
        asset: assetSide.asset,
        potAmount: assetSide.potAmount,
        assetAmount: assetSide.assetAmount,
      });
      setLatestPosition(result);
      setPositions(getLiquidityPositions());
      setSuccessOpen(true);
      setAmountA("");
      setAmountB("");
      toast.success("Liquidity added", { description: `${result.assetSymbol}/POT` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Liquidity creation failed");
    }
  };

  const copyPoolAddress = async () => {
    if (!latestPosition?.poolAddress) return;
    await navigator.clipboard.writeText(latestPosition.poolAddress);
    toast.success("Pool address copied");
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-start justify-center py-8">
      <div className="w-full max-w-xl space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Liquidity</h1>
          <p className="text-sm text-muted-foreground">Choose two tokens, enter amounts, and create a market.</p>
        </div>

        <Card className="border-border/50 bg-card/70 shadow-2xl shadow-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="rounded-2xl bg-muted/30 border border-border/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">First token</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountA}
                  onChange={(event) => setAmountA(event.target.value)}
                  disabled={isCreatingLiquidity}
                  className="h-14 border-0 bg-transparent p-0 text-4xl font-semibold focus-visible:ring-0"
                />
                <TokenSelector value={tokenA} tokens={tokens} onChange={selectTokenA} />
              </div>
            </div>

            <div className="flex justify-center -my-1 relative z-10">
              <div className="size-11 rounded-full bg-background border-2 border-border flex items-center justify-center">
                <Plus className="size-5" />
              </div>
            </div>

            <div className="rounded-2xl bg-muted/30 border border-border/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Second token</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountB}
                  onChange={(event) => setAmountB(event.target.value)}
                  disabled={isCreatingLiquidity}
                  className="h-14 border-0 bg-transparent p-0 text-4xl font-semibold focus-visible:ring-0"
                />
                <TokenSelector value={tokenB} tokens={tokens} onChange={selectTokenB} />
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm text-muted-foreground flex items-center justify-between gap-3">
              <span>{sameToken(tokenA, tokenB) ? "Choose two different tokens" : assetSide?.pair || "Select a POT market"}</span>
              <span>{priceText}</span>
            </div>

            <Button
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary to-chart-2 text-base font-semibold hover:opacity-90"
              disabled={!canSubmit}
              onClick={handleCreateLiquidity}
            >
              {isCreatingLiquidity ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Droplets className="mr-2 size-4" />}
              {buttonLabel}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Your pools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {positions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-5 text-center text-sm text-muted-foreground">
                Pools you create will show here.
              </div>
            ) : (
              positions.map((position) => (
                <div key={position.id} className="rounded-xl bg-muted/25 border border-border/40 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">POT / {position.assetSymbol}</p>
                    <p className="text-xs text-muted-foreground">{position.potAmount} POT + {position.assetAmount} {position.assetSymbol}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(position.poolAddress).then(() => toast.success("Pool copied"))}>
                    Copy
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          POT is pinned at the top. Bridge assets and launched tokens appear automatically.
        </p>
      </div>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              Liquidity added
            </DialogTitle>
          </DialogHeader>

          {latestPosition && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Pair</span><span>POT / {latestPosition.assetSymbol}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">POT</span><span>{latestPosition.potAmount}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Token</span><span>{latestPosition.assetAmount} {latestPosition.assetSymbol}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Pool</span><span className="font-mono text-xs text-right">{shortAddress(latestPosition.poolAddress, 8, 8)}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2" onClick={copyPoolAddress}>
                  <Copy className="size-4" /> Copy
                </Button>
                <Button asChild className="gap-2 bg-gradient-to-r from-primary to-chart-2">
                  <Link to="/app/swap"><ExternalLink className="size-4" /> Swap</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
