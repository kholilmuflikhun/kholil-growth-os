import { describe, expect, it } from "vitest";
import { calculateFinancialSnapshot, calculateFinancialSummary, toMinorUnits } from "../src/finance";

describe("operational financial snapshot", () => {
  it("separates recognized revenue, cash receipts, receivables and operating profit", () => {
    const result = calculateFinancialSnapshot({
      orders: [
        { amount: "1000.00", status: "DELIVERED", payments: [{ amount: "400.00" }] },
        { amount: "500.00", status: "IN_PROGRESS", payments: [{ amount: "100.00" }] },
        { amount: "200.00", status: "CANCELLED", payments: [] },
      ],
      payments: [{ amount: "400.00" }, { amount: "100.00" }],
      transactions: [
        { type: "EXPENSE", classification: "DIRECT_COST", amount: "200.00" },
        { type: "EXPENSE", classification: "OPERATING_EXPENSE", amount: "100.00" },
        { type: "INCOME", classification: "CUSTOMER_PAYMENT", amount: "500.00" },
        { type: "INCOME", classification: "UNCLASSIFIED", amount: "50.00" },
      ],
    });
    expect(result.recognizedRevenue).toBe(1000);
    expect(result.cashCollected).toBe(500);
    expect(result.receivables).toBe(1000);
    expect(result.grossProfit).toBe(800);
    expect(result.netOperatingProfit).toBe(700);
    expect(result.unclassifiedInflows).toBe(50);
  });
  it("rounds currency to minor units to avoid binary floating-point drift", () => {
    expect(toMinorUnits(0.1) + toMinorUnits(0.2)).toBe(30);
  });
  it("rejects non-finite monetary values", () => { expect(() => toMinorUnits("NaN")).toThrow(); });
});

describe("aggregate financial summary", () => {
  it("calculates dashboard totals without loading every order or transaction", () => {
    const summary = calculateFinancialSummary({
      recognizedRevenue: "1200.00", activeOrderValue: "1800.00", activeOrderPayments: "600.00", cashCollected: "400.00",
      transactionTotals: [
        { type: "INCOME", classification: "CUSTOMER_PAYMENT", amount: "400.00" },
        { type: "INCOME", classification: "OTHER_INCOME", amount: "100.00" },
        { type: "EXPENSE", classification: "DIRECT_COST", amount: "250.00" },
        { type: "EXPENSE", classification: "OPERATING_EXPENSE", amount: "150.00" },
        { type: "EXPENSE", classification: "OWNER_WITHDRAWAL", amount: "75.00" },
      ],
    });
    expect(summary.recognizedRevenue).toBe(1200);
    expect(summary.cashCollected).toBe(400);
    expect(summary.receivables).toBe(1200);
    expect(summary.grossProfit).toBe(950);
    expect(summary.netOperatingProfit).toBe(900);
    expect(summary.netCashFlow).toBe(25);
  });
});
