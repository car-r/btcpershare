"use client";
import { useMemo, useState } from "react";
import { COMPANIES, satsForPill, type Pill } from "@/lib/tape";
import { formatSats } from "@/lib/sats";
import {
  SHARES_DEFAULT_N,
  SHARES_PRESETS,
  chartPointsFor,
  formatClaimedBtc,
  liveClaimed,
  sharesSeriesFor,
} from "@/lib/shares-over-time";
import { ShareCard } from "./ShareCard";
import { SharesOverTimeChart } from "./SharesOverTimeChart";

export function SatsCalc() {
  const [ticker, setTicker] = useState("MSTR");
  const [pill, setPill] = useState<Pill>("fd");
  const [n, setN] = useState(SHARES_DEFAULT_N);
  const company = COMPANIES.find((c) => c.ticker === ticker)!;
  const available: Pill[] = (["basic", "fd", "clean"] as Pill[]).filter((p) => satsForPill(company, p) != null);
  const safe = available.includes(pill) ? pill : "basic";
  const value = satsForPill(company, safe) ?? 0;

  const series = sharesSeriesFor(ticker);
  const live = liveClaimed(ticker, n);
  const chartPts = useMemo(() => chartPointsFor(ticker, n), [ticker, n]);
  const claimed = live?.btc ?? (n * value) / 100_000_000;

  return (
    <div className="container">
      <h1 className="page-title">sats / share</h1>
      <p className="page-lead">basic, FD, and clean pills that actually change the number.</p>
      <div className="field"><label>Company</label>
        <select value={ticker} onChange={(e) => { setTicker(e.target.value); setPill("fd"); }}>
          {COMPANIES.map((c) => <option key={c.ticker} value={c.ticker}>${c.ticker} {c.name}</option>)}
        </select>
      </div>
      <div className="pill-row">
        {available.map((p) => (
          <button key={p} type="button" aria-pressed={safe === p} onClick={() => setPill(p)}>{p === "fd" ? (company.fdLabel ?? "FD") : p}</button>
        ))}
      </div>
      <div className="hero-number">{formatSats(value)}</div>
      <div className="hero-sub">sats / share</div>
      {safe === "clean" && company.cleanNote ? <p className="page-lead">{company.cleanNote}</p> : null}

      <section className="panel" style={{ marginTop: "1.25rem" }} aria-label="BTC claimed over time">
        <div className="panel-title">BTC claimed by N shares</div>
        <div className="shares-presets" role="group" aria-label="Share presets">
          {SHARES_PRESETS.map((p) => (
            <button key={p} type="button" className="shares-preset" aria-pressed={n === p} onClick={() => setN(p)}>{p}</button>
          ))}
        </div>
        <p className="my-shares-out">
          {n} ${ticker} → {formatClaimedBtc(claimed)} BTC
          {live ? ` → ${live.sats.toLocaleString("en-US")} sats` : null}
        </p>
        <p className="my-shares-basis muted">
          {(series?.denomLabel ?? (safe === "fd" ? (company.fdLabel ?? "ADSO") : safe))} · split-adjusted
        </p>
        {series && chartPts.length > 0 ? (
          <>
            <SharesOverTimeChart
              points={chartPts}
              ticker={ticker}
              n={n}
              denomLabel={series.denomLabel}
            />
            <ShareCard
              ticker={ticker}
              n={n}
              btc={claimed}
              points={chartPts}
              denomLabel={series.denomLabel}
            />
          </>
        ) : (
          <>
            <p className="shares-no-series muted">Live claim only — no seed series for ${ticker}.</p>
            <ShareCard ticker={company.ticker} line={formatSats(value) + " sats/share"} sub={safe === "fd" ? (company.fdLabel ?? "FD") : safe} />
          </>
        )}
      </section>
    </div>
  );
}
