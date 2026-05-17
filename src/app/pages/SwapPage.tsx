import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUpDown, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { TokenIcon } from "../components/TokenIcon";
import { getDisplayMarketPositions, isManagedLiquidityPosition, type LiquidityPosition } from "../blockchain/liquidity";
import { getSwapQuote, type SwapDirection, type SwapResult } from "../blockchain/swap";
import { findMatchingToken, getDefaultPairToken, getTradeTokens, POT_TOKEN, sameToken, TOKEN_REGISTRY_EVENTS, tokenKey, type TradeTokenOption } from "../blockchain/tokens";
import { usePortaldot } from "../providers/PortaldotProvider";
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

function findPoolForPair(positions: LiquidityPosition[], from: TradeTokenOption, to: TradeTokenOption) {
  const asset = from.isPot ? to : to.isPot ? from : undefined;
  if (!asset?.assetId) return undefined;
  return positions.find((pool) => pool.assetId === asset.assetId);
}

function directionForPair(from: TradeTokenOption, to: TradeTokenOption): SwapDirection | null {
  if (from.isPot && !to.isPot) return "potToAsset";
  if (!from.isPot && to.isPot) return "assetToPot";
  return null;
}

export function SwapPage() {
  const { selectedAccount, status, executeSwap, isExecutingSwap } = usePortaldot();
  const [tokens, setTokens] = useState<TradeTokenOption[]>(() => getTradeTokens());
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [fromToken, setFromToken] = useState<TradeTokenOption>(POT_TOKEN);
  const [toToken, setToToken] = useState<TradeTokenOption>(() => getDefaultPairToken(getTradeTokens()) || POT_TOKEN);
  const [fromAmount, setFromAmount] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [latestSwap, setLatestSwap] = useState<SwapResult | null>(null);

  const refresh = useCallback(() => {
    const nextTokens = getTradeTokens();
    const nextPositions = getDisplayMarketPositions();

    setTokens(nextTokens);
    setPositions(nextPositions);
    setFromToken((current) => findMatchingToken(nextTokens, current) || POT_TOKEN);
    setToToken((current) => findMatchingToken(nextTokens, current) || getDefaultPairToken(nextTokens) || POT_TOKEN);
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

  const selectedPool = useMemo(() => findPoolForPair(positions, fromToken, toToken), [fromToken, positions, toToken]);
  const direction = directionForPair(fromToken, toToken);

  const quote = useMemo(() => {
    if (!selectedPool || !direction) return null;
    return getSwapQuote(selectedPool, direction, fromAmount, 0.5);
  }, [direction, fromAmount, selectedPool]);

  const poolIsReady = selectedPool ? isManagedLiquidityPosition(selectedPool) : false;
  const receiveValue = quote?.outputAmount || "";

  const buttonLabel = !selectedAccount
    ? "Connect wallet"
    : status !== "connected"
      ? "Start Portaldot node"
      : sameToken(fromToken, toToken)
        ? "Select different tokens"
        : !direction
          ? "Select a POT market"
          : !poolIsReady
            ? "Create liquidity first"
            : !Number(fromAmount)
              ? "Enter amount"
              : isExecutingSwap
                ? "Swapping..."
                : "Swap";

  const canSwap = Boolean(
    selectedAccount &&
    status === "connected" &&
    selectedPool &&
    poolIsReady &&
    direction &&
    !sameToken(fromToken, toToken) &&
    Number(fromAmount) > 0 &&
    !isExecutingSwap,
  );

  const selectFromToken = (token: TradeTokenOption) => {
    if (sameToken(token, toToken)) {
      setToToken(fromToken);
    }
    if (!token.isPot && !toToken.isPot) {
      setToToken(POT_TOKEN);
    }
    setFromToken(token);
  };

  const selectToToken = (token: TradeTokenOption) => {
    if (sameToken(token, fromToken)) {
      setFromToken(toToken || POT_TOKEN);
    }
    if (!token.isPot && !fromToken.isPot) {
      setFromToken(POT_TOKEN);
    }
    setToToken(token);
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(receiveValue || "");
  };

  const handleSwap = async () => {
    if (!selectedPool || !direction) return;

    try {
      const result = await executeSwap({
        pool: selectedPool,
        direction,
        inputAmount: fromAmount,
        slippagePercent: 0.5,
      });
      setLatestSwap(result);
      setSuccessOpen(true);
      setFromAmount("");
      toast.success("Swap completed", { description: shortAddress(result.outputTxHash) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Swap failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-start justify-center py-8">
      <div className="w-full max-w-xl space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Swap</h1>
          <p className="text-sm text-muted-foreground">Trade POT, bridge assets, and launched tokens.</p>
        </div>

        <Card className="border-border/50 bg-card/70 shadow-2xl shadow-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="rounded-2xl bg-muted/30 border border-border/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You pay</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(event) => setFromAmount(event.target.value)}
                  disabled={isExecutingSwap}
                  className="h-14 border-0 bg-transparent p-0 text-4xl font-semibold focus-visible:ring-0"
                />
                <TokenSelector value={fromToken} tokens={tokens} onChange={selectFromToken} />
              </div>
            </div>

            <div className="flex justify-center -my-1 relative z-10">
              <Button variant="outline" size="icon" className="size-11 rounded-full bg-background border-2" onClick={switchTokens}>
                <ArrowDown className="size-5" />
              </Button>
            </div>

            <div className="rounded-2xl bg-muted/30 border border-border/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You receive</span>
                <span className="text-xs text-muted-foreground">Estimated</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={receiveValue}
                  readOnly
                  className="h-14 border-0 bg-transparent p-0 text-4xl font-semibold focus-visible:ring-0"
                />
                <TokenSelector value={toToken} tokens={tokens} onChange={selectToToken} />
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm text-muted-foreground flex items-center justify-between gap-3">
              <span>{sameToken(fromToken, toToken) ? "Choose two different tokens" : `${fromToken.symbol} → ${toToken.symbol}`}</span>
              <span className={poolIsReady ? "text-success" : "text-muted-foreground"}>
                {poolIsReady ? "Market ready" : "Add liquidity first"}
              </span>
            </div>

            <Button
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary to-chart-2 text-base font-semibold hover:opacity-90"
              disabled={!canSwap}
              onClick={handleSwap}
            >
              {isExecutingSwap ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowUpDown className="mr-2 size-4" />}
              {buttonLabel}
            </Button>
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
              Swap complete
            </DialogTitle>
          </DialogHeader>

          {latestSwap && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Input</span><span>{latestSwap.inputAmount}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Output</span><span>{latestSwap.outputAmount}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Transaction</span><span className="font-mono text-xs text-right">{shortAddress(latestSwap.outputTxHash, 10, 8)}</span></div>
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
