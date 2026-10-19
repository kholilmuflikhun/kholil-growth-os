import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession, destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(12).max(200).regex(/[A-Z]/, "Gunakan huruf besar").regex(/[a-z]/, "Gunakan huruf kecil").regex(/[0-9]/, "Gunakan angka").regex(/[^A-Za-z0-9]/, "Gunakan simbol") });
export async function POST(request: Request) {
  const session = await getSession({ allowPasswordChange: true });
  if (!session) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Password baru minimal 12 karakter dan harus mencakup huruf besar, huruf kecil, angka, dan simbol." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) return NextResponse.json({ error: "Password saat ini tidak sesuai." }, { status: 400 });
  if (await bcrypt.compare(parsed.data.newPassword, user.passwordHash)) return NextResponse.json({ error: "Password baru harus berbeda dari password saat ini." }, { status: 400 });
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } }),
    prisma.authSession.updateMany({ where: { userId: user.id, id: { not: session.sessionId }, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await destroySession();
  await createSession({ userId: user.id, email: user.email, username: user.username, role: user.role, mustChangePassword: false });
  return NextResponse.json({ ok: true, otherSessionsRevoked: true });
}
