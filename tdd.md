# Technical Design Document (TDD): GCP Terraform IaC Generator

**Versi Dokumen:** 1.0
**Tanggal:** 23 Juli 2024
**Penulis Teknis:** Senior Frontend Engineer

---

## 1. Pendahuluan

### 1.1. Tujuan Dokumen
Dokumen ini menguraikan desain teknis dan arsitektur untuk aplikasi GCP Terraform IaC Generator. Ini berfungsi sebagai cetak biru bagi tim pengembangan untuk membangun, memelihara, dan mengembangkan aplikasi sesuai dengan persyaratan yang didefinisikan dalam BRD dan PRD.

### 1.2. Ikhtisar Sistem
Aplikasi ini adalah _Single-Page Application_ (SPA) yang dibangun menggunakan React, TypeScript, dan Tailwind CSS. Fungsi intinya adalah untuk:
1.  Menyediakan antarmuka pengguna (UI) yang komprehensif bagi pengguna untuk mengonfigurasi infrastruktur GCP yang diinginkan.
2.  Menerjemahkan status konfigurasi UI menjadi sebuah _prompt_ yang terstruktur.
3.  Mengirimkan _prompt_ ini ke Google Gemini API (`gemini-2.5-flash`) untuk menghasilkan satu set file Terraform.
4.  Menampilkan file-file yang dihasilkan dalam antarmuka yang bersih dan mudah digunakan.

Aplikasi ini sepenuhnya berjalan di sisi klien (_client-side_), dengan satu-satunya interaksi sisi server adalah panggilan ke Gemini API.

## 2. Arsitektur Sistem

### 2.1. Arsitektur Tingkat Tinggi
Aplikasi ini mengikuti arsitektur berbasis komponen yang sederhana dan modern.

```
+-------------------------------------------------------------------+
|                           Peramban Pengguna                       |
| +---------------------------------------------------------------+ |
| |               Aplikasi React (SPA)                            | |
| |                                                               | |
| | +---------------------+      +------------------------------+ | |
| | |    ConfigPanel      |      |          CodePanel           | | |
| | | (Manajemen State UI)|<---->| (Menampilkan Hasil Generasi) | | |
| | +---------------------+      +------------------------------+ | |
| |           ^                                     ^             | |
| |           | (1. User Config)                    | (5. Update UI) | |
| |           v                                     |             | |
| | +---------------------------------------------------------------+ |
| | |                   App.tsx (State Controller)                  | | |
| | +---------------------------------------------------------------+ | |
| |           | (2. Trigger Generate)               | (4. Parse & Set State) | |
| |           v                                     |             | |
| | +---------------------------------------------------------------+ | |
| | |                    geminiService.ts (API Layer)               | | |
| | +---------------------------------------------------------------+ | |
| |                                | (3. Panggilan API)             | |
| +--------------------------------|--------------------------------+ |
|                                  v                                  |
+----------------------------------|----------------------------------+
                                   |
                                   | HTTP POST
                                   v
+-------------------------------------------------------------------+
|                       Google Gemini API Endpoint                  |
|                   (Model: gemini-2.5-flash)                       |
+-------------------------------------------------------------------+
```

### 2.2. Alur Data
1.  **Konfigurasi Pengguna:** Pengguna berinteraksi dengan `ConfigPanel`, memodifikasi formulir. Setiap perubahan memanggil fungsi _handler_ yang memperbarui objek state `config` utama yang disimpan di komponen `App.tsx`.
2.  **Pemicu Generasi:** Pengguna mengklik tombol "Generate IaC with Gemini". Ini memanggil fungsi `handleGenerateCode` di `App.tsx`.
3.  **Panggilan API:** `handleGenerateCode` memanggil `generateTerraformCode` dari `geminiService.ts`, meneruskan objek `config` saat ini.
    - `geminiService` membangun sebuah _prompt_ terperinci, menyematkan konfigurasi sebagai string JSON.
    - `geminiService` menggunakan SDK `@google/genai` untuk membuat permintaan `generateContent` ke model `gemini-2.5-flash`, dengan `responseMimeType: "application/json"` dan skema respons yang telah ditentukan sebelumnya.
