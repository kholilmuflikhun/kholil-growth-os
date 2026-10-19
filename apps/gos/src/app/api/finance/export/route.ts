import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function csvCell(value: unknown) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");
  // Prevent spreadsheet formula injection in exported user-entered text.
  const safe = /^[=+@\\-\\t\\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["OWNER", "ADMIN", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  }
  const url = new URL(request.url);
  const month = url.searchParams.get("month");
  if (!month || !/^\\d{4}-\\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Periode bulan harus berformat YYYY-MM." }, { status: 400 });
  }
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 1);
  const rows = await prisma.financialTransaction.findMany({
    where: { occurredAt: { gte: start, lt: end } },
    include: { project: { select: { name: true } } },
    orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
  });
  const header = ["Tanggal", "Jenis", "Kategori", "Nominal_Rp", "Proyek", "Referensi", "Catatan"];
  const lines = [header, ...rows.map(row => [
    row.occurredAt.toISOString().slice(0, 10),
    row.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
    row.category, Number(row.amount), row.project?.name || "", row.reference || "", row.notes || "",
  ])];
  const csv = "\\uFEFF" + lines.map(line => line.map(csvCell).join(",")).join("\\r\\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finance-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
