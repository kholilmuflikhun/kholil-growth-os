import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const data = await prisma.customer.findMany({
    include: {
      _count: { select: { orders: true, payments: true } },
      orders: { select: { id: true, title: true, amount: true, status: true, payments: { select: { amount: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 1000,
  });
  return NextResponse.json({ data });
}
export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const businessName = typeof body?.businessName === "string" ? body.businessName.trim() : "";
  if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Nama pelanggan harus 2–120 karakter." }, { status: 400 });
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160)) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  if (phone.length > 40 || businessName.length > 160) return NextResponse.json({ error: "Kontak atau nama usaha terlalu panjang." }, { status: 400 });
  const data = await prisma.customer.create({ data: { name, email: email || null, phone: phone || null, businessName: businessName || null } });
  return NextResponse.json({ data }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID pelanggan tidak valid." }, { status: 400 });
  const data: { name?: string; email?: string | null; phone?: string | null; businessName?: string | null } = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 120) return NextResponse.json({ error: "Nama pelanggan tidak valid." }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.email !== undefined) {
    const value = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (value && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 160)) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    data.email = value || null;
  }
  for (const field of ["phone", "businessName"] as const) {
    if (body[field] !== undefined) {
      const value = typeof body[field] === "string" ? body[field].trim() : "";
      if (value.length > (field === "phone" ? 40 : 160)) return NextResponse.json({ error: "Data pelanggan terlalu panjang." }, { status: 400 });
      data[field] = value || null;
    }
  }
  try { return NextResponse.json({ data: await prisma.customer.update({ where: { id: body.id }, data }) }); }
  catch { return NextResponse.json({ error: "Pelanggan tidak ditemukan." }, { status: 404 }); }
}
export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID pelanggan wajib diisi." }, { status: 400 });
  const linked = await prisma.payment.count({ where: { customerId: id } });
  if (linked) return NextResponse.json({ error: "Pelanggan memiliki riwayat pembayaran. Ubah data pelanggan agar riwayat keuangan tetap terjaga." }, { status: 409 });
  try { await prisma.customer.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Pelanggan tidak ditemukan atau masih terkait dengan data lain." }, { status: 409 }); }
}
