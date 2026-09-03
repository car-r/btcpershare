import { ACCRETION_PRESETS, COMPANIES, satsForPill, type Company } from "./tape";
import { asstSeries } from "./asst-series";
import { satsPerShare, type Verdict } from "./sats";

export type LiveField = { value: number | null; as_of: string | null; live: boolean; note?: string | null };

export type TapeSnapshotRow = {
  ticker: string;
  name: string;
  as_of: string | null;
  accession: string | null;
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
  price: LiveField;
  mnav: LiveField;
  clean: LiveField;
};

export type SeriesPoint = {
  as_of: string | null;
  btc: number;
  shares_basic: number;
  shares_fd: number | null;
  sats_basic: number;
  sats_fd: number | null;
  sata_shares: number | null;
  strc_held: number | null;
  verdict: Verdict | null;
  accession: string | null;
};

function accessionFrom(c: Company): string | null {
  const src = c.sources.find((s) => s.includes("sec.gov"));
  if (!src) return null;
  const parts = src.split("/");
  const raw = parts.find((p) => p.length === 18 && /^[0-9]+$/.test(p));
  if (!raw) return null;
  return raw.slice(0, 10) + "-" + raw.slice(10, 12) + "-" + raw.slice(12);
}

function sataShares(c: Company): number | null {
  return c.ticker === "ASST" ? 9_073_914 : null;
}

export function snapshotRow(c: Company): TapeSnapshotRow {
  return {
    ticker: c.ticker,
    name: c.name,
    as_of: c.asOf,
    accession: accessionFrom(c),
    btc: c.btc,
    pledged_btc: c.pledgedBtc ?? null,
    shares_basic: c.basicShares,
    shares_fd: c.fdShares,
    shares_fd_label: c.fdLabel,
    sats_basic: satsForPill(c, "basic") ?? 0,
    sats_fd: satsForPill(c, "fd"),
    sata_shares: sataShares(c),
    strc_held: null,
    verdict: c.lastWeek?.verdict ?? null,
    price: { value: c.priceSnapshot, as_of: c.cleanAsOf, live: true },
    mnav: { value: c.mnavSnapshot, as_of: c.cleanAsOf, live: true },
    clean: { value: c.cleanSats, as_of: c.cleanAsOf, live: true, note: c.cleanNote },
  };
}

export function tapeSnapshot() {
  return {
    feed: "snapshot" as const,
    disclaimer: "Not financial advice. BTC and share counts are filing-locked until the next 8-K. price, mNAV, and clean are live fields.",
    companies: COMPANIES.map(snapshotRow),
  };
}

export function seriesFor(ticker: string): SeriesPoint[] {
  const c = COMPANIES.find((x) => x.ticker.toUpperCase() === ticker.toUpperCase());
  if (!c) return [];
  if (c.ticker === "ASST") return asstSeries();
  const preset = ACCRETION_PRESETS.find((p) => p.ticker === c.ticker);
  const latest: SeriesPoint = {
    as_of: c.asOf,
    btc: c.btc,
    shares_basic: c.basicShares,
    shares_fd: c.fdShares,
    sats_basic: satsForPill(c, "basic") ?? 0,
    sats_fd: satsForPill(c, "fd"),
    sata_shares: sataShares(c),
    strc_held: null,
    verdict: c.lastWeek?.verdict ?? null,
    accession: accessionFrom(c),
  };
  if (!preset) return [latest];
  const priorBtc = preset.startBtc;
  const priorBasic = preset.startShares;
  const priorFd = c.ticker === "MSTR" ? preset.startShares : null;
  const prior: SeriesPoint = {
    as_of: null,
    btc: priorBtc,
    shares_basic: priorBasic,
    shares_fd: priorFd,
    sats_basic: satsPerShare(priorBtc, priorBasic),
    sats_fd: priorFd ? satsPerShare(priorBtc, priorFd) : null,
    sata_shares: c.ticker === "ASST" ? 8_270_815 : null,
    strc_held: null,
    verdict: null,
    accession: null,
  };
  if (c.ticker === "ASST") prior.sata_shares = 9_073_914 - 803_099;
  return [prior, latest];
}
