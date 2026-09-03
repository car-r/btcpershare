import Link from "next/link";
import { AsstChart } from "../../components/AsstChart";
import { ASST_FILINGS, asstSeries } from "@/lib/asst-series";
import { ASST_QUARTERLY, ASST_SPARK_DATES } from "@/lib/asst-quarterly";
import { ASST_CAP_MIX_000s, ASST_YIELD_LOCK } from "@/lib/strive-kpis";
import { formatBtc, formatSats } from "@/lib/sats";
import { AsstLiveKpis } from "../../components/AsstLiveKpis";

export default function AsstPage() {
  const series = asstSeries();
  const last = ASST_FILINGS[ASST_FILINGS.length - 1];
  const weekly = ASST_FILINGS.filter((r) => r.as_of >= "2026-05-22");
  return (
    <div className="container">
      <p className="page-lead"><Link href="/cos">Companies</Link> / ASST</p>
      <h1 className="page-title">$ASST Strive</h1>
      <p className="page-lead">Effective = Class A + Class B + pre-funded warrants (PF is 0, so A+B). AFDS is Strive&apos;s Sats per Share. Traditional warrants (~26.6M) are in neither. SATA is never in the denom.</p>
      <div className="hero-number">{formatSats(last.sats_basic)}</div>
      <div className="hero-sub">Effective {formatSats(last.sats_basic)} · AFDS {formatSats(last.afds ? Math.round((last.btc * 100_000_000) / last.afds) : 0)} · {formatBtc(last.btc)} BTC · as of {last.as_of}</div>
      <AsstLiveKpis />
      <div className="panel" style={{ marginTop: "1.25rem" }}>
        <div className="panel-title">BPS chart</div>
        <AsstChart label="ASST weekly sats basic, Class A plus Class B" points={series.filter((p) => p.as_of).map((p) => ({ as_of: p.as_of as string, sats_basic: p.sats_basic, btc: p.btc }))} marks={[...ASST_SPARK_DATES]} />
        <p className="page-lead">Weekly sats_basic (Class A+B). Marks: Mar 9 19,933 → Apr 2 19,854 → May 22 21,777 → Jun 1 24,091 → Aug 14 23,532 → Aug 21 23,813 → Aug 28 24,829. No interpolation before Mar 9.</p>
      </div>
      <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Era</h2>
      <ul className="page-lead">
        <li>Listing ~Sep 12 2025. First quarter 9/30/25: {formatBtc(5886)} BTC / {formatSats(13946)} AFDS sats.</li>
        <li>YE 2025: {formatBtc(7627)} BTC / {formatSats(17037)} AFDS sats. SATA stated $201.273M (share count not printed). QTD yield +22.2%.</li>
        <li>Semler (SMLR) all-stock is Q1 2026: {formatBtc(7627)} → {formatBtc(13628)} BTC and AFDS 44,766,899 → 71,985,609. Company printed 18,931 sats. Not an open-market buy.</li>
        <li>Q2 2026 preliminary: {formatBtc(19864)} BTC / {formatSats(23465)} AFDS sats. 8-K yield {ASST_YIELD_LOCK.q2_2026_pct.toFixed(1)}% (dashboard rounds to 23.9% — filing wins).</li>
        <li>Q3 QTD AFDS {ASST_YIELD_LOCK.q3_qtd_pct.toFixed(1)}% (23,990 / 23,465). YTD {ASST_YIELD_LOCK.ytd_2026_pct.toFixed(1)}% (23,990 / 17,037). Filing-locked until the next 8-K.</li>
        <li>Weekly holdings table starts as-of May 22 2026. Weekly denom is Effective (A+B), not AFDS.</li>
      </ul>
      <div className="panel" style={{ marginTop: "1.25rem" }}>
        <div className="panel-title">Quarterly AFDS</div>
        <AsstChart
          label="ASST quarterly AFDS sats, not Class A plus Class B"
          points={ASST_QUARTERLY.map((r) => ({ as_of: r.as_of, sats_basic: r.sats_fd, btc: r.btc }))}
          marks={ASST_QUARTERLY.map((r) => r.as_of)}
        />
        <p className="page-lead">Company sats on these prints is AFDS. Off the weekly Effective spark. Q2 preliminary unaudited. Source 8-K 0001628280-26-047102.</p>
      </div>
      <div className="desktop-table-wrap" style={{ display: "block", marginTop: "0.75rem" }}>
        <table className="desktop-table">
          <thead><tr><th>As of</th><th>BTC</th><th>AFDS sats</th><th>Amp</th><th>QTD yield</th></tr></thead>
          <tbody>
            {ASST_QUARTERLY.map((r) => (
              <tr key={r.as_of}>
                <td>{r.as_of}</td>
                <td>{formatBtc(r.btc)}</td>
                <td>{formatSats(r.sats_fd)}</td>
                <td>{r.amplification_pct == null ? "—" : r.amplification_pct.toFixed(1) + "%"}</td>
                <td>{r.btc_yield_qtd_pct == null ? "—" : "+" + r.btc_yield_qtd_pct.toFixed(1) + "%"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Weekly A+B</h2>
      <div className="desktop-table-wrap" style={{ display: "block", marginTop: "0.5rem" }}>
        <table className="desktop-table">
          <thead><tr><th>As of</th><th>BTC</th><th>sats basic</th><th>AFDS sats</th><th>SATA</th></tr></thead>
          <tbody>
            {weekly.map((r) => (
              <tr key={r.as_of}>
                <td>{r.as_of}</td>
                <td>{formatBtc(r.btc)}</td>
                <td>{formatSats(r.sats_basic)}</td>
                <td>{r.afds ? formatSats(Math.round((r.btc * 100_000_000) / r.afds)) : "—"}</td>
                <td>{r.sata ? r.sata.toLocaleString("en-US") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Cap mix (thousands)</h2>
      <p className="page-lead">Dashboard rounded &apos;000s for mix display only. Not for sats math. Sats use 8-K exact AFDS.</p>
      <div className="desktop-table-wrap" style={{ display: "block", marginTop: "0.5rem" }}>
        <table className="desktop-table">
          <thead><tr><th>As of</th><th>Effective</th><th>AFDS</th><th>PF warrants</th><th>Trad. warrants</th></tr></thead>
          <tbody>
            {ASST_CAP_MIX_000s.map((r) => (
              <tr key={r.as_of}>
                <td>{r.as_of}</td>
                <td>{r.effective.toLocaleString("en-US")}</td>
                <td>{r.afds.toLocaleString("en-US")}</td>
                <td>{r.pf_warrants.toLocaleString("en-US")}</td>
                <td>{r.trad_warrants.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="page-lead" style={{ marginTop: "1rem" }}>Not financial advice. Filings via SEC EDGAR.</p>
    </div>
  );
}
