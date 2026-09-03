import raw from "@/data/asst-quarterly.json";
import { satsPerShare, btcYield } from "./sats";
import { ASST_SERIES } from "./asst-series";

export type AsstQuarterly = {
  as_of: string;
  btc: number;
  shares_fd: number;
  shares_fd_label: "AFDS";
  sats_fd: number;
  sata_shares: number;
  sata_notional: number;
  debt: number;
  btc_yield_qtd: number | null;
  amplification: number | null;
  note: string;
  source_accession: string;
};

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

type RawQ = {
  as_of: string;
  btc: number;
  shares_fd: number;
  shares_fd_label: "AFDS";
  sats_fd: number;
  sata_shares: number;
  debt: number;
  btc_yield_qtd: number | null;
  amplification: number | null;
  note: string;
  source_accession: string;
};

const rows = raw as RawQ[];

export const ASST_QUARTERLY: AsstQuarterly[] = rows.map((r) => ({
  ...r,
  sata_notional: r.sata_shares * 100,
}));

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function check() {
  if (ASST_QUARTERLY.length !== 4) throw new Error("ASST quarterly length");
  if (ASST_QUARTERLY[0].as_of !== "2025-09-30" || ASST_QUARTERLY[3].as_of !== "2026-06-30") {
    throw new Error("ASST quarterly dates");
  }
  for (let i = 0; i < ASST_QUARTERLY.length; i++) {
    const r = ASST_QUARTERLY[i];
    const got = satsPerShare(r.btc, r.shares_fd);
    if (Math.abs(got - r.sats_fd) > 1) throw new Error("ASST quarterly sats " + r.as_of + " " + got);
    if (i > 0) {
      const y = round1(btcYield(ASST_QUARTERLY[i - 1].sats_fd, r.sats_fd) * 100);
      if (r.btc_yield_qtd == null || y !== r.btc_yield_qtd) {
        throw new Error("ASST quarterly yield " + r.as_of + " " + y);
      }
    }
  }
  const q1 = ASST_QUARTERLY[2];
  const ye = ASST_QUARTERLY[1];
  if (q1.btc - ye.btc !== 6001) throw new Error("Semler BTC");
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
  return ASST_QUARTERLY;
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
