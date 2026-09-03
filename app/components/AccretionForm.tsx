"use client";
import { useMemo, useState } from "react";
import { ACCRETION_PRESETS, runAccretion } from "@/lib/tape";
import { formatSats, formatYieldPct } from "@/lib/sats";
import { ShareCard } from "./ShareCard";

export function AccretionForm() {
  const [id, setId] = useState("ASST");
  const preset = ACCRETION_PRESETS.find((p) => p.id === id)!;
  const [buyBtc, setBuyBtc] = useState(preset.buyBtc);
  const [buyPx, setBuyPx] = useState(preset.buyPx);
  const [issueCommon, setIssueCommon] = useState(preset.issueCommon);
  const [issuePreferred, setIssuePreferred] = useState(preset.issuePreferred);
  const [cashRaised, setCashRaised] = useState(preset.cashRaised);
  function load(next: string) {
    const p = ACCRETION_PRESETS.find((x) => x.id === next)!;
    setId(next); setBuyBtc(p.buyBtc); setBuyPx(p.buyPx); setIssueCommon(p.issueCommon); setIssuePreferred(p.issuePreferred); setCashRaised(p.cashRaised);
  }
  const result = useMemo(() => runAccretion({ startBtc: preset.startBtc, startShares: preset.startShares, buyBtc, issueCommon, issuePreferred, preferredInDenom: preset.preferredInDenom }), [preset, buyBtc, issueCommon, issuePreferred]);
  return (
    <div className="container">
      <h1 className="page-title">Accretion checker</h1>
      <p className="page-lead">See if a BTC purchase accretes or dilutes sats/share. SATA is shown, not in the denominator.</p>
      <div className="calc-grid two">
        <section className="panel">
          <div className="panel-title">Inputs</div>
          <div className="pill-row">
            {ACCRETION_PRESETS.map((p) => <button key={p.id} type="button" aria-pressed={id === p.id} onClick={() => load(p.id)}>{p.ticker}</button>)}
          </div>
          <div className="field"><label>BTC bought</label><input value={buyBtc} onChange={(e) => setBuyBtc(Number(e.target.value) || 0)} /></div>
          <div className="field"><label>BTC price (USD)</label><input value={buyPx} onChange={(e) => setBuyPx(Number(e.target.value) || 0)} /></div>
          <div className="field"><label>Shares issued (common)</label><input value={issueCommon} onChange={(e) => setIssueCommon(Number(e.target.value) || 0)} /></div>
          <div className="field"><label>Preferred / SATA issued</label><input value={issuePreferred} onChange={(e) => setIssuePreferred(Number(e.target.value) || 0)} /></div>
          <div className="field"><label>Cash raised (USD)</label><input value={cashRaised} onChange={(e) => setCashRaised(Number(e.target.value) || 0)} /></div>
        </section>
        <section className="panel">
          <div className="panel-title">Verdict</div>
          <div className={"verdict-pill " + result.verdict} style={{ fontSize: "1.6rem" }}>{result.verdict.toUpperCase()}</div>
          <div className={"last-week " + result.verdict}>{formatYieldPct(result.yield)} sats/share</div>
          <div className="stat-row"><span className="k">Before</span><span className="v">{formatSats(result.satsStart)}</span></div>
          <div className="stat-row"><span className="k">After</span><span className="v">{formatSats(result.satsEnd)}</span></div>
          <div className="stat-row"><span className="k">Preferred in denom</span><span className="v">{preset.preferredInDenom ? "yes" : "no"}</span></div>
          {issuePreferred ? <div className="stat-row"><span className="k">SATA / preferred issued</span><span className="v">{issuePreferred.toLocaleString("en-US")}</span></div> : null}
          <ShareCard ticker={preset.ticker} line={(buyBtc >= 0 ? "+" : "") + buyBtc.toLocaleString("en-US") + " BTC"} sub={"sats/share " + formatYieldPct(result.yield)} />
        </section>
      </div>
    </div>
  );
}
