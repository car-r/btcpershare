export type LiveField = { value: number | null; as_of: string | null; live: boolean; note?: string | null };

export type Spot = {
  value: number | null;
  as_of: string | null;
  live: boolean;
  source: string | null;
};

export async function fetchBtcSpot(): Promise<Spot> {
  try {
    const r = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", { cache: "no-store" });
    if (!r.ok) throw new Error("spot http " + r.status);
    const j = (await r.json()) as { data?: { amount?: string } };
    const n = Number(j.data?.amount);
    if (!Number.isFinite(n) || n <= 0) throw new Error("spot bad");
    return { value: n, as_of: new Date().toISOString(), live: true, source: "coinbase" };
  } catch {
    return { value: null, as_of: null, live: false, source: null };
  }
}

export async function fetchAsstLast(): Promise<Spot> {
  try {
    const r = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/ASST?interval=1d&range=1d", {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) throw new Error("asst http " + r.status);
    const j = (await r.json()) as { chart?: { result?: { meta?: { regularMarketPrice?: number } }[] } };
    const n = Number(j.chart?.result?.[0]?.meta?.regularMarketPrice);
    if (!Number.isFinite(n) || n <= 0) throw new Error("asst bad");
    return { value: n, as_of: new Date().toISOString(), live: true, source: "yahoo" };
  } catch {
    return { value: null, as_of: null, live: false, source: null };
  }
}
