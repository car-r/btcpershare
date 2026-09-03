"use client";
import { useEffect, useState } from "react";
import { formatRatioPct, formatUsdCompact } from "@/lib/strive-kpis";

type Live = { value: number | null; live: boolean };
type YieldLock = { q2_2026_pct: number; q3_qtd_pct: number; ytd_2026_pct: number; q4_2025_pct: number; q1_2026_pct: number };
type Sata = {
  notional: number;
  rate: number;
  annual_div: number;
  dividend_reserve_months: number;
  preferred_in_denom: boolean;
  amplification: Live;
  tav: Live;
  ntav: Live;
  ntav_per_share_diluted: Live;
  coverage_years: Live;
  breakeven_arr: Live;
  btc_spot: Live;
  asst_px: Live;
  ev: Live;
  ev_tav: Live;
  yield_lock: YieldLock;
};

export function AsstLiveKpis({ compact = false }: { compact?: boolean }) {
  const [sata, setSata] = useState<Sata | null>(null);
  useEffect(() => {
    fetch("/api/tape")
      .then((r) => r.json())
      .then((j: { companies?: { ticker: string; sata: Sata | null }[] }) => {
        const row = j.companies?.find((c) => c.ticker === "ASST");
        setSata(row?.sata ?? null);
      })
      .catch(() => setSata(null));
  }, []);
  if (!sata) return null;
  if (compact) {
    if (sata.amplification.value == null) return null;
    return (
      <div className="stat-row">
        <span className="k">SATA amp</span>
        <span className="v">{formatRatioPct(sata.amplification.value)}</span>
      </div>
    );
  }
  const y = sata.yield_lock;
  return (
    <div className="panel" style={{ marginTop: "1.25rem" }}>
      <div className="panel-title">SATA · amplification, not sats</div>
      <p className="page-lead">Preferred equity. $100 liquidation preference, never in Effective or AFDS. Dividend reserve is 18 months policy, not cash+STRC.</p>
      <div className="stat-row"><span className="k">Amplification</span><span className="v accent">{sata.amplification.value != null ? formatRatioPct(sata.amplification.value) : "—"}</span></div>
      <div className="stat-row"><span className="k">TAV</span><span className="v">{sata.tav.value != null ? formatUsdCompact(sata.tav.value) : "—"}</span></div>
      <div className="stat-row"><span className="k">NTAV</span><span className="v">{sata.ntav.value != null ? formatUsdCompact(sata.ntav.value) : "—"}</span></div>
      <div className="stat-row"><span className="k">NTAV / AFDS</span><span className="v">{sata.ntav_per_share_diluted.value != null ? "$" + sata.ntav_per_share_diluted.value.toFixed(2) : "—"}</span></div>
      <div className="stat-row"><span className="k">EV</span><span className="v">{sata.ev.value != null ? formatUsdCompact(sata.ev.value) : "—"}</span></div>
      <div className="stat-row"><span className="k">EV / TAV</span><span className="v">{sata.ev_tav.value != null ? sata.ev_tav.value.toFixed(2) + "x" : "—"}</span></div>
      <div className="stat-row"><span className="k">Coverage</span><span className="v">{sata.coverage_years.value != null ? sata.coverage_years.value.toFixed(1) + "y" : "—"}</span></div>
      <div className="stat-row"><span className="k">Breakeven ARR</span><span className="v">{sata.breakeven_arr.value != null ? formatRatioPct(sata.breakeven_arr.value, 2) : "—"}</span></div>
      <div className="stat-row"><span className="k">Annual dividend</span><span className="v">{formatUsdCompact(sata.annual_div)}</span></div>
      <div className="stat-row"><span className="k">Dividend reserve</span><span className="v">{sata.dividend_reserve_months} months / 1.5y (policy)</span></div>
      <div className="stat-row"><span className="k">Q3 QTD yield</span><span className="v">+{y.q3_qtd_pct.toFixed(1)}% AFDS</span></div>
      <div className="stat-row"><span className="k">YTD yield</span><span className="v">+{y.ytd_2026_pct.toFixed(1)}% AFDS</span></div>
      <div className="stat-row"><span className="k">BTC spot</span><span className="v">{sata.btc_spot.value != null ? "$" + Math.round(sata.btc_spot.value).toLocaleString("en-US") : "—"}</span></div>
    </div>
  );
}
