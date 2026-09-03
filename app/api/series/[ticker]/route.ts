import { COMPANIES } from "@/lib/tape";
import { seriesFor } from "@/lib/snapshot";
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
  const note =
    t === "ASST"
      ? "ASST 8-K warehouse. sats_basic = BTC * 1e8 / (Class A + Class B). SATA is preferred, not in that number."
      : "Placeholder seed (latest filing plus prior-week lock). Full 8-K warehouse comes later.";
  return NextResponse.json({
    ticker: t,
    feed: "series",
    note,
    series: seriesFor(ticker),
  });
}
