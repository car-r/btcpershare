import { ACCRETION_PRESETS, COMPANIES, satsForPill, type Company } from "./tape";
import { asstSeries, ASST_SERIES } from "./asst-series";
import { satsPerShare, type Verdict } from "./sats";
import { asstSataKpis, type AsstSataKpis } from "./strive-kpis";
import { fetchAsstLast, fetchBtcSpot, fetchEquityLast, mnavMktCap, type LiveField, type Spot } from "./spot";
import { bars as filingBars, latest as latestFiling } from "./filings";

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
  /** Always market-cap mNAV; never EV. */
  mnav_basis: "mkt_cap";
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
  const f = latestFiling(c.ticker);
  if (f?.accession) return f.accession;
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
    price: { value: c.priceSnapshot, as_of: c.cleanAsOf, live: false },
    mnav: { value: c.mnavSnapshot, as_of: c.cleanAsOf, live: false },
    mnav_basis: "mkt_cap",
    clean: { value: c.cleanSats, as_of: c.cleanAsOf, live: false, note: c.cleanNote },
    sata: null,
  };
}

export async function tapeSnapshot() {
  const [btcSpot, mstrPx, asstSpot, xxiPx]: [Spot, Spot, Spot, Spot] = await Promise.all([
    fetchBtcSpot(),
    fetchEquityLast("MSTR"),
    fetchAsstLast(),
    fetchEquityLast("XXI"),
  ]);
  const pxByTicker: Record<string, Spot> = {
    MSTR: mstrPx,
    ASST: asstSpot,
    XXI: xxiPx,
  };

  return {
    feed: "snapshot" as const,
    disclaimer:
      "Not financial advice. BTC and share counts are filing-locked until the next 8-K. mNAV shown is market-cap mNAV (not EV). Amp/TAV/NTAV/coverage are live (BTC spot). SATA is preferred equity, not in sats/share.",
    btc_spot: btcSpot,
    asst_px: asstSpot,
    companies: COMPANIES.map((c) => {
      const row = snapshotRow(c);
      const px = pxByTicker[c.ticker] ?? { value: null, as_of: null, live: false, source: null };
      // LIVE mNAV only — never stored on a filing
      const liveMnav = mnavMktCap(px.value, c.basicShares, c.btc, btcSpot.value);
      const priceField: LiveField =
        px.value != null
          ? { value: px.value, as_of: px.as_of, live: px.live }
          : { value: c.priceSnapshot, as_of: c.cleanAsOf, live: false };
      const mnavField: LiveField =
        liveMnav != null
          ? { value: liveMnav, as_of: px.as_of ?? btcSpot.as_of, live: true }
          : c.mnavSnapshot != null
            ? { value: c.mnavSnapshot, as_of: c.cleanAsOf, live: false }
            : { value: null, as_of: null, live: false };
      const next = { ...row, price: priceField, mnav: mnavField, mnav_basis: "mkt_cap" as const };
      if (c.ticker !== "ASST") return next;
      return { ...next, sata: asstSataKpis(btcSpot, asstSpot) };
    }),
  };
}

export function seriesFor(ticker: string): SeriesPoint[] {
  const c = COMPANIES.find((x) => x.ticker.toUpperCase() === ticker.toUpperCase());
  if (!c) return [];
  if (c.ticker === "ASST") return asstSeries();

  // MSTR tape series = 2 pts only (prior-week lock + latest). Do not invent weekly ADSO history.
  const f = latestFiling(c.ticker);
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
    btc_yield_pct:
      f?.satsChgPct != null ? Math.round(f.satsChgPct * 10000) / 100 : null,
    accession: accessionFrom(c),
    url: c.sources.find((s) => s.includes("sec.gov")) ?? null,
  };

  if (c.ticker === "XXI") return [latest];

  const preset = ACCRETION_PRESETS.find((p) => p.ticker === c.ticker);
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

/** Yield bars for one ticker (numeric satsChgPct rows only). */
export function barsFor(ticker: string) {
  return filingBars(ticker).map((r) => ({
    ticker: r.ticker,
    periodEnd: r.periodEnd,
    filedAt: r.filedAt,
    satsChgPct: r.satsChgPct as number,
    verdict: r.verdict,
    satsAdso: r.satsAdso,
    satsBasic: r.satsBasic,
  }));
}
