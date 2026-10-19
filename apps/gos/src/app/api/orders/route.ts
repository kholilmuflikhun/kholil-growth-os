import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = ["CONFIRMED", "IN_PROGRESS", "DELIVERED", "CANCELLED"] as const;
async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const [orders, proposals] = await Promise.all([
    prisma.order.findMany({
      include: {
        proposal: { select: { id: true, status: true, lead: { select: { id: true, name: true, businessName: true } } } },
        project: { select: { id: true, name: true, status: true } },
        customer: { select: { id: true, name: true, businessName: true } },
        payments: { select: { amount: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    }),
    prisma.proposal.findMany({
      where: { status: "ACCEPTED", order: { is: null } },
      include: { lead: { select: { id: true, name: true, contact: true, businessName: true, service: true } } },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
  ]);
  return NextResponse.json({ data: orders, acceptedProposals: proposals });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const proposalId = typeof body?.proposalId === "string" ? body.proposalId : "";
  if (!proposalId) return NextResponse.json({ error: "Penawaran yang disetujui wajib dipilih." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { proposalId }, include: { proposal: true, project: true, customer: true, payments: true } });
      if (existing) return { order: existing, alreadyExists: true };
      const proposal = await tx.proposal.findUnique({
        where: { id: proposalId },
        include: { lead: { select: { id: true, name: true, contact: true, businessName: true, status: true } } },
      });
      if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
      if (proposal.status !== "ACCEPTED") throw new Error("PROPOSAL_NOT_ACCEPTED");
      const customerName = proposal.lead.businessName || proposal.lead.name;
      let customer = await tx.customer.findFirst({
        where: { OR: [{ phone: proposal.lead.contact }, { name: customerName }] }, orderBy: { createdAt: "asc" },
      });
      if (!customer) customer = await tx.customer.create({ data: { name: proposal.lead.name, phone: proposal.lead.contact, businessName: proposal.lead.businessName } });
      const order = await tx.order.create({
        data: { proposalId: proposal.id, customerId: customer.id, customerName, contact: proposal.lead.contact, title: proposal.title, amount: proposal.amount, notes: proposal.notes },
        include: { proposal: { select: { id: true, status: true, lead: { select: { id: true, name: true, businessName: true } } } }, project: true, customer: true, payments: true },
      });
      await tx.lead.update({ where: { id: proposal.leadId }, data: { status: "WON", estimatedValue: proposal.amount } });
      return { order, alreadyExists: false };
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 });
    return NextResponse.json({ data: result.order, alreadyExists: result.alreadyExists }, { status: result.alreadyExists ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PROPOSAL_NOT_FOUND") return NextResponse.json({ error: "Penawaran tidak ditemukan." }, { status: 404 });
    if (message === "PROPOSAL_NOT_ACCEPTED") return NextResponse.json({ error: "Order hanya dapat dibuat dari penawaran berstatus Disetujui." }, { status: 409 });
    // A concurrent retry may have created the unique order; retrieve it instead of duplicating it.
    const existing = await prisma.order.findUnique({ where: { proposalId }, include: { proposal: true, project: true, customer: true, payments: true } }).catch(() => null);
    if (existing) return NextResponse.json({ data: existing, alreadyExists: true }, { status: 200 });
    console.error("Order conversion failed", error);
    return NextResponse.json({ error: "Order gagal dibuat. Tidak ada perubahan yang dikonfirmasi; periksa status penawaran sebelum mencoba kembali." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID order tidak valid." }, { status: 400 });
  const data: { status?: string; startDate?: Date | null; dueDate?: Date | null; deliveredAt?: Date | null; notes?: string | null; projectId?: string | null } = {};
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: "Status order tidak valid." }, { status: 400 });
    data.status = body.status;
    if (body.status === "DELIVERED") data.deliveredAt = new Date();
  }
  for (const field of ["startDate", "dueDate"] as const) {
    if (body[field] !== undefined) {
      const value = body[field] ? new Date(String(body[field])) : null;
      if (value && Number.isNaN(value.getTime())) return NextResponse.json({ error: `Tanggal ${field} tidak valid.` }, { status: 400 });
      data[field] = value;
    }
  }
  if (body.notes !== undefined) data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;
  if (body.projectId !== undefined) {
    if (body.projectId === null || body.projectId === "") data.projectId = null;
    else if (typeof body.projectId === "string" && await prisma.project.findUnique({ where: { id: body.projectId }, select: { id: true } })) data.projectId = body.projectId;
    else return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }
  try {
    const order = await prisma.order.update({
      where: { id: body.id }, data,
      include: { proposal: { select: { id: true, status: true, lead: { select: { id: true, name: true, businessName: true } } } }, project: { select: { id: true, name: true, status: true } } },
    });
    return NextResponse.json({ data: order });
  } catch { return NextResponse.json({ error: "Order tidak ditemukan atau gagal diperbarui." }, { status: 404 }); }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID order wajib diisi." }, { status: 400 });
  try { await prisma.order.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 }); }
}
