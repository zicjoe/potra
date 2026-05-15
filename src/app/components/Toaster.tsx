import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#1a1a24",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          color: "#f8fafc",
        },
      }}
    />
  );
}
