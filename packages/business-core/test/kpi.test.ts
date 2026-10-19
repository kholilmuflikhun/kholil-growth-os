import { describe, expect, it } from "vitest";
import { kpiAchievement, weightedKpiScore } from "../src/kpi";

describe("KPI scoring", () => {
  it("caps higher-is-better achievement and supports lower-is-better metrics", () => {
    expect(kpiAchievement(10, 20)).toBe(1.5);
    expect(kpiAchievement(10, 5, "LOWER_IS_BETTER")).toBe(1.5);
  });
  it("normalizes the weighted score and handles empty input", () => {
    expect(weightedKpiScore([{ target: 10, actual: 10, weight: 0.5 }, { target: 20, actual: 10, weight: 0.5 }])).toBe(75);
    expect(weightedKpiScore([])).toBeNull();
  });
});
