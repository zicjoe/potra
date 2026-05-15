import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { SwapPage } from "./pages/SwapPage";
import { BridgePage } from "./pages/BridgePage";
import { LaunchPage } from "./pages/LaunchPage";
import { LiquidityPage } from "./pages/LiquidityPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { EcosystemPage } from "./pages/EcosystemPage";
import { ActivityPage } from "./pages/ActivityPage";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "swap", Component: SwapPage },
      { path: "bridge", Component: BridgePage },
      { path: "launch", Component: LaunchPage },
      { path: "liquidity", Component: LiquidityPage },
      { path: "portfolio", Component: PortfolioPage },
      { path: "ecosystem", Component: EcosystemPage },
      { path: "activity", Component: ActivityPage },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
