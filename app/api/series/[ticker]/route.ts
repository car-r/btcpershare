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
  return NextResponse.json({
    ticker: ticker.toUpperCase(),
    feed: "series",
    note: "Placeholder seed (latest filing plus prior-week lock). Full 8-K warehouse comes later.",
    series: seriesFor(ticker),
  });
}
