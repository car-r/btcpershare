import { satsPerShare, btcYield, verdictFromYield, type Verdict } from "./sats";
import { latest as latestFiling, sataShares, type FilingRow } from "./filings";

export type Pill = "basic" | "fd" | "clean";

export type ActivityPill = { label: string; on: boolean };

export type LastBuy = { btc: number | null; avgPx: number | null; note: string };

export type LastWeek = {
  verdict: Verdict;
  yield: number;
  satsStart: number;
  satsEnd: number;
  basis: string;
  label: string;
};

export type Company = {
  ticker: string;
  name: string;
  asOf: string;
  btc: number;
  pledgedBtc?: number;
  basicShares: number;
  basicLabel: string;
  fdShares: number | null;
  fdLabel: string | null;
  cleanSats: number | null;
  cleanNote: string | null;
  cleanAsOf: string | null;
  mnavSnapshot: number | null;
  priceSnapshot: number | null;
  activities: ActivityPill[];
  lastBuy: LastBuy;
  lastWeek: LastWeek | null;
  preferredShares: number | null;
  preferredLabel: string | null;
  preferredInDenom: boolean;
  hasFdPill: boolean;
  sources: string[];
  heroDefaultPill: Pill;
};

function assertSats(label: string, btc: number, shares: number, expected: number) {
  const got = satsPerShare(btc, shares);
  if (got !== expected) {
    throw new Error(`sats assert failed for ${label}: got ${got}, expected ${expected}`);
  }
}

function lastWeekFromFiling(
  f: FilingRow,
  basis: string,
  satsEnd: number,
  labelFmt: (y: number, start: number, end: number) => string,
): LastWeek | null {
  if (f.satsChgPct == null || f.verdict == null || f.satsPrevAdso == null) return null;
  const y = f.satsChgPct;
  return {
    verdict: f.verdict,
    yield: y,
    satsStart: f.satsPrevAdso,
    satsEnd,
    basis,
    label: labelFmt(y, f.satsPrevAdso, satsEnd),
  };
}

export const MSTR: Company = (() => {
  const f = latestFiling("MSTR");
  if (!f || f.btcHeld == null || f.adso == null || f.basicShares == null || f.satsAdso == null) {
    throw new Error("MSTR latest filing incomplete");
  }
  const btc = f.btcHeld;
  const basicShares = f.basicShares;
  const adso = f.adso;
  const fdso = 424479000; // do not use for FD pill
  void fdso;
  assertSats("MSTR basic", btc, basicShares, 200971);
  assertSats("MSTR ADSO", btc, adso, 187751);
  const satsAdso = f.satsAdso;
  const y = f.satsChgPct ?? btcYield(f.satsPrevAdso ?? 188628, satsAdso);
  const v = f.verdict ?? verdictFromYield(y);
  const lastWeekStart = f.satsPrevAdso ?? 188628;
  return {
    ticker: "MSTR",
    name: "Strategy",
    asOf: f.periodEnd,
    btc,
    basicShares,
    basicLabel: "basic",
    fdShares: adso,
    fdLabel: "ADSO",
    cleanSats: 156056,
    cleanNote: "strategy.com snapshot fallback — mNAV 1.12× · MSTR $141.64",
    cleanAsOf: "Sep 3, 2026 2:50pm ET",
    mnavSnapshot: 1.12,
    priceSnapshot: 141.64,
    activities: [{ label: "ATM on", on: f.atmOn !== false }],
    lastBuy: {
      btc: f.btcBought,
      avgPx: 80318,
      note: "+4,603 BTC @ $80,318 (sold 4,531,421 MSTR Aug 24–30)",
    },
    lastWeek: {
      verdict: v,
      yield: y,
      satsStart: lastWeekStart,
      satsEnd: satsAdso,
      basis: "ADSO",
      label: `DILUTIVE -0.46% ADSO (188,628 → 187,751)`,
    },
    preferredShares: null,
    preferredLabel: null,
    preferredInDenom: false,
    hasFdPill: true,
    sources: [
      f.url ?? "https://www.sec.gov/Archives/edgar/data/1050446/000119312526375463/mstr-20260831.htm",
      "https://www.strategy.com/shares",
    ],
    heroDefaultPill: "fd",
  };
})();

export const ASST: Company = (() => {
  const f = latestFiling("ASST");
  if (!f || f.btcHeld == null || f.basicShares == null || f.adso == null || f.satsBasic == null) {
    throw new Error("ASST latest filing incomplete");
  }
  const btc = f.btcHeld; // do not add estimated +143 BTC from Sep 3 SATA
  const effectiveCommon = f.basicShares;
  const afds = f.adso;
  const sataOutstanding = sataShares(f);
  assertSats("ASST effective", btc, effectiveCommon, 24829);
  assertSats("ASST AFDS", btc, afds, 23990);
  const lastWeekStart = f.satsPrevAdso ?? 23813;
  const lastWeekEnd = f.satsBasic;
  // Prefer filing-copied chg; display still +4.3% via formatYieldPct
  const y = f.satsChgPct ?? btcYield(lastWeekStart, lastWeekEnd);
  const v = f.verdict ?? verdictFromYield(y);
  return {
    ticker: "ASST",
    name: "Strive",
    asOf: f.periodEnd,
    btc,
    basicShares: effectiveCommon,
    basicLabel: "basic",
    fdShares: afds,
    fdLabel: "AFDS",
    cleanSats: null,
    cleanNote: null,
    cleanAsOf: null,
    mnavSnapshot: null,
    priceSnapshot: null,
    activities: [
      { label: "ATM on", on: f.atmOn !== false },
      { label: "SATA on", on: f.sataOn !== false },
    ],
    lastBuy: {
      btc: f.btcBought,
      avgPx: 79431,
      note: "+1,800 BTC @ $79,431 vs +3,579,147 common + 803,099 SATA",
    },
    lastWeek: {
      verdict: v,
      yield: y,
      satsStart: lastWeekStart,
      satsEnd: lastWeekEnd,
      basis: "effective",
      label: "ACCRETIVE +4.3% (23,813 → 24,829)",
    },
    preferredShares: sataOutstanding,
    preferredLabel: "SATA",
    preferredInDenom: false,
    hasFdPill: true,
    sources: [
      f.url ?? "https://www.sec.gov/Archives/edgar/data/1920406/000162828026059468/asst-20260831.htm",
    ],
    heroDefaultPill: "basic",
  };
})();

