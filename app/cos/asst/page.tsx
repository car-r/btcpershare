import Link from "next/link";
import { AsstChart } from "../../components/AsstChart";
import { ASST_FILINGS, asstSeries } from "@/lib/asst-series";
import { ASST_QUARTERLY, ASST_SPARK_DATES } from "@/lib/asst-quarterly";
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
      <p className="page-lead">sats/share = BTC × 100,000,000 / (Class A + Class B). AFDS is Strive’s headline BPS. SATA is amplification, not a sats denom.</p>
      <div className="hero-number">{formatSats(last.sats_basic)}</div>
      <div className="hero-sub">sats basic · AFDS {formatSats(last.afds ? Math.round((last.btc * 100_000_000) / last.afds) : 0)} · {formatBtc(last.btc)} BTC · as of {last.as_of}</div>
      <AsstLiveKpis />
      <div className="panel" style={{ marginTop: "1.25rem" }}>
        <div className="panel-title">BPS chart</div>
        <AsstChart points={series.filter((p) => p.as_of).map((p) => ({ as_of: p.as_of as string, sats_basic: p.sats_basic, btc: p.btc }))} marks={[...ASST_SPARK_DATES]} />
        <p className="page-lead">Weekly sats_basic (Class A+B). Marks: Mar 9 19,933 → Apr 2 19,854 → May 22 21,777 → Jun 1 24,091 → Aug 14 23,532 → Aug 21 23,813 → Aug 28 24,829. No interpolation before Mar 9.</p>
      </div>
      <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Era</h2>
      <ul className="page-lead">
        <li>Listing ~Sep 12 2025. First quarter 9/30/25: {formatBtc(5886)} BTC / {formatSats(13946)} AFDS sats.</li>
        <li>YE 2025: {formatBtc(7627)} BTC / {formatSats(17037)} AFDS sats. SATA 2,012,730. QTD yield +22.2%.</li>
        <li>Semler (SMLR) all-stock is Q1 2026: {formatBtc(7627)} → {formatBtc(13628)} BTC and AFDS 44,766,899 → 71,985,609 (+27.2M). Not an open-market buy.</li>
        <li>Q2 2026: {formatBtc(19864)} BTC / {formatSats(23465)} AFDS sats. 8-K amp 67.2% (historical, not the live tape amp).</li>
        <li>Weekly holdings table starts as-of May 22 2026. Weekly denom is Class A+B, not AFDS.</li>
      </ul>
      <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Quarterly AFDS</h2>
      <p className="page-lead">Company BPS on these prints is AFDS. Separate from the weekly A+B series.</p>
      <div className="desktop-table-wrap" style={{ display: "block", marginTop: "0.5rem" }}>
        <table className="desktop-table">
          <thead><tr><th>As of</th><th>BTC</th><th>AFDS sats</th><th>SATA</th><th>QTD yield</th></tr></thead>
          <tbody>
            {ASST_QUARTERLY.map((r) => (
              <tr key={r.as_of}>
                <td>{r.as_of}</td>
                <td>{formatBtc(r.btc)}</td>
                <td>{formatSats(r.sats_fd)}</td>
                <td>{r.sata_shares ? r.sata_shares.toLocaleString("en-US") : "—"}</td>
                <td>{r.btc_yield_qtd == null ? "—" : "+" + r.btc_yield_qtd.toFixed(1) + "%"}</td>
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
      <p className="page-lead" style={{ marginTop: "1rem" }}>Not financial advice. Filings via SEC EDGAR.</p>
    </div>
  );
}
