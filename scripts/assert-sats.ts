import {
  MSTR,
  ASST,
  XXI,
  HERO_DEFAULT,
  ACCRETION_PRESETS,
  runAccretion,
  satsForPill,
} from "../src/data/tape";
import { satsPerShare } from "../src/lib/sats";

const checks: Array<[string, boolean]> = [
  ["MSTR basic", satsPerShare(MSTR.btc, MSTR.basicShares) === 200971],
  ["MSTR ADSO", satsPerShare(MSTR.btc, MSTR.fdShares!) === 187751],
  ["ASST basic", satsPerShare(ASST.btc, ASST.basicShares) === 24829],
  ["ASST AFDS", satsPerShare(ASST.btc, ASST.fdShares!) === 23990],
  ["XXI classA", satsPerShare(XXI.btc, XXI.basicShares) === 12553],
  ["hero default", HERO_DEFAULT.sats === 187751 && HERO_DEFAULT.pill === "fd"],
  ["hero not clean", satsForPill(MSTR, "fd") === 187751],
];

for (const p of ACCRETION_PRESETS) {
  const r = runAccretion(p);
  checks.push([
    `accretion ${p.id}`,
    r.satsStart === p.expectedSatsStart &&
      r.satsEnd === p.expectedSatsEnd &&
      r.verdict === p.expectedVerdict,
  ]);
}

let failed = 0;
for (const [name, ok] of checks) {
  if (!ok) {
    console.error("FAIL", name);
    failed++;
  } else {
    console.log("ok", name);
  }
}
if (failed) {
  process.exit(1);
}
console.log("assert-sats: all passed");
