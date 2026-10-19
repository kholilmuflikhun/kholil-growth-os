import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function cell(value: unknown) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  const safe = /^[=+@\\-\\t\\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export async function GET() {
  const session = await getSession();
  if (!session || !["OWNER", "ADMIN", "MANAGER"].includes(session.role)) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const rows = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
  const header = ["Tanggal_Dibuat", "Nama", "Bisnis", "Kontak", "Layanan", "Status", "Estimasi_Rp", "Probabilitas_Menang_Persen", "Forecast_Tertimbang_Rp", "Penanggung_Jawab", "Follow_Up", "Sumber", "Alasan_Tidak_Lanjut", "Catatan"];
  const lines = [header, ...rows.map(r => [
    r.createdAt.toISOString(), r.name, r.businessName || "", r.contact, r.service, r.status,
    r.estimatedValue == null ? "" : Number(r.estimatedValue), r.probability, r.estimatedValue == null ? 0 : Number(r.estimatedValue) * r.probability / 100,
    r.owner || "", r.nextFollowUp || "", r.source, r.lostReason || "", r.message,
  ])];
  const csv = "\\uFEFF" + lines.map(line => line.map(cell).join(",")).join("\\r\\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="crm-leads.csv"', "Cache-Control": "no-store" } });
}
