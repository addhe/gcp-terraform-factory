# UX/UI Design Flow Documentation: GCP Terraform IaC Generator

**Versi Dokumen:** 1.0
**Tanggal:** 23 Juli 2024
**Desainer:** Senior Frontend Engineer

---

## 1. Pendahuluan

### 1.1. Tujuan
Dokumen ini bertujuan untuk mendefinisikan dan menyelaraskan alur pengguna (User Flow) dan desain visual (UI) dengan kebutuhan produk yang telah dijabarkan dalam PRD (Product Requirements Document) dan TDD (Technical Design Document). Ini adalah panduan untuk memastikan pengalaman pengguna (UX) yang kohesif, intuitif, dan efisien.

### 1.2. Filosofi Desain
- **Developer-Centric:** Antarmuka dirancang untuk developer. Ini berarti tema gelap (dark mode) untuk kenyamanan visual, penggunaan font monospace untuk kode, dan tata letak yang padat informasi namun tetap bersih.
- **Clarity over Clutter (Kejelasan di atas Keruwetan):** Setiap elemen UI memiliki tujuan yang jelas. Kami menghindari elemen dekoratif yang tidak perlu. Pengguna harus dapat memahami status aplikasi dan langkah selanjutnya secara sekilas.
- **Efficiency and Speed (Efisiensi dan Kecepatan):** Alur kerja dioptimalkan untuk memungkinkan pengguna mengonfigurasi dan menghasilkan kode secepat mungkin. Interaksi seperti menambah/menghapus item dibuat instan dan mudah diakses.

## 2. Sistem Desain Visual (Visual Design System)

### 2.1. Palet Warna
Palet warna didominasi oleh nuansa abu-abu gelap dengan ungu sebagai warna aksen untuk menyoroti tindakan utama dan status aktif.

| Peran | Warna | Kode Hex | Contoh Penggunaan |
|---|---|---|---|
| **Latar Utama** | `gray-950` | `#0c0c0f` | Latar belakang body utama. |
| **Latar Panel** | `gray-900` | `#111115` | Latar belakang `ConfigPanel` dan `CodePanel`. |
| **Batas/Garis** | `gray-800` | `#1c1c21` | Garis pemisah antar panel dan bagian. |
| **Input/Form** | `gray-800` | `#1c1c21` | Latar belakang field input. |
| **Teks Utama** | `gray-200` | `(Tailwind)` | Teks isi utama. |
| **Teks Sekunder** | `gray-400` | `(Tailwind)` | Label formulir, teks petunjuk, placeholder. |
| **Aksen Utama** | `purple-600` | `(Tailwind)` | Tombol "Generate", hover/focus state. |
| **Status Aktif**| `purple-500` | `(Tailwind)` | Toggle yang aktif, tab aktif. |
| **Teks Kesalahan**| `red-400` | `(Tailwind)` | Pesan kesalahan. |

### 2.2. Tipografi
- **Font Utama:** Menggunakan font `sans-serif` sistem default untuk keterbacaan yang bersih di semua platform.
- **Hierarki Teks:**
  - `h1` (Judul Aplikasi): 24px, Bold.
  - `h2` (Judul Panel): 20px, Bold.
  - `h3` (Judul Bagian): 18px, Bold.
  - **Label Formulir:** 14px, Medium.
  - **Teks Isi:** 16px, Regular.
  - **Kode/Input:** 14px, Font `monospace`.

### 2.3. Komponen Inti
- **Input & Textarea:** Latar belakang gelap (`gray-800`), batas halus (`gray-700`), dan efek `ring` berwarna ungu saat fokus untuk memberikan umpan balik yang jelas.
- **Tombol Utama:** Latar belakang ungu solid, teks putih tebal. Memiliki status `hover` yang lebih gelap dan status `disabled` yang pudar untuk menunjukkan non-interaktivitas.
- **Tombol Sekunder (Tambah/Hapus):** Biasanya berupa ikon (`PlusIcon`, `TrashIcon`) atau teks dengan batas putus-putus untuk tindakan "tambah item baru". Tujuannya agar tidak bersaing secara visual dengan tombol utama.
- **Toggle Switch:** Desain sakelar geser modern yang berubah warna dari abu-abu menjadi ungu saat diaktifkan, memberikan indikasi status yang jelas.
- **Panel (Section):** Menggunakan kartu dengan batas untuk mengelompokkan konten terkait. Tajuknya dapat diklik untuk memperluas/menciutkan konten, menghemat ruang layar.

## 3. Alur Pengguna (User Flow)

Alur pengguna utama adalah linear: **Konfigurasi -> Generasi -> Tinjau**.

### **Langkah 1: Halaman Awal & Status Default**
- **Tampilan:**
  - **Panel Kiri (`ConfigPanel`):** Menampilkan semua modul konfigurasi dengan nilai default yang telah diisi. Beberapa modul (seperti VPC, GKE) diaktifkan secara default untuk menunjukkan fungsionalitas inti.
  - **Panel Kanan (`CodePanel`):** Menampilkan pesan selamat datang: *"Your generated code will appear here. Configure your resources on the left and click 'Generate'."* Tampilan ini kosong namun informatif.
