import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const now = new Date();
  const old = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const [expiredSessions, oldBuckets] = await prisma.$transaction([
    prisma.authSession.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: old } }] } }),
    prisma.rateLimitBucket.deleteMany({ where: { windowStart: { lt: old } } }),
  ]);
  return NextResponse.json({ ok: true, cleanedAt: now.toISOString(), expiredSessions: expiredSessions.count, oldRateLimitBuckets: oldBuckets.count });
}
