# Phase 23 — Automated Daily Business Briefing

## Tujuan
Menyediakan satu halaman briefing harian yang menyusun ulang data aktual dari modul yang sudah ada menjadi indikator target dan prioritas tindakan.

## Fitur
- Ringkasan pemasukan hari ini dan bulan berjalan, biaya tercatat, estimasi bersih, dan persentase target.
- Daftar prospek yang belum dijadwalkan atau perlu follow-up.
- Ringkasan piutang order, proyek yang mencapai/melewati tenggat, reminder, konten terjadwal, dan layanan berulang yang perlu kontak/renewal.
- Rekomendasi prioritas berdasarkan sinyal data yang tersedia.
- Tombol untuk membuat tindakan harian pada Action Center. `sourceKey` unik dengan tanggal membantu mencegah tindakan duplikat saat tombol ditekan berulang.
- Link langsung ke modul terkait.

## Routes
- Page: `/daily-briefing`
- API: `GET /api/daily-briefing` untuk membaca ringkasan, `POST /api/daily-briefing` untuk membuat tindakan di Action Center.

## Cara kerja dan batasan
- Tidak menambahkan model atau migration baru; memakai tabel yang sudah ada.
- Target default Rp5.200.000 per bulan dan pace harian dihitung dengan 26 hari aktif jika Goal aktif tidak tersedia.
- Semua metrik berasal dari data yang sudah dimasukkan pengguna. Tidak ada transaksi, pembayaran, atau aktivitas yang direkayasa.
- Fitur ini belum mengirim briefing otomatis melalui email, WhatsApp, atau push notification. Halaman menghasilkan briefing saat dibuka; tombol POST membuat tindakan secara eksplisit.
- Periksa nilai pendapatan dan piutang terhadap catatan sumber sebelum mengambil keputusan.

## Verifikasi
Build, typecheck, dan pengujian database harus dijalankan pada lingkungan proyek setelah `pnpm install` dan konfigurasi `.env` tersedia.
