import { ASST_FILINGS } from "./asst-series";
import { satsPerShare, btcYield } from "./sats";
import type { LiveField, Spot } from "./spot";

export const SATA_PAR = 100;
export const SATA_RATE = 0.13;
export const ASST_DEBT = 0;
export const DIVIDEND_RESERVE_MONTHS = 18;
export const PREFUNDED_WARRANTS = 0;
export const TRADITIONAL_WARRANTS = 26_596_000;

export function sataNotional(shares: number, par = SATA_PAR): number {
  return shares * par;
}

export function amplification(input: {
  debt: number;
  sataNotional: number;
  btc: number;
  btcSpot: number;
}): number {
  const fmv = input.btc * input.btcSpot;
  if (fmv <= 0) throw new Error("BTC FMV must be > 0");
  return (input.debt + input.sataNotional) / fmv;
}

export function treasuryAssetValue(input: {
  btc: number;
  btcSpot: number;
  cash: number;
  strcFv: number;
}): number {
  return input.btc * input.btcSpot + input.cash + input.strcFv;
}

export function netTreasuryAssetValue(tav: number, debt: number, preferred: number): number {
  return tav - debt - preferred;
}

export function enterpriseValue(input: {
  marketCap: number;
  debt: number;
  preferred: number;
  cash: number;
  strcFv: number;
}): number {
  return input.marketCap + input.debt + input.preferred - input.cash - input.strcFv;
}

export function annualDividend(notional: number, rate = SATA_RATE): number {
  return notional * rate;
}

export function coverageYears(tav: number, annualDiv: number): number {
  if (annualDiv <= 0) throw new Error("annual dividend must be > 0");
  return tav / annualDiv;
}

export function breakevenArr(annualDiv: number, tav: number): number {
  if (tav <= 0) throw new Error("TAV must be > 0");
  return annualDiv / tav;
}

export function thousandsToUsd(n: number): number {
  return n * 1000;
}

