import { COMPANIES, satsForPill } from "@/lib/tape";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    disclaimer: "Not financial advice. BTC and share counts are filing-locked until the next 8-K.",
    companies: COMPANIES.map((c) => ({
      ticker: c.ticker,
      name: c.name,
      asOf: c.asOf,
      btc: c.btc,
      satsBasic: satsForPill(c, "basic"),
      satsFd: satsForPill(c, "fd"),
      satsClean: satsForPill(c, "clean"),
      lastWeek: c.lastWeek,
      activities: c.activities,
      sources: c.sources,
    })),
  });
}
