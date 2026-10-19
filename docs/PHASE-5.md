# Phase 5 — Operational Modules: Projects, Content & KPI

## Tujuan
Menambahkan alat operasional untuk mengelola proyek, kalender konten, dan pencatatan hasil KPI dalam Growth OS.

## Cakupan fitur
- **Projects & Orders:** pembuatan, daftar, perubahan status, penghapusan, anggaran proyek, dan tenggat.
- **Content Planner:** pembuatan konten, daftar, perubahan status, serta tanggal terjadwal dan tanggal publikasi.
- **KPI & Reports:** pencatatan hasil KPI dan ringkasan skor berbobot sederhana.
- Migrasi `202610150001_phase5_operations` menambahkan `Goal.description` dan `Project.customerName` opsional.

## Alur penggunaan
1. Buat proyek dan isi informasi pelanggan, anggaran, status, serta tenggat bila tersedia.
2. Catat aktivitas konten dan perbarui status sesuai proses kerja.
3. Catat hasil KPI dengan target/bobot yang relevan.
4. Tinjau laporan dan pastikan setiap angka didukung data yang benar.

## Database dan aktivasi
Jalankan migrasi database sebelum menggunakan perubahan skema:

```bash
pnpm db:generate
pnpm db:migrate
```

Pastikan `DATABASE_URL` menunjuk ke database development/staging yang benar sebelum menjalankan migrasi.

## Batasan
- Skor KPI hanya seandal target, bobot, dan data aktual yang dimasukkan.
- Jadwal konten tidak berarti konten dipublikasikan otomatis ke platform eksternal.
- Status proyek tidak sama dengan penerimaan kas; transaksi aktual dicatat melalui modul Finance.

## Kriteria penerimaan
- CRUD proyek, konten, dan hasil KPI mengikuti autentikasi serta otorisasi yang ditetapkan.
- Field tambahan tersedia setelah migrasi berhasil.
- Validasi input dan perubahan status bekerja sesuai aturan.
- Pengujian database, API, dan UI dijalankan sebelum rilis.
