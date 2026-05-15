import { potraConfig } from "../config/env";

export async function claimTestPot(address: string) {
  const response = await fetch(`${potraConfig.faucetApi}/api/faucet/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Faucet claim failed");
  }

  return payload as { ok: true; txHash: string; blockHash?: string; amount: string };
}
