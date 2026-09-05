"use client";

import { SHARE_CARD_SUB, formatClaimedBtc } from "@/lib/shares-over-time";
import { stepPathCoords, type ChartPt } from "./SharesOverTimeChart";

type LegacyProps = {
  ticker: string;
  line: string;
  sub: string;
  /** When set, render Tuesday 1600×900 card with orange step chart. */
  n?: undefined;
  points?: undefined;
  btc?: undefined;
  denomLabel?: undefined;
};

type TuesdayProps = {
  ticker: string;
  n: number;
  btc: number;
  points: ChartPt[];
  denomLabel?: string;
  line?: undefined;
  sub?: undefined;
};

export type ShareCardProps = LegacyProps | TuesdayProps;

function isTuesday(p: ShareCardProps): p is TuesdayProps {
  return typeof (p as TuesdayProps).n === "number" && Array.isArray((p as TuesdayProps).points);
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
  x.fillText(SHARE_CARD_SUB + "  ·  Not financial advice", 80, 820);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = ticker + "-btcpershare.png";
  a.click();
}

function downloadTuesday(p: TuesdayProps) {
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 900;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#0B0D10";
  ctx.fillRect(0, 0, 1600, 900);

  const headline = `${p.n} $${p.ticker} → ${formatClaimedBtc(p.btc)} BTC`;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 72px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(headline, 80, 120);

  const sub = p.denomLabel
    ? `${p.denomLabel} · split-adjusted · btcpershare.io`
    : SHARE_CARD_SUB;
  ctx.fillStyle = "#8a8a8a";
  ctx.font = "32px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(sub, 80, 180);

  // Chart box
  const box = { x: 80, y: 240, w: 1440, h: 480 };
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x, box.y, box.w, box.h);

  if (p.points.length) {
    const coords = stepPathCoords(p.points, box);
    ctx.strokeStyle = "#F7931A";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.beginPath();
    coords.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // endpoint dots on data points only (every other corner of step is data)
    const xs = p.points.map((pt) => new Date(pt.date + "T00:00:00Z").getTime());
    const ys = p.points.map((pt) => pt.btc);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const yPad = (maxY - minY) * 0.08 || maxY * 0.05 || 0.001;
    const y0 = Math.max(0, minY - yPad);
    const y1 = maxY + yPad;
    const xspan = maxX - minX || 1;
    const yspan = y1 - y0 || 1;
    p.points.forEach((pt) => {
      const t = new Date(pt.date + "T00:00:00Z").getTime();
      const cx = box.x + ((t - minX) / xspan) * box.w;
      const cy = box.y + (1 - (pt.btc - y0) / yspan) * box.h;
      ctx.fillStyle = "#0B0D10";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#F7931A";
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    ctx.fillStyle = "#8a8a8a";
    ctx.font = "24px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(p.points[0].date, box.x, box.y + box.h + 40);
    ctx.textAlign = "right";
    ctx.fillText(p.points[p.points.length - 1].date, box.x + box.w, box.y + box.h + 40);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = "#5a5a5a";
  ctx.font = "24px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Not financial advice. Filing dates, not daily marks.", 80, 860);

  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `${p.ticker}-${p.n}-shares-btcpershare.png`;
  a.click();
}

export function ShareCard(props: ShareCardProps) {
  if (isTuesday(props)) {
    const sub = props.denomLabel
      ? `${props.denomLabel} · split-adjusted · btcpershare.io`
      : SHARE_CARD_SUB;
    return (
      <div className="panel share-card-panel" style={{ marginTop: "1rem" }}>
        <div className="panel-title">Share card · Tuesday PNG</div>
        <div className="share-card-preview">
          <div className="share-card-headline">
            {props.n} ${props.ticker} → {formatClaimedBtc(props.btc)} BTC
          </div>
          <div className="share-card-sub">{sub}</div>
        </div>
        <div className="share-card-actions">
          <button type="button" className="primary" onClick={() => downloadTuesday(props)}>
            Export PNG 1600×900
          </button>
          <a
            className="calc-inline-link"
            href={`/api/share-card?ticker=${encodeURIComponent(props.ticker)}&n=${props.n}`}
            target="_blank"
            rel="noreferrer"
          >
            /api/share-card →
          </a>
        </div>
      </div>
    );
  }

  const { ticker, line, sub } = props;
  return (
    <div className="panel" style={{ marginTop: "1rem" }}>
      <div className="panel-title">Share card</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#F7931A" }}>${ticker}</div>
      <div>{line}</div>
      <div style={{ color: "#22c55e", fontWeight: 700 }}>{sub}</div>
      <p className="page-lead">via @btcpershare</p>
      <button type="button" className="primary" onClick={() => downloadLegacy(ticker, line, sub)}>
        Download PNG
      </button>
    </div>
  );
}
