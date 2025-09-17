
# Software Design Document (SDD): GCP Terraform IaC Generator

**Versi Dokumen:** 1.0
**Tanggal:** 23 Juli 2024
**Penulis Utama:** Senior Frontend Engineer

---

## 1. Pendahuluan

### 1.1. Tujuan
Dokumen ini menyediakan desain teknis yang komprehensif untuk aplikasi GCP Terraform IaC Generator. Tujuannya adalah untuk menjabarkan arsitektur perangkat lunak, modul internal, struktur data, dan alur kerja teknis secara rinci. SDD ini akan menjadi panduan utama bagi para engineer selama fase implementasi, pemeliharaan, dan pengembangan di masa depan.

### 1.2. Ruang Lingkup
Aplikasi ini adalah sebuah _Single-Page Application_ (SPA) yang bertujuan untuk menghasilkan kode Terraform untuk infrastruktur Google Cloud Platform (GCP). Ruang lingkupnya mencakup antarmuka pengguna untuk konfigurasi, logika untuk membangun _prompt_ dan berinteraksi dengan Google Gemini API, serta tampilan untuk hasil kode yang dihasilkan. Aplikasi ini **tidak** menjalankan kode Terraform atau mengelola state infrastruktur.

### 1.3. Akronim dan Singkatan
- **SPA:** Single-Page Application
- **GCP:** Google Cloud Platform
- **IaC:** Infrastructure as Code
- **API:** Application Programming Interface
- **UI:** User Interface
- **UX:** User Experience
- **SDK:** Software Development Kit
- **JSON:** JavaScript Object Notation

## 2. Arsitektur Sistem

### 2.1. Gaya Arsitektur
Aplikasi ini mengadopsi arsitektur **client-side SPA** modern. Seluruh logika UI dan interaksi dengan API eksternal dijalankan sepenuhnya di dalam peramban pengguna. Tidak ada backend kustom yang diperlukan, yang menyederhanakan deployment dan mengurangi biaya operasional.

### 2.2. Diagram Arsitektur Tingkat Tinggi

```
+-------------------------------------------------------------------+
|                           Peramban Pengguna                       |
| +---------------------------------------------------------------+ |
| |               Aplikasi React (gcp-terraform-generator)        | |
| |                                                               | |
| | +---------------------+      +------------------------------+ | |
| | |    ConfigPanel      |<---->|          CodePanel           | | |
| | |  (Input Pengguna)   |      |   (Output: Kode, Status)     | | |
| | +---------------------+      +------------------------------+ | |
| |           ^                                     ^             | |
| |           | (1. Pembaruan State)                | (4. Render Ulang) | |
| |           v                                     |             | |
| | +---------------------------------------------------------------+ | |
| | |                   App.tsx (Orkestrator State)                 | | |
| | +---------------------------------------------------------------+ | |
| |           | (2. Panggil Layanan)                | (3. Perbarui State) | |
| |           v                                     |             | |
| | +---------------------------------------------------------------+ | |
| | |               services/geminiService.ts (Logika Inti)         | | |
| | +---------------------------------------------------------------+ | |
| |                                | (2a. Panggilan API HTTP)       | |
| +--------------------------------|--------------------------------+ |
|                                  v                                  |
+----------------------------------|----------------------------------+
                                   |
+----------------------------------|----------------------------------+
|                                  v                                  |
| +---------------------------------------------------------------+ |
| |                 Google Gemini API Endpoint                    | |
| |                 (Model: gemini-2.5-flash)                     | |
| +---------------------------------------------------------------+ |
```

### 2.3. Tumpukan Teknologi (Tech Stack)
- **Framework Frontend:** React 19
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS
- **Alat Build:** Vite
- **SDK AI:** `@google/genai` untuk interaksi dengan Gemini API

## 3. Desain Terperinci

### 3.1. Struktur Modul dan Komponen

Aplikasi dipecah menjadi beberapa komponen React yang logis dan dapat digunakan kembali:

- **`App.tsx`**:
  - **Peran:** Komponen akar dan orkestrator state.
  - **Tanggung Jawab:**
    - Menyimpan state utama aplikasi: `config` (konfigurasi pengguna), `generatedFiles` (hasil dari API), `isLoading`, dan `error`.
    - Mendefinisikan fungsi `handleGenerateCode` yang memicu logika pembuatan kode.
    - Meneruskan state dan _callbacks_ ke komponen anak (`ConfigPanel` dan `CodePanel`).

- **`components/ConfigPanel.tsx`**:
  - **Peran:** Panel input utama.
  - **Tanggung Jawab:**
    - Merender seluruh formulir konfigurasi.
    - Mengimpor dan menggunakan komponen `Section` untuk setiap modul GCP.
    - Merupakan "komponen bodoh" (_dumb component_) yang sepenuhnya dikendalikan oleh _props_ dari `App.tsx`.

- **`components/CodePanel.tsx`**:
  - **Peran:** Panel output.
  - **Tanggung Jawab:**
    - Mengelola state lokalnya sendiri untuk tab yang aktif (`activeTab`).
    - Menampilkan UI secara kondisional berdasarkan `isLoading`, `error`, dan `files` dari _props_.
    - Menampilkan antarmuka tab untuk menavigasi file yang dihasilkan.
    - Mengimplementasikan fungsionalitas "Salin ke Clipboard".

