"use client";
import { useEffect, useState } from "react";
import { formatRatioPct, formatUsdCompact } from "@/lib/strive-kpis";

type Live = { value: number | null; live: boolean };
type Sata = {
  notional: number;
  rate: number;
  annual_div: number;
  dividend_reserve_months: number;
  preferred_in_denom: boolean;
  amplification: Live;
  tav: Live;
  coverage_years: Live;
  breakeven_arr: Live;
  btc_spot: Live;
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
  return (
    <div className="panel" style={{ marginTop: "1.25rem" }}>
      <div className="panel-title">SATA · amplification, not sats</div>
      <p className="page-lead">Preferred equity. $100 stated amount × shares, never added to Class A+B or AFDS.</p>
      <div className="stat-row"><span className="k">Amplification</span><span className="v accent">{sata.amplification.value != null ? formatRatioPct(sata.amplification.value) : "—"}</span></div>
      <div className="stat-row"><span className="k">TAV</span><span className="v">{sata.tav.value != null ? formatUsdCompact(sata.tav.value) : "—"}</span></div>
      <div className="stat-row"><span className="k">Coverage</span><span className="v">{sata.coverage_years.value != null ? sata.coverage_years.value.toFixed(1) + "y" : "—"}</span></div>
      <div className="stat-row"><span className="k">Breakeven ARR</span><span className="v">{sata.breakeven_arr.value != null ? formatRatioPct(sata.breakeven_arr.value, 2) : "—"}</span></div>
      <div className="stat-row"><span className="k">Annual dividend</span><span className="v">{formatUsdCompact(sata.annual_div)}</span></div>
      <div className="stat-row"><span className="k">Dividend reserve</span><span className="v">{sata.dividend_reserve_months} months (policy)</span></div>
      <div className="stat-row"><span className="k">BTC spot</span><span className="v">{sata.btc_spot.value != null ? "$" + Math.round(sata.btc_spot.value).toLocaleString("en-US") : "—"}</span></div>
    </div>
  );
}
