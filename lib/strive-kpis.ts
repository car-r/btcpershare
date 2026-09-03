import { ASST_FILINGS } from "./asst-series";
import { satsPerShare } from "./sats";
import type { LiveField, Spot } from "./spot";

export const SATA_PAR = 100;
export const SATA_RATE = 0.13;
export const ASST_DEBT = 0;
export const DIVIDEND_RESERVE_MONTHS = 18;

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

function live(value: number | null, spot: Spot, note?: string | null): LiveField {
  return {
    value,
    as_of: spot.as_of,
    live: spot.live && value != null,
    note: note ?? null,
  };
}

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
  preferred_in_denom: false;
  amplification: LiveField;
  tav: LiveField;
  coverage_years: LiveField;
  breakeven_arr: LiveField;
  btc_spot: LiveField;
};

export function asstFilingTreasury() {
  const last = ASST_FILINGS[ASST_FILINGS.length - 1];
  if (last.cash_thousands == null || last.strc_fv == null || last.sata == null) {
    throw new Error("ASST last 8-K missing cash/STRC/SATA");
  }
  return {
    as_of: last.as_of,
    btc: last.btc,
    shares_basic: last.class_a + last.class_b,
    shares_fd: last.afds,
    sata_shares: last.sata,
    cash: thousandsToUsd(last.cash_thousands),
    strc_fv: thousandsToUsd(last.strc_fv),
    strc_held: last.strc_held,
    sats_basic: last.sats_basic,
    sats_fd: last.afds ? satsPerShare(last.btc, last.afds) : null,
  };
}

export function asstSataKpis(spot: Spot): AsstSataKpis {
  const t = asstFilingTreasury();
  const notional = sataNotional(t.sata_shares);
  const annual_div = annualDividend(notional);
  const px = spot.value;
  let amp: number | null = null;
  let tav: number | null = null;
  let years: number | null = null;
  let brk: number | null = null;
  if (px != null) {
    amp = amplification({ debt: ASST_DEBT, sataNotional: notional, btc: t.btc, btcSpot: px });
    tav = treasuryAssetValue({ btc: t.btc, btcSpot: px, cash: t.cash, strcFv: t.strc_fv });
    years = coverageYears(tav, annual_div);
    brk = breakevenArr(annual_div, tav);
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
    preferred_in_denom: false,
    amplification: live(amp, spot, "SATA notional / BTC FMV. Debt is 0. Preferred equity, not sats denom."),
    tav: live(tav, spot, "BTC FMV + cash + STRC FV"),
    coverage_years: live(years, spot, "TAV / annual SATA dividend"),
    breakeven_arr: live(brk, spot, "annual SATA dividend / TAV"),
    btc_spot: live(px, spot, spot.source),
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
  const div = annualDividend(n);
  const years = coverageYears(tav, div);
  const brk = breakevenArr(div, tav);
  if (Math.abs(amp - 0.481) > 0.002) throw new Error("amp fixture " + amp);
  if (Math.abs(tav / 1e9 - 2.12) > 0.02) throw new Error("TAV fixture " + tav);
  if (Math.abs(years - 18.0) > 0.15) throw new Error("coverage fixture " + years);
  if (Math.abs(brk - 0.0556) > 0.001) throw new Error("breakeven fixture " + brk);
}
checkFixture();
