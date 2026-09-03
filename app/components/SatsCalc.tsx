"use client";
import { useState } from "react";
import { COMPANIES, satsForPill, type Pill } from "@/lib/tape";
import { formatSats } from "@/lib/sats";
import { ShareCard } from "./ShareCard";

export function SatsCalc() {
  const [ticker, setTicker] = useState("MSTR");
  const [pill, setPill] = useState<Pill>("fd");
  const company = COMPANIES.find((c) => c.ticker === ticker)!;
  const available: Pill[] = (["basic", "fd", "clean"] as Pill[]).filter((p) => satsForPill(company, p) != null);
  const safe = available.includes(pill) ? pill : "basic";
  const value = satsForPill(company, safe) ?? 0;
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
      <ShareCard ticker={company.ticker} line={formatSats(value) + " sats/share"} sub={safe === "fd" ? (company.fdLabel ?? "FD") : safe} />
    </div>
  );
}
