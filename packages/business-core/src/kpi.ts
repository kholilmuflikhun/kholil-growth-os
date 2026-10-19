export type KpiDirection = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";
export function kpiAchievement(target: number, actual: number, direction: KpiDirection = "HIGHER_IS_BETTER", cap = 1.5): number {
  if (![target, actual, cap].every(Number.isFinite) || target < 0 || actual < 0 || cap < 0) throw new Error("Nilai KPI tidak valid.");
  if (target === 0) return actual === 0 ? 1 : (direction === "LOWER_IS_BETTER" ? 0 : cap);
  const ratio = direction === "HIGHER_IS_BETTER" ? actual / target : actual === 0 ? cap : target / actual;
  return Math.max(0, Math.min(cap, ratio));
}
export function weightedKpiScore(items: Array<{ target: number; actual: number; weight: number; direction?: KpiDirection }>): number | null {
  if (!items.length) return null;
  if (items.some((item) => !Number.isFinite(item.weight) || item.weight < 0)) throw new Error("Bobot KPI tidak valid.");
  const weightTotal = items.reduce((sum, item) => sum + item.weight, 0);
  if (weightTotal <= 0) return null;
  const contribution = items.reduce((sum, item) => sum + kpiAchievement(item.target, item.actual, item.direction) * item.weight, 0);
  return contribution / weightTotal * 100;
}
