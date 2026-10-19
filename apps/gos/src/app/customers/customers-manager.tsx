"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CircleDollarSign, RefreshCw, Search, UsersRound, WalletCards } from "lucide-react";

type Customer = { id: string; name: string; email: string | null; phone: string | null; businessName: string | null; _count: { orders: number; payments: number }; orders: { id: string; title: string; amount: string | number; status: string; payments: { amount: string | number }[] }[] };
type Order = { id: string; title: string; amount: string | number; status: string; customerId: string | null; customerName: string; contact: string; payments: { amount: string | number }[]; customer: { id: string; name: string; businessName: string | null } | null };
type Payment = { id: string; amount: string | number; paidAt: string; method: string; reference: string | null; notes: string | null; customer: { id: string; name: string; businessName: string | null }; order: { id: string; title: string; amount: string | number; status: string }; transaction: { id: string; occurredAt: string; category: string } | null };
const money = (n:number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
const fmtDate = (s:string) => new Intl.DateTimeFormat("id-ID",{dateStyle:"medium"}).format(new Date(s));
const methods: Record<string,string> = { CASH:"Tunai", TRANSFER:"Transfer bank", QRIS:"QRIS", OTHER:"Lainnya" };
export default function CustomersManager() {
  const [customers,setCustomers] = useState<Customer[]>([]);
  const [payments,setPayments] = useState<Payment[]>([]);
  const [orders,setOrders] = useState<Order[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [query,setQuery] = useState("");
  const [busy,setBusy] = useState(false);
  const [paymentIdempotencyKey,setPaymentIdempotencyKey] = useState(() => crypto.randomUUID());
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [cRes,pRes] = await Promise.all([fetch("/api/customers",{cache:"no-store"}),fetch("/api/payments",{cache:"no-store"})]);
      const [cJson,pJson] = await Promise.all([cRes.json(),pRes.json()]);
      if (!cRes.ok) throw new Error(cJson.error || "Gagal memuat pelanggan.");
      if (!pRes.ok) throw new Error(pJson.error || "Gagal memuat pembayaran.");
      setCustomers(cJson.data); setPayments(pJson.data); setOrders(pJson.orders);
    } catch(e) { setError(e instanceof Error ? e.message : "Gagal memuat data."); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{void load();},[load]);
  const orderRows = useMemo(()=>orders.map(o=>({...o,paid:o.payments.reduce((s,p)=>s+Number(p.amount),0),balance:Math.max(0,Number(o.amount)-o.payments.reduce((s,p)=>s+Number(p.amount),0))})),[orders]);
  const receivables = orderRows.filter(o=>o.status!=="CANCELLED").reduce((s,o)=>s+o.balance,0);
  const totalPayments = payments.reduce((s,p)=>s+Number(p.amount),0);
  const filtered = customers.filter(c=>[c.name,c.businessName||"",c.email||"",c.phone||""].join(" ").toLowerCase().includes(query.toLowerCase()));
  async function createCustomer(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError("");setNotice("");setBusy(true);
    const formElement=e.currentTarget;
    const form=new FormData(formElement);
    try {
      const res=await fetch("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),businessName:form.get("businessName"),phone:form.get("phone"),email:form.get("email")})});
      const json=await res.json();if(!res.ok)throw new Error(json.error||"Gagal menyimpan pelanggan.");
      formElement.reset();setNotice("Pelanggan berhasil ditambahkan.");await load();
    } catch(err){setError(err instanceof Error?err.message:"Gagal menyimpan pelanggan.");}
    finally{setBusy(false);}
  }
  async function recordPayment(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError("");setNotice("");setBusy(true);
    const formElement=e.currentTarget;
    const form=new FormData(formElement);
    try {
      const res=await fetch("/api/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idempotencyKey:paymentIdempotencyKey,orderId:form.get("orderId"),amount:Number(form.get("amount")),paidAt:form.get("paidAt"),method:form.get("method"),reference:form.get("reference"),notes:form.get("notes")})});
      const json=await res.json();if(!res.ok)throw new Error(json.error||"Gagal mencatat pembayaran.");
      formElement.reset();setNotice("Pembayaran dicatat dan transaksi pemasukan Finance dibuat otomatis.");await load();
    } catch(err){setError(err instanceof Error?err.message:"Gagal mencatat pembayaran.");}
    finally{setBusy(false);}
  }
  const outstandingOrders=orderRows.filter(o=>o.balance>0 && o.status!=="CANCELLED");
  return <div className="space-y-6">
    {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <section className="grid gap-3 sm:grid-cols-3">{[["Database pelanggan",String(customers.length)],["Pembayaran tercatat",money(totalPayments)],["Sisa piutang order",money(receivables)]].map(([label,value])=><article key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></article>)}</section>
    <section className="grid gap-5 xl:grid-cols-2">
      <form onSubmit={createCustomer} className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-2"><UsersRound className="text-blue-600"/><h2 className="font-extrabold">Tambah pelanggan</h2></div><p className="text-sm text-zinc-500">Simpan data pelanggan atau usaha untuk riwayat order berikutnya.</p><input name="name" required minLength={2} maxLength={120} placeholder="Nama kontak pelanggan" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/><input name="businessName" maxLength={160} placeholder="Nama usaha (opsional)" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/><div className="grid gap-3 sm:grid-cols-2"><input name="phone" maxLength={40} placeholder="Nomor telepon / WhatsApp" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/><input name="email" type="email" maxLength={160} placeholder="Email (opsional)" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/></div><button disabled={busy} className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Simpan pelanggan</button></form>
      <form onSubmit={recordPayment} className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-2"><CircleDollarSign className="text-blue-600"/><h2 className="font-extrabold">Catat pembayaran order</h2></div><p className="text-sm text-zinc-500">Untuk uang muka, cicilan, atau pelunasan. Pemasukan Finance dibuat otomatis satu kali per pembayaran.</p><select name="orderId" required defaultValue="" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"><option value="" disabled>Pilih order dengan sisa tagihan</option>{outstandingOrders.map(o=><option key={o.id} value={o.id}>{o.title} · {o.customerName} · Sisa {money(o.balance)}</option>)}</select><div className="grid gap-3 sm:grid-cols-2"><input name="amount" type="number" required min="1" step="1" placeholder="Nominal diterima (Rp)" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/><input name="paidAt" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/></div><div className="grid gap-3 sm:grid-cols-2"><select name="method" defaultValue="TRANSFER" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950">{Object.entries(methods).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><input name="reference" maxLength={120} placeholder="No. referensi / bukti (opsional)" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/></div><input name="notes" maxLength={1000} placeholder="Catatan pembayaran (opsional)" className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/><button disabled={busy||outstandingOrders.length===0} className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><WalletCards className="mr-1 inline" size={16}/>{outstandingOrders.length===0?"Tidak ada order yang memiliki piutang":"Simpan pembayaran"}</button></form>
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="flex flex-col justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center"><div><h2 className="font-extrabold">Database pelanggan</h2><p className="mt-1 text-sm text-zinc-500">Cari pelanggan, kontak, atau nama usaha.</p></div><div className="relative"><Search className="absolute left-3 top-3 text-zinc-400" size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari pelanggan..." className="rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"/></div></div>
      {loading?<p className="p-8 text-center text-sm text-zinc-500">Memuat data...</p>:filtered.length===0?<p className="p-8 text-center text-sm text-zinc-500">Tidak ada pelanggan yang cocok.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/60"><tr>{["Pelanggan","Kontak","Jumlah order","Pembayaran","Aksi"].map(x=><th key={x} className="px-5 py-3">{x}</th>)}</tr></thead><tbody>{filtered.map(c=><tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800"><td className="px-5 py-4"><p className="font-bold">{c.businessName||c.name}</p>{c.businessName&&<p className="text-xs text-zinc-500">{c.name}</p>}</td><td className="px-5 py-4 text-zinc-500">{c.phone||"—"}<p className="text-xs">{c.email||""}</p></td><td className="px-5 py-4">{c._count.orders}</td><td className="px-5 py-4">{c._count.payments}</td><td className="px-5 py-4"><button onClick={async()=>{const next=window.prompt("Nama kontak pelanggan:",c.name);if(next===null)return;const res=await fetch("/api/customers",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:c.id,name:next})});const json=await res.json();if(!res.ok){setError(json.error||"Gagal memperbarui pelanggan.");return;}setNotice("Nama pelanggan diperbarui.");await load();}} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold dark:border-zinc-700">Ubah nama</button></td></tr>)}</tbody></table></div>}
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-800"><div><h2 className="font-extrabold">Riwayat pembayaran</h2><p className="mt-1 text-sm text-zinc-500">Setiap baris terkait dengan transaksi pemasukan di Finance.</p></div><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold dark:border-zinc-700"><RefreshCw size={15}/>Muat ulang</button></div>{loading?<p className="p-8 text-center text-sm text-zinc-500">Memuat pembayaran...</p>:payments.length===0?<p className="p-8 text-center text-sm text-zinc-500">Belum ada pembayaran order.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/60"><tr>{["Tanggal","Pelanggan","Order","Metode","Referensi","Nominal"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{payments.map(p=><tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800"><td className="px-4 py-4">{fmtDate(p.paidAt)}</td><td className="px-4 py-4 font-semibold">{p.customer.businessName||p.customer.name}</td><td className="px-4 py-4">{p.order.title}</td><td className="px-4 py-4">{methods[p.method]||p.method}</td><td className="px-4 py-4 text-zinc-500">{p.reference||"—"}</td><td className="px-4 py-4 font-extrabold text-emerald-600">{money(Number(p.amount))}</td></tr>)}</tbody></table></div>}</section>
    <p className="text-xs leading-5 text-zinc-500">Sisa piutang dihitung dari nilai order dikurangi seluruh pembayaran yang tercatat. Jangan mencatat pembayaran yang sama lagi secara manual di Finance karena sistem telah membuat transaksi pemasukan otomatis.</p>
  </div>;
}
