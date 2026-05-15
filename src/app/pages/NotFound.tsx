import { Link } from "react-router";
import { Home, Search } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="relative">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            404
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-chart-2/20 blur-3xl -z-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link to="/">
            <Button className="gap-2">
              <Home className="size-4" />
              Go Home
            </Button>
          </Link>
          <Link to="/app/ecosystem">
            <Button variant="outline" className="gap-2">
              <Search className="size-4" />
              Explore Ecosystem
            </Button>
          </Link>
        </div>

        <div className="pt-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <div className="size-6 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <span className="text-xs font-bold text-white">P</span>
            </div>
            <span>Return to Potra</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
