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
  strc_held: number | null;
  sats_basic: number;
  accession: string;
  url: string;
};

export const ASST_FILINGS = raw as AsstFiling[];

function check() {
  for (const r of ASST_FILINGS) {
    const got = satsPerShare(r.btc, r.effective_common);
    if (got !== r.sats_basic) throw new Error("ASST sats mismatch " + r.as_of + " " + got + " != " + r.sats_basic);
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
      shares_basic: r.effective_common,
      shares_fd: r.afds,
      sats_basic: r.sats_basic,
      sats_fd: r.afds ? satsPerShare(r.btc, r.afds) : null,
      sata_shares: r.sata,
      strc_held: r.strc_held,
      verdict,
      accession: r.accession,
    };
  });
}
