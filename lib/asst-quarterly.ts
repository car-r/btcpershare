import raw from "@/data/asst-quarterly-company.json";
import { satsPerShare, btcYield } from "./sats";
import { ASST_SERIES } from "./asst-series";

export type AsstQuarterlyRow = {
  ticker: "ASST";
  as_of: string;
  period: string;
  label: string;
  btc: number;
  shares_fd: number;
  shares_fd_label: string;
  sats_fd: number;
  btc_yield_qtd_pct: number | null;
  amplification_pct: number | null;
  class_a: number | null;
  class_b: number | null;
  shares_basic: number | null;
  sats_basic: number | null;
  sata_shares: number | null;
  preferred_in_denom: false;
  accession: string;
  url: string;
  note: string;
};

type FileShape = {
  series: string;
  ticker: string;
  denom: string;
  preferred_in_denom: boolean;
  source: { form: string; filing_date: string; accession: string; url: string; table: string; footnote: string };
  rows: Omit<AsstQuarterlyRow, "preferred_in_denom" | "accession" | "url">[];
};

const file = raw as FileShape;

export const ASST_QUARTERLY_META = {
  series: "quarterly_company" as const,
  ticker: "ASST" as const,
  denom: "AFDS" as const,
  preferred_in_denom: false as const,
  source: file.source,
};

export const ASST_QUARTERLY: AsstQuarterlyRow[] = file.rows.map((r) => ({
  ...r,
  preferred_in_denom: false,
  accession: file.source.accession,
  url: file.source.url,
}));

const SPARK_DATES = [
  "2026-03-09",
  "2026-04-02",
  "2026-05-22",
  "2026-06-01",
  "2026-08-14",
  "2026-08-21",
  "2026-08-28",
] as const;

const SPARK_SATS = [19933, 19854, 21777, 24091, 23532, 23813, 24829] as const;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function check() {
  if (file.preferred_in_denom !== false) throw new Error("ASST quarterly preferred in denom");
  if (ASST_QUARTERLY.length !== 4) throw new Error("ASST quarterly length");
  const q3 = ASST_QUARTERLY[0];
  const ye = ASST_QUARTERLY[1];
  const q1 = ASST_QUARTERLY[2];
  const q2 = ASST_QUARTERLY[3];
  if (q3.sats_fd !== 13946 || ye.sats_fd !== 17037 || q1.sats_fd !== 18931 || q2.sats_fd !== 23465) {
    throw new Error("ASST quarterly printed sats");
  }
  const nick = satsPerShare(q1.btc, q1.shares_fd);
  if (nick !== 18932) throw new Error("expected Q1 round nick 18932, got " + nick);
  if (q1.sats_fd !== 18931) throw new Error("keep company-printed Q1 sats_fd");
  for (const r of [q3, ye, q1]) {
    if (r.class_a != null || r.class_b != null || r.shares_basic != null || r.sats_basic != null || r.sata_shares != null) {
      throw new Error("invented A+B or SATA shares " + r.as_of);
    }
  }
  if (q2.class_a == null || q2.class_b == null || q2.shares_basic == null || q2.sats_basic == null) {
    throw new Error("Q2 missing A+B");
  }
  if (q2.class_a + q2.class_b !== q2.shares_basic) throw new Error("Q2 A+B");
  if (satsPerShare(q2.btc, q2.shares_basic) !== 24241 || q2.sats_basic !== 24241) throw new Error("Q2 sats_basic");
  if (q2.sata_shares !== 7829502) throw new Error("Q2 SATA");
  for (let i = 0; i < ASST_QUARTERLY.length; i++) {
    const r = ASST_QUARTERLY[i];
    const got = satsPerShare(r.btc, r.shares_fd);
    if (Math.abs(got - r.sats_fd) > 1) throw new Error("ASST quarterly sats " + r.as_of + " " + got);
    if (i > 0) {
      const y = round1(btcYield(ASST_QUARTERLY[i - 1].sats_fd, r.sats_fd) * 100);
      if (r.btc_yield_qtd_pct == null || y !== r.btc_yield_qtd_pct) {
        throw new Error("ASST quarterly yield " + r.as_of + " " + y);
      }
    }
    if (r.accession !== "0001628280-26-047102" || !r.url.includes("000162828026047102")) {
      throw new Error("ASST quarterly accession " + r.as_of);
    }
  }
  if (q3.amplification_pct !== 0) throw new Error("Q3 amp");
  if (ye.amplification_pct !== 30.1 || q1.amplification_pct !== 47.1 || q2.amplification_pct !== 67.2) {
    throw new Error("ASST quarterly amp");
  }
}

function checkSpark() {
  const spark = asstSpark7();
  if (spark.length !== 7) throw new Error("ASST spark 7 length");
  spark.forEach((r, i) => {
    if (r.as_of !== SPARK_DATES[i] || r.sats_basic !== SPARK_SATS[i]) {
      throw new Error("ASST spark 7 " + r.as_of);
    }
  });
}

check();

export function asstQuarterly() {
  return {
    ...ASST_QUARTERLY_META,
    rows: ASST_QUARTERLY,
  };
}

export function asstSpark7() {
  return SPARK_DATES.map((d) => {
    const row = ASST_SERIES.find((r) => r.as_of === d);
    if (!row) throw new Error("ASST spark missing " + d);
    return row;
  });
}

checkSpark();

export const ASST_SPARK_DATES: readonly string[] = SPARK_DATES;
