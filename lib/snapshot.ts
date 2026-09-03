import { ACCRETION_PRESETS, COMPANIES, satsForPill, type Company } from "./tape";
import { asstSeries, ASST_SERIES } from "./asst-series";
import { satsPerShare, type Verdict } from "./sats";
import { asstSataKpis, type AsstSataKpis } from "./strive-kpis";
import { fetchBtcSpot, type LiveField, type Spot } from "./spot";

export type { LiveField };

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
  preferred_in_denom: boolean;
  strc_held: number | null;
  verdict: Verdict | null;
  price: LiveField;
  mnav: LiveField;
  clean: LiveField;
  sata: AsstSataKpis | null;
};

export type SeriesPoint = {
  ticker?: string;
  as_of: string | null;
  filing_date?: string | null;
  btc: number;
  pledged_btc?: number | null;
  shares_basic: number;
  shares_fd: number | null;
  shares_fd_label?: string | null;
  sats_basic: number;
  sats_fd: number | null;
  sata_shares: number | null;
  strc_held: number | null;
  verdict: Verdict | null;
  btc_yield_pct?: number | null;
  accession: string | null;
  url: string | null;
  format?: string | null;
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
  return c.preferredShares;
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
    preferred_in_denom: c.preferredInDenom,
    strc_held: c.ticker === "ASST" ? (ASST_SERIES[ASST_SERIES.length - 1]?.strc_held ?? 505000) : null,
    verdict: c.lastWeek?.verdict ?? null,
    price: { value: c.priceSnapshot, as_of: c.cleanAsOf, live: true },
    mnav: { value: c.mnavSnapshot, as_of: c.cleanAsOf, live: true },
    clean: { value: c.cleanSats, as_of: c.cleanAsOf, live: true, note: c.cleanNote },
    sata: null,
  };
}

export async function tapeSnapshot() {
  const spot: Spot = await fetchBtcSpot();
  return {
    feed: "snapshot" as const,
    disclaimer: "Not financial advice. BTC and share counts are filing-locked until the next 8-K. Amplification, TAV, and coverage are live (BTC spot). SATA is preferred equity, not in sats/share.",
    btc_spot: spot,
    companies: COMPANIES.map((c) => {
      const row = snapshotRow(c);
      if (c.ticker !== "ASST") return row;
      return { ...row, sata: asstSataKpis(spot) };
    }),
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
    url: c.sources.find((s) => s.includes("sec.gov")) ?? null,
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
    sata_shares: null,
    strc_held: null,
    verdict: null,
    accession: null,
    url: null,
  };
  return [prior, latest];
}
