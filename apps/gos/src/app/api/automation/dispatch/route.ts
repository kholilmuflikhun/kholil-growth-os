import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliverNotification } from "@/lib/notification-delivery";
import { matchesBearerSecret } from "@/lib/security-utils";

export const dynamic = "force-dynamic";

/** Vercel Cron calls this endpoint daily. Set CRON_SECRET in the deployment environment. */
async function dispatch(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!matchesBearerSecret(authorization, secret)) {
    return NextResponse.json({ error: "Unauthorized automation request." }, { status: 401 });
  }

  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const owner = await prisma.user.findFirst({
    where: { role: { in: ["OWNER", "ADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!owner) return NextResponse.json({ ok: true, created: 0, note: "No owner account exists yet." });
  const ownerId = owner.id;

  // Upcoming reminders receive one notice within 24 hours; overdue reminders receive
  // a separate notice. Dedupe keys make repeated/concurrent cron runs idempotent.
  const upcoming = await prisma.reminder.findMany({
    where: { status: "OPEN", dueAt: { gt: now, lte: soon } },
    orderBy: { dueAt: "asc" }, take: 200,
  });
  const overdue = await prisma.reminder.findMany({
    where: { status: "OPEN", dueAt: { lte: now } },
    orderBy: { dueAt: "asc" }, take: 200,
  });

  let createdUpcoming = 0;
  let createdOverdue = 0;
  async function createOnce(reminder: typeof upcoming[number], kind: "UPCOMING" | "OVERDUE") {
    const dedupeKey = `reminder:${reminder.id}:${kind}`;
    try {
      const title = kind === "UPCOMING" ? `Pengingat dalam 24 jam: ${reminder.title}` : `Pengingat terlambat: ${reminder.title}`;
      const message = reminder.description || `Jadwal: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(reminder.dueAt)}. Buka modul pengingat untuk meninjau tindakan ini.`;
      await prisma.notification.create({ data: {
        userId: ownerId, reminderId: reminder.id, dedupeKey,
        type: kind === "UPCOMING" ? "REMINDER_UPCOMING" : "REMINDER_DUE", title, message,
      } });
      // External delivery is best-effort; provider failure must not undo in-app notification creation.
      try { await deliverNotification({ title, message }); } catch { /* keep cron resilient */ }
      return true;
    } catch (error) {
      // PostgreSQL unique constraint prevents duplicates if two cron runs overlap.
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") return false;
      throw error;
    }
  }

  for (const reminder of upcoming) if (await createOnce(reminder, "UPCOMING")) createdUpcoming += 1;
  for (const reminder of overdue) if (await createOnce(reminder, "OVERDUE")) createdOverdue += 1;

  return NextResponse.json({
    ok: true,
    checkedUpcoming: upcoming.length,
    checkedOverdue: overdue.length,
    createdUpcoming,
    createdOverdue,
    ranAt: now.toISOString(),
  });
}

export async function GET(request: Request) { return dispatch(request); }
export async function POST(request: Request) { return dispatch(request); }
