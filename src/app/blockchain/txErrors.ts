export function isTxPoolPriorityError(message: string) {
  return /priority is too low|too low priority|already in the pool|1014:/i.test(message);
}

export function humanizeTxError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  if (isTxPoolPriorityError(raw)) {
    return new Error(
      "Portaldot is still processing a previous transaction from the same signer. Wait a few seconds, refresh your balance, then try again.",
    );
  }

  if (/1010:|invalid transaction/i.test(raw)) {
    return new Error("The wallet transaction was rejected by Portaldot. Refresh the app, confirm the wallet account is funded, and try again.");
  }

  if (/inability to pay|payment/i.test(raw)) {
    return new Error("This wallet does not have enough POT to pay the network fee. Claim test POT and try again.");
  }

  if (/cancel|reject/i.test(raw)) {
    return new Error("Transaction cancelled in wallet.");
  }

  return error instanceof Error ? error : new Error(raw || "Portaldot transaction failed");
}
