import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const [data, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { reminder: { select: { id: true, status: true, dueAt: true } } },
    }),
    prisma.notification.count({ where: { userId: session.userId, readAt: null } }),
  ]);
  return NextResponse.json({ data, unread });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (body?.all === true) {
    await prisma.notification.updateMany({ where: { userId: session.userId, readAt: null }, data: { readAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID notifikasi tidak valid." }, { status: 400 });
  const result = await prisma.notification.updateMany({ where: { id: body.id, userId: session.userId, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true, updated: result.count });
}
