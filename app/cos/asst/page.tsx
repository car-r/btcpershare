import Link from "next/link";
import { AsstChart } from "../../components/AsstChart";
import { ASST_FILINGS, asstSeries } from "@/lib/asst-series";
import { formatBtc, formatSats } from "@/lib/sats";

export default function AsstPage() {
  const series = asstSeries();
  const last = ASST_FILINGS[ASST_FILINGS.length - 1];
  const weekly = ASST_FILINGS.filter((r) => r.as_of >= "2026-05-22");
  return (
    <div className="container">
      <p className="page-lead"><Link href="/cos">Companies</Link> / ASST</p>
      <h1 className="page-title">$ASST Strive</h1>
      <p className="page-lead">sats/share = BTC × 100,000,000 / (Class A + Class B). SATA is preferred and is not in that number.</p>
      <div className="hero-number">{formatSats(last.sats_basic)}</div>
      <div className="hero-sub">sats / share · {formatBtc(last.btc)} BTC · as of {last.as_of}</div>
      <div className="panel" style={{ marginTop: "1.25rem" }}>
        <div className="panel-title">BPS chart</div>
        <AsstChart points={series.filter((p) => p.as_of).map((p) => ({ as_of: p.as_of as string, sats_basic: p.sats_basic, btc: p.btc }))} />
        <p className="page-lead">Accretion into Jun 1 ({formatSats(24091)}), bleed through Aug 14 ({formatSats(23532)}), then Aug 21 and Aug 28 take the high at {formatSats(24829)} sats / {formatBtc(23156)} BTC.</p>
      </div>
      <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "1.5rem" }}>Era</h2>
      <ul className="page-lead">
        <li>Listing ~Sep 12 2025. First quarter 9/30/25: {formatBtc(5886)} BTC / {formatSats(13946)} AFDS sats.</li>
        <li>Semler (SMLR) all-stock deal is Q1 2026: 7,627 → 13,628 BTC and AFDS 44.8M → 72.0M. Not an open-market buy.</li>
        <li>Weekly holdings table starts as-of May 22 2026.</li>
      </ul>
      <div className="desktop-table-wrap" style={{ display: "block", marginTop: "1rem" }}>
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