- **Tindakan Pengguna:** Pengguna mulai meninjau dan mengubah konfigurasi di panel kiri.

### **Langkah 2: Proses Konfigurasi**
- **Tampilan:**
  - Pengguna berinteraksi dengan formulir di `ConfigPanel`.
  - Mengaktifkan/menonaktifkan modul menggunakan _toggle switch_. Saat dinonaktifkan, badan bagian tersebut disembunyikan.
  - Menambah atau menghapus item dinamis (misalnya, Subnet, Node Pool, Aturan Firewall) menggunakan tombol `+ Add` dan ikon `Trash`. Penambahan/penghapusan item terjadi secara instan tanpa memuat ulang halaman.
- **Interaksi:**
  - **Input Teks:** Umpan balik visual diberikan saat field aktif (`focus`).
  - **Perubahan State:** Setiap interaksi pengguna (mengetik, mengklik toggle) secara langsung memperbarui objek state `config` di komponen `App.tsx`. UI adalah representasi langsung dari state ini.

### **Langkah 3: Memulai Generasi Kode**
- **Tindakan Pengguna:** Pengguna mengklik tombol "Generate IaC with Gemini" di bagian bawah `ConfigPanel`.
- **Tampilan & Interaksi:**
  - **Tombol Generate:** Tombol segera berubah ke status `disabled`. Teksnya berubah menjadi "Generating Code..." dan sebuah ikon _spinner_ muncul. Ini mencegah klik ganda dan memberikan umpan balik bahwa sistem sedang bekerja.
  - **Panel Kiri (`ConfigPanel`):** Seluruh panel menjadi non-interaktif (meskipun tidak di-disable secara visual untuk memungkinkan pengguna melihat konfigurasi mereka).
  - **Panel Kanan (`CodePanel`):** Pesan selamat datang digantikan oleh indikator pemuatan layar penuh. Ini menampilkan _spinner_ besar dengan teks informatif seperti *"Generating your infrastructure code..."* dan *"Gemini is thinking. This may take a moment."*. Ini mengelola ekspektasi pengguna bahwa proses ini mungkin tidak instan.

### **Langkah 4A: Alur Berhasil (Success Flow)**
- **Tampilan:**
  - Setelah API merespons dengan sukses, status `isLoading` menjadi `false`.
  - **Tombol Generate:** Kembali ke keadaan normal ("Generate IaC with Gemini").
  - **Panel Kanan (`CodePanel`):**
    - Indikator pemuatan hilang.
    - Antarmuka tab muncul di bagian atas panel (`main.tf`, `variables.tf`, dll.).
    - Tab `main.tf` aktif secara default, menampilkan konten kode yang dihasilkan.
    - Di sudut kanan atas, ikon "Salin ke Clipboard" muncul.
- **Tindakan Pengguna:**
  - Pengguna dapat beralih antar tab untuk meninjau semua file.
  - Pengguna mengklik ikon "Salin".
- **Interaksi:**
  - **Salin ke Clipboard:** Saat diklik, ikon clipboard secara singkat berubah menjadi ikon tanda centang (`CheckIcon`) berwarna hijau untuk memberikan umpan balik visual instan bahwa tindakan itu berhasil. Ikon kembali normal setelah 2 detik.

### **Langkah 4B: Alur Gagal (Error Flow)**
- **Tampilan:**
  - Jika panggilan API gagal, status `isLoading` menjadi `false` dan state `error` diisi dengan pesan.
  - **Tombol Generate:** Kembali ke keadaan normal, memungkinkan pengguna untuk mencoba lagi setelah memperbaiki konfigurasi (jika perlu).
  - **Panel Kanan (`CodePanel`):**
    - Indikator pemuatan hilang.
    - Panel menampilkan status kesalahan:
      - Sebuah ikon peringatan besar (`ExclamationIcon`) berwarna merah.
      - Judul yang jelas seperti "Generation Failed".
      - Pesan kesalahan yang diterima dari `geminiService`, yang dirancang untuk menjadi informatif bagi pengguna.

## 4. Desain Responsif
- **Desktop (Layar Lebar > 1024px):** Tampilan dua kolom berdampingan seperti yang dijelaskan di atas. Ini adalah tampilan utama yang dioptimalkan.
- **Tablet & Seluler (Layar Sempit < 1024px):** Tata letak berubah menjadi satu kolom. `ConfigPanel` muncul di bagian atas, dan `CodePanel` muncul di bawahnya. Pengguna akan menggulir ke bawah untuk melihat hasil setelah mengonfigurasi dan menghasilkan kode. Semua fungsionalitas tetap sama.

---

**Catatan Pembaruan (2025-09-17):** UI and flows remain the same; README now documents Docker build/run and test commands.
