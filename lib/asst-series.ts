import raw from "@/data/asst-8k-series.json";
import warehouse from "@/data/asst-series-warehouse.json";
import { satsPerShare, type Verdict } from "./sats";

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

export const ASST_FILINGS = raw as AsstFiling[];

function check() {
  for (const r of ASST_FILINGS) {
    if (r.class_a + r.class_b !== r.effective_common) {
      throw new Error("ASST denom mismatch " + r.as_of + " class A+B != effective_common");
    }
    const got = satsPerShare(r.btc, r.effective_common);
    if (got !== r.sats_basic) throw new Error("ASST sats mismatch " + r.as_of + " " + got + " != " + r.sats_basic);
    if (r.afds) {
      if (r.as_of < "2026-07-24") throw new Error("ASST AFDS before 2026-07-24 " + r.as_of);
    } else if (r.as_of >= "2026-07-24") {
      throw new Error("ASST AFDS missing from 2026-07-24 " + r.as_of);
    }
    if (r.as_of >= "2026-06-05") {
      if (r.strc_held !== 505000) throw new Error("ASST STRC missing " + r.as_of);
    } else if (r.strc_held != null) {
      throw new Error("ASST STRC too early " + r.as_of);
    }
  }
  const last = ASST_FILINGS[ASST_FILINGS.length - 1];
  if (last.btc !== 23156 || last.sats_basic !== 24829) throw new Error("ASST lock last row");
}
check();

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

export const ASST_SERIES = warehouse as AsstSeriesRow[];

function checkWarehouse() {
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
  for (let i = 0; i < ASST_SERIES.length; i++) {
    const w = ASST_SERIES[i];
    const f = ASST_FILINGS[i];
    if (w.as_of !== f.as_of) throw new Error("ASST as_of drift " + w.as_of);
    if (w.shares_basic !== f.class_a + f.class_b) throw new Error("ASST SATA in denom " + w.as_of);
    if (w.sats_basic !== f.sats_basic || w.btc !== f.btc) throw new Error("ASST sats drift " + w.as_of);
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
checkWarehouse();

export function asstSeries() {
  return ASST_SERIES;
}
