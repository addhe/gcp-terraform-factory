
# Test Plan & Test Cases: GCP Terraform IaC Generator

**Versi Dokumen:** 1.0
**Tanggal:** 23 Juli 2024
**Penulis:** Senior Frontend Engineer (QA Lead)

---

## Catatan Pembaruan (2025-09-17)

- Project is dockerized; follow steps in `README.md` to build and run the container for smoke tests. Unit tests use `npm test`; coverage instructions are in README.

## 1. Pendahuluan

### 1.1. Tujuan
Dokumen ini menguraikan strategi pengujian, sumber daya, dan jadwal yang dimaksudkan untuk memverifikasi dan memvalidasi aplikasi GCP Terraform IaC Generator. Tujuannya adalah untuk mendeteksi dan mendokumentasikan cacat, memastikan bahwa perangkat lunak memenuhi persyaratan fungsional dan non-fungsional, dan memberikan produk akhir yang stabil dan berkualitas tinggi kepada pengguna.

### 1.2. Ruang Lingkup Pengujian

#### 1.2.1. Dalam Ruang Lingkup (In-Scope)
- **Pengujian Fungsional:** Memverifikasi bahwa setiap fitur yang dijelaskan dalam PRD berfungsi seperti yang diharapkan. Ini termasuk:
  - Konfigurasi semua modul (VPC, GKE, Compute, dll.).
  - Logika untuk menambah/menghapus item dinamis (subnet, node pool, aturan firewall).
  - Fungsionalitas pengaktifan/penonaktifan modul.
  - Proses pembuatan kode end-to-end.
- **Pengujian UI/UX:** Memastikan antarmuka pengguna intuitif, konsisten secara visual, dan sesuai dengan desain yang ditentukan dalam Dokumen Alur UX/UI.
- **Penanganan Kesalahan:** Menguji bagaimana aplikasi menangani skenario yang gagal, seperti panggilan API yang tidak berhasil atau input yang tidak valid.
- **Kompatibilitas Peramban:** Memverifikasi bahwa aplikasi berfungsi dengan benar di peramban web modern utama.
- **Pengujian Responsif:** Memastikan tata letak aplikasi beradaptasi dengan benar pada berbagai ukuran layar (desktop, tablet, seluler).

#### 1.2.2. Di Luar Ruang Lingkup (Out-of-Scope)
- **Kualitas Kode Terraform yang Dihasilkan:** Pengujian ini akan memverifikasi bahwa kode *dihasilkan* dan tampak masuk akal, tetapi tidak akan menjalankan `terraform apply` untuk memvalidasi bahwa kode tersebut 100% bebas dari kesalahan sintaksis atau logis. Validasi ini bergantung pada kualitas _prompt_ dan kemampuan model Gemini.
- **Pengujian Beban/Stres API:** Tidak ada pengujian formal yang akan dilakukan untuk menentukan batas beban pada Gemini API.
- **Pengujian Keamanan Formal:** Tidak ada pengujian penetrasi atau pemindaian kerentanan formal yang akan dilakukan.

## 2. Strategi Pengujian

- **Tingkat Pengujian:** Pengujian akan difokuskan terutama pada tingkat **End-to-End (E2E)** dan **Manual Exploratory Testing**.
- **Otomatisasi:** Mengingat sifat aplikasi yang sangat visual dan berbasis alur, pengujian manual adalah prioritas untuk rilis awal. Kasus uji E2E kritis (misalnya, alur generasi yang berhasil) adalah kandidat utama untuk otomatisasi di masa depan menggunakan alat seperti Playwright atau Cypress.
- **Lingkungan Pengujian:** Pengujian akan dilakukan langsung di lingkungan pengembangan dan _staging_ menggunakan kunci API Gemini yang valid.

### 2.1. Kriteria Lulus/Gagal
- **Kriteria Lulus:** Semua kasus uji dengan prioritas "Tinggi" harus lulus. Tidak boleh ada cacat kritis atau besar yang belum terselesaikan.
- **Kriteria Gagal:** Adanya cacat kritis (misalnya, aplikasi crash, alur utama tidak berfungsi) akan memblokir rilis.

## 3. Test Cases

### 3.1. Konfigurasi Umum & UI

| ID | Modul | Prioritas | Judul Tes | Langkah-langkah | Hasil yang Diharapkan |
|---|---|---|---|---|---|
| TC-GEN-01 | UI Umum | Tinggi | Verifikasi nilai default saat memuat | 1. Buka aplikasi. | 1. `ConfigPanel` terisi dengan nilai default. 2. `CodePanel` menampilkan pesan selamat datang. 3. Tombol "Generate" aktif. |
| TC-GEN-02 | UI Umum | Tinggi | Aktifkan/nonaktifkan modul | 1. Klik tombol sakelar untuk modul GKE. 2. Klik lagi untuk mengaktifkannya kembali. | 1. Formulir konfigurasi GKE disembunyikan. 2. Formulir konfigurasi GKE muncul kembali. |
| TC-GEN-03 | UI Umum | Sedang | Responsivitas Tata Letak | 1. Ubah ukuran jendela peramban dari lebar ke sempit. | 1. Tata letak berubah dari dua kolom menjadi satu kolom. Tidak ada elemen yang tumpang tindih atau terpotong. |

