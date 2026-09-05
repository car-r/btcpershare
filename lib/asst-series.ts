/** ASST weekly series — single source: data/filings/ASST.json (copied sats/%, not recomputed). */

import { loadByTicker, sataShares, type FilingRow } from "./filings";
import { type Verdict } from "./sats";

export type AsstFiling = {
  as_of: string;
  filing_date: string;
  btc: number;
  class_a: number;
  class_b: number;
  effective_common: number;
  afds: number | null;
  sata: number | null;
  cash_thousands: number | null;
  strc_fv: number | null;
  strc_held: number | null;
  sats_basic: number;
  accession: string;
  url: string;
  format: string;
};

export type AsstSeriesRow = {
  ticker: "ASST";
  as_of: string;
  filing_date: string;
  accession: string;
  url: string;
  btc: number;
  pledged_btc: number | null;
  shares_basic: number;
  shares_fd: number | null;
  shares_fd_label: string | null;
  sats_basic: number;
  sats_fd: number | null;
  sata_shares: number | null;
  strc_held: number | null;
  verdict: Verdict | null;
  btc_yield_pct: number | null;
  format: string;
};

type AsstNotes = {
  class_a?: number;
  class_b?: number;
  strc_fv_thousands?: number | null;
  format?: string;
};

function parseNotes(row: FilingRow): AsstNotes {
  if (!row.notes) return {};
  try {
    return JSON.parse(row.notes) as AsstNotes;
  } catch {
    return {};
  }
}

function strcHeld(periodEnd: string): number | null {
  return periodEnd >= "2026-06-05" ? 505000 : null;
}

function yieldPct(row: FilingRow): number | null {
  if (row.satsChgPct == null) return null;
  // Recover warehouse percent units (e.g. 4.27) from fraction.
  return Math.round(row.satsChgPct * 10000) / 100;
}

function toSeries(row: FilingRow): AsstSeriesRow {
  if (row.btcHeld == null || row.basicShares == null || row.satsBasic == null) {
    throw new Error("ASST filing incomplete " + row.periodEnd);
  }
  const n = parseNotes(row);
  return {
    ticker: "ASST",
    as_of: row.periodEnd,
    filing_date: row.filedAt ?? row.periodEnd,
    accession: row.accession ?? "",
    url: row.url ?? "",
    btc: row.btcHeld,
    pledged_btc: row.pledgedBtc,
    shares_basic: row.basicShares,
    shares_fd: row.adso,
    shares_fd_label: row.adso != null ? "AFDS" : null,
    // COPIED from ledger — do not recompute btc*1e8/shares
    sats_basic: row.satsBasic,
    sats_fd: row.satsAdso,
    sata_shares: sataShares(row),
    strc_held: strcHeld(row.periodEnd),
    verdict: row.verdict,
    btc_yield_pct: yieldPct(row),
    format: n.format ?? "8-K",
  };
}

function toFiling(row: FilingRow): AsstFiling {
  if (row.btcHeld == null || row.basicShares == null || row.satsBasic == null) {
    throw new Error("ASST filing incomplete " + row.periodEnd);
  }
  const n = parseNotes(row);
  const class_a = n.class_a ?? row.basicShares;
  const class_b = n.class_b ?? 0;
  return {
    as_of: row.periodEnd,
    filing_date: row.filedAt ?? row.periodEnd,
    btc: row.btcHeld,
    class_a,
    class_b,
    effective_common: row.basicShares,
    afds: row.adso,
    sata: sataShares(row),
    cash_thousands: row.usdCash != null ? Math.round(row.usdCash / 1000) : null,
    strc_fv: n.strc_fv_thousands ?? null,
    strc_held: strcHeld(row.periodEnd),
    sats_basic: row.satsBasic,
    accession: row.accession ?? "",
    url: row.url ?? "",
    format: n.format ?? "8-K",
  };
}

const ROWS = loadByTicker("ASST");

export const ASST_FILINGS: AsstFiling[] = ROWS.map(toFiling);
export const ASST_SERIES: AsstSeriesRow[] = ROWS.map(toSeries);

function check() {
  if (ASST_SERIES.length !== 22 || ASST_FILINGS.length !== 22) throw new Error("ASST series length");
  if (ASST_SERIES[0].as_of !== "2026-03-09" || ASST_SERIES[1].as_of !== "2026-04-02") {
    throw new Error("ASST series invented dates");
  }
  if (ASST_SERIES[0].verdict != null || ASST_SERIES[0].btc_yield_pct != null) {
    throw new Error("ASST first row must have no prior");
  }
  const last = ASST_SERIES[ASST_SERIES.length - 1];
  if (last.btc !== 23156 || last.sats_basic !== 24829 || last.strc_held !== 505000) {
    throw new Error("ASST warehouse lock last row");
  }
  if (last.btc_yield_pct !== 4.27) throw new Error("ASST last yield pct " + last.btc_yield_pct);
  const lastF = ASST_FILINGS[ASST_FILINGS.length - 1];
  if (lastF.class_a + lastF.class_b !== lastF.effective_common) {
    throw new Error("ASST denom mismatch last");
  }
  if (lastF.strc_fv !== 49152) throw new Error("ASST strc_fv lock");
  // Prior-week lock for tape +4.3% path (23813 → 24829)
  const prev = ASST_SERIES[ASST_SERIES.length - 2];
  if (prev.sats_basic !== 23813) throw new Error("ASST prev sats lock");
  for (let i = 0; i < ASST_SERIES.length; i++) {
    const w = ASST_SERIES[i];
    const f = ASST_FILINGS[i];
    const src = ROWS[i];
    if (w.as_of !== f.as_of) throw new Error("ASST as_of drift " + w.as_of);
    if (f.class_a + f.class_b !== f.effective_common) throw new Error("ASST SATA in denom " + w.as_of);
    // sats copied from ledger row — never recompute against adso unless proven
    if (w.sats_basic !== src.satsBasic || w.btc !== src.btcHeld) throw new Error("ASST sats drift " + w.as_of);
    if (w.shares_fd !== f.afds) throw new Error("ASST AFDS drift " + w.as_of);
    if ((w.as_of >= "2026-07-24") !== (w.shares_fd != null && w.shares_fd_label === "AFDS")) {
      throw new Error("ASST AFDS window " + w.as_of);
    }
    if (w.as_of >= "2026-06-05") {
      if (w.strc_held !== 505000) throw new Error("ASST STRC window " + w.as_of);
    } else if (w.strc_held != null) {
      throw new Error("ASST STRC too early " + w.as_of);
    }
  }
}
check();

export function asstSeries() {
  return ASST_SERIES;
}
