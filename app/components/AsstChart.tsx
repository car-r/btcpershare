"use client";

type Pt = { as_of: string; sats_basic: number; btc: number };

export function AsstChart({ points, marks }: { points: Pt[]; marks: string[] }) {
  const w = 640;
  const h = 220;
  const pad = { l: 48, r: 12, t: 16, b: 28 };
  const xs = points.map((p) => new Date(p.as_of + "T00:00:00Z").getTime());
  const ys = points.map((p) => p.sats_basic);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xspan = maxX - minX || 1;
  const yspan = maxY - minY || 1;
  const X = (t: number) => pad.l + ((t - minX) / xspan) * (w - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - minY) / yspan) * (h - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(xs[i]).toFixed(1)},${Y(p.sats_basic).toFixed(1)}`).join(" ");
  const marked = points.filter((p) => marks.includes(p.as_of));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="ASST sats per share, weekly Class A+B, March to August 2026" style={{ width: "100%", height: "auto" }}>
      <rect width={w} height={h} fill="#000" />
      <path d={d} fill="none" stroke="#F7931A" strokeWidth="2" />
      {marked.map((p) => {
        const t = new Date(p.as_of + "T00:00:00Z").getTime();
        return <circle key={p.as_of} cx={X(t)} cy={Y(p.sats_basic)} r="3.5" fill="#fff" stroke="#F7931A" />;
      })}
      <text x={pad.l} y={14} fill="#8a8a8a" fontSize="11">{minY.toLocaleString("en-US")}</text>
      <text x={pad.l} y={h - 8} fill="#8a8a8a" fontSize="11">{points[0].as_of.slice(5)} – {points[points.length - 1].as_of.slice(5)}</text>
      <text x={w - pad.r} y={14} textAnchor="end" fill="#F7931A" fontSize="11">{maxY.toLocaleString("en-US")} sats</text>
    </svg>
  );
}
