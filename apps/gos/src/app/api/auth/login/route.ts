import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { checkRateLimit, getRequestAddress } from "@/lib/rate-limit";

const schema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const ip = getRequestAddress(request);
  try {
    const rate = await checkRateLimit({ namespace: "login", identifier: ip, limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rate.allowed) return NextResponse.json({ error: "Terlalu banyak percobaan login. Silakan coba lagi setelah beberapa saat." }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt.getTime() - Date.now()) / 1000))) } });
  } catch (error) {
    console.error("Login rate limit unavailable", error);
    return NextResponse.json({ error: "Layanan login sementara tidak tersedia." }, { status: 503 });
  }
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 8_192) return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  let body: unknown = null;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Periksa username dan password." }, { status: 400 });
  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: parsed.data.username }, { email: parsed.data.username }] },
    });
    const valid = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
    if (!user || !valid) {
      console.warn("Failed GOS login attempt", { ip, at: new Date().toISOString() });
      return NextResponse.json({ error: "Kredensial tidak valid." }, { status: 401 });
    }
    await createSession({ userId: user.id, email: user.email, username: user.username, role: user.role, mustChangePassword: user.mustChangePassword });
    return NextResponse.json({ ok: true, mustChangePassword: user.mustChangePassword });
  } catch (error) {
    console.error("GOS login unavailable", error);
    return NextResponse.json({ error: "Layanan login belum siap. Periksa konfigurasi database dan AUTH_SECRET." }, { status: 503 });
  }
}
