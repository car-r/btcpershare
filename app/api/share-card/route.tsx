import { ImageResponse } from "next/og";
import {
  chartPointsFor,
  formatClaimedBtc,
  liveClaimed,
  sharesSeriesFor,
} from "@/lib/shares-over-time";

export const runtime = "edge";

function niceTicks(lo: number, hi: number, target = 5): number[] {
  if (!(hi > lo)) return [lo];
  const span = hi - lo;
  const raw = span / Math.max(1, target - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const err = raw / pow;
  let step = pow;
  if (err >= 7.5) step = 10 * pow;
  else if (err >= 3.5) step = 5 * pow;
  else if (err >= 1.5) step = 2 * pow;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const out: number[] = [];
  for (let v = start; v <= end + step * 0.5; v += step) {
    const r = Math.round(v / step) * step;
    if (r >= lo - step * 1e-9 && r <= hi + step * 1e-9) out.push(Number(r.toPrecision(12)));
  }
  return out.length ? out : [lo, hi];
}

function yearTicks(minMs: number, maxMs: number): number[] {
  const y0 = new Date(minMs).getUTCFullYear();
  const y1 = new Date(maxMs).getUTCFullYear();
  const years: number[] = [];
  const startEven = y0 % 2 === 0 ? y0 : y0 + 1;
  for (let y = startEven; y <= y1; y += 2) years.push(y);
  if (!years.includes(y0)) years.unshift(y0);
  if (!years.includes(y1)) years.push(y1);
  return [...new Set(years)].sort((a, b) => a - b);
}

function fmtYTick(v: number): string {
  if (Math.abs(v) < 1e-12) return "0";
  if (Math.abs(v) >= 0.1) return v.toFixed(2);
  if (Math.abs(v) >= 0.01) return v.toFixed(3);
  return v.toFixed(4);
}

type Pt = { date: string; btc: number };

function chartGeom(points: Pt[], box: { x: number; y: number; w: number; h: number }) {
  const xs = points.map((p) => new Date(p.date + "T00:00:00Z").getTime());
  const ys = points.map((p) => p.btc);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const yPad = (maxY - Math.min(...ys)) * 0.08 || maxY * 0.05 || 0.001;
  const y0 = 0;
  const y1 = maxY + yPad;
  const xspan = maxX - minX || 1;
  const yspan = y1 - y0 || 1;
  const X = (t: number) => box.x + ((t - minX) / xspan) * box.w;
  const Y = (v: number) => box.y + (1 - (v - y0) / yspan) * box.h;
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
  return {
    X,
    Y,
    y0,
    y1,
    minX,
    maxX,
    yTicks: niceTicks(y0, y1, 5),
    xYears: yearTicks(minX, maxX),
    d: parts.join(" "),
    last: points[points.length - 1],
  };
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
  const title = `BTC claimed by ${n.toLocaleString("en-US")} shares of ${ticker}`;
  const sub = `${denom} · split-adjusted`;
  const claim =
    live != null ? `${n} $${ticker} → ${formatClaimedBtc(btc)} BTC` : `${n} $${ticker}`;

  const svgW = 1472;
  const svgH = 620;
  const pad = { l: 72, r: 36, t: 28, b: 48 };
  const box = {
    x: pad.l,
    y: pad.t,
    w: svgW - pad.l - pad.r,
    h: svgH - pad.t - pad.b,
  };
  const g = points.length ? chartGeom(points, box) : null;

  // Satori: SVG may use line/path/circle/rect only — NO <text>. Labels via HTML overlays.
  const yLabelNodes: Array<{ key: string; top: number; text: string }> = [];
  const xLabelNodes: Array<{ key: string; left: number; text: string }> = [];
  let lastLabel: { left: number; top: number; text: string; anchor: "start" | "end" } | null =
    null;

  if (g) {
    for (const v of g.yTicks) {
      yLabelNodes.push({ key: `y-${v}`, top: g.Y(v) - 11, text: fmtYTick(v) });
    }
    for (const year of g.xYears) {
      const tms = Date.UTC(year, 0, 1);
      const cx = g.X(Math.min(Math.max(tms, g.minX), g.maxX));
      xLabelNodes.push({ key: `x-${year}`, left: cx - 28, text: String(year) });
    }
    const lt = new Date(g.last.date + "T00:00:00Z").getTime();
    const lx = g.X(lt);
    const ly = g.Y(g.last.btc);
    const anchor: "start" | "end" = lx > box.x + box.w * 0.72 ? "end" : "start";
    lastLabel = {
      left: anchor === "end" ? lx - 140 : lx + 10,
      top: ly - 30,
      text: `${fmtYTick(g.last.btc)} BTC`,
      anchor,
    };
  }

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
          padding: "48px 64px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8a8a8a", marginTop: 8 }}>
          {sub}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#8a8a8a", marginTop: 6 }}>
          {claim}
        </div>

        <div
          style={{
            display: "flex",
            position: "relative",
            marginTop: 20,
            border: "1px solid #2a2a2a",
            borderRadius: 12,
            width: svgW,
            height: svgH,
            overflow: "hidden",
            background: "#0B0D10",
          }}
        >
          {g ? (
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
              <rect width={svgW} height={svgH} fill="#0B0D10" />
              <line
                x1={box.x}
                x2={box.x + box.w}
                y1={g.Y(g.y0)}
                y2={g.Y(g.y0)}
                stroke="#3a3a3a"
                strokeWidth="2"
              />
              <line
                x1={box.x}
                x2={box.x}
                y1={box.y}
                y2={box.y + box.h}
                stroke="#2a2a2a"
                strokeWidth="1"
              />
              {g.yTicks.map((v) =>
                v === g.y0 ? null : (
                  <line
                    key={`yg-${v}`}
                    x1={box.x}
                    x2={box.x + box.w}
                    y1={g.Y(v)}
                    y2={g.Y(v)}
                    stroke="#1f1f1f"
                    strokeWidth="1"
                  />
                ),
              )}
              {g.xYears.map((year) => {
                const t = Date.UTC(year, 0, 1);
                const cx = g.X(Math.min(Math.max(t, g.minX), g.maxX));
                return (
                  <line
                    key={`xt-${year}`}
                    x1={cx}
                    x2={cx}
                    y1={box.y + box.h}
                    y2={box.y + box.h + 8}
                    stroke="#5a5a5a"
                    strokeWidth="1"
                  />
                );
              })}
              <path d={g.d} fill="none" stroke="#F7931A" strokeWidth="4" />
              {points.map((pt) => {
                const t = new Date(pt.date + "T00:00:00Z").getTime();
                return (
                  <circle
                    key={pt.date}
                    cx={g.X(t)}
                    cy={g.Y(pt.btc)}
                    r="7"
                    fill="#0B0D10"
                    stroke="#F7931A"
                    strokeWidth="3"
                  />
                );
              })}
            </svg>
          ) : (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                color: "#5a5a5a",
                fontSize: 28,
              }}
            >
              Live widget only — no seed series
            </div>
          )}

          {/* Y-axis label (HTML — Satori cannot render SVG <text>) */}
          {g ? (
            <div
              style={{
                position: "absolute",
                left: 8,
                top: box.y + box.h / 2 - 20,
                display: "flex",
                color: "#8a8a8a",
                fontSize: 22,
                fontWeight: 600,
                transform: "rotate(-90deg)",
              }}
            >
              BTC
            </div>
          ) : null}

          {yLabelNodes.map((lab) => (
            <div
              key={lab.key}
              style={{
                position: "absolute",
                left: 8,
                top: lab.top,
                width: pad.l - 16,
                display: "flex",
                justifyContent: "flex-end",
                color: "#8a8a8a",
                fontSize: 20,
              }}
            >
              {lab.text}
            </div>
          ))}

          {xLabelNodes.map((lab) => (
            <div
              key={lab.key}
              style={{
                position: "absolute",
                left: lab.left,
                bottom: 8,
                width: 56,
                display: "flex",
                justifyContent: "center",
                color: "#8a8a8a",
                fontSize: 20,
              }}
            >
              {lab.text}
            </div>
          ))}

          {lastLabel ? (
            <div
              style={{
                position: "absolute",
                left: lastLabel.left,
                top: lastLabel.top,
                display: "flex",
                color: "#F7931A",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {lastLabel.text}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#5a5a5a", marginTop: 24 }}>
          btcpershare.io · not financial advice
        </div>
      </div>
    ),
    {
      width: 1600,
      height: 900,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Disposition": `inline; filename="btcpershare-${ticker}-${n}sh.png"`,
      },
    },
  );
}
