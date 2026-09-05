"use client";

/** Step chart: BTC claimed by N shares over filing dates. Orange #F7931A. MAX only. */

export type ChartPt = { date: string; btc: number };

export function SharesOverTimeChart({
  points,
  ticker,
  n,
  height = 220,
}: {
  points: ChartPt[];
  ticker: string;
  n: number;
  height?: number;
}) {
  if (!points.length) return null;

  const w = 640;
  const h = height;
  const pad = { l: 56, r: 16, t: 20, b: 36 };
  const xs = points.map((p) => new Date(p.date + "T00:00:00Z").getTime());
  const ys = points.map((p) => p.btc);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  // Pad y a bit so the line isn't glued to edges
  const yPad = (maxY - minY) * 0.08 || maxY * 0.05 || 0.001;
  const y0 = Math.max(0, minY - yPad);
  const y1 = maxY + yPad;
  const xspan = maxX - minX || 1;
  const yspan = y1 - y0 || 1;
  const X = (t: number) => pad.l + ((t - minX) / xspan) * (w - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - y0) / yspan) * (h - pad.t - pad.b);

  // Step-after path: horizontal then vertical between points
  const parts: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const x = X(xs[i]);
    const y = Y(points[i].btc);
    if (i === 0) {
      parts.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
    } else {
      const prevX = X(xs[i - 1]);
      const prevY = Y(points[i - 1].btc);
      parts.push(`L${x.toFixed(1)},${prevY.toFixed(1)}`);
      parts.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
      void prevX;
    }
  }
  const d = parts.join(" ");

  const fmtAxis = (v: number) => {
    if (v >= 0.1) return v.toFixed(3);
    return v.toFixed(4);
  };

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="shares-chart-wrap">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`BTC claimed by ${n} shares of ${ticker} over time`}
        className="shares-chart-svg"
      >
        <rect width={w} height={h} fill="transparent" />
        {/* y ticks */}
        <text x={pad.l - 8} y={Y(y1) + 4} textAnchor="end" fill="#8a8a8a" fontSize="11">
          {fmtAxis(y1)}
        </text>
        <text x={pad.l - 8} y={Y(y0) + 4} textAnchor="end" fill="#8a8a8a" fontSize="11">
          {fmtAxis(y0)}
        </text>
        <line
          x1={pad.l}
          x2={w - pad.r}
          y1={Y(y0)}
          y2={Y(y0)}
          stroke="#2a2a2a"
          strokeWidth="1"
        />
        <path d={d} fill="none" stroke="#F7931A" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={X(xs[i])}
            cy={Y(p.btc)}
            r="3.5"
            fill="#0B0D10"
            stroke="#F7931A"
            strokeWidth="2"
          />
        ))}
        <text x={pad.l} y={h - 10} fill="#8a8a8a" fontSize="11">
          {first.date.slice(0, 4)}
        </text>
        <text x={w - pad.r} y={h - 10} textAnchor="end" fill="#8a8a8a" fontSize="11">
          {last.date}
        </text>
        <text x={w - pad.r} y={pad.t - 4} textAnchor="end" fill="#F7931A" fontSize="11">
          MAX · BTC
        </text>
      </svg>
    </div>
  );
}

/** Build step path coords for canvas / OG share card (normalized 0–1 box). */
export function stepPathCoords(
  points: ChartPt[],
  box: { x: number; y: number; w: number; h: number },
): { x: number; y: number }[] {
  if (!points.length) return [];
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
  const X = (t: number) => box.x + ((t - minX) / xspan) * box.w;
  const Y = (v: number) => box.y + (1 - (v - y0) / yspan) * box.h;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const x = X(xs[i]);
    const y = Y(points[i].btc);
    if (i === 0) out.push({ x, y });
    else {
      out.push({ x, y: Y(points[i - 1].btc) });
      out.push({ x, y });
    }
  }
  return out;
}