export function formatUsdCompact(n: number): string {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function formatRatioPct(n: number, digits = 1): string {
  return (n * 100).toFixed(digits) + "%";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function live(value: number | null, spot: Spot, note?: string | null): LiveField {
  return {
    value,
    as_of: spot.as_of,
    live: Boolean(spot.live && value != null),
    note: note ?? null,
  };
}

export const ASST_YIELD_LOCK = (() => {
  const q2 = 24.0;
  const q3Qtd = round1(btcYield(23465, 23990) * 100);
  const ytd = round1(btcYield(17037, 23990) * 100);
  if (q3Qtd !== 2.2) throw new Error("Q3 QTD lock " + q3Qtd);
  if (ytd !== 40.8) throw new Error("YTD lock " + ytd);
  return {
    denom: "AFDS" as const,
    q4_2025_pct: 22.2,
    q1_2026_pct: 11.1,
    q2_2026_pct: q2,
    q2_dashboard_rounds_to: 23.9,
    q3_qtd_pct: q3Qtd,
    ytd_2026_pct: ytd,
    note: "Filing-locked until next 8-K. Q2 keep 24.0 from the 8-K, not dashboard 23.9.",
  };
})();

export const ASST_CAP_MIX_000s = [
  { as_of: "2026-08-28", class_a: 83470, class_b: 9793, pf_warrants: 0, effective: 93263, afds: 96523, trad_warrants: 26596 },
  { as_of: "2026-06-30", class_a: 72165, class_b: 9780, pf_warrants: 0, effective: 81945, afds: 84653, trad_warrants: 26596 },
  { as_of: "2026-03-31", class_a: 59287, class_b: 9872, pf_warrants: 0, effective: 69159, afds: 71986, trad_warrants: 26596 },
  { as_of: "2025-12-31", class_a: 34937, class_b: 9777, pf_warrants: 54, effective: 44767, afds: 44767, trad_warrants: 26594 },
  { as_of: "2025-09-30", class_a: 22441, class_b: 10902, pf_warrants: 8862, effective: 42205, afds: 42205, trad_warrants: 27281 },
] as const;

export type AsstSataKpis = {
  shares: number;
  par: number;
  rate: number;
  notional: number;
  debt: number;
  cash: number;
  strc_fv: number;
  annual_div: number;
  dividend_reserve_months: number;
  dividend_reserve_years: 1.5;
  preferred_in_denom: false;
  prefunded_warrants: number;
  traditional_warrants: number;
  amplification: LiveField;
  tav: LiveField;
  ntav: LiveField;
  ntav_per_share_diluted: LiveField;
  coverage_years: LiveField;
  breakeven_arr: LiveField;
  btc_spot: LiveField;
  asst_px: LiveField;
  market_cap: LiveField;
  ev: LiveField;
  ev_tav: LiveField;
  multiple_to_ntav: LiveField;
  yield_lock: typeof ASST_YIELD_LOCK;
};

export function asstFilingTreasury() {
  const last = ASST_FILINGS[ASST_FILINGS.length - 1];
  if (last.cash_thousands == null || last.strc_fv == null || last.sata == null || last.afds == null) {
    throw new Error("ASST last 8-K missing cash/STRC/SATA/AFDS");
  }
  return {
    as_of: last.as_of,
    btc: last.btc,
    shares_basic: last.class_a + last.class_b + PREFUNDED_WARRANTS,
    shares_fd: last.afds,
    sata_shares: last.sata,
    cash: thousandsToUsd(last.cash_thousands),
    strc_fv: thousandsToUsd(last.strc_fv),
    strc_held: last.strc_held,
    sats_basic: last.sats_basic,
    sats_fd: satsPerShare(last.btc, last.afds),
  };
}

export function asstSataKpis(btcSpot: Spot, asstSpot: Spot): AsstSataKpis {
  const t = asstFilingTreasury();
  const notional = sataNotional(t.sata_shares);
  const annual_div = annualDividend(notional);
  const px = btcSpot.value;
  const asstPx = asstSpot.value;
  let amp: number | null = null;
  let tav: number | null = null;
  let ntav: number | null = null;
  let ntavShare: number | null = null;
  let years: number | null = null;
  let brk: number | null = null;
  let mkt: number | null = null;
  let ev: number | null = null;
  let evTav: number | null = null;
  let mktNtav: number | null = null;
  if (px != null) {
    amp = amplification({ debt: ASST_DEBT, sataNotional: notional, btc: t.btc, btcSpot: px });
    tav = treasuryAssetValue({ btc: t.btc, btcSpot: px, cash: t.cash, strcFv: t.strc_fv });
    ntav = netTreasuryAssetValue(tav, ASST_DEBT, notional);
    ntavShare = ntav / t.shares_fd;
    years = coverageYears(tav, annual_div);
    brk = breakevenArr(annual_div, tav);
    if (asstPx != null) {
      mkt = asstPx * t.shares_basic;
      ev = enterpriseValue({ marketCap: mkt, debt: ASST_DEBT, preferred: notional, cash: t.cash, strcFv: t.strc_fv });
      evTav = ev / tav;
      mktNtav = mkt / ntav;
    }
  }
  return {
    shares: t.sata_shares,
    par: SATA_PAR,
    rate: SATA_RATE,
    notional,
    debt: ASST_DEBT,
    cash: t.cash,
    strc_fv: t.strc_fv,
    annual_div,
    dividend_reserve_months: DIVIDEND_RESERVE_MONTHS,
    dividend_reserve_years: 1.5,
    preferred_in_denom: false,
    prefunded_warrants: PREFUNDED_WARRANTS,
    traditional_warrants: TRADITIONAL_WARRANTS,
    amplification: live(amp, btcSpot, "SATA notional / BTC FMV. Debt is 0. Preferred equity, not sats denom."),
    tav: live(tav, btcSpot, "BTC FMV + cash + STRC FV"),
    ntav: live(ntav, btcSpot, "TAV - debt - SATA liquidation preference"),
    ntav_per_share_diluted: live(ntavShare, btcSpot, "NTAV / AFDS (Strive default toggle)"),
    coverage_years: live(years, btcSpot, "TAV / annual SATA dividend"),
    breakeven_arr: live(brk, btcSpot, "annual SATA dividend / TAV"),
    btc_spot: live(px, btcSpot, btcSpot.source),
    asst_px: live(asstPx, asstSpot, asstSpot.source),
    market_cap: live(mkt, asstSpot, "ASST last x Effective (A+B, PF=0)"),
    ev: live(ev, asstSpot, "Mkt cap + debt + pref - cash - STRC"),
    ev_tav: live(evTav, asstSpot, "EV / TAV. Do not scrape mNAV."),
    multiple_to_ntav: live(mktNtav, asstSpot, "Market cap / NTAV"),
    yield_lock: ASST_YIELD_LOCK,
  };
}

function checkFixture() {
  const t = asstFilingTreasury();
  if (t.btc !== 23156 || t.sats_basic !== 24829 || t.sats_fd !== 23990) {
    throw new Error("ASST KPI lock sats");
  }
  if (t.sata_shares !== 9073914) throw new Error("ASST KPI lock SATA");
  const n = sataNotional(t.sata_shares);
  if (n !== 907391400) throw new Error("SATA notional");
  const spot = 81500;
  const amp = amplification({ debt: 0, sataNotional: n, btc: t.btc, btcSpot: spot });
  const tav = treasuryAssetValue({ btc: t.btc, btcSpot: spot, cash: t.cash, strcFv: t.strc_fv });
  const ntav = netTreasuryAssetValue(tav, 0, n);
  const div = annualDividend(n);
  const years = coverageYears(tav, div);
  const brk = breakevenArr(div, tav);
  if (Math.abs(amp - 0.481) > 0.002) throw new Error("amp fixture " + amp);
  if (Math.abs(tav / 1e9 - 2.12) > 0.02) throw new Error("TAV fixture " + tav);
  if (Math.abs(ntav / 1e9 - 1.21) > 0.02) throw new Error("NTAV fixture " + ntav);
  if (Math.abs(ntav / t.shares_fd - 12.58) > 0.05) throw new Error("NTAV/share " + ntav / t.shares_fd);
  if (Math.abs(years - 18.0) > 0.15) throw new Error("coverage fixture " + years);
  if (Math.abs(brk - 0.0556) > 0.001) throw new Error("breakeven fixture " + brk);
  const cashStrcYears = (t.cash + t.strc_fv) / div;
  if (Math.abs(cashStrcYears - 1.97) > 0.05) throw new Error("cash+STRC coverage sanity " + cashStrcYears);
  if (DIVIDEND_RESERVE_MONTHS !== 18) throw new Error("reserve is policy 18 months");
}
checkFixture();