### 3.2. Pengujian Fungsional per Modul

| ID | Modul | Prioritas | Judul Tes | Langkah-langkah | Hasil yang Diharapkan |
|---|---|---|---|---|---|
| TC-VPC-01 | VPC | Tinggi | Tambah dan Hapus Subnet | 1. Klik "+ Add Subnet". 2. Isi detail. 3. Klik ikon tempat sampah di sebelah subnet pertama. | 1. Formulir subnet baru muncul. 2. State aplikasi diperbarui. 3. Subnet pertama dihapus dari UI dan state. |
| TC-GKE-01 | GKE | Tinggi | Toggle Autoscaling Node Pool | 1. Di node pool, centang kotak "Autoscaling". 2. Hapus centang. | 1. Input "Node Count" disembunyikan, dan input "Min Nodes" & "Max Nodes" muncul. 2. Perilaku terbalik. |
| TC-CSQL-01| Cloud SQL | Tinggi | Toggle Konfigurasi Backup | 1. Di bagian Cloud SQL, aktifkan "Enable Backups". 2. Nonaktifkan. | 1. Input "Backup Start Time" muncul. 2. Input "Backup Start Time" disembunyikan. |
| TC-FW-01 | Firewall | Tinggi | Tambah/Hapus Aturan & Protokol | 1. Klik "+ Add Firewall Rule". 2. Di dalam aturan baru, klik "+ Add Protocol". 3. Hapus protokol yang baru ditambahkan. 4. Hapus seluruh aturan. | 1. Aturan firewall baru muncul. 2. Formulir protokol baru muncul di dalam aturan. 3. Protokol dihapus. 4. Seluruh blok aturan dihapus. |
| TC-IAM-01 | IAM | Tinggi | Tambah dan Hapus Peran | 1. Klik "+ Add Role Binding". 2. Isi peran baru. 3. Klik ikon tempat sampah di sebelahnya. | 1. Input teks baru untuk peran muncul. 2. Peran berhasil dihapus. |

### 3.3. Alur Generasi Kode

| ID | Modul | Prioritas | Judul Tes | Langkah-langkah | Hasil yang Diharapkan |
|---|---|---|---|---|---|
| TC-E2E-01 | End-to-End | Kritis | Alur Generasi yang Berhasil | 1. Gunakan konfigurasi default. 2. Pastikan kunci API valid. 3. Klik "Generate IaC with Gemini". | 1. Tombol menjadi nonaktif dengan spinner. 2. `CodePanel` menampilkan status pemuatan. 3. Setelah beberapa saat, `CodePanel` menampilkan file yang dihasilkan, dengan `main.tf` aktif. |
| TC-E2E-02 | End-to-End | Kritis | Alur Generasi Gagal (Kunci API tidak valid) | 1. Ganti kunci API dengan nilai yang tidak valid di `index.html` atau variabel lingkungan. 2. Muat ulang aplikasi. 3. Klik "Generate IaC with Gemini". | 1. Tombol dan `CodePanel` menunjukkan status pemuatan. 2. Setelah gagal, `CodePanel` menampilkan pesan kesalahan yang jelas (misalnya, "API_KEY not valid"). 3. Tombol "Generate" kembali aktif. |
| TC-E2E-03 | End-to-End | Tinggi | Verifikasi Nonaktifkan Modul | 1. Nonaktifkan modul GKE. 2. Klik "Generate". 3. Periksa `main.tf` yang dihasilkan. | 1. Kode yang dihasilkan tidak boleh mengandung resource `google_container_cluster` atau `google_container_node_pool`. |

### 3.4. Fungsionalitas Panel Kode

| ID | Modul | Prioritas | Judul Tes | Langkah-langkah | Hasil yang Diharapkan |
|---|---|---|---|---|---|
| TC-CODE-01| Code Panel | Tinggi | Pergantian Tab | 1. Setelah generasi berhasil, klik tab `variables.tf`. 2. Klik tab `README.md`. | 1. Konten `variables.tf` ditampilkan. 2. Konten `README.md` ditampilkan. Tab yang aktif disorot secara visual. |
| TC-CODE-02| Code Panel | Tinggi | Fungsionalitas Salin ke Clipboard | 1. Setelah generasi berhasil, klik ikon "Salin" di `main.tf`. 2. Buka editor teks dan tempel. | 1. Ikon berubah menjadi tanda centang selama beberapa detik. 2. Seluruh konten `main.tf` berhasil ditempel. |

---
