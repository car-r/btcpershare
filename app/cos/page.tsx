import Link from "next/link";

export default function Page() {
  return (
    <div className="container">
      <h1 className="page-title">Companies</h1>
      <p className="page-lead">Three names on the tape. Deep page for Strive; MSTR and XXI stay on the homepage tape for now.</p>
      <Link className="calc-link" href="/cos/asst">
        <h2>$ASST Strive</h2>
        <p>Weekly 8-K warehouse, SATA amp, AFDS quarters. SATA never in sats/share.</p>
      </Link>
      <div className="calc-link" style={{ marginTop: "0.75rem", opacity: 0.85 }}>
        <h2>$MSTR Strategy</h2>
        <p>On the tape — ADSO 187,751 · dilutive −0.46% this week. Company page next.</p>
      </div>
      <div className="calc-link" style={{ marginTop: "0.75rem", opacity: 0.85 }}>
        <h2>$XXI Twenty One</h2>
        <p>On the tape — flat · 16,116 BTC pledged. Company page next.</p>
      </div>
    </div>
  );
}
