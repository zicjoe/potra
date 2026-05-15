import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
}

export function FeatureCard({ icon: Icon, title, description, onClick }: FeatureCardProps) {
  return (
    <Card
      className="bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
    >
      <CardHeader>
        <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Icon className="size-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
