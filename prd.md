# Product Requirements Document (PRD): GCP Terraform IaC Generator

**Versi Dokumen:** 1.0
**Tanggal:** 23 Juli 2024
**Pemilik Produk:** Senior Frontend Engineer

---

## 1. Pendahuluan

### 1.1. Visi Produk
Untuk memberdayakan setiap developer, dari startup hingga enterprise, untuk menerapkan infrastruktur Google Cloud Platform (GCP) dengan percaya diri dan efisien. Kami mencapai ini dengan menyediakan sebuah alat intuitif yang mengabstraksi kompleksitas penulisan _Infrastructure as Code_ (IaC) dan menghasilkan kode Terraform berkualitas tinggi, aman, dan siap produksi hanya dalam beberapa klik.

### 1.2. Latar Belakang
Produk ini lahir dari pengamatan bahwa penyiapan awal infrastruktur cloud adalah rintangan signifikan dalam siklus hidup pengembangan perangkat lunak. GCP Terraform IaC Generator dirancang untuk menghilangkan rintangan ini, mengubah proses yang biasanya memakan waktu berhari-hari dan memerlukan keahlian mendalam menjadi tugas yang dapat diselesaikan dalam hitungan menit.

### 1.3. Audiens Target & Persona Pengguna
- **Persona 1: Alex, DevOps Engineer**
  - **Kebutuhan:** Perlu membuat fondasi infrastruktur standar dan dapat diulang untuk beberapa proyek baru dengan cepat. Menginginkan kode yang mengikuti praktik terbaik yang dapat ia tinjau dan modifikasi lebih lanjut.
  - **Frustrasi:** Menghabiskan terlalu banyak waktu untuk menulis kode boilerplate Terraform yang sama berulang kali.

- **Persona 2: Bella, Full-Stack Developer**
  - **Kebutuhan:** Ingin menerapkan aplikasi barunya di GKE dan Cloud SQL tanpa harus menjadi ahli Terraform atau GCP. Membutuhkan solusi yang "cukup berhasil".
  - **Frustrasi:** Merasa terintimidasi oleh banyaknya layanan GCP dan kurva pembelajaran Terraform yang curam.

- **Persona 3: Chandra, Pendiri Startup Teknologi**
  - **Kebutuhan:** Perlu meluncurkan MVP secepat mungkin dengan anggaran terbatas. Tidak memiliki tim DevOps khusus.
  - **Frustrasi:** Keterbatasan sumber daya menghambat kemampuan untuk membangun infrastruktur yang tangguh dan skalabel sejak awal.

## 2. Fitur dan Fungsionalitas

### 2.1. Fungsionalitas Inti: Konfigurasi dan Generasi

#### **US-01: Sebagai pengguna, saya ingin mengonfigurasi pengaturan proyek GCP dasar.**
- **Deskripsi:** Pengguna dapat memasukkan Project ID, memilih Region default, dan menentukan nama GCS Bucket untuk state Terraform.
- **Kriteria Penerimaan:**
  - Terdapat tiga kolom input teks di bagian atas panel konfigurasi untuk `projectId`, `region`, dan `bucketName`.
  - Nilai-nilai ini digunakan sebagai variabel dasar dalam kode Terraform yang dihasilkan.

#### **US-02: Sebagai pengguna, saya ingin mengaktifkan/menonaktifkan modul infrastruktur sesuai kebutuhan.**
- **Deskripsi:** Setiap komponen infrastruktur (VPC, GKE, dll.) disajikan sebagai "modul" yang dapat diaktifkan atau dinonaktifkan dengan sebuah tombol sakelar (toggle).
- **Kriteria Penerimaan:**
  - Setiap modul memiliki tajuk bagian dengan tombol sakelar.
  - Saat dinonaktifkan, opsi konfigurasi untuk modul tersebut disembunyikan.
  - Saat diaktifkan, formulir konfigurasi untuk modul tersebut ditampilkan.
  - Modul yang dinonaktifkan tidak akan disertakan dalam kode Terraform yang dihasilkan.

#### **US-03: Sebagai pengguna, saya ingin mengklik satu tombol untuk menghasilkan seluruh kode IaC.**
- **Deskripsi:** Sebuah tombol "Generate IaC with Gemini" yang menonjol akan memulai proses.
- **Kriteria Penerimaan:**
  - Tombol berada di bagian bawah panel konfigurasi.
  - Saat diklik, tombol menunjukkan status pemuatan (misalnya, spinner dan teks "Generating...").
  - Tombol dinonaktifkan selama proses generasi untuk mencegah pengiriman ganda.
  - Setelah selesai, status pemuatan hilang dan panel kode diperbarui dengan hasilnya.

### 2.2. Detail Fitur per Modul

