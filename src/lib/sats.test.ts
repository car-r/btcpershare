import { describe, expect, test } from "bun:test";
import { satsPerShare, btcYield, verdictFromYield, formatSats } from "./sats";

describe("satsPerShare", () => {
  test("MSTR basic", () => expect(satsPerShare(845050, 420483000)).toBe(200971));
  test("MSTR ADSO", () => expect(satsPerShare(845050, 450090000)).toBe(187751));
  test("ASST effective", () => expect(satsPerShare(23156, 93262570)).toBe(24829));
  test("ASST AFDS", () => expect(satsPerShare(23156, 96523351)).toBe(23990));
  test("XXI classA", () => expect(satsPerShare(43514, 346636211)).toBe(12553));
});

describe("verdict", () => {
  test("ASST week accretive", () => {
    const y = btcYield(23813, 24829);
    expect(verdictFromYield(y)).toBe("accretive");
  });
  test("MSTR week dilutive", () => {
    const y = btcYield(188628, 187751);
    expect(verdictFromYield(y)).toBe("dilutive");
  });
  test("flat band", () => expect(verdictFromYield(0.0004)).toBe("flat"));
});

describe("format", () => {
  test("en-US separators", () => expect(formatSats(187751)).toBe("187,751"));
});
