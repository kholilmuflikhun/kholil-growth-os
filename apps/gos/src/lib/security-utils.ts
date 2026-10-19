/** Small pure helpers shared by API routes and tests. */
export function hasStrongSecret(value: string | undefined, minimumLength = 32): boolean {
  return typeof value === "string" && value.length >= minimumLength && !/^changeme|^example|^your[-_ ]/i.test(value);
}

/** Compare bearer tokens without an early character-by-character exit. */
export function matchesBearerSecret(authorization: string | null, secret: string | undefined): boolean {
  if (!authorization || !hasStrongSecret(secret)) return false;
  const expected = `Bearer ${secret}`;
  if (authorization.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= authorization.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

/** Prefix spreadsheet formula-leading values before CSV export. */
export function protectCsvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? `'${text}` : text;
}