| Modul | Fitur Konfigurasi | Pengalaman Pengguna |
|---|---|---|
| **VPC & Subnets** | Nama VPC, daftar subnet (nama, CIDR, region). | Pengguna dapat secara dinamis menambah atau menghapus subnet. Setiap subnet adalah grup field yang rapi. |
| **GKE** | Nama cluster, jaringan, subnetwork, daftar node pool (nama, tipe mesin, ukuran disk, autoscaling, jumlah node min/maks atau tetap). | Pengguna dapat menambah/menghapus node pool. Opsi autoscaling secara kondisional menampilkan field min/maks node. |
| **Compute Engine** | Nama instance, tipe mesin, zona, image boot disk, skrip startup. | Kolom `startupScript` adalah `<textarea>` dengan font monospace untuk keterbacaan kode. |
| **Cloud SQL** | Nama instance, versi database, tier, ketersediaan tinggi (HA), konfigurasi backup (aktif/nonaktif, waktu mulai). | Tombol sakelar sederhana untuk HA dan backup. Waktu mulai hanya muncul jika backup diaktifkan. |
| **Firewall** | Daftar aturan (nama, arah, prioritas, rentang sumber/tujuan), daftar protokol yang diizinkan (protokol, port opsional). | Pengguna dapat menambah/menghapus aturan. Di dalam setiap aturan, mereka dapat menambah/menghapus beberapa protokol. |
| **IAM** | Nama Service Account, daftar binding peran tingkat proyek. | Pengguna dapat secara dinamis menambah/menghapus binding peran ke Service Account. |
| **Cloud Run** | Nama layanan, lokasi, image container, CPU, memori, penskalaan (instans min/maks), izinkan akses tanpa autentikasi. | Input numerik untuk penskalaan dan tombol sakelar sederhana untuk akses publik. |
| **Cloud Storage** | Daftar bucket (nama, lokasi, kelas penyimpanan, versioning). | Pengguna dapat menambah/menghapus beberapa konfigurasi bucket. |

### 2.3. Panel Tampilan Kode

#### **US-04: Sebagai pengguna, saya ingin melihat semua file yang dihasilkan dalam antarmuka yang jelas.**
- **Deskripsi:** Hasil generasi kode ditampilkan di panel sisi kanan dengan tab untuk setiap file.
- **Kriteria Penerimaan:**
  - Terdapat tab untuk `main.tf`, `variables.tf`, `outputs.tf`, `README.md`, `setup.sh`, dan `LICENSE`.
  - Mengklik tab akan menampilkan konten file yang sesuai.
  - Konten ditampilkan dalam blok kode `pre` dengan font monospace.
  - `main.tf` adalah tab aktif secara default setelah generasi berhasil.

#### **US-05: Sebagai pengguna, saya ingin menyalin konten file ke clipboard dengan mudah.**
- **Deskripsi:** Sebuah tombol "Salin" tersedia untuk file yang sedang aktif.
- **Kriteria Penerimaan:**
  - Ikon clipboard ada di sudut kanan atas panel kode.
  - Mengklik ikon menyalin seluruh konten file yang aktif ke clipboard pengguna.
  - Umpan balik visual (misalnya, ikon berubah menjadi tanda centang) diberikan setelah berhasil menyalin.

## 3. Persyaratan UI/UX

- **Tata Letak:** Desain dua panel yang responsif. Panel konfigurasi di kiri (dapat digulir), panel kode di kanan.
- **Tema:** Tema gelap (dark mode) untuk mengurangi kelelahan mata dan sesuai dengan estetika alat developer modern.
- **Penanganan Status:**
  - **Status Awal:** Panel kode menampilkan pesan selamat datang yang menginstruksikan pengguna untuk memulai konfigurasi.
  - **Status Pemuatan:** Selama generasi, panel konfigurasi dinonaktifkan, dan panel kode menampilkan indikator pemuatan yang jelas dengan pesan yang menenangkan ("Gemini is thinking...").
  - **Status Kesalahan:** Jika generasi gagal, panel kode menampilkan pesan kesalahan yang jelas dan mudah dipahami, memberikan petunjuk tentang kemungkinan masalah (misalnya, kunci API tidak valid).
- **Aksesibilitas:** Semua elemen formulir harus memiliki label yang sesuai (`<label htmlFor="...">`). Kontras warna harus memenuhi standar WCAG AA. Aplikasi harus dapat dinavigasi menggunakan keyboard.

## 4. Rencana Masa Depan (Di Luar Cakupan V1)

- **Penyimpanan Konfigurasi:** Memungkinkan pengguna untuk menyimpan, memuat, dan mengelola konfigurasi mereka (memerlukan autentikasi pengguna).
- **Berbagi Konfigurasi:** Menghasilkan URL unik yang dapat dibagikan yang berisi status konfigurasi.
- **Dukungan Modul Lanjutan:** Menambahkan dukungan untuk layanan GCP lainnya seperti Pub/Sub, Cloud Functions, dll.
- **Impor Konfigurasi:** Mengizinkan pengguna untuk mengunggah file JSON konfigurasi yang ada untuk mengisi UI.

## 5. Metrik Keberhasilan

- **Tingkat Penyelesaian Tugas:** Persentase pengguna yang memulai konfigurasi dan berhasil mengklik tombol "Generate".
- **Keterlibatan Fitur:** Modul mana yang paling sering diaktifkan oleh pengguna.
- **Waktu per Tugas:** Waktu rata-rata yang dihabiskan pengguna dari memuat halaman hingga menghasilkan kode.
- **Tingkat Retensi:** (Untuk masa depan) Persentase pengguna yang kembali untuk membuat konfigurasi baru.
- **Umpan Balik Kualitatif:** Mengumpulkan umpan balik melalui survei singkat atau tautan umpan balik di aplikasi.

---

## Catatan Pembaruan (2025-09-17)

- The project now includes a multi-stage `Dockerfile` and an entrypoint script to inject `API_KEY` at runtime. Unit tests use Vitest; see `README.md` for commands.
