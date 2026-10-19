import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deliverNotification } from "@/lib/notification-delivery";

export const dynamic = "force-dynamic";
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (session.role !== "OWNER" && session.role !== "ADMIN") return NextResponse.json({ error: "Hanya pemilik atau admin yang dapat menguji kanal notifikasi." }, { status: 403 });
  const results = await deliverNotification({
    title: "Tes notifikasi Growth Operating System",
    message: `Ini adalah pesan uji untuk akun ${session.username}. Jika diterima, kanal notifikasi sudah terhubung.`,
  });
  const configured = results.some(result => !result.skipped);
  return NextResponse.json({ ok: results.some(result => result.ok), configured, results }, { status: configured ? 200 : 400 });
}
