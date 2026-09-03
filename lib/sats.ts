/** sats/share and accretion formulas */

export function satsPerShare(btc: number, shares: number): number {
  if (shares <= 0) throw new Error("shares must be > 0");
  return Math.round((btc * 100_000_000) / shares);
}

export function btcYield(satsStart: number, satsEnd: number): number {
  if (satsStart <= 0) throw new Error("satsStart must be > 0");
  return satsEnd / satsStart - 1;
}

export type Verdict = "accretive" | "dilutive" | "flat";

export function verdictFromYield(y: number): Verdict {
  if (y > 0.0005) return "accretive";
  if (y < -0.0005) return "dilutive";
  return "flat";
}

export function formatSats(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatYieldPct(y: number): string {
  const pct = y * 100;
  const sign = pct > 0 ? "+" : "";
  const abs = Math.abs(pct);
  if (abs >= 1) return `${sign}${pct.toFixed(1)}%`;
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatBtc(n: number): string {
  return n.toLocaleString("en-US");
}