- **`components/config/ModuleConfigs.tsx`**:
  - **Peran:** Kumpulan komponen formulir spesifik per modul.
  - **Tanggung Jawab:** Setiap komponen (misalnya, `GkeConfig`, `VpcConfig`) merender field input untuk satu modul GCP dan meneruskan event `onChange` kembali ke `ConfigPanel`. Ini menjaga `ConfigPanel` tetap terorganisir.

- **`services/geminiService.ts`**:
  - **Peran:** Lapisan layanan (logika bisnis inti).
  - **Tanggung Jawab:**
    - **`createPrompt(config)`:** Mengonstruksi _prompt_ teks yang sangat terstruktur dan terperinci berdasarkan objek `config` dari UI. _Prompt engineering_ yang cermat di sini sangat penting untuk kualitas output.
    - **`generateTerraformCode(config)`:**
      1. Menginisialisasi klien Gemini API menggunakan kunci API yang diinjeksi saat runtime.
      2. Memanggil `createPrompt` untuk mendapatkan _prompt_.
      3. Melakukan panggilan `ai.models.generateContent` ke model `gemini-2.5-flash`.
      4. **Menerapkan Skema Respons:** Menggunakan `responseMimeType: "application/json"` dan `responseSchema` untuk memaksa model mengembalikan JSON yang terstruktur dengan baik, yang secara drastis meningkatkan keandalan.
      5. Mem-parsing respons JSON yang diterima.
      6. Menambahkan konten statis (misalnya, file `LICENSE`).
      7. Mengembalikan objek `GeneratedFiles` atau melemparkan `Error` jika terjadi kegagalan.

### 3.2. Desain Data

- **`types.ts`**:
  - **Peran:** Sumber kebenaran tunggal untuk semua model data aplikasi.
  - **Struktur Utama:**
    - **`GcpConfig`**: Interface komprehensif yang mendefinisikan seluruh objek konfigurasi, termasuk semua sub-objek untuk setiap modul GCP (misalnya, `VpcConfig`, `GkeNodePool`).
    - **`GeneratedFiles`**: Interface yang mendefinisikan bentuk objek hasil yang berhasil, dengan kunci untuk setiap konten file (`main_tf`, `variables_tf`, dll.).
  - **Manfaat:** Penggunaan TypeScript memastikan keamanan tipe di seluruh aplikasi, mengurangi bug, dan meningkatkan pengalaman pengembangan melalui pelengkapan otomatis.

- **Manajemen State:**
  - **Strategi:** Menggunakan pendekatan React fundamental "mengangkat state ke atas" (_lifting state up_).
  - **Lokasi State:** Semua state global aplikasi (konfigurasi, hasil, status pemuatan) dikelola di dalam komponen `App.tsx` menggunakan _hook_ `useState`.
  - **Alur Data:** Aliran data bersifat searah dan dapat diprediksi:
    1. Interaksi pengguna di `ConfigPanel` memanggil fungsi _handler_.
    2. _Handler_ memanggil `setConfig` untuk memperbarui state di `App.tsx`.
    3. Pembaruan state memicu render ulang `ConfigPanel` dengan nilai-nilai baru.
    4. Saat "Generate" diklik, `handleGenerateCode` menggunakan state `config` saat ini untuk memanggil `geminiService`.
    5. Hasil dari layanan digunakan untuk memperbarui state `generatedFiles`, yang memicu render ulang `CodePanel`.

## 4. Penanganan Kesalahan
- **Validasi Input:** Validasi dasar dilakukan melalui atribut HTML5 (misalnya, `type="number"`, `min`). Tidak ada validasi sisi klien yang kompleks karena model AI dapat menangani input yang tidak sempurna.
- **Kesalahan API:** `geminiService` membungkus panggilan API dalam blok `try...catch`. Setiap kegagalan (misalnya, kunci API tidak valid, masalah jaringan, _prompt_ diblokir oleh filter keamanan) akan ditangkap.
- **Umpan Balik UI:** Kesalahan yang ditangkap di lapisan layanan akan dilemparkan kembali sebagai `Error`. `App.tsx` menangkap ini dan mengatur state `error`. `CodePanel` kemudian akan menampilkan pesan kesalahan yang jelas kepada pengguna, memberikan umpan balik tentang apa yang salah.

## 5. Deployment dan Konfigurasi

---

**Catatan Pembaruan (2025-09-17):** Docker multi-stage build added; entrypoint injects `API_KEY` into `index.html`. Unit tests and guidance in `README.md` updated.
  - **Saat Deployment (Direkomendasikan):** Sebuah skrip entrypoint di lingkungan hosting (misalnya, `entrypoint.sh` di dalam kontainer Docker) akan menggunakan `sed` atau alat serupa untuk mengganti `__API_KEY__` dengan nilai dari variabel lingkungan `API_KEY` sebelum server web dimulai.
  - **Keamanan:** Pendekatan ini memastikan bahwa kunci API tidak pernah ada dalam kode sumber atau artefak build, dan disuntikkan dengan aman saat runtime.
