import { CheckCircle2, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "pending" | "success" | "error";
  title: string;
  description: string;
  txHash?: string;
}

export function TransactionModal({
  open,
  onOpenChange,
  status,
  title,
  description,
  txHash,
}: TransactionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={`size-12 rounded-full border flex items-center justify-center ${
                status === "pending"
                  ? "bg-primary/10 border-primary/20"
                  : status === "success"
                  ? "bg-success/10 border-success/20"
                  : "bg-destructive/10 border-destructive/20"
              }`}
            >
              {status === "pending" && <Loader2 className="size-6 text-primary animate-spin" />}
              {status === "success" && <CheckCircle2 className="size-6 text-success" />}
              {status === "error" && <AlertCircle className="size-6 text-destructive" />}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {txHash && (
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transaction Hash</span>
                <button className="flex items-center gap-1 text-primary hover:underline">
                  <span className="font-mono text-xs">{txHash}</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </div>
          )}

          {status === "success" && (
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
          {status === "error" && (
            <Button className="w-full" variant="destructive" onClick={() => onOpenChange(false)}>
              Dismiss
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
