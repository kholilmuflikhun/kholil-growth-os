import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toMinorUnits } from "@kholil/business-core/finance";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const [payments, orders] = await Promise.all([
    prisma.payment.findMany({ include: { customer: { select: { id: true, name: true, businessName: true } }, order: { select: { id: true, title: true, amount: true, status: true } }, transaction: { select: { id: true, occurredAt: true, category: true } } }, orderBy: { paidAt: "desc" }, take: 1000 }),
    prisma.order.findMany({ where: { status: { not: "CANCELLED" } }, include: { customer: true, payments: { select: { amount: true } } }, orderBy: { createdAt: "desc" }, take: 1000 }),
  ]);
  return NextResponse.json({ data: payments, orders }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const amount = Number(body?.amount);
  const paidAt = new Date(String(body?.paidAt || ""));
  const method = typeof body?.method === "string" ? body.method : "TRANSFER";
  const reference = typeof body?.reference === "string" ? body.reference.trim().slice(0, 120) : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : "";
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : request.headers.get("idempotency-key")?.trim() || "";
  if (!orderId) return NextResponse.json({ error: "Order wajib dipilih." }, { status: 400 });
  if (idempotencyKey.length < 8 || idempotencyKey.length > 120) return NextResponse.json({ error: "Kunci idempotensi wajib berisi 8–120 karakter." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000 || Math.abs(toMinorUnits(amount) / 100 - amount) > 1e-8) return NextResponse.json({ error: "Nominal pembayaran harus lebih dari nol dan maksimal dua angka desimal." }, { status: 400 });
  if (Number.isNaN(paidAt.getTime())) return NextResponse.json({ error: "Tanggal pembayaran tidak valid." }, { status: 400 });
  if (! ["CASH", "TRANSFER", "QRIS", "OTHER"].includes(method)) return NextResponse.json({ error: "Metode pembayaran tidak valid." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Serialize all payments for the same order to prevent concurrent over-collection.
      await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
      const prior = await tx.payment.findUnique({ where: { idempotencyKey }, include: { customer: { select: { id: true, name: true, businessName: true } }, order: { select: { id: true, title: true, amount: true, status: true } }, transaction: { select: { id: true, occurredAt: true, category: true } } } });
      if (prior) {
        const sameRequest = prior.orderId === orderId && toMinorUnits(String(prior.amount)) === toMinorUnits(amount) && prior.method === method && (prior.reference ?? "") === (reference || "");
        if (!sameRequest) throw new Error("IDEMPOTENCY_KEY_REUSED");
        return { payment: prior, alreadyRecorded: true };
      }
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: { select: { amount: true } }, project: { select: { id: true } } } });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.status === "CANCELLED") throw new Error("ORDER_CANCELLED");
      const paidCents = order.payments.reduce((sum, payment) => sum + toMinorUnits(String(payment.amount)), 0);
      const orderCents = toMinorUnits(String(order.amount));
      const amountCents = toMinorUnits(amount);
      const remainingCents = Math.max(0, orderCents - paidCents);
      if (amountCents > remainingCents) throw new Error(`PAYMENT_EXCEEDS_BALANCE:${remainingCents}`);
      let customer = order.customerId ? await tx.customer.findUnique({ where: { id: order.customerId } }) : null;
      if (!customer) customer = await tx.customer.create({ data: { name: order.customerName, phone: order.contact || null } });
      const finance = await tx.financialTransaction.create({
        data: { type: "INCOME", category: "Pembayaran order", classification: "CUSTOMER_PAYMENT", amount, occurredAt: paidAt, settlementAt: paidAt, reference: reference || `ORDER-${order.id}`, notes: [order.title, method, notes].filter(Boolean).join(" · ").slice(0, 1000), projectId: order.projectId },
      });
      const payment = await tx.payment.create({
        data: { orderId, customerId: customer.id, transactionId: finance.id, idempotencyKey, amount, paidAt, method, reference: reference || null, notes: notes || null },
        include: { customer: { select: { id: true, name: true, businessName: true } }, order: { select: { id: true, title: true, amount: true, status: true } }, transaction: { select: { id: true, occurredAt: true, category: true } } },
      });
      if (!order.customerId) await tx.order.update({ where: { id: order.id }, data: { customerId: customer.id } });
      return { payment, alreadyRecorded: false };
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 });
    return NextResponse.json({ data: result.payment, alreadyRecorded: result.alreadyRecorded }, { status: result.alreadyRecorded ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "IDEMPOTENCY_KEY_REUSED") return NextResponse.json({ error: "Kunci idempotensi sudah digunakan untuk pembayaran berbeda. Muat ulang riwayat sebelum mencoba lagi." }, { status: 409 });
    if (message === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    if (message === "ORDER_CANCELLED") return NextResponse.json({ error: "Pembayaran tidak dapat dicatat untuk order yang dibatalkan." }, { status: 409 });
    if (message.startsWith("PAYMENT_EXCEEDS_BALANCE:")) {
      const remaining = Number(message.split(":")[1] || 0) / 100;
      return NextResponse.json({ error: `Nominal melebihi sisa tagihan (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(remaining)}).` }, { status: 409 });
    }
    // A concurrent retry may have committed the same idempotency key first.
    const existing = await prisma.payment.findUnique({ where: { idempotencyKey }, include: { customer: { select: { id: true, name: true, businessName: true } }, order: { select: { id: true, title: true, amount: true, status: true } }, transaction: { select: { id: true, occurredAt: true, category: true } } } }).catch(() => null);
    if (existing) return NextResponse.json({ data: existing, alreadyRecorded: true }, { status: 200 });
    console.error("Payment transaction failed", error);
    return NextResponse.json({ error: "Pembayaran gagal dicatat. Tidak ada perubahan yang dikonfirmasi; periksa riwayat pembayaran sebelum mencoba kembali." }, { status: 500 });
  }
}
