"use client";

/** Step chart: BTC claimed by N shares over filing dates. Orange #F7931A. MAX only. */

export type ChartPt = { date: string; btc: number };

export type ChartBox = { x: number; y: number; w: number; h: number };

export type ChartLayout = {
  box: ChartBox;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  X: (t: number) => number;
  Y: (v: number) => number;
  yTicks: number[];
  xYears: number[];
  pathD: string;
  pathCoords: { x: number; y: number }[];
  last: ChartPt;
  first: ChartPt;
};

/** Nice numeric ticks covering [lo, hi] (inclusive-ish). */
export function niceTicks(lo: number, hi: number, target = 5): number[] {
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

export function yearTicks(minMs: number, maxMs: number): number[] {
  const y0 = new Date(minMs).getUTCFullYear();
  const y1 = new Date(maxMs).getUTCFullYear();
  // Prefer even years on MAX (2020, 2022, 2024, 2026)
  const years: number[] = [];
  const startEven = y0 % 2 === 0 ? y0 : y0 + 1;
  for (let y = startEven; y <= y1; y += 2) years.push(y);
  if (!years.includes(y0)) years.unshift(y0);
  if (!years.includes(y1)) years.push(y1);
  // Deduplicate + sort
  return [...new Set(years)].sort((a, b) => a - b);
}

export function fmtYTick(v: number): string {
  if (Math.abs(v) < 1e-12) return "0";
  if (Math.abs(v) >= 1) return v.toFixed(2);
  if (Math.abs(v) >= 0.1) return v.toFixed(2);
  if (Math.abs(v) >= 0.01) return v.toFixed(3);
  return v.toFixed(4);
}

export function buildChartLayout(
  points: ChartPt[],
  box: ChartBox,
  opts?: { yFloorZero?: boolean },
): ChartLayout | null {
  if (!points.length) return null;
  const xs = points.map((p) => new Date(p.date + "T00:00:00Z").getTime());
  const ys = points.map((p) => p.btc);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const yPad = (maxY - minY) * 0.08 || maxY * 0.05 || 0.001;
  const yFloorZero = opts?.yFloorZero !== false;
  const y0 = yFloorZero ? 0 : Math.max(0, minY - yPad);
  const y1 = maxY + yPad;
  const xspan = maxX - minX || 1;
  const yspan = y1 - y0 || 1;
  const X = (t: number) => box.x + ((t - minX) / xspan) * box.w;
  const Y = (v: number) => box.y + (1 - (v - y0) / yspan) * box.h;

  const parts: string[] = [];
  const pathCoords: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const x = X(xs[i]);
    const y = Y(points[i].btc);
    if (i === 0) {
      parts.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
      pathCoords.push({ x, y });
    } else {
      const prevY = Y(points[i - 1].btc);
      parts.push(`L${x.toFixed(1)},${prevY.toFixed(1)}`);
      parts.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
      pathCoords.push({ x, y: prevY });
      pathCoords.push({ x, y });
    }
  }

  return {
    box,
    x0: minX,
    x1: maxX,
    y0,
    y1,
    X,
    Y,
    yTicks: niceTicks(y0, y1, 5),
    xYears: yearTicks(minX, maxX),
    pathD: parts.join(" "),
    pathCoords,
    first: points[0],
    last: points[points.length - 1],
  };
}

/** Build step path coords for canvas / OG share card. */
export function stepPathCoords(
  points: ChartPt[],
  box: ChartBox,
): { x: number; y: number }[] {
  return buildChartLayout(points, box)?.pathCoords ?? [];
}

export function SharesOverTimeChart({
  points,
  ticker,
  n,
  height = 280,
  denomLabel = "ADSO",
}: {
  points: ChartPt[];
  ticker: string;
  n: number;
  height?: number;
  denomLabel?: string;
}) {
  if (!points.length) return null;

  const w = 640;
  const h = height;
  // ~48px left, ~32px bottom so labels aren't clipped
  const pad = { l: 48, r: 20, t: 28, b: 36 };
  const layout = buildChartLayout(points, {
    x: pad.l,
    y: pad.t,
    w: w - pad.l - pad.r,
    h: h - pad.t - pad.b,
  });
  if (!layout) return null;

  const { X, Y, y0, yTicks, xYears, pathD, last } = layout;
  const lastX = X(new Date(last.date + "T00:00:00Z").getTime());
  const lastY = Y(last.btc);
  const lastLabel = `${fmtYTick(last.btc)} BTC`;

  return (
    <div className="shares-chart-wrap">
      <div className="shares-chart-chrome">
        <div className="shares-chart-title">
          BTC claimed by {n.toLocaleString("en-US")} shares of {ticker}
        </div>
        <div className="shares-chart-sub">{denomLabel} · split-adjusted</div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`BTC claimed by ${n} shares of ${ticker} over time`}
        className="shares-chart-svg"
      >
        <rect width={w} height={h} fill="#0B0D10" />

        {/* Plot frame + baseline (zero-line when y0===0) */}
        <line
          x1={pad.l}
          x2={w - pad.r}
          y1={Y(y0)}
          y2={Y(y0)}
          stroke="#3a3a3a"
          strokeWidth="1.25"
        />
        <line
          x1={pad.l}
          x2={pad.l}
          y1={pad.t}
          y2={h - pad.b}
          stroke="#2a2a2a"
          strokeWidth="1"
        />

        {/* Y grid + ticks */}
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            {v !== y0 ? (
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={Y(v)}
                y2={Y(v)}
                stroke="#1f1f1f"
                strokeWidth="1"
              />
            ) : null}
            <text
              x={pad.l - 8}
              y={Y(v) + 4}
              textAnchor="end"
              fill="#8a8a8a"
              fontSize="11"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {fmtYTick(v)}
            </text>
          </g>
        ))}

        {/* Y-axis label */}
        <text
          x={14}
          y={(pad.t + h - pad.b) / 2}
          fill="#8a8a8a"
          fontSize="11"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          textAnchor="middle"
          transform={`rotate(-90 14 ${(pad.t + h - pad.b) / 2})`}
        >
          BTC
        </text>

        {/* X year ticks */}
        {xYears.map((year) => {
          const t = Date.UTC(year, 0, 1);
          const cx = X(Math.min(Math.max(t, layout.x0), layout.x1));
          return (
            <g key={`x-${year}`}>
              <line
                x1={cx}
                x2={cx}
                y1={h - pad.b}
                y2={h - pad.b + 5}
                stroke="#5a5a5a"
                strokeWidth="1"
              />
              <text
                x={cx}
                y={h - 10}
                textAnchor="middle"
                fill="#8a8a8a"
                fontSize="11"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {year}
              </text>
            </g>
          );
        })}

        <path d={pathD} fill="none" stroke="#F7931A" strokeWidth="2.5" strokeLinejoin="round" />

        {points.map((p, i) => {
          const t = new Date(p.date + "T00:00:00Z").getTime();
          return (
            <circle
              key={p.date}
              cx={X(t)}
              cy={Y(p.btc)}
              r="3.5"
              fill="#0B0D10"
              stroke="#F7931A"
              strokeWidth="2"
            />
          );
        })}

        {/* Last-point label */}
        <text
          x={Math.min(lastX + 8, w - pad.r)}
          y={Math.max(lastY - 8, pad.t + 10)}
          fill="#F7931A"
          fontSize="11"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontWeight="700"
          textAnchor={lastX > w * 0.72 ? "end" : "start"}
        >
          {lastLabel}
        </text>
      </svg>
      <div className="shares-chart-footer">btcpershare.io · not financial advice</div>
    </div>
  );
}
