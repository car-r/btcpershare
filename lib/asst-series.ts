import raw from "@/data/asst-8k-series.json";
import { satsPerShare, btcYield, verdictFromYield, type Verdict } from "./sats";

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

export function asstSeries() {
  return ASST_FILINGS.map((r, i) => {
    const prev = i > 0 ? ASST_FILINGS[i - 1] : null;
    let verdict: Verdict | null = null;
    if (prev) verdict = verdictFromYield(btcYield(prev.sats_basic, r.sats_basic));
    return {
      as_of: r.as_of,
      btc: r.btc,
      shares_basic: r.class_a + r.class_b,
      shares_fd: r.afds,
      sats_basic: r.sats_basic,
      sats_fd: r.afds ? satsPerShare(r.btc, r.afds) : null,
      sata_shares: r.sata,
      strc_held: r.strc_held,
      verdict,
      accession: r.accession,
      url: r.url,
    };
  });
}
