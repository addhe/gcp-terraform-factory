# Deployment Plan & Risk Management: GCP Terraform IaC Generator

**Versi Dokumen:** 1.1
**Tanggal:** 17 September 2025
**Penulis:** Senior Frontend Engineer

---

## 1. Pendahuluan

Dokumen ini menguraikan strategi untuk mendeploy aplikasi GCP Terraform IaC Generator ke lingkungan produksi dan mengidentifikasi potensi risiko yang terkait dengan proyek ini, beserta rencana mitigasinya. Tujuannya adalah untuk memastikan proses deployment yang lancar, dapat diulang, dan aman, serta untuk secara proaktif mengelola tantangan yang mungkin timbul.

## 2. Rencana Deployment

### 2.1. Strategi Deployment
Aplikasi ini akan di-deploy sebagai **kontainer Docker** yang menjalankan server web statis (misalnya, Nginx). Pendekatan ini dipilih karena:
- **Portabilitas:** Kontainer dapat berjalan secara konsisten di lingkungan mana pun (lokal, staging, produksi).
- **Isolasi:** Semua dependensi terbungkus di dalam image, menghilangkan masalah "berfungsi di mesin saya".
- **Skalabilitas:** Mudah untuk diskalakan menggunakan layanan orkestrasi seperti Google Cloud Run atau Kubernetes (GKE).
- **Manajemen Konfigurasi yang Aman:** Memungkinkan injeksi `API_KEY` saat runtime sebagai variabel lingkungan, sesuai dengan praktik terbaik keamanan.

### 2.2. Lingkungan Target
- **Produksi:** Google Cloud Run. Layanan ini ideal untuk aplikasi state-less berbasis kontainer, dengan penskalaan otomatis (termasuk skala-ke-nol untuk efisiensi biaya) dan integrasi yang erat dengan ekosistem GCP.
- **Registri Image:** Google Artifact Registry akan digunakan untuk menyimpan image Docker yang telah di-build.

### 2.3. Proses Deployment (Langkah demi Langkah)

#### **Tahap 1: Persiapan (Pre-Deployment Checklist)**
1.  **Code Freeze:** Semua pengembangan fitur untuk rilis telah selesai dan di-merge ke branch `main`.
2.  **Pengujian Final:** Semua test case dari `test-plan.md` telah dijalankan dan lulus.
3.  **Build Aplikasi:** Jalankan perintah `npm run build` untuk menghasilkan aset statis di direktori `/dist`.
4.  **Build & Tag Image Docker:** Gunakan `Dockerfile` (multi-stage) untuk membuat image produksi. The final image uses Nginx to serve static files. At container startup the `docker-entrypoint.sh` script injects the `API_KEY` into `index.html` by replacing the `__API_KEY__` placeholder.
    ```bash
    # Contoh perintah build dan tag
    export IMAGE_TAG=$(git rev-parse --short HEAD)
    export AR_REPO="us-central1-docker.pkg.dev/your-gcp-project/iac-generator-repo/app"
    docker build -t ${AR_REPO}:${IMAGE_TAG} .
    docker tag ${AR_REPO}:${IMAGE_TAG} ${AR_REPO}:latest
    ```
5.  **Push Image ke Registry:**
    ```bash
    # Pastikan gcloud SDK terautentikasi
    gcloud auth configure-docker us-central1-docker.pkg.dev
    docker push ${AR_REPO}:${IMAGE_TAG}
    docker push ${AR_REPO}:latest
    ```

#### **Tahap 2: Deployment ke Cloud Run**
1.  **Deployment Awal:**
    ```bash
    gcloud run deploy gcp-terraform-iac-generator \
      --image="${AR_REPO}:${IMAGE_TAG}" \
      --platform=managed \
      --region=us-central1 \
      --allow-unauthenticated \
      --set-env-vars="API_KEY=SECRET_API_KEY_VALUE" # Ganti dengan nilai asli atau referensi Secret Manager
    ```
    **Catatan Keamanan:** Sangat disarankan untuk menyimpan `API_KEY` di Google Secret Manager dan mereferensikannya dalam perintah deployment untuk menghindari mengekspos rahasia dalam skrip atau log.
2.  **Pembaruan (Deployment Berikutnya):** Cukup jalankan kembali perintah `gcloud run deploy` dengan tag image yang baru. Cloud Run akan secara otomatis membuat revisi baru dan mengalihkan lalu lintas.