export const XXI: Company = (() => {
  const f = latestFiling("XXI");
  if (!f || f.btcHeld == null || f.basicShares == null || f.satsBasic == null) {
    throw new Error("XXI latest filing incomplete");
  }
  const btc = f.btcHeld;
  const classA = f.basicShares;
  const classB = 215736011; // NO economic rights — do not dilute
  void classB;
  assertSats("XXI classA", btc, classA, 12553);
  const lw = lastWeekFromFiling(f, "classA", f.satsBasic, () => "FLAT");
  return {
    ticker: "XXI",
    name: "Twenty One",
    asOf: f.periodEnd,
    btc,
    pledgedBtc: f.pledgedBtc ?? undefined,
    basicShares: classA,
    basicLabel: "basic",
    fdShares: null,
    fdLabel: null,
    cleanSats: null,
    cleanNote: null,
    cleanAsOf: null,
    mnavSnapshot: null,
    priceSnapshot: null,
    activities: [{ label: "ATM off", on: f.atmOn === true }],
    lastBuy: {
      btc: null,
      avgPx: null,
      note: "No H1 2026 buys; 10-Q as of Jun 30 still 43,514 BTC",
    },
    lastWeek: lw ?? {
      verdict: "flat",
      yield: 0,
      satsStart: f.satsBasic,
      satsEnd: f.satsBasic,
      basis: "classA",
      label: "FLAT",
    },
    preferredShares: null,
    preferredLabel: null,
    preferredInDenom: false,
    hasFdPill: false,
    sources: [
      f.url ??
        "https://www.sec.gov/Archives/edgar/data/2070457/000121390026087471/ea0299640-10q_twentyone.htm",
    ],
    heroDefaultPill: "basic",
  };
})();

export const COMPANIES: Company[] = [MSTR, ASST, XXI];

export const HERO_DEFAULT = {
  ticker: "MSTR" as const,
  pill: "fd" as Pill,
  sats: 187751,
};

export function satsForPill(c: Company, pill: Pill): number | null {
  if (pill === "basic") return satsPerShare(c.btc, c.basicShares);
  if (pill === "fd") {
    if (!c.hasFdPill || c.fdShares == null) return null;
    return satsPerShare(c.btc, c.fdShares);
  }
  return c.cleanSats;
}

export type AccretionPreset = {
  id: string;
  ticker: string;
  name: string;
  startBtc: number;
  startShares: number;
  buyBtc: number;
  buyPx: number;
  issueCommon: number;
  issuePreferred: number;
  cashRaised: number;
  preferredInDenom: boolean;
  expectedSatsStart: number;
  expectedSatsEnd: number;
  expectedVerdict: Verdict;
};

export const ACCRETION_PRESETS: AccretionPreset[] = [
  {
    id: "ASST",
    ticker: "ASST",
    name: "Strive",
    startBtc: 21356,
    startShares: 89683423,
    buyBtc: 1800,
    buyPx: 79431,
    issueCommon: 3579147,
    issuePreferred: 803099,
    cashRaised: 154.6e6,
    preferredInDenom: false,
    expectedSatsStart: 23813,
    expectedSatsEnd: 24829,
    expectedVerdict: "accretive",
  },
  {
    id: "MSTR",
    ticker: "MSTR",
    name: "Strategy",
    startBtc: 840447,
    startShares: 445558579,
    buyBtc: 4603,
    buyPx: 80318,
    issueCommon: 4531421,
    issuePreferred: 0,
    cashRaised: 602.8e6,
    preferredInDenom: false,
    expectedSatsStart: 188628,
    expectedSatsEnd: 187751,
    expectedVerdict: "dilutive",
  },
];

export function runAccretion(p: {
  startBtc: number;
  startShares: number;
  buyBtc: number;
  issueCommon: number;
  issuePreferred: number;
  preferredInDenom: boolean;
}) {
  const satsStart = satsPerShare(p.startBtc, p.startShares);
  const endBtc = p.startBtc + p.buyBtc;
  const endShares =
    p.startShares + p.issueCommon + (p.preferredInDenom ? p.issuePreferred : 0);
  const satsEnd = satsPerShare(endBtc, endShares);
  const y = btcYield(satsStart, satsEnd);
  return { satsStart, satsEnd, endBtc, endShares, yield: y, verdict: verdictFromYield(y) };
}

for (const p of ACCRETION_PRESETS) {
  const r = runAccretion(p);
  if (r.satsStart !== p.expectedSatsStart || r.satsEnd !== p.expectedSatsEnd) {
    throw new Error(
      `accretion preset ${p.id}: got ${r.satsStart}→${r.satsEnd}, expected ${p.expectedSatsStart}→${p.expectedSatsEnd}`,
    );
  }
  if (r.verdict !== p.expectedVerdict) {
    throw new Error(`accretion preset ${p.id}: verdict ${r.verdict} ≠ ${p.expectedVerdict}`);
  }
}
