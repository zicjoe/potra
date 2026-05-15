interface NetworkBadgeProps {
  network: string;
  className?: string;
}

const networkIcons: Record<string, string> = {
  portaldot: "POT",
  sepolia: "ETH",
  bnb: "BNB",
  ethereum: "ETH",
};

export function NetworkBadge({ network, className = "" }: NetworkBadgeProps) {
  const icon = networkIcons[network.toLowerCase()] || network.slice(0, 3).toUpperCase();

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 ${className}`}>
      <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center">
        <span className="text-[8px] font-bold">{icon.slice(0, 1)}</span>
      </div>
      <span className="text-xs font-medium capitalize">{network}</span>
    </div>
  );
}
