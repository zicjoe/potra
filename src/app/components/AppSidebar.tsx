import { Link, useLocation } from "react-router";
import { Activity, ArrowLeftRight, Droplets, GitBranch, Globe, LayoutDashboard, Rocket, Wallet } from "lucide-react";
import { usePortaldot } from "../providers/PortaldotProvider";

const navigation = [
  { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { name: "Swap", href: "/app/swap", icon: ArrowLeftRight },
  { name: "Bridge", href: "/app/bridge", icon: GitBranch },
  { name: "Launch", href: "/app/launch", icon: Rocket },
  { name: "Liquidity", href: "/app/liquidity", icon: Droplets },
  { name: "Portfolio", href: "/app/portfolio", icon: Wallet },
  { name: "Ecosystem", href: "/app/ecosystem", icon: Globe },
  { name: "Activity", href: "/app/activity", icon: Activity },
];

export function AppSidebar() {
  const location = useLocation();
  const { status, chainInfo } = usePortaldot();
  const isOnline = status === "connected";

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
            <span className="font-bold text-white">P</span>
          </div>
          <span className="text-xl font-semibold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Potra
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== "/app" && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="size-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-chart-2/10 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-2">Network</p>
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-warning"}`} />
            <span className="text-sm font-medium">{chainInfo?.chain || "Portaldot Local"}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{isOnline ? "RPC connected" : "Check RPC"}</p>
        </div>
      </div>
    </aside>
  );
}
