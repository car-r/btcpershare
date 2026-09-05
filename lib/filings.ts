/** Append-only JSON filing ledger. History lives in data/filings/{TICKER}.json. */

import type { Verdict } from "./sats";
import mstr from "@/data/filings/MSTR.json";
import asst from "@/data/filings/ASST.json";
import xxi from "@/data/filings/XXI.json";

export type FilingRow = {
  ticker: string;
  form: string | null;
  filedAt: string | null;
  periodEnd: string;
  accession: string | null;
  url: string | null;
  btcHeld: number | null;
  btcBought: number | null;
  btcSold: number | null;
  basicShares: number | null;
  adso: number | null;
  adsoEst: boolean | null;
  atmOn: boolean | null;
  sataOn: boolean | null;
  sharesIssued: number | null;
  atmProceedsUsd: number | null;
  pledgedBtc: number | null;
  debtUsd: number | null;
  prefNotionalUsd: number | null;
  usdCash: number | null;
  usdReserve: number | null;
  satsBasic: number | null;
  satsAdso: number | null;
  satsPrevAdso: number | null;
  satsChgPct: number | null;
  verdict: Verdict | null;
  notes: string | null;
};

const BY_TICKER: Record<string, FilingRow[]> = {
  MSTR: mstr as FilingRow[],
  ASST: asst as FilingRow[],
  XXI: xxi as FilingRow[],
};

export function loadByTicker(ticker: string): FilingRow[] {
  return BY_TICKER[ticker.toUpperCase()] ?? [];
}

export function series(ticker: string): FilingRow[] {
  return loadByTicker(ticker);
}

export function latest(ticker: string): FilingRow | null {
  const rows = loadByTicker(ticker);
  return rows.length ? rows[rows.length - 1] : null;
}

/** Green/red bar rows: numeric satsChgPct only. One ticker per chart. */
export function bars(ticker: string): FilingRow[] {
  return loadByTicker(ticker).filter((r) => r.satsChgPct != null && Number.isFinite(r.satsChgPct));
}

export function sataShares(row: FilingRow): number | null {
  if (row.prefNotionalUsd == null) return null;
  return row.prefNotionalUsd / 100;
}
