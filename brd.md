# Business Requirements Document (BRD): GCP Terraform IaC Generator

**Versi Dokumen:** 1.0
**Tanggal:** 23 Juli 2024
**Penulis:** Senior Frontend Engineer

---

## 1. Latar Belakang Proyek

### 1.1. Ringkasan Eksekutif
Proyek GCP Terraform IaC Generator bertujuan untuk mengembangkan sebuah aplikasi web yang memungkinkan developer dan tim DevOps untuk secara cepat dan mudah menghasilkan kode _Infrastructure as Code_ (IaC) Terraform yang siap produksi untuk platform Google Cloud Platform (GCP). Aplikasi ini akan menyederhanakan proses penyiapan infrastruktur cloud yang kompleks dan rawan kesalahan dengan menyediakan antarmuka pengguna (UI) yang intuitif untuk konfigurasi dan memanfaatkan kecerdasan buatan (Google Gemini API) untuk menghasilkan kode berkualitas tinggi.

### 1.2. Masalah Bisnis
Penyiapan infrastruktur cloud secara manual atau bahkan dengan menulis kode Terraform dari awal adalah proses yang:
- **Memakan Waktu:** Membutuhkan waktu berharga dari engineer untuk menulis, menguji, dan men-debug kode IaC.
- **Rawan Kesalahan:** Kesalahan konfigurasi dapat menyebabkan masalah keamanan, ketidakstabilan, dan pembengkakan biaya.
- **Membutuhkan Keahlian Tinggi:** Memerlukan pemahaman mendalam tentang GCP dan praktik terbaik Terraform, yang menjadi penghalang bagi tim kecil atau developer junior.
- **Tidak Konsisten:** Tanpa standardisasi, konfigurasi infrastruktur dapat bervariasi antar proyek atau tim, menyulitkan manajemen dan pemeliharaan.

### 1.3. Peluang Bisnis
Dengan menyediakan alat generator IaC, kita dapat:
- **Mempercepat _Time-to-Market_:** Mengurangi waktu yang dibutuhkan dari ide hingga penerapan aplikasi di cloud.
- **Meningkatkan Produktivitas Developer:** Membebaskan engineer dari tugas-tugas IaC yang repetitif agar mereka dapat fokus pada pengembangan fitur aplikasi.
- **Meningkatkan Keamanan dan Kepatuhan:** Menerapkan praktik terbaik keamanan dan arsitektur secara default dalam kode yang dihasilkan.
- **Menurunkan Biaya:** Menghindari kesalahan konfigurasi yang mahal dan mengoptimalkan penggunaan sumber daya.
- **Mendemokratisasi Adopsi Cloud:** Memudahkan tim dengan berbagai tingkat keahlian untuk mengadopsi GCP dengan benar.

## 2. Tujuan dan Sasaran Proyek

### 2.1. Tujuan Utama
Menjadi alat pilihan utama bagi developer untuk memulai proyek di GCP dengan menyediakan cara tercepat dan paling andal untuk menghasilkan fondasi infrastruktur berbasis Terraform.

### 2.2. Sasaran Spesifik (SMART)
- **Specific:** Mengembangkan aplikasi web yang menerima input konfigurasi GCP melalui UI dan menghasilkan satu set file Terraform (`main.tf`, `variables.tf`, `outputs.tf`, dll.).
- **Measurable:** Mencapai 1.000 sesi generasi kode unik dalam 3 bulan pertama setelah peluncuran.
- **Achievable:** Meluncurkan _Minimum Viable Product_ (MVP) yang mendukung modul inti GCP (VPC, GKE, Compute Engine) dalam 2 bulan.
- **Relevant:** Secara langsung mengatasi inefisiensi dalam proses _onboarding_ proyek ke GCP.
- **Time-bound:** Menyelesaikan dan meluncurkan versi 1.0 dalam kuartal fiskal saat ini.

## 3. Ruang Lingkup Proyek

### 3.1. Dalam Ruang Lingkup (In-Scope)
- **Antarmuka Konfigurasi (UI):** UI berbasis web yang memungkinkan pengguna untuk:
  - Mengonfigurasi parameter proyek global (Project ID, Region).
  - Mengaktifkan/menonaktifkan dan mengonfigurasi modul infrastruktur spesifik.
  - Modul yang didukung: VPC & Subnets, GKE, Compute Engine, Cloud SQL, Firewall, Secret Manager, IAM, Cloud Run, Cloud Storage.
- **Mesin Generator Kode:**
  - Integrasi dengan Google Gemini API untuk mengubah konfigurasi JSON menjadi file Terraform.
  - Penerapan _prompt engineering_ tingkat lanjut untuk memastikan kualitas dan keamanan kode.
