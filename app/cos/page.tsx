import Link from "next/link";
export default function Page() {
  return (
    <div className="container">
      <h1 className="page-title">Companies</h1>
      <p className="page-lead">MSTR, ASST, and XXI are on the tape. Metaplanet and the rest: days 31-60.</p>
      <Link className="calc-link" href="/cos/asst"><h2>$ASST Strive</h2><p>BPS chart from weekly 8.01s. SATA is preferred, not in sats/share.</p></Link>
    </div>
  );
}
