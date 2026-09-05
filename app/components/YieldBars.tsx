"use client";

type Bar = {
  periodEnd: string;
  satsChgPct: number;
  verdict: string | null;
};

/** One-ticker green/red yield bars (numeric satsChgPct only). */
export function YieldBars({
  bars,
  label,
}: {
  bars: Bar[];
  label: string;
}) {
  if (!bars.length) return null;
  const w = 640;
  const h = 160;
  const pad = { l: 8, r: 8, t: 16, b: 28 };
  const maxAbs = Math.max(...bars.map((b) => Math.abs(b.satsChgPct)), 0.001);
  const bw = (w - pad.l - pad.r) / bars.length;
  const mid = pad.t + (h - pad.t - pad.b) / 2;
  const scale = (h - pad.t - pad.b) / 2 / maxAbs;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} style={{ width: "100%", height: "auto" }}>
      <rect width={w} height={h} fill="#000" />
      <line x1={pad.l} x2={w - pad.r} y1={mid} y2={mid} stroke="#333" strokeWidth="1" />
      {bars.map((b, i) => {
        const x = pad.l + i * bw + bw * 0.15;
        const barW = bw * 0.7;
        const mag = Math.abs(b.satsChgPct) * scale;
        const y = b.satsChgPct >= 0 ? mid - mag : mid;
        const fill =
          b.verdict === "accretive" || b.satsChgPct > 0.0005
            ? "#1a9e5c"
            : b.verdict === "dilutive" || b.satsChgPct < -0.0005
              ? "#c43c3c"
              : "#666";
        return <rect key={b.periodEnd + i} x={x} y={y} width={barW} height={Math.max(mag, 1)} fill={fill} />;
      })}
      <text x={pad.l} y={h - 8} fill="#8a8a8a" fontSize="11">
        {bars[0].periodEnd.slice(5)} – {bars[bars.length - 1].periodEnd.slice(5)} · {bars.length} bars
      </text>
    </svg>
  );
}
