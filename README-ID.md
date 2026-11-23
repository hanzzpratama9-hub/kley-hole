# KLEY PROMPT — CLOUD EDITION

Project ini sudah berisi website Kley Prompt, Vercel Function, dan skema Supabase. Sinkronisasi konten publik (prompt, banner Landscape, kategori, blok konten, galeri Owner, dan Landscape Updates) berjalan melalui API server Vercel.

## PENTING: ada konfigurasi satu kali sebelum deploy

Gua tidak bisa masuk ke akun Vercel/Supabase lu atau membuat secret di akun lu. Jadi project ini tidak bisa aman dibuat benar-benar tinggal deploy tanpa konfigurasi. Jangan pernah menaruh Supabase `service_role` key di HTML.

## A. Siapkan Supabase (sekali saja)

1. Buka https://supabase.com/dashboard lalu pilih project `kley-prompt` yang sudah lu buat.
2. Buka **SQL Editor → New query**.
3. Buka file `supabase-schema.sql` dari folder project ini, salin seluruh isinya, tempel di SQL Editor, lalu tekan **Run**.
4. Pastikan hasilnya sukses. SQL ini membuat tabel `kley_site_content` dan bucket publik `kley-public-assets`.
5. Buka **Project Settings → API**. Salin **Project URL** dan **service_role (secret) key**. Simpan pribadi; jangan kirim ke chat atau masukkan ke file HTML.

## B. Siapkan project Vercel lama

1. Buka https://vercel.com/dashboard dan pilih project Kley Prompt yang domain lamanya ingin dipertahankan.
2. Buka **Settings → Environment Variables**.
3. Tambahkan tiga variable berikut untuk **Production**:
   - `SUPABASE_URL` = Project URL dari Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key dari Supabase.
   - `KLEY_OWNER_SYNC_KEY` = buat secret acak panjang minimal 32 karakter (contoh: password manager). Jangan gunakan password akun.
4. Simpan ketiganya.

## C. Deploy folder ini ke project Vercel yang SAMA

Folder root project harus memuat:

- `index.html`
- `package.json`
- `vercel.json`
- `api/content.js`

PENTING: Vercel Drop (`vercel.com/drop`) membuat project baru. Untuk mempertahankan domain project lama, deployment harus masuk ke project lama melalui Git yang sudah dihubungkan atau Vercel CLI (`vercel link` ke project lama lalu `vercel deploy --prod`). Dashboard upload manual tidak selalu menyediakan upload deployment baru ke project existing.

## D. Sambungkan Owner Panel setelah deployment

1. Buka domain Kley Prompt yang lama dan login sebagai Owner.
2. Buka Owner Panel → Page 7 (Code Redeem Generator).
3. Di bagian **Sinkronisasi Cloud Kley Prompt**, masukkan nilai `KLEY_OWNER_SYNC_KEY` yang sama persis dengan variable Vercel.
4. Tekan **Simpan Kunci**. Status akan memeriksa API dan mengambil data cloud jika ada.
5. Jika cloud masih kosong dan browser Owner ini berisi konten yang benar, tekan **Upload Konten ke Cloud** satu kali untuk migrasi awal.
6. Perubahan konten yang memanggil `saveState()` dan Landscape Updates akan dikirim otomatis setelah jeda singkat. Jika status gagal, cek pesan status dan Environment Variables.

## Yang tersinkron dan yang belum

**Tersinkron:** Prompt Library, banner Landscape (foto + nama), kategori, layout, custom blocks, Owner Gallery, dan Landscape Updates. Foto data-URL diunggah ke Supabase Storage oleh API.

**Belum menjadi cloud account system:** login/registrasi, password, sesi, profil pribadi, riwayat privat, pembelian, dan Code Redeem versi lama masih memakai penyimpanan lokal browser. Kode redeem jangan dipakai sebagai benefit global lintas perangkat sebelum dibuat endpoint redeem server-side dengan identitas akun yang tervalidasi.

## Batas teknis

- Website dan endpoint publik harus memakai HTTPS (domain Vercel sudah HTTPS).
- Endpoint menolak POST tanpa `KLEY_OWNER_SYNC_KEY`; secret tidak ditaruh di HTML.
- Batas payload request Vercel berlaku. Foto besar atau terlalu banyak gambar dalam satu batch bisa gagal; gunakan gambar yang sudah dikompres.
- Project ini belum diuji end-to-end di akun Supabase/Vercel milik lu. Jalankan SQL, isi Environment Variables, deploy ke project lama, lalu uji upload prompt dan banner dari Owner.
- Simpan backup file lama sebelum mengganti Production.
