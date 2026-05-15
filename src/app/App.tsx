import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/Toaster";
import { PortaldotProvider } from "./providers/PortaldotProvider";

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <PortaldotProvider>
      <RouterProvider router={router} />
      <Toaster />
    </PortaldotProvider>
  );
}