4.  **Pemrosesan Respons:** Gemini API memproses _prompt_ dan mengembalikan objek JSON tunggal yang berisi konten file yang diminta.
5.  **Pembaruan State & UI:**
    - `geminiService` mem-parsing respons JSON.
    - `App.tsx` menerima data yang di-parsing dan memperbarui state `generatedFiles`.
    - Perubahan state ini memicu `CodePanel` untuk me-render ulang dan menampilkan konten file yang baru diterima.

## 3. Desain Komponen

Aplikasi ini dipecah menjadi komponen-komponen yang dapat dikelola dan digunakan kembali.

-   **`App.tsx` (Komponen Induk):**
    -   Bertanggung jawab atas state tingkat aplikasi: `config`, `generatedFiles`, `isLoading`, `error`.
    -   Mengelola logika inti untuk menangani generasi kode (`handleGenerateCode`).
    -   Menghubungkan `ConfigPanel` dan `CodePanel`, meneruskan state dan _callbacks_ yang diperlukan sebagai _props_.

-   **`ConfigPanel.tsx` (Panel Kiri):**
    -   Merender semua elemen UI untuk konfigurasi infrastruktur.
    -   Menggunakan komponen `Section` untuk setiap modul GCP yang dapat diaktifkan/dinonaktifkan.
    -   Di dalam setiap `Section`, merender komponen konfigurasi spesifik (misalnya, `VpcConfig`, `GkeConfig`).
    -   Tidak memiliki state sendiri; sepenuhnya dikendalikan oleh _props_ dari `App.tsx`.

-   **`CodePanel.tsx` (Panel Kanan):**
    -   Merender hasil kode yang dihasilkan.
    -   Mengelola state lokal untuk tab yang sedang aktif (`activeTab`).
    -   Menampilkan status yang berbeda secara kondisional: pesan selamat datang, indikator pemuatan, pesan kesalahan, atau tampilan kode bertab.
    -   Mengimplementasikan fungsionalitas "Salin ke Clipboard".

-   **`components/config/ModuleConfigs.tsx`:**
    -   Berisi komponen fungsional _stateless_ untuk setiap modul GCP (VPC, GKE, dll.).
    -   Setiap komponen bertanggung jawab untuk merender formulir untuk modulnya dan memanggil fungsi _callback_ `onChange` yang disediakan saat input pengguna terjadi.
    -   Desain ini menjaga `ConfigPanel.tsx` tetap bersih dan terorganisir.

-   **`components/common/`:**
    -   Berisi komponen UI dasar yang dapat digunakan kembali seperti `Input`, `Select`, `Section`, dan `Textarea` untuk memastikan konsistensi visual dan fungsional di seluruh aplikasi.

## 4. Manajemen State

-   **Strategi:** Menggunakan pendekatan "mengangkat state ke atas" (_lifting state up_) standar React.
-   **Sumber Kebenaran Tunggal:** Objek state `config` utama berada di `App.tsx` dan berfungsi sebagai sumber kebenaran tunggal untuk seluruh konfigurasi aplikasi.
-   **Pembaruan State:** State diperbarui secara _immutable_. Fungsi _handler_ di `ConfigPanel` membuat salinan dari state sebelumnya (`...prev`), memodifikasinya, dan meneruskannya ke fungsi `setConfig` dari `App.tsx`. Ini memastikan alur data yang dapat diprediksi dan mencegah efek samping.
-   **Skalabilitas:** Untuk kompleksitas saat ini, `useState` dan `useCallback` sudah cukup. Jika aplikasi tumbuh secara signifikan (misalnya, dengan akun pengguna atau riwayat konfigurasi), migrasi ke pustaka manajemen state seperti Zustand atau Redux Toolkit dapat dipertimbangkan.

## 5. Integrasi API dan Rekayasa Prompt

Ini adalah komponen paling kritis dari aplikasi.

-   **File:** `services/geminiService.ts`
-   **Fungsi Inti:** `generateTerraformCode(config: GcpConfig)`
-   **Manajemen Kunci API:** Kunci API dibaca dari `window.GCP_GENERATOR_API_KEY`. Variabel ini disuntikkan saat runtime (misalnya, oleh skrip entrypoint Docker), memisahkan rahasia dari kode sumber.

