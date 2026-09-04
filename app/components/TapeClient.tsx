"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { COMPANIES, HERO_DEFAULT, satsForPill, type Pill } from "@/lib/tape";
import { formatBtc, formatSats, formatYieldPct } from "@/lib/sats";
import { Tip } from "./Tip";

type LiveField = { value: number | null; as_of: string | null; live: boolean };
type TapeRow = {
  ticker: string;
  mnav: LiveField;
  price: LiveField;
};

function fmtMnav(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(2) + "×";
}

function payCaption(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "Live mNAV loading…";
  return `you pay $${n.toFixed(2)} for $1 of Bitcoin on the balance sheet`;
}

function weekPct(y: number): string {
  return formatYieldPct(y);
}

function latestFilingEnglish(): string {
  // Most recent locked filing on the tape (MSTR Aug 30).
  return "Strategy (as of Aug 30): bought 4,603 BTC at about $80,318 and sold 4.53M shares to fund it. Assumed-diluted sats/share fell 0.46%. Strive’s Aug 28 print: +1,800 BTC vs new common + SATA — basic sats/share up 4.3%. Twenty One’s Jun 30 10-Q still shows 43,514 BTC, flat.";
}

export function TapeClient() {
  const [ticker, setTicker] = useState<string>(HERO_DEFAULT.ticker);
  const [pill, setPill] = useState<Pill>(HERO_DEFAULT.pill);
  const [shares, setShares] = useState(100);
  const [liveByTicker, setLiveByTicker] = useState<Record<string, TapeRow>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tape")
      .then((r) => r.json())
      .then((j: { companies?: TapeRow[] }) => {
        if (cancelled || !j.companies) return;
        const map: Record<string, TapeRow> = {};
        for (const row of j.companies) map[row.ticker] = row;
        setLiveByTicker(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const company = COMPANIES.find((c) => c.ticker === ticker) ?? COMPANIES[0];
  const value = useMemo(
    () => satsForPill(company, pill) ?? satsForPill(company, "basic") ?? 0,
    [company, pill],
  );
  const week = company.lastWeek;
  const heroLive = liveByTicker[company.ticker];
  const heroMnav = heroLive?.mnav?.value ?? null;
  const rowMnav = (tk: string) => liveByTicker[tk]?.mnav?.value ?? null;

  const mySats = value * Math.max(0, shares);
  const myBtc = mySats / 100_000_000;

  const pillLabel = pill === "fd" ? (company.fdLabel ?? "ADSO") : pill;

  return (
    <div className="container">
      {/* 1) Pitch above big numbers */}
      <p className="pitch">
        Companies that buy Bitcoin with stock can make each share own more Bitcoin — or less. This site
        watches that number, and the price tag on it.
      </p>

      {/* 2) Dual hero — MSTR default left sats, right live mNAV */}
      <section className="dual-hero" aria-label="Hero">
        <div className="hero-left">
          <div className="hero-number">{formatSats(value)}</div>
          <div className="hero-sub">
            <Tip label="sats/share" className="tip-inline">
              sats/share
            </Tip>
            <span className="muted"> · </span>
            <span className="ticker">${company.ticker}</span>
            <span className="muted"> · </span>
            <Tip label={pillLabel} className="tip-inline">
              {pillLabel}
            </Tip>
          </div>
          <div className="pill-row">
            {(["basic", "fd", "clean"] as Pill[]).map((p, i) => {
              const disabled = satsForPill(company, p) == null;
              const lab = p === "fd" ? (company.fdLabel ?? "FD") : p;
              return (
                <span key={p}>
                  {i > 0 ? <span className="sep"> · </span> : null}
                  <button
                    type="button"
                    aria-pressed={pill === p}
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) setPill(p);
                    }}
                  >
                    {lab}
                  </button>
                </span>
              );
            })}
          </div>
          {week ? (
            <div className={"verdict-pill " + week.verdict}>
              <Tip
                label={week.verdict}
                className={"tip-inline tip-verdict " + week.verdict}
              >
                {week.verdict} {weekPct(week.yield)} this week
              </Tip>
            </div>
          ) : null}
        </div>

        <div className="hero-right">
          <div className="mnav-number">{fmtMnav(heroMnav)}</div>
          <div className="hero-sub">
            <Tip label="mNAV (mkt cap)" className="tip-inline">
              mNAV (mkt cap)
            </Tip>
            <span className="muted"> · ${company.ticker}</span>
          </div>
          <p className="mnav-caption">{payCaption(heroMnav)}</p>
          <p className="hero-underline">
            Sats/share is whether they compounded. mNAV is the price tag.
          </p>
        </div>
      </section>

      {/* 3) Worked example — REQUIRED */}
      <section className="example-card" aria-label="Worked example">
        <div className="panel-title">Last week on the tape</div>
        <p>
          Last week Strive issued shares and bought Bitcoin. Sats/share went up 4.3%. Shareholders won.
        </p>
        <p>
          Strategy’s assumed-diluted sats/share went down 0.46%. The stack grew; each share shrank a bit.
        </p>
        <p>Twenty One was flat.</p>
      </section>

      {/* 4) My shares micro-calc */}
      <section className="my-shares panel" aria-label="My shares">
        <div className="panel-title">My shares</div>
        <div className="my-shares-row">
          <div className="field">
            <label>Ticker</label>
            <select
              value={ticker}
              onChange={(e) => {
                const next = COMPANIES.find((c) => c.ticker === e.target.value)!;
                setTicker(next.ticker);
                setPill(next.heroDefaultPill);
              }}
            >
              {COMPANIES.map((c) => (
                <option key={c.ticker} value={c.ticker}>
                  {c.ticker}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Shares</label>
            <input
              inputMode="numeric"
              value={shares}
              onChange={(e) => setShares(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            />
          </div>
        </div>
        <p className="my-shares-out">
          {shares.toLocaleString("en-US")} shares of {ticker} → {myBtc.toFixed(4)} BTC →{" "}
          {Math.round(mySats).toLocaleString("en-US")} sats
        </p>
        <p className="my-shares-basis muted">
          Using {pillLabel} ({formatSats(value)} sats/share).
        </p>
        <Link className="calc-inline-link" href="/calc">
          Full calculator →
        </Link>
      </section>

      {/* 5) Live treasury tape */}
      <div className="section-head">
        <span>
          <span className="dot"></span>Live treasury tape
        </span>
        <span>
          <span className="dot live"></span>mNAV live
        </span>
      </div>

      <div className="tape-list">
        {COMPANIES.map((c) => {
          const shown =
            satsForPill(c, c.heroDefaultPill) ?? satsForPill(c, "basic") ?? 0;
          const m = rowMnav(c.ticker);
          return (
            <article
              key={c.ticker}
              className={"tape-card" + (c.ticker === ticker ? " selected" : "")}
              onClick={() => {
                setTicker(c.ticker);
                setPill(c.heroDefaultPill);
              }}
            >
              <div className="tape-card-top">
                <div className="company-id">
                  <div className="company-icon">{c.ticker[0]}</div>
                  <div>
                    <div className="ticker">${c.ticker}</div>
                    <div className="name">{c.name}</div>
                  </div>
                </div>
                <div className="activity-pills">
                  {c.activities.map((a) => (
                    <Tip key={a.label} label={a.label} className={a.on ? "activity on" : "activity"}>
                      {a.label}
                    </Tip>
                  ))}
                </div>
              </div>
              <div className="stat-rows">
                <div className="stat-row">
                  <span className="k">Bitcoin held</span>
                  <span className="v">
                    {formatBtc(c.btc)} BTC
                    {c.pledgedBtc ? (
                      <>
                        <br />
                        <Tip label="pledged" className="tip-inline muted">
                          {formatBtc(c.pledgedBtc)} pledged
                        </Tip>
                      </>
                    ) : null}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="k">
                    <Tip label="sats/share" className="tip-inline">
                      sats/share
                    </Tip>
                  </span>
                  <span className="v accent">{formatSats(c.ticker === ticker ? value : shown)}</span>
                </div>
                <div className="stat-row">
                  <span className="k">
                    <Tip label="mNAV (mkt cap)" className="tip-inline">
                      mNAV (mkt cap)
                    </Tip>
                  </span>
                  <span className="v">{fmtMnav(m)}</span>
                </div>
              </div>
              {c.lastWeek ? (
                <div className={"last-week " + c.lastWeek.verdict}>
                  <Tip label={c.lastWeek.verdict} className={"tip-inline tip-verdict " + c.lastWeek.verdict}>
                    {weekPct(c.lastWeek.yield)} this week
                  </Tip>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="desktop-table-wrap">
        <table className="desktop-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Bitcoin held</th>
              <th>
                <Tip label="sats/share" className="tip-th">
                  sats/share
                </Tip>
              </th>
              <th>
                <Tip label="mNAV (mkt cap)" className="tip-th">
                  mNAV (mkt cap)
                </Tip>
              </th>
              <th>last week</th>
              <th>Activity</th>
            </tr>
          </thead>
          <tbody>
            {COMPANIES.map((c) => {
              const shown =
                satsForPill(c, c.heroDefaultPill) ?? satsForPill(c, "basic") ?? 0;
              return (
                <tr
                  key={c.ticker}
                  className={c.ticker === ticker ? "selected" : ""}
                  onClick={() => {
                    setTicker(c.ticker);
                    setPill(c.heroDefaultPill);
                  }}
                >
                  <td>
                    <b>${c.ticker}</b>
                    <div className="name">{c.name}</div>
                  </td>
                  <td>
                    {formatBtc(c.btc)}
                    {c.pledgedBtc ? (
                      <div className="name">
                        <Tip label="pledged" className="tip-inline">
                          {formatBtc(c.pledgedBtc)} pledged
                        </Tip>
                      </div>
                    ) : null}
                  </td>
                  <td className="sats-cell">
                    <span className="btc-share">{formatSats(c.ticker === ticker ? value : shown)}</span>
                    <span className="sats">
                      {c.heroDefaultPill === "fd" ? (c.fdLabel ?? "FD") : "basic"}
                    </span>
                  </td>
                  <td>{fmtMnav(rowMnav(c.ticker))}</td>
                  <td>
                    {c.lastWeek ? (
                      <span className={"week-pct " + c.lastWeek.verdict}>
                        {weekPct(c.lastWeek.yield)}
                      </span>
                    ) : (
                      "flat"
                    )}
                  </td>
                  <td>
                    {c.activities.map((a) => (
                      <Tip key={a.label} label={a.label} className={a.on ? "activity on" : "activity"}>
                        {a.label}
                      </Tip>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6) Latest filing in English */}
      <section className="filing-block panel" aria-label="Latest filing">
        <div className="panel-title">Latest filing</div>
        <p>{latestFilingEnglish()}</p>
      </section>
    </div>
  );
}
