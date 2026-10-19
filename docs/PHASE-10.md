# Phase 10 — AI Business Assistant

## Tujuan
Menyediakan briefing harian berbasis data Growth OS untuk membantu pemilik menentukan tindakan yang perlu diprioritaskan.

## Fitur
- Halaman terlindungi `/assistant`.
- Endpoint `/api/assistant/route` mengumpulkan data operasional yang relevan, termasuk pengingat, prospek dan tindak lanjut, goal aktif, transaksi keuangan, serta aktivitas konten.
- Ringkasan dibangun dengan aturan yang dapat dipahami, lalu disajikan sebagai daftar perhatian dan tindakan yang disarankan.
- Endpoint memerlukan sesi pengguna yang valid.

## Data dan konfigurasi
- Tidak memerlukan migrasi skema khusus Phase 10.
- Membaca data dari model yang telah tersedia di database; hasilnya dipengaruhi kelengkapan dan ketepatan data tersebut.

## Batasan
- Implementasi ini merupakan assistant berbasis aturan, bukan integrasi model AI eksternal.
- Assistant tidak mengirim pesan atau melakukan transaksi secara otomatis.
- Briefing adalah bantuan operasional, bukan nasihat akuntansi, hukum, atau keuangan profesional.

## Kriteria penerimaan
- Pengguna tanpa sesi ditolak.
- Briefing hanya memakai data yang tersedia dan tidak mengarang nilai yang hilang.
- Ketika tidak ada data relevan, UI menunjukkan kondisi kosong secara wajar.
- Rekomendasi dapat ditindaklanjuti melalui modul terkait dan tidak mengubah data bisnis secara diam-diam.
