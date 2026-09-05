import { COMPANIES } from "@/lib/tape";
import { barsFor, seriesFor } from "@/lib/snapshot";
import { asstQuarterly, asstSpark7 } from "@/lib/asst-quarterly";
import { chartPointsFor, sharesSeriesFor } from "@/lib/shares-over-time";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ ticker: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { ticker } = await ctx.params;
  const known = COMPANIES.some((c) => c.ticker.toUpperCase() === ticker.toUpperCase());
  if (!known) {
    return NextResponse.json({ error: "unknown ticker", ticker }, { status: 404 });
  }
  const t = ticker.toUpperCase();
  const overTime = sharesSeriesFor(t);
  const shares_over_time = overTime
    ? {
        denom: overTime.denomLabel,
        live_sats_adso: overTime.liveSatsAdso,
        n100: chartPointsFor(t, 100),
        series: overTime.points,
        note: "Seed/filings. Y-axis = BTC claimed by N shares. Step, no interpolate. No invented weekly ADSO.",
      }
    : null;

  const bars = barsFor(t);

  if (t === "ASST") {
    return NextResponse.json({
      ticker: t,
      feed: "series",
      note: "Weekly series is sats_basic = Class A+B from filings/ASST.json. Quarterly sats are AFDS. Do not mix denoms or interpolate 2025-09-30 to 2026-03-09.",
      denom: { weekly: "class_a+class_b", quarterly: "AFDS" },
      series: seriesFor(ticker),
      bars,
      quarterly_company: asstQuarterly(),
      sparkline_7: asstSpark7(),
      shares_over_time,
    });
  }
  return NextResponse.json({
    ticker: t,
    feed: "series",
    note:
      t === "MSTR"
        ? "Tape series is 2 pts (prior-week lock + latest). 100-share chart uses 7 filing seed points. Bars = rows with numeric satsChgPct only."
        : "Snapshot filing only.",
    series: seriesFor(ticker),
    bars,
    shares_over_time,
  });
}
