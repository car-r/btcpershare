/** 100-shares-over-time v1 — MSTR from filings ledger; ASST from seed (AFDS quarterly). */

import seed from "@/data/100-shares-seed.json";
import { latest, series as filingSeries } from "./filings";

export type SharesPoint = {
  date: string;
  sats_adso: number;
  btc_per_100: number;
  note?: string;
};

export type SharesSeries = {
  ticker: string;
  denomLabel: string; // ADSO | AFDS
  liveSatsAdso: number;
  points: SharesPoint[];
};

function btcPer100FromSats(satsAdso: number): number {
  // Match seed rounding: 187751 → 0.1878
  return Math.round(satsAdso / 100) / 1e4;
}

const MSTR_SERIES: SharesPoint[] = filingSeries("MSTR")
  .filter((r) => r.satsAdso != null)
  .map((r) => ({
    date: r.periodEnd,
    sats_adso: r.satsAdso as number,
    btc_per_100: btcPer100FromSats(r.satsAdso as number),
  }));

const ASST_SERIES: SharesPoint[] = seed.asst.sats_seed_known.map((p) => ({
  date: p.date,
  sats_adso: p.sats_adso,
  btc_per_100: p.btc_per_100,
  note: p.note,
}));

export const SHARES_PRESETS = seed.formula.presets as number[];
export const SHARES_DEFAULT_N = seed.formula.default_n as number;
export const SHARES_CAPTION = seed.formula.caption as string;
export const SHARES_FOOTER = seed.ui.footer as string;
export const SHARE_CARD_SUB = seed.share_card.sub as string;

/** btc claimed by N shares = n * sats_adso / 1e8 */
export function btcPerN(satsAdso: number, n: number): number {
  return (n * satsAdso) / 100_000_000;
}

/** Rescale from seed btc_per_100: btc_per_n = btc_per_100 * n / 100 */
export function scaleBtcPer100(btcPer100: number, n: number): number {
  return (btcPer100 * n) / 100;
}

export function formatClaimedBtc(btc: number): string {
  if (btc >= 1) return btc.toFixed(4);
  if (btc >= 0.1) return btc.toFixed(4);
  if (btc >= 0.01) return btc.toFixed(4);
  return btc.toFixed(6);
}

export function sharesSeriesFor(ticker: string): SharesSeries | null {
  const t = ticker.toUpperCase();
  if (t === "MSTR") {
    const live = latest("MSTR")?.satsAdso ?? seed.mstr.live.sats_adso;
    if (MSTR_SERIES.length !== 7) throw new Error("MSTR 100-share must be 7 filing points");
    if (MSTR_SERIES[MSTR_SERIES.length - 1].btc_per_100 !== 0.1878) {
      throw new Error("MSTR 100-share end lock 0.1878");
    }
    return {
      ticker: "MSTR",
      denomLabel: "ADSO",
      liveSatsAdso: live,
      points: MSTR_SERIES,
    };
  }
  if (t === "ASST") {
    return {
      ticker: "ASST",
      denomLabel: "AFDS",
      liveSatsAdso: seed.asst.live.sats_adso,
      points: ASST_SERIES,
    };
  }
  // XXI (and others): no seed series → live widget only
  return null;
}

export function chartPointsFor(ticker: string, n: number): { date: string; btc: number; sats_adso: number }[] {
  const s = sharesSeriesFor(ticker);
  if (!s) return [];
  return s.points.map((p) => ({
    date: p.date,
    sats_adso: p.sats_adso,
    // Prefer formula n * sats / 1e8; for default n=100 keep rounded seed axis via scale when n===100
    btc: n === 100 ? scaleBtcPer100(p.btc_per_100, n) : btcPerN(p.sats_adso, n),
  }));
}

export function liveClaimed(ticker: string, n: number): { btc: number; sats: number; satsAdso: number; denomLabel: string } | null {
  const s = sharesSeriesFor(ticker);
  if (!s) return null;
  const btc = btcPerN(s.liveSatsAdso, n);
  return {
    btc,
    sats: Math.round(n * s.liveSatsAdso),
    satsAdso: s.liveSatsAdso,
    denomLabel: s.denomLabel,
  };
}

export { seed as SHARES_SEED };
