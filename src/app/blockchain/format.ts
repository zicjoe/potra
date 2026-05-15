export function formatUnits(raw: string | bigint, decimals: number, precision = 4) {
  const value = typeof raw === "bigint" ? raw : BigInt(raw || "0");
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const padded = fraction.toString().padStart(decimals, "0").slice(0, precision);
  const trimmed = padded.replace(/0+$/, "");
  return trimmed ? `${whole.toString()}.${trimmed}` : whole.toString();
}

export function parseUnits(value: string, decimals: number) {
  const clean = value.trim();
  if (!clean) return 0n;
  const [whole, fraction = ""] = clean.split(".");
  const normalizedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(normalizedFraction || "0");
}
