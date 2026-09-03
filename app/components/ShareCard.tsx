"use client";

export function ShareCard({ ticker, line, sub }: { ticker: string; line: string; sub: string }) {
  function download() {
    const c = document.createElement("canvas");
    c.width = 1200; c.height = 630;
    const x = c.getContext("2d");
    if (!x) return;
    x.fillStyle = "#000"; x.fillRect(0, 0, 1200, 630);
    x.fillStyle = "#F7931A"; x.font = "bold 48px sans-serif"; x.fillText("btcpershare", 64, 90);
    x.fillStyle = "#fff"; x.font = "bold 64px sans-serif"; x.fillText("$" + ticker, 64, 220);
    x.fillStyle = "#F7931A"; x.font = "bold 64px sans-serif"; x.fillText(line, 64, 330);
    x.fillStyle = "#22c55e"; x.font = "bold 48px sans-serif"; x.fillText(sub, 64, 410);
    x.fillStyle = "#8a8a8a"; x.font = "28px sans-serif"; x.fillText("via @btcpershare  ·  Not financial advice", 64, 560);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = ticker + "-btcpershare.png";
    a.click();
  }
  return (
    <div className="panel" style={{ marginTop: "1rem" }}>
      <div className="panel-title">Share card</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F7931A" }}>${ticker}</div>
      <div>{line}</div>
      <div style={{ color: "#22c55e", fontWeight: 700 }}>{sub}</div>
      <p className="page-lead">via @btcpershare</p>
      <button type="button" className="primary" onClick={download}>Download</button>
    </div>
  );
}
