import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  gradient?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  gradient = false,
}: StatCardProps) {
  const changeColor =
    changeType === "positive"
      ? "text-success"
      : changeType === "negative"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <Card className={`${gradient ? "bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20" : "bg-card/50 border-border/50"}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Icon className="size-4 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {change && <p className={`text-sm mt-1 ${changeColor}`}>{change}</p>}
      </CardContent>
    </Card>
  );
}
