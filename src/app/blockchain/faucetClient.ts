import { potraConfig } from "../config/env";
import { humanizeTxError } from "./txErrors";

const FAUCET_REQUEST_TIMEOUT_MS = 20000;

export async function claimTestPot(address: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FAUCET_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${potraConfig.faucetApi}/api/faucet/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) {
      throw humanizeTxError(new Error(payload.error || "Faucet claim failed"));
    }

    return payload as { ok: true; txHash: string; blockHash?: string; amount: string; status?: string };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The faucet request took too long. Refresh your balance, then try again if POT did not arrive.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
