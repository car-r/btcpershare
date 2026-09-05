import { ImageResponse } from "next/og";
import {
  chartPointsFor,
  formatClaimedBtc,
  liveClaimed,
  sharesSeriesFor,
  SHARE_CARD_SUB,
} from "@/lib/shares-over-time";

export const runtime = "edge";

function stepPathInBox(
  points: { date: string; btc: number }[],
  w: number,
  h: number,
): string {
  if (!points.length) return "";
  const xs = points.map((p) => new Date(p.date + "T00:00:00Z").getTime());
  const ys = points.map((p) => p.btc);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const yPad = (maxY - minY) * 0.08 || maxY * 0.05 || 0.001;
  const y0 = Math.max(0, minY - yPad);
  const y1 = maxY + yPad;
  const xspan = maxX - minX || 1;
  const yspan = y1 - y0 || 1;
  const X = (t: number) => ((t - minX) / xspan) * w;
  const Y = (v: number) => (1 - (v - y0) / yspan) * h;
  const parts: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const x = X(xs[i]);
    const y = Y(points[i].btc);
    if (i === 0) parts.push(`M${x.toFixed(1)} ${y.toFixed(1)}`);
    else {
      parts.push(`L${x.toFixed(1)} ${Y(points[i - 1].btc).toFixed(1)}`);
      parts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
    }
  }
  return parts.join(" ");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ticker = (url.searchParams.get("ticker") || "MSTR").toUpperCase();
  const n = Math.max(1, Math.floor(Number(url.searchParams.get("n") || 100) || 100));

  const series = sharesSeriesFor(ticker);
  const live = liveClaimed(ticker, n);
  const points = chartPointsFor(ticker, n);

  const btc = live?.btc ?? 0;
  const denom = series?.denomLabel ?? live?.denomLabel ?? "ADSO";
  const headline =
    live != null
      ? `${n} $${ticker} → ${formatClaimedBtc(btc)} BTC`
      : `${n} $${ticker}`;
  const sub = live != null ? `${denom} · split-adjusted · btcpershare.io` : SHARE_CARD_SUB;
  const d = stepPathInBox(points, 1440, 480);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0B0D10",
          color: "#fff",
          padding: "64px 80px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {headline}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#8a8a8a", marginTop: 12 }}>
          {sub}
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            marginTop: 36,
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {d ? (
            <svg width="1440" height="480" viewBox="0 0 1440 480">
              <path d={d} fill="none" stroke="#F7931A" strokeWidth="4" />
            </svg>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5a5a5a",
                fontSize: 28,
              }}
            >
              Live widget only — no seed series
            </div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#5a5a5a", marginTop: 28 }}>
          Not financial advice. Filing dates, not daily marks.
        </div>
      </div>
    ),
    {
      width: 1600,
      height: 900,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Disposition": `inline; filename="${ticker}-${n}-shares-btcpershare.png"`,
      },
    },
  );
}