### 5.1. Rekayasa Prompt (`createPrompt`)
Kualitas output sangat bergantung pada kualitas _prompt_. _Prompt_ dirancang secara strategis untuk memaksimalkan akurasi:
1.  **Penetapan Persona:** `You are an expert Google Cloud Platform engineer and a Terraform specialist.`
2.  **Instruksi Spesifik:** Memberikan aturan implementasi yang sangat jelas dan tidak ambigu untuk kasus-kasus kompleks (misalnya, logika kondisional untuk GKE autoscaling, pembuatan resource `google_project_iam_member` untuk setiap peran IAM). Ini memandu model untuk menghasilkan kode yang benar secara sintaksis dan logis.
3.  **Input Terstruktur:** Objek `config` pengguna (setelah memfilter modul yang dinonaktifkan) di-serialisasi ke JSON dan disematkan langsung dalam _prompt_.
4.  **Format Output yang Ditegakkan:** Secara eksplisit meminta output dalam format JSON tunggal dengan kunci yang telah ditentukan (`main_tf`, `variables_tf`, dll.).

### 5.2. Panggilan API dan Penegakan Skema
-   Untuk memastikan keandalan, kita tidak hanya meminta JSON dalam _prompt_ teks tetapi juga menggunakan fitur canggih dari Gemini API:
    -   `responseMimeType: "application/json"`: Memberi tahu model untuk menghasilkan output yang sesuai dengan MIME type JSON.
    -   `responseSchema`: Ini adalah bagian yang paling penting. Kami menyediakan skema OpenAPI yang mendefinisikan struktur persis dari objek JSON yang diharapkan (kunci dan tipe datanya). Ini secara signifikan meningkatkan kemungkinan model mengembalikan JSON yang valid dan dapat di-parsing, mengurangi kebutuhan untuk penanganan string yang rapuh di sisi klien.

### 5.3. Penanganan Respons dan Kesalahan
-   Fungsi ini menggunakan blok `try...catch` yang kuat untuk menangani:
    -   Kegagalan panggilan jaringan ke API.
    -   Kesalahan dari API (misalnya, kunci tidak valid, _prompt_ diblokir).
    -   Kesalahan saat mem-parsing JSON (meskipun `responseSchema` meminimalkan risiko ini).
-   Pesan kesalahan yang informatif dibuat dan dilemparkan kembali ke UI untuk ditampilkan kepada pengguna.
-   Konten file `LICENSE` ditambahkan secara lokal setelah menerima respons, karena kontennya statis dan tidak perlu dihasilkan oleh AI.

## 6. Model Data

-   **File:** `types.ts`
-   **Tujuan:** Menyediakan definisi TypeScript untuk semua struktur data utama.
-   **Manfaat:**
    -   **Keamanan Tipe:** Mencegah bug umum yang disebabkan oleh tipe data yang tidak cocok.
    -   **Developer Experience:** Mengaktifkan pelengkapan otomatis (autocomplete) dan pemeriksaan statis di dalam IDE.
    -   **Dokumentasi Mandiri:** Bertindak sebagai dokumentasi yang jelas untuk bentuk data yang diharapkan di seluruh aplikasi.

## 7. Proses Build dan Deployment

-   **Alat Build:** Vite digunakan untuk pengembangan lokal yang cepat (HMR) dan untuk mem-bundle aplikasi untuk produksi.
-   **Output Build:** Perintah `npm run build` menghasilkan aset statis (HTML, JS, CSS) di dalam direktori `/dist`.
-   **Deployment (Direkomendasikan):**
    1.  Gunakan `Dockerfile` multi-tahap.
    2.  **Tahap Build:** Gunakan image Node.js untuk menginstal dependensi (`npm install`) dan membangun aplikasi (`npm run build`).
    3.  **Tahap Serve:** Salin aset yang dibangun dari direktori `/dist` ke dalam image server web yang ringan (misalnya, Nginx).
    4.  **Injeksi Kunci API:** Gunakan skrip `entrypoint.sh` yang menjalankan `sed` atau alat serupa pada `index.html` untuk menggantikan placeholder `__API_KEY__` dengan nilai dari variabel lingkungan `API_KEY` saat kontainer dimulai.
    -   Pendekatan ini memastikan bahwa aplikasi tetap sepenuhnya statis dan kunci API tidak pernah diekspos dalam kode sumber atau artefak build.

---

## Catatan Pengujian (2025-09-17)

- Unit tests: `npm test` (uses Vitest)
- Coverage: `npm run test:coverage` (may require installing a coverage provider matching your Vitest version; see README)
- Manual Docker smoke test: build image and run locally, then visit the container URL and run an end-to-end generation to verify behavior.
