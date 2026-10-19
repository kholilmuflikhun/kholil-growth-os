"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, WalletCards } from "lucide-react";

type Tx = { id: string; type: string; classification: string; category: string; amount: string | number; occurredAt: string; notes: string | null; reference: string | null; projectId: string | null; project?: { id: string; name: string } | null };
type ProjectOption = { id: string; name: string; status: string };
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
export default function FinanceManager() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [transactionType, setTransactionType] = useState("INCOME");
  const [classification, setClassification] = useState("OTHER_INCOME");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/finance", { cache: "no-store" }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memuat transaksi.");
      setRows(result.data);
      const projectResponse = await fetch("/api/projects", { cache: "no-store" });
      const projectResult = await projectResponse.json();
      if (projectResponse.ok) setProjects(projectResult.data.filter((p: ProjectOption) => !["COMPLETED", "CANCELLED"].includes(p.status)));
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat transaksi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const selected = rows.filter(r => r.occurredAt.slice(0, 7) === month);
  const income = selected.filter(r => r.type === "INCOME").reduce((s, r) => s + Number(r.amount), 0);
  const expense = selected.filter(r => r.type === "EXPENSE").reduce((s, r) => s + Number(r.amount), 0);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      type: String(form.get("type")), classification: String(form.get("classification")), category: String(form.get("category")), amount: Number(form.get("amount")),
      occurredAt: String(form.get("occurredAt")), notes: String(form.get("notes") || ""), reference: String(form.get("reference") || ""), projectId: String(form.get("projectId") || ""),
    }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Gagal menyimpan transaksi."); return; }
    event.currentTarget.reset(); setNotice("Transaksi berhasil dicatat."); await load();
  }
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label className="text-sm font-semibold">Periode laporan<input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mt-2 block rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"/></label><div className="flex gap-2"><a href={`/api/finance/export?month=${encodeURIComponent(month)}`} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-800">Ekspor CSV</a><button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-800"><RefreshCw className="mr-1 inline" size={16}/>Muat ulang</button></div></div>
    <div className="grid gap-3 sm:grid-cols-3">{[["Kas masuk", money(income), "text-emerald-600"], ["Kas keluar", money(expense), "text-red-600"], ["Arus kas bersih", money(income-expense), income-expense >= 0 ? "text-blue-600" : "text-red-600"]].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{label}</p><p className={`mt-2 text-2xl font-extrabold ${color}`}>{value}</p></div>)}</div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
    <form onSubmit={create} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2 xl:grid-cols-5">
      <div className="md:col-span-2 xl:col-span-5"><h2 className="font-extrabold">Catat transaksi</h2><p className="mt-1 text-sm text-zinc-500">Gunakan nominal positif. Klasifikasi memisahkan biaya langsung, beban operasional, dan arus kas non-operasional. Pembayaran order dicatat melalui modul Pelanggan.</p></div>
      <select required name="type" value={transactionType} onChange={event => { const next = event.target.value; setTransactionType(next); setClassification(next === "INCOME" ? "OTHER_INCOME" : "OPERATING_EXPENSE"); }} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"><option value="INCOME">Pemasukan lain</option><option value="EXPENSE">Pengeluaran</option></select>
      <select required name="classification" value={classification} onChange={event => setClassification(event.target.value)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950">{transactionType === "INCOME" ? <option value="OTHER_INCOME">Pendapatan lain</option> : <><option value="DIRECT_COST">Biaya langsung</option><option value="OPERATING_EXPENSE">Beban operasional</option><option value="OWNER_WITHDRAWAL">Penarikan pemilik</option><option value="TAX">Pajak</option><option value="LOAN_PRINCIPAL">Pokok pinjaman</option><option value="ASSET_PURCHASE">Pembelian aset</option><option value="REFUND">Pengembalian dana</option></>}</select>
      <input required name="category" minLength={2} maxLength={100} placeholder="Kategori, mis. Desain logo" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <input required name="amount" type="number" min="1" step="1" placeholder="Nominal (Rp)" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <input required name="occurredAt" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <input name="reference" placeholder="Referensi (opsional)" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <select name="projectId" defaultValue="" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"><option value="">Tanpa proyek terkait</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <input name="notes" placeholder="Catatan (opsional)" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 md:col-span-2"/>
      <button className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 md:col-span-2 xl:col-span-3"><WalletCards className="mr-1 inline" size={16}/>Simpan transaksi</button>
    </form>
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {loading ? <p className="p-8 text-center text-sm text-zinc-500">Memuat transaksi...</p> : selected.length === 0 ? <p className="p-8 text-center text-sm text-zinc-500">Belum ada transaksi pada periode ini.</p> : <table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/60"><tr>{["Tanggal", "Jenis", "Kategori / catatan", "Proyek", "Referensi", "Nominal"].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{selected.map(r => <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800"><td className="px-4 py-4">{new Date(r.occurredAt).toLocaleDateString("id-ID")}</td><td className={`px-4 py-4 font-bold ${r.type === "INCOME" ? "text-emerald-600" : "text-red-600"}`}>{r.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</td><td className="px-4 py-4"><p className="font-semibold">{r.category}</p><p className="text-xs text-zinc-500">{r.classification.replaceAll("_", " ")}</p>{r.notes && <p className="mt-1 text-xs text-zinc-500">{r.notes}</p>}</td><td className="px-4 py-4 text-zinc-500">{r.project?.name || "—"}</td><td className="px-4 py-4 text-zinc-500">{r.reference || "—"}</td><td className="px-4 py-4 font-extrabold">{money(Number(r.amount))}</td></tr>)}</tbody></table>}
    </div>
    <p className="text-xs leading-5 text-zinc-500">Laporan ini menghitung transaksi berdasarkan tanggal transaksi, bukan tanggal penyelesaian. Selisih pemasukan dan pengeluaran bukan otomatis laba bersih akuntansi.</p>
  </div>;
}
