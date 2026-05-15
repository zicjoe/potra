import { ExternalLink, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { usePortaldot } from "../providers/PortaldotProvider";
import { Button } from "./ui/button";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const wallets = [
  { name: "SubWallet", icon: "🟣", description: "Recommended for Portaldot/Substrate accounts" },
  { name: "Polkadot.js", icon: "⚫", description: "Connect with the official browser extension" },
  { name: "Talisman", icon: "🔷", description: "Connect with a Polkadot ecosystem wallet" },
];

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { connectWallet, accounts, selectAccount } = usePortaldot();

  const handleConnect = async () => {
    await connectWallet();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5" />
            Connect Portaldot Wallet
          </DialogTitle>
          <DialogDescription>
            Potra connects through Polkadot-compatible browser wallets for real Portaldot transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={handleConnect}
              className="w-full p-4 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/50 transition-all flex items-center gap-4"
            >
              <div className="size-12 rounded-lg bg-card flex items-center justify-center text-2xl">
                {wallet.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">{wallet.name}</p>
                <p className="text-sm text-muted-foreground">{wallet.description}</p>
              </div>
              <ExternalLink className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {accounts.length > 1 && (
          <div className="space-y-2 border-t border-border/50 pt-4">
            <p className="text-sm font-medium">Choose account</p>
            {accounts.map((account) => (
              <Button
                key={account.address}
                variant="outline"
                className="w-full justify-start font-mono text-xs"
                onClick={() => {
                  selectAccount(account);
                  onOpenChange(false);
                }}
              >
                {account.meta?.name || account.address}
              </Button>
            ))}
          </div>
        )}

        <div className="text-center pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Use SubWallet, Polkadot.js, or Talisman with the Portaldot local node.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
