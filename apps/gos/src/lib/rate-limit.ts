import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type RateLimitResult = { allowed: boolean; limit: number; remaining: number; resetAt: Date };

/** Database-backed fixed-window limiter; key material is hashed before persistence. */
export async function checkRateLimit(input: {
  namespace: string; identifier: string; limit: number; windowMs: number; now?: Date;
}): Promise<RateLimitResult> {
  const now = input.now ?? new Date();
  const windowStart = new Date(Math.floor(now.getTime() / input.windowMs) * input.windowMs);
  const resetAt = new Date(windowStart.getTime() + input.windowMs);
  const pepper = process.env.AUTH_SECRET;
  if (!pepper || pepper.length < 32) throw new Error("AUTH_SECRET must be configured before rate limiting.");
  const keyHash = createHash("sha256").update(`${pepper}:${input.namespace}:${input.identifier}`).digest("hex");
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { keyHash_windowStart: { keyHash, windowStart } },
    create: { keyHash, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  // Opportunistic bounded cleanup; a scheduled daily cleanup is still recommended in production.
  if (now.getUTCMinutes() === 0 && now.getUTCSeconds() < 3) {
    await prisma.rateLimitBucket.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) } } }).catch(() => undefined);
  }
  return { allowed: bucket.count <= input.limit, limit: input.limit, remaining: Math.max(0, input.limit - bucket.count), resetAt };
}

export function getRequestAddress(request: Request, trustedForwardedAddress?: string | null): string {
  const candidate = trustedForwardedAddress ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Keep key size bounded and avoid persisting raw network identifiers.
  return candidate.trim().slice(0, 100) || "unknown";
}