- **Tampilan Hasil:**
  - Menampilkan file-file yang dihasilkan dalam tampilan tab yang mudah dinavigasi.
  - Menyediakan fungsionalitas "Salin ke Clipboard".
  - Menyertakan file pendukung seperti `README.md` dan skrip `setup.sh`.
- **Deployment:** Aplikasi akan di-container-isasi menggunakan Docker untuk portabilitas dan kemudahan deployment.

### 3.2. Di Luar Ruang Lingkup (Out-of-Scope)
- **Eksekusi Terraform:** Aplikasi ini **tidak** akan menjalankan `terraform apply` atau mengelola state Terraform. Tugasnya hanya sebatas menghasilkan kode.
- **Manajemen Akun Pengguna:** Versi awal tidak akan memiliki sistem login atau penyimpanan konfigurasi per pengguna.
- **Integrasi CI/CD:** Tidak ada integrasi langsung dengan platform CI/CD seperti Jenkins atau GitLab CI.
- **Deteksi Perubahan (Drift Detection):** Aplikasi tidak akan membandingkan kode yang dihasilkan dengan infrastruktur yang sudah ada.

## 4. Kebutuhan Fungsional

| ID | Prioritas | Sebagai seorang... | Saya ingin... | Sehingga saya dapat... |
|----|-----------|--------------------|------------------------------------------------------------------------------------------------|------------------------------------------------|
| F-01 | Wajib | Developer | Mengonfigurasi detail proyek GCP seperti Project ID dan Region. | Memastikan kode yang dihasilkan ditargetkan untuk lingkungan yang benar. |
| F-02 | Wajib | DevOps Engineer | Mengaktifkan modul VPC dan mendefinisikan beberapa subnet dengan rentang CIDR kustom. | Membuat jaringan pribadi yang terisolasi untuk aplikasi saya. |
| F-03 | Wajib | Developer | Mengaktifkan dan mengonfigurasi cluster GKE dengan satu atau lebih node pool. | Menerapkan aplikasi berbasis kontainer saya. |
| F-04 | Tinggi | System Admin | Mengaktifkan dan mengonfigurasi instance Compute Engine, termasuk skrip startup. | Menjalankan beban kerja berbasis VM. |
| F-05 | Tinggi | Developer | Mengaktifkan dan mengonfigurasi instance Cloud SQL (PostgreSQL/MySQL). | Menyediakan database relasional yang terkelola untuk aplikasi saya. |
| F-06 | Wajib | Security Engineer | Mendefinisikan aturan Firewall kustom untuk mengizinkan atau menolak lalu lintas. | Mengamankan infrastruktur saya dari akses yang tidak sah. |
| F-07 | Tinggi | Developer | Mengaktifkan modul Cloud Run dan mengonfigurasi layanan serverless. | Menerapkan aplikasi tanpa mengelola server. |
| F-08 | Tinggi | Developer | Membuat satu atau lebih bucket Cloud Storage dengan konfigurasi spesifik. | Menyimpan aset statis atau data aplikasi. |
| F-09 | Wajib | Semua Pengguna | Menekan tombol "Generate" untuk memicu proses pembuatan kode. | Mendapatkan file Terraform berdasarkan konfigurasi saya. |
| F-10 | Wajib | Semua Pengguna | Melihat konten file-file yang dihasilkan (`.tf`, `.md`, `.sh`) di UI. | Memverifikasi dan memahami kode sebelum menggunakannya. |
| F-11 | Wajib | Semua Pengguna | Menyalin konten file dengan mudah ke clipboard saya. | Memindahkan kode ke editor lokal atau sistem kontrol versi saya. |

## 5. Metrik Keberhasilan

- **Tingkat Adopsi:** Jumlah sesi generasi kode yang berhasil per minggu/bulan.
- **Kualitas Kode:** Umpan balik kualitatif dari pengguna mengenai keakuratan, kelengkapan, dan kepatuhan kode yang dihasilkan terhadap praktik terbaik.
- **Pengurangan Waktu:** Waktu rata-rata yang dihemat per proyek untuk penyiapan infrastruktur awal (diukur melalui survei pengguna).
- **Keandalan Layanan:** Ketersediaan aplikasi (uptime) di atas 99.9%.
- **Tingkat Kesalahan API:** Tingkat kesalahan saat memanggil Gemini API di bawah 1%.

---

## Catatan Pembaruan (2025-09-17)

- Project is Dockerized with a multi-stage `Dockerfile`. The built app is served by Nginx. At container start an entrypoint script injects runtime `API_KEY` into `index.html` from the `API_KEY` environment variable.
