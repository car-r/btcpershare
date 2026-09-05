"use client";

import { formatClaimedBtc } from "@/lib/shares-over-time";
import {
  buildChartLayout,
  fmtYTick,
  type ChartPt,
} from "./SharesOverTimeChart";

type LegacyProps = {
  ticker: string;
  line: string;
  sub: string;
  n?: undefined;
  points?: undefined;
  btc?: undefined;
  denomLabel?: undefined;
};

type ChartExportProps = {
  ticker: string;
  n: number;
  btc: number;
  points: ChartPt[];
  denomLabel?: string;
  line?: undefined;
  sub?: undefined;
};

export type ShareCardProps = LegacyProps | ChartExportProps;

function isChartExport(p: ShareCardProps): p is ChartExportProps {
  return typeof (p as ChartExportProps).n === "number" && Array.isArray((p as ChartExportProps).points);
}

function downloadLegacy(ticker: string, line: string, sub: string) {
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 900;
  const x = c.getContext("2d");
  if (!x) return;
  x.fillStyle = "#0B0D10";
  x.fillRect(0, 0, 1600, 900);
  x.fillStyle = "#F7931A";
  x.font = "bold 48px ui-sans-serif, system-ui, sans-serif";
  x.fillText("btcpershare", 80, 100);
  x.fillStyle = "#fff";
  x.font = "bold 72px ui-sans-serif, system-ui, sans-serif";
  x.fillText("$" + ticker, 80, 240);
  x.fillStyle = "#F7931A";
  x.font = "bold 64px ui-sans-serif, system-ui, sans-serif";
  x.fillText(line, 80, 360);
  x.fillStyle = "#22c55e";
  x.font = "bold 48px ui-sans-serif, system-ui, sans-serif";
  x.fillText(sub, 80, 450);
  x.fillStyle = "#8a8a8a";
  x.font = "28px ui-sans-serif, system-ui, sans-serif";
  x.fillText("btcpershare.io · not financial advice", 80, 820);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `btcpershare-${ticker}.png`;
  a.click();
}

/** Draw full chart with axes into a 1600×900 canvas (same geometry as on-page). */
export function drawShareChartPng(
  ctx: CanvasRenderingContext2D,
  p: {
    ticker: string;
    n: number;
    btc: number;
    points: ChartPt[];
    denomLabel?: string;
  },
) {
  const W = 1600;
  const H = 900;
  ctx.fillStyle = "#0B0D10";
  ctx.fillRect(0, 0, W, H);

  const denom = p.denomLabel ?? "ADSO";
  const title = `BTC claimed by ${p.n.toLocaleString("en-US")} shares of ${p.ticker}`;
  const sub = `${denom} · split-adjusted`;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 52px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(title, 64, 88);

  ctx.fillStyle = "#8a8a8a";
  ctx.font = "28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(sub, 64, 132);

  // Chart area with axis padding (~48 left, ~32 bottom of plot)
  const outer = { x: 64, y: 180, w: 1472, h: 620 };
  const pad = { l: 72, r: 36, t: 28, b: 48 };
  const box = {
    x: outer.x + pad.l,
    y: outer.y + pad.t,
    w: outer.w - pad.l - pad.r,
    h: outer.h - pad.t - pad.b,
  };

  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1;
  ctx.strokeRect(outer.x, outer.y, outer.w, outer.h);

  const layout = buildChartLayout(p.points, box);
  if (layout) {
    const { X, Y, y0, yTicks, xYears, pathCoords, last } = layout;

    // Y grid + ticks + BTC label
    ctx.font = "22px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "#8a8a8a";
    ctx.textAlign = "end";
    for (const v of yTicks) {
      const yy = Y(v);
      ctx.strokeStyle = v === y0 ? "#3a3a3a" : "#1f1f1f";
      ctx.lineWidth = v === y0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(box.x, yy);
      ctx.lineTo(box.x + box.w, yy);
      ctx.stroke();
      ctx.fillText(fmtYTick(v), box.x - 12, yy + 7);
    }
    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(outer.x + 22, box.y + box.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("BTC", 0, 0);
    ctx.restore();

    // Y axis spine
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x, box.y);
    ctx.lineTo(box.x, box.y + box.h);
    ctx.stroke();

    // X year ticks
    ctx.textAlign = "center";
    ctx.fillStyle = "#8a8a8a";
    ctx.font = "22px ui-sans-serif, system-ui, sans-serif";
    for (const year of xYears) {
      const t = Date.UTC(year, 0, 1);
      const cx = X(Math.min(Math.max(t, layout.x0), layout.x1));
      ctx.strokeStyle = "#5a5a5a";
      ctx.beginPath();
      ctx.moveTo(cx, box.y + box.h);
      ctx.lineTo(cx, box.y + box.h + 8);
      ctx.stroke();
      ctx.fillText(String(year), cx, box.y + box.h + 32);
    }

    // Step path
    ctx.strokeStyle = "#F7931A";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    pathCoords.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Data dots
    for (const pt of p.points) {
      const t = new Date(pt.date + "T00:00:00Z").getTime();
      const cx = X(t);
      const cy = Y(pt.btc);
      ctx.fillStyle = "#0B0D10";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#F7931A";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Last-point label
    const lt = new Date(last.date + "T00:00:00Z").getTime();
    const lx = X(lt);
    const ly = Y(last.btc);
    const label = `${fmtYTick(last.btc)} BTC`;
    ctx.fillStyle = "#F7931A";
    ctx.font = "bold 24px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = lx > box.x + box.w * 0.72 ? "right" : "left";
    ctx.fillText(label, lx + (ctx.textAlign === "right" ? -10 : 10), ly - 14);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = "#5a5a5a";
  ctx.font = "24px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("btcpershare.io · not financial advice", 64, 860);

  // Tiny live claim echo (live claim)
  ctx.fillStyle = "#8a8a8a";
  ctx.font = "22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`${p.n} $${p.ticker} → ${formatClaimedBtc(p.btc)} BTC`, 64, 168);
}

function downloadChart(p: ChartExportProps) {
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 900;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  drawShareChartPng(ctx, p);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `btcpershare-${p.ticker}-${p.n}sh.png`;
  a.click();
}

export function ShareCard(props: ShareCardProps) {
  if (isChartExport(props)) {
    return (
      <div className="share-card-actions" style={{ marginTop: "0.75rem" }}>
        <button type="button" className="primary" onClick={() => downloadChart(props)}>
          Download chart
        </button>
        <a
          className="calc-inline-link"
          href={`/api/share-card?ticker=${encodeURIComponent(props.ticker)}&n=${props.n}`}
          target="_blank"
          rel="noreferrer"
          download={`btcpershare-${props.ticker}-${props.n}sh.png`}
        >
          Open PNG →
        </a>
      </div>
    );
  }

  const { ticker, line, sub } = props;
  return (
    <div className="panel" style={{ marginTop: "1rem" }}>
      <div className="panel-title">Chart export</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F7931A" }}>${ticker}</div>
      <div>{line}</div>
      <div style={{ color: "#22c55e", fontWeight: 700 }}>{sub}</div>
      <button type="button" className="primary" onClick={() => downloadLegacy(ticker, line, sub)}>
        Download chart
      </button>
    </div>
  );
}
