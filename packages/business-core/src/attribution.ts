export type AttributionInput = { source?: string | null; medium?: string | null; campaign?: string | null };
export function cleanUtmValue(value: unknown, maxLength = 160): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength);
  return cleaned || undefined;
}
/** Only exact campaign slugs can link a public inquiry to an internal campaign record. */
export function normalizeCampaignSlug(value: unknown): string | undefined {
  const cleaned = cleanUtmValue(value, 160)?.toLowerCase();
  return cleaned && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned) ? cleaned : undefined;
}
export function attributionCompleteness(input: AttributionInput): number {
  return [input.source, input.medium, input.campaign].filter((value) => cleanUtmValue(value)).length;
}
