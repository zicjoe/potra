import { useState } from "react";
import { ChevronDown, Copy, ExternalLink, RefreshCw, Settings, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { WalletConnectModal } from "./WalletConnectModal";
import { usePortaldot } from "../providers/PortaldotProvider";
import { potraConfig, shortAddress } from "../config/env";

export function AppHeader() {
  const [walletOpen, setWalletOpen] = useState(false);
  const {
    status,
    chainInfo,
    error,
    selectedAccount,
    potBalance,
    disconnectWallet,
    refreshBalance,
    claimFaucet,
    isClaimingFaucet,
  } = usePortaldot();

  const isOnline = status === "connected";

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
          isOnline ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20"
        }`}>
          <div className={`size-2 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-warning"}`} />
          <span className={`text-sm ${isOnline ? "text-success" : "text-warning"}`}>
            {status === "connecting" ? "Connecting" : isOnline ? "Portaldot Online" : "RPC Offline"}
          </span>
        </div>
        <p className="hidden xl:block text-xs text-muted-foreground">
          {chainInfo ? `${chainInfo.chain} · ${chainInfo.nodeName}` : error || potraConfig.rpcUrl}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {selectedAccount && (
          <Button
            variant="outline"
            size="sm"
            onClick={claimFaucet}
            disabled={isClaimingFaucet || !isOnline}
          >
            {isClaimingFaucet ? "Claiming..." : "Claim test POT"}
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={() => refreshBalance()}>
          <RefreshCw className="size-4" />
        </Button>

        <Button variant="outline" size="sm">
          <Settings className="size-4" />
        </Button>

        {!selectedAccount ? (
          <Button className="gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90" onClick={() => setWalletOpen(true)}>
            <Wallet className="size-4" />
            Connect Wallet
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90">
                <Wallet className="size-4" />
                <span>{shortAddress(selectedAccount.address)}</span>
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-2">
                <p className="text-xs text-muted-foreground mb-1">Connected wallet</p>
                <p className="text-sm font-mono break-all">{selectedAccount.address}</p>
                <div className="mt-3 p-2 rounded bg-muted/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">POT balance</span>
                    <span className="font-medium">{potBalance}</span>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(selectedAccount.address)}>
                <Copy className="mr-2 size-4" />
                Copy address
              </DropdownMenuItem>
              {potraConfig.explorerUrl && (
                <DropdownMenuItem onClick={() => window.open(potraConfig.explorerUrl, "_blank")}>
                  <ExternalLink className="mr-2 size-4" />
                  Open explorer
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={disconnectWallet}>Disconnect</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <WalletConnectModal open={walletOpen} onOpenChange={setWalletOpen} />
    </header>
  );
}
