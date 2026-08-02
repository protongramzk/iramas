# 📜 FEATURES.md — IRAMAS AUDIO SUITE
Dokumen ini mencakup spesifikasi fitur utama, manajemen data lokal, serta panduan skema sistem tema untuk proyek **Iramas**.
## 🎵 1. Playlist & Queue Engine
Sistem manajemen antrean dan daftar putar dipisah secara tegas untuk memberikan fleksibilitas setara *desktop-grade audio player*.
### A. Dynamic Play Queue (Antrean Pemutaran Sementara)
 * **In-Memory Volatile Queue:** Daftar lagu yang sedang berjalan secara *real-time*.
 * **Play Next & Queue After:** Opsi menyisipkan lagu persis setelah lagu yang diputar tanpa merusak antrean utama.
 * **Drag-to-Reorder:** Mengubah urutan lagu di antrean secara langsung melalui gesture interaktif.
### B. Persistent Playlists (Penyimpanan Permanen)
 * **Custom User Playlists:** Pembuatan playlist kustom yang disimpan di IndexedDB (Dexie.js) sebagai array referensi trackIds.
 * **Smart Auto-Playlists:**
   * [FAVORITES] — Akses cepat lagu yang ditandai dengan ikon hati.
   * [RECENTLY_ADDED] — Filter otomatis berdasarkan timestamp addedAt.
   * [MOST_PLAYED] — Diurutkan berdasarkan playCount yang tercatat secara internal.
## ⏱️ 2. Intelligent Sleep Timer
Fitur penghenti pemutaran otomatis yang dirancang khusus untuk kenyamanan tidur tanpa menguras daya baterai.
 * **Flexible Countdown Options:**
   * Durasi berbasis waktu: 15m, 30m, 45m, 60m, atau kustom menit.
   * Durasi berbasis trek: End of Current Track.
 * **Psychoacoustic Smooth Fade-Out:**
   * Memanfaatkan fungsi Howler.fade() pada 10–15 detik terakhir sebelum timer habis.
   * Volume diturunkan secara eksponensial dari level aktif ke 0\text{ dB} agar tidak mengejutkan pendengar saat mulai tertidur.
 * **DSP & Engine Shutdown:** Otomatis mematikan *AudioContext* Tone.js dan menghentikan requestAnimationFrame pada visualizer setelah audio berhenti total untuk menghemat penggunaan CPU/RAM.
## 🎨 3. System Themes & Color Schemas
Sistem tema dirancang serba *sharp* (0\text{px} radius, 0\text{px} shadow) dengan kontras yang dioptimalkan untuk mengurangi kelelahan mata (*eye strain*) pada penggunaan jangka panjang.
### A. Base Mode Toggle
 * **Dark Mode (Default):** Menggunakan latar belakang gelap OLED-friendly untuk menghemat konsumsi daya layar dan kenyamanan di ruang redup.
 * **Light Mode:** Menggunakan kontras *high-readability paper tone* untuk penggunaan di bawah terik matahari.
### B. Curated "Comfort-First" Color Palettes
Setiap skema warna terdiri dari **4 variabel CSS standar**:
 * --bg-primary (Latar Belakang Utama)
 * --panel-bg (Latar Belakang Panel/Kartu)
 * --border-color (Garis Batas Element Sharp)
 * --accent-color (Warna Aksen Penanda/Tombol Aktif)
#### 🌙 Dark Mode Schemas
| Name ID | Name | Background (--bg-primary) | Panel (--panel-bg) | Border (--border-color) | Accent (--accent-color) | Mood / Use Case |
|---|---|---|---|---|---|---|
| dark-cassava | **Cassava Emerald** | #121212 | #1E1E1E | #333333 | #00FF66 | Industrial, neon contrast, ultra-sharp. |
| dark-amber | **Amber Terminal** | #141210 | #1F1A17 | #3A312B | #FFB000 | Vintage CRT, hangat, ramah mata saat malam. |
| dark-nord | **Nordic Frost** | #1A1C23 | #232631 | #3B4252 | #88C0D0 | Sejuk, pastel dingin, sangat tenang. |
| dark-dracula | **Vampire Violet** | #181824 | #212130 | #363654 | #BD93F9 | Modern synthwave, gelap berkarakter. |
#### ☀️ Light Mode Schemas
| Name ID | Name | Background (--bg-primary) | Panel (--panel-bg) | Border (--border-color) | Accent (--accent-color) | Mood / Use Case |
|---|---|---|---|---|---|---|
| light-paper | **Industrial Paper** | #F4F4F0 | #E8E8E2 | #D0D0C8 | #1A1A1A | High-contrast koran/kertas koran lama. |
| light-nord | **Snow Ice** | #EBF0F5 | #E1E8F0 | #C8D4E0 | #5E81AC | Lembut, tidak menyilaukan mata di siang hari. |
| light-sepia | **Warm Sepia** | #F7F3E9 | #EDE7D8 | #DCD4C0 | #8C6D46 | Nada kayu/buku tua, *zero blue-light strain*. |
## 🗄️ 4. Data Persistence Schema (Dexie.js Update)
Tabel tambahan yang siap diimplementasikan untuk mendukung fitur-fitur di atas:
```javascript
// Database Schema Update (Dexie.js)
db.version(3).stores({
  tracks: '++id, name, title, artist, album, duration, size, playCount, isFavorite, addedAt',
  playlists: '++id, name, trackIds, createdAt',
  eqPresets: '++id, name, gains, isDefault',
  visualizers: '++id, name, author, type, codeString, isSelected',
  settings: 'key, value' // Menyimpan 'activeThemeId', 'sleepTimerDefaults', dll.
});

```
