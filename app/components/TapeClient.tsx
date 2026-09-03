"use client";
import { useMemo, useState } from "react";
import { AsstLiveKpis } from "./AsstLiveKpis";
import { COMPANIES, HERO_DEFAULT, satsForPill, type Pill } from "@/lib/tape";
import { formatBtc, formatSats, formatYieldPct } from "@/lib/sats";

function spark(start: number, end: number) {
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  const span = max - min || 1;
  const y1 = 26 - ((start - min) / span) * 20;
  const y2 = 26 - ((end - min) / span) * 20;
  const color = end >= start ? "#22c55e" : "#ff6b35";
  return <svg width="72" height="32" viewBox="0 0 72 32" aria-hidden="true"><polyline fill="none" stroke={color} strokeWidth="2" points={`4,${y1} 68,${y2}`} /></svg>;
}

export function TapeClient() {
  const [ticker, setTicker] = useState<string>(HERO_DEFAULT.ticker);
  const [pill, setPill] = useState<Pill>(HERO_DEFAULT.pill);
  const company = COMPANIES.find((c) => c.ticker === ticker) ?? COMPANIES[0];
  const value = useMemo(() => satsForPill(company, pill) ?? satsForPill(company, "basic") ?? 0, [company, pill]);
  const week = company.lastWeek;
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-number">{formatSats(value)}</div>
        <div className="hero-sub"><span className="muted">sats / share for </span><span className="ticker">${company.ticker}</span></div>
        <div className="pill-row">
          {(["basic", "fd", "clean"] as Pill[]).map((p, i) => {
            const disabled = satsForPill(company, p) == null;
            return (
              <span key={p}>
                {i > 0 ? <span className="sep"> · </span> : null}
                <button type="button" aria-pressed={pill === p} disabled={disabled} onClick={() => { if (!disabled) setPill(p); }}>{p === "fd" ? (company.fdLabel ?? "FD") : p}</button>
              </span>
            );
          })}
        </div>
        {week ? <div className={"verdict-pill " + week.verdict}>{week.label}</div> : null}
        {pill === "clean" && company.cleanNote ? <p className="clean-note">{company.cleanNote} ({company.cleanAsOf})</p> : null}
        <h1 className="tagline">Did they stack more Bitcoin than they printed shares?</h1>
        <p className="tagline-sub">Live BTC-per-share tape for treasury companies. Filings in plain English.</p>
      </section>
      <div className="section-head"><span><span className="dot"></span>Live treasury tape</span><span><span className="dot live"></span>SEC filings</span></div>
      <div className="tape-list">
        {COMPANIES.map((c) => {
          const shown = satsForPill(c, c.hasFdPill && pill === "fd" ? "fd" : "basic") ?? 0;
          return (
            <article key={c.ticker} className={"tape-card" + (c.ticker === ticker ? " selected" : "")} onClick={() => { setTicker(c.ticker); setPill(c.heroDefaultPill); }}>
              <div className="tape-card-top">
                <div className="company-id"><div className="company-icon">{c.ticker[0]}</div><div><div className="ticker">${c.ticker}</div><div className="name">{c.name}</div></div></div>
                <div className="activity-pills">{c.activities.map((a) => <span key={a.label} className={a.on ? "activity on" : "activity"}>{a.label}</span>)}</div>
              </div>
              <div className="stat-rows">
                <div className="stat-row"><span className="k">Bitcoin held</span><span className="v">{formatBtc(c.btc)} BTC</span></div>
                <div className="stat-row"><span className="k">sats / share</span><span className="v accent">{formatSats(c.ticker === ticker ? value : shown)}</span></div>
                {c.preferredShares != null ? <div className="stat-row"><span className="k">{c.preferredLabel} outstanding</span><span className="v">{c.preferredShares.toLocaleString("en-US")}</span></div> : null}
                {c.ticker === "ASST" ? <AsstLiveKpis compact /> : null}
              </div>
              {c.lastWeek ? <div className={"last-week " + c.lastWeek.verdict}>{c.lastWeek.label}</div> : null}
              {c.lastWeek ? spark(c.lastWeek.satsStart, c.lastWeek.satsEnd) : null}
            </article>
          );
        })}
      </div>
      <div className="desktop-table-wrap">
        <table className="desktop-table">
          <thead><tr><th>Company</th><th>Bitcoin held</th><th>sats / share</th><th>Last week</th><th>Activity</th></tr></thead>
          <tbody>
            {COMPANIES.map((c) => {
              const shown = satsForPill(c, c.hasFdPill && pill === "fd" ? "fd" : "basic") ?? 0;
              return (
                <tr key={c.ticker} className={c.ticker === ticker ? "selected" : ""} onClick={() => { setTicker(c.ticker); setPill(c.heroDefaultPill); }}>
                  <td><b>${c.ticker}</b><div className="name">{c.name}</div></td>
                  <td>{formatBtc(c.btc)}{c.pledgedBtc ? <div className="name">{formatBtc(c.pledgedBtc)} pledged</div> : null}</td>
                  <td className="sats-cell"><span className="btc-share">{formatSats(c.ticker === ticker ? value : shown)}</span></td>
                  <td>{c.lastWeek ? formatYieldPct(c.lastWeek.yield) : "flat"}</td>
                  <td>{c.activities.map((a) => <span key={a.label} className={a.on ? "activity on" : "activity"}>{a.label}</span>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