#### **Tahap 3: Verifikasi Pasca-Deployment (Smoke Testing)**
1.  Buka URL layanan Cloud Run yang disediakan.
2.  Verifikasi bahwa aplikasi dimuat tanpa kesalahan konsol.
3.  Lakukan satu alur generasi E2E (seperti TC-E2E-01) untuk memastikan fungsionalitas inti bekerja di lingkungan produksi.
4.  Periksa responsivitas pada satu ukuran layar seluler menggunakan DevTools peramban.

### 2.4. Rencana Rollback
Jika verifikasi pasca-deployment gagal atau cacat kritis ditemukan, lakukan rollback segera.
1.  Buka konsol Google Cloud Run.
2.  Pilih layanan `gcp-terraform-iac-generator`.
3.  Buka tab "Revisions".
4.  Pilih revisi stabil sebelumnya dan klik "Manage traffic".
5.  Alihkan 100% lalu lintas ke revisi stabil sebelumnya.
Proses ini terjadi hampir secara instan tanpa downtime.

## 3. Manajemen Risiko

| Kategori | ID Risiko | Deskripsi Risiko | Kemungkinan | Dampak | Strategi Mitigasi |
|---|---|---|---|---|---|
| **Teknis** | R-01 | **Kegagalan atau Waktu Henti Gemini API.** Aplikasi kehilangan fungsionalitas intinya jika API tidak tersedia. | Rendah | Tinggi | - Implementasikan penanganan kesalahan yang tangguh di `geminiService.ts`. - Tampilkan pesan kesalahan yang jelas dan ramah pengguna di UI yang memberitahu mereka bahwa layanan AI sementara tidak tersedia dan untuk mencoba lagi nanti. |
| **Teknis** | R-02 | **Perubahan yang Merusak (Breaking Changes) pada Gemini API.** Pembaruan pada API atau SDK `@google/genai` dapat merusak fungsionalitas yang ada. | Rendah | Tinggi | - "Pin" versi SDK `@google/genai` di `package.json` untuk mencegah pembaruan otomatis yang tidak terduga. - Pantau log rilis resmi Google untuk pembaruan API. - Lakukan pengujian regresi menyeluruh sebelum memperbarui versi SDK. |
| **Kualitas** | R-03 | **Output Kode Terraform Berkualitas Rendah.** Model menghasilkan kode yang tidak valid secara sintaksis, tidak aman, atau tidak lengkap. | Sedang | Tinggi | - Terus tingkatkan rekayasa _prompt_ di `createPrompt` dengan instruksi yang lebih spesifik. - Manfaatkan `responseSchema` secara ekstensif untuk menegakkan struktur output. - Tambahkan disclaimer yang jelas di UI/README bahwa kode dihasilkan oleh AI dan harus selalu ditinjau oleh manusia sebelum diterapkan. |
| **Keamanan**| R-04 | **Kebocoran atau Eksposur `API_KEY`.** Kunci API secara tidak sengaja ter-commit ke repositori atau terekspos dalam log. | Rendah | Kritis | - **Pencegahan:** Gunakan `gitleaks` atau alat pemindaian serupa dalam hook pre-commit atau pipeline CI. - **Praktik Terbaik:** Jangan pernah melakukan hardcode pada kunci. Selalu suntikkan saat runtime melalui variabel lingkungan yang diambil dari sistem manajemen rahasia (misalnya, Google Secret Manager). - **Respons:** Jika terjadi kebocoran, segera putar (revoke dan buat ulang) kunci API yang terekspos. |
| **Operasional**| R-05 | **Kegagalan Proses Deployment.** Deployment revisi baru gagal karena konfigurasi yang salah atau masalah pada image Docker. | Sedang | Sedang | - Ikuti rencana Rollback yang telah ditentukan untuk segera mengembalikan ke revisi stabil sebelumnya. - Lakukan deployment ke lingkungan _staging_ (jika ada) sebelum production. - Pastikan image Docker diuji secara lokal sebelum di-push. |
| **UX** | R-06 | **Kompleksitas UI yang Berlebihan.** Pengguna merasa kesulitan dalam mengonfigurasi modul, yang menyebabkan frustrasi dan tingkat adopsi yang rendah. | Sedang | Sedang | - Berikan nilai default yang masuk akal untuk semua field. - Kumpulkan umpan balik pengguna secara aktif pasca-peluncuran melalui tautan umpan balik atau survei. - Prioritaskan iterasi pada desain UI berdasarkan data penggunaan dan umpan balik kualitatif. |
