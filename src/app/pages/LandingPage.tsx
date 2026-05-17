import { Link } from "react-router";
import { ArrowRight, TrendingUp, Shield, Zap, ArrowLeftRight, GitBranch, Rocket } from "lucide-react";
import { Button } from "../components/ui/button";

const stats = [
  { label: "Native token", value: "POT" },
  { label: "Environment", value: "Local" },
  { label: "Launch flow", value: "Onchain" },
  { label: "Liquidity", value: "Vaults" },
];

const features = [
  {
    icon: ArrowLeftRight,
    title: "Instant Swaps",
    description: "Trade through protocol-seeded Portaldot markets or user-created pools with real onchain settlement."
  },
  {
    icon: GitBranch,
    title: "Cross-Chain Bridge",
    description: "Prepare testnet asset movement into Portaldot through a gateway-style bridge flow."
  },
  {
    icon: Rocket,
    title: "Token Launchpad",
    description: "Create Portaldot-native assets through real Assets pallet extrinsics."
  },
  {
    icon: Shield,
    title: "Secure & Audited",
    description: "Every active launch and liquidity action is backed by signed local-chain transactions."
  },
  {
    icon: Zap,
    title: "Instant Finality",
    description: "Connect directly to a local Portaldot node and verify execution through real chain state."
  },
  {
    icon: TrendingUp,
    title: "Deep Liquidity",
    description: "Create liquidity for launched assets or supported bridge assets without starting from a blank market."
  },
];

const recentActivity = [
  { type: "launch", text: "Create a Portaldot-native asset", time: "Step 1" },
  { type: "liquidity", text: "Add liquidity or use seeded markets", time: "Step 2" },
  { type: "swap", text: "Swap through active Potra markets", time: "Step 3" },
  { type: "bridge", text: "Prepare the asset gateway", time: "Step 4" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-card/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <span className="font-bold text-white">P</span>
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Potra
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/app/swap">
              <Button className="gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90">
                Launch App
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-chart-2/10" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-chart-2 bg-clip-text text-transparent">
              Launch, bridge, and trade on Portaldot.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The gateway to the Portaldot economy. Launch native assets, add liquidity, execute swaps, and bridge testnet assets through a production-grade Portaldot experience.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/app/swap">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90">
                  Launch App
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/app/ecosystem">
                <Button size="lg" variant="outline">
                  Explore Ecosystem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-border bg-card/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need to build on Portaldot</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A focused launch and liquidity workspace for builders testing real Portaldot execution.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="size-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Product Flow</h2>
              <p className="text-lg text-muted-foreground">
                The first working loop inside Potra
              </p>
            </div>

            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-card border border-border/50 flex items-center justify-between hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <p className="font-medium">{activity.text}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/app/activity">
                <Button variant="outline" className="gap-2">
                  Open Activity
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                <span className="font-bold text-white">P</span>
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Potra
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Potra. Built on Portaldot.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
