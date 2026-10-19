import { describe, expect, it } from "vitest";
import { hasStrongSecret, matchesBearerSecret, protectCsvCell } from "./security-utils";

describe("security helpers", () => {
  it("rejects missing, short, and placeholder secrets", () => {
    expect(hasStrongSecret(undefined)).toBe(false);
    expect(hasStrongSecret("short")).toBe(false);
    expect(hasStrongSecret("your-secret-value-that-is-long-enough" )).toBe(false);
    expect(hasStrongSecret("a".repeat(40))).toBe(true);
  });
  it("requires exact bearer token and strong configured secret", () => {
    const secret = "s".repeat(40);
    expect(matchesBearerSecret(`Bearer ${secret}`, secret)).toBe(true);
    expect(matchesBearerSecret(`Bearer ${secret}x`, secret)).toBe(false);
    expect(matchesBearerSecret(`Bearer ${secret}`, "short")).toBe(false);
    expect(matchesBearerSecret(null, secret)).toBe(false);
  });
  it("protects CSV values that could be interpreted as spreadsheet formulas", () => {
    expect(protectCsvCell("=1+1")).toBe("'=1+1");
    expect(protectCsvCell("  @SUM(A1:A2)")).toBe("'  @SUM(A1:A2)");
    expect(protectCsvCell("ordinary text")).toBe("ordinary text");
    expect(protectCsvCell(null)).toBe("");
  });
});
