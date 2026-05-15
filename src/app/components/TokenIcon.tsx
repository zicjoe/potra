interface TokenIconProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TokenIcon({ symbol, size = "md", className = "" }: TokenIconProps) {
  const sizeClasses = {
    sm: "size-6",
    md: "size-10",
    lg: "size-12",
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center ${className}`}>
      <span className={`font-semibold ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {symbol.slice(0, 2)}
      </span>
    </div>
  );
}
