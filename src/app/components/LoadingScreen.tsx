import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="size-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center mx-auto animate-pulse">
          <span className="text-2xl font-bold text-white">P</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading Potra...</span>
        </div>
      </div>
    </div>
  );
}
