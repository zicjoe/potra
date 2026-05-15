import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl ${className}`}>
      {children}
    </div>
  );
}
