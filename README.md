# btcpershare

Static Astro 5 site for [btcpershare.io](https://btcpershare.io) — did they stack more Bitcoin than they printed shares?

Not financial advice.

## Run

Requires Node 24.x (see `package.json` engines). Bun also works for install/dev/build.

```bash
bun install
bun run dev
bun run build
bun run preview
```

Tests / asserts:

```bash
bun test
bun run assert:sats
bun run build   # also runs dist ban-list + hero checks
```

## Filing-locked data

Holdings and share counts live in `src/data/tape.ts` and are derived with:

`sats = round(btc * 100_000_000 / shares)`

Build-time asserts fail if locked sats drift. Price / mNAV / clean are live-ish (strategy.com fetch with snapshot fallback) and must not replace the hero default.

Hero default: **MSTR · FD(ADSO) · 187,751 sats**.

## DNS / deploy

DNS, Vercel project domains, GoDaddy, and Cloudflare are **not** managed in this repo.
