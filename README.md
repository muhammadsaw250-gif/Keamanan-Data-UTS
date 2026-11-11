# Secure Digital Library

Aplikasi sistem informasi perpustakaan digital dengan landing page publik dan halaman admin. Admin membuka dashboard menggunakan **private key**, bukan password. Data buku dienkripsi dengan **AES-256-GCM** sebelum disimpan ke SQLite.

## Teknologi
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite (`node:sqlite`)
- Kriptografi: PBKDF2-SHA256, HMAC-SHA256, AES-256-GCM

## Persyaratan
- Node.js >= 22.13
- npm

## Menjalankan aplikasi
Buka terminal pertama:

```bash
cd backend
npm install
npm start
```

Backend berjalan pada `http://localhost:5000`.

Buka terminal kedua:

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan pada `http://localhost:5173`.

## Mengakses admin
1. Buka `http://localhost:5173/admin`.
2. Masukkan private key yang dibuat saat konfigurasi admin pertama kali.
3. Setelah verifikasi berhasil, dashboard mengambil seluruh data buku dan mendekripsinya di backend sebelum dikirimkan ke halaman admin.
4. Klik Logout untuk mengakhiri sesi.

**Penting:** private key tidak disimpan dalam database dan tidak dapat dipulihkan jika hilang. Jangan menaruh private key asli di README, source code, GitHub, atau file `.env`.

## Membuat admin baru pada database kosong
Hentikan backend, lalu pindahkan atau hapus `backend/database/library.db` (buat salinan cadangan terlebih dahulu). Jalankan backend kembali, kemudian kirim permintaan setup satu kali:

```bash
curl -X POST http://localhost:5000/api/admin/setup ^
  -H "Content-Type: application/json" ^
  -d "{\"privateKey\":\"kunci-rahasia-minimal-12-karakter\"}"
```

Contoh di atas menggunakan sintaks Windows Command Prompt. Ganti contoh private key dengan kunci milik sendiri yang kuat dan simpan di tempat aman. Endpoint setup hanya berhasil jika admin belum pernah dikonfigurasi.

## Alur keamanan
1. Private key diproses dengan PBKDF2-SHA256 sebanyak 310.000 iterasi dan salt acak.
2. Hasil derivasi dipisah menjadi kunci autentikasi dan kunci enkripsi.
3. Database menyimpan salt serta verifier HMAC, bukan private key.
4. Seluruh objek data buku (judul, penulis, kategori, tahun, URL cover, dan isi) diserialisasi lalu dienkripsi menggunakan AES-256-GCM dengan IV acak dan authentication tag.
5. Payload buku lengkap (judul, penulis, kategori, tahun, URL cover, dan isi) disimpan terenkripsi pada tabel `books`. Untuk kebutuhan landing page, informasi katalog yang memang ditujukan untuk publik disimpan terpisah pada tabel `public_catalog`. Tabel katalog ini hanya berisi informasi yang boleh dilihat pengunjung; bukan tempat penyimpanan isi buku atau data privat.
6. Setelah private key benar, backend menyimpan kunci enkripsi dalam sesi sementara. Sesi berakhir otomatis setelah 30 menit atau ketika admin logout.
7. Login membatasi lima percobaan private key yang salah dalam jendela 15 menit per alamat IP.

## Database
- `backend/database/library.db`: database SQLite.
- `backend/database/library_dump.sql`: dump SQL untuk pemeriksaan/arsip.
- `public_catalog`: proyeksi metadata publik untuk landing page.
- `books`: ciphertext, IV, dan authentication tag untuk seluruh data buku.

Saat migrasi dari database versi sebelumnya, metadata lama dipindahkan ke `public_catalog`, lalu kolom metadata lama pada `books` dikosongkan. Data buku lama tetap dienkripsi dan tidak perlu dimasukkan ulang.

Jangan menyalin database ketika backend masih aktif tanpa membuat backup/checkpoint yang konsisten. File `-wal` dan `-shm` adalah file pendamping SQLite saat mode WAL aktif.

## Catatan pengembangan
- API backend: `http://localhost:5000/api`
- Landing page: `/`
- Login admin: `/admin`
- Dashboard admin: `/admin/dashboard`
- Jangan mengunggah `.env`, private key, token sesi, atau `node_modules` ke repositori publik.
