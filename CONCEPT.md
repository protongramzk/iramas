Berikut adalah blueprint teknis dan arsitektur lengkap untuk **Iramas**—*Digital Audio Suite & Local Music Player* berbasis Web/PWA yang berfokus pada efisiensi performa, pemrosesan audio *low-latency*, serta arsitektur *client-side* murni tanpa ketergantungan pada *server/backend*.
## 🏗️ 1. Tech Stack Core & Arsitektur Sistem
 * **UI Framework:** **Svelte** (Kemampuan *compile-time reactivity* tanpa Virtual DOM, menghasilkan ukuran *bundle* ultra-kecil dan eksekusi rendering 60\text{ FPS}).
 * **Local Storage & Database:** **Dexie.js (IndexedDB)** (Penyimpanan permanen untuk *Blob* file audio, metadata ID3, preset Equalizer, serta visualizer kustom).
 * **Audio Core Transport:** **Howler.js** (Manajemen *playback*, pemutaran *background*, serta integrasi penuh dengan navigator.mediaSession).
 * **Sound Enhancer DSP Engine:** **Tone.js** (Rantai pemrosesan pemutar frekuensi, *Equalizer*, *Compressor*, dan *Limiter*).
 * **Metadata Parser:** **jsmediatags** (Ekstraksi metadata tag ID3 v1/v2 dan *cover art* dari *Blob* lokal secara *asynchronous*).
## 🔄 2. Rantai Jalur Audio (DSP Pipeline)
Setiap file audio yang diputar dilewatkan melalui *AudioContext Node Chain* dari **Tone.js** sebelum dialirkan ke *speaker/headphone*:
 * **Tone.EQ10 (10-Band Equalizer):** Pemrosesan sinyal frekuensi 31\text{ Hz} hingga 16\text{ kHz}.
 * **Tone.Compressor:** Meratakan rentang dinamis agar bagian audio yang pelan tetap berkarakter tanpa membuat bagian keras menjadi tidak nyaman.
 * **Tone.Limiter:** Membatasi puncak gain (0\text{ dBFS}) untuk mencegah terjadinya *clipping* atau suara pecah saat *Preamp/Bass Boost* dinaikkan.
 * **Tone.Analyser:** Mengambil data frekuensi gelombang (*FFT*) secara *real-time* untuk dikirimkan ke modul Visualizer Canvas.
## 💾 3. Skema Data (Dexie.js / IndexedDB)
Database lokal diberi nama **IramasDB** dengan struktur *object store* sebagai berikut:
```javascript
import Dexie from 'dexie';

export const db = new Dexie('IramasDB');

db.version(1).stores({
  // Menyimpan metadata dan Blob file audio
  tracks: '++id, name, title, artist, album, duration, size, addedAt',
  
  // Menyimpan preset Equalizer kustom milik user
  eqPresets: '++id, name, gains, isDefault',
  
  // Menyimpan script atau konfigurasi JSON Visualizer kustom
  visualizers: '++id, name, author, type, codeString, isSelected',
  
  // Key-value storage untuk pengaturan aplikasi
  settings: 'key, value'
});

```
## 📱 4. Layout & Navigasi Utama (4 Screen System)
Antarmuka **Iramas** dibagi menjadi 4 layar utama yang diakses melalui **Bottom Navigation Bar** yang selalu berada di area *thumb-zone* (bagian bawah layar) agar nyaman digunakan dengan satu tangan.
```
┌─────────────────────────────────────────┐
│                                         │
│           VIEWPORT AKTIF                │
│    (Player / EQ / Library / Settings)   │
│                                         │
├─────────────────────────────────────────┤
│ [PLAYER]  [EQUALIZER]  [LIBRARY]  [SET] │ ◄─ Bottom Navbar
└─────────────────────────────────────────┘

```
### 🎵 Screen 1: Player Page (Layar Utama Pemutar)
Layar fokus untuk kontrol lagu yang sedang berjalan dan visualisasi sinyal audio.
#### Komponen Utama:
 1. **Visualizer Canvas 2D:**
   * Memanfaatkan requestAnimationFrame() untuk merender data sinyal frekuensi dari Tone.Analyser.
   * **Standar Import Visualizer:** Mendukung pemuatan plugin kustom berbasis skrip JS yang diimpor oleh user. Skrip menjalankan kontrak fungsi sederhana:
     ```javascript
     // Standar Modul Visualizer Kustom (.js)
     export function renderVisualizer(ctx, width, height, frequencyData) {
       // Logika menggambar kustom menggunakan HTML5 Canvas 2D
     }
     
     ```
 2. **Artwork Container:** Menampilkan gambar sampul album (*Cover Art*) yang diekstrak oleh jsmediatags.
 3. **Track Metadata:** Judul lagu dan nama artis dengan teks berjalan (*marquee*) jika teks terlalu panjang.
 4. **Scrubber Bar (Progress Rail):** *Slider* interaktif untuk melompat (*seek*) ke detik lagu tertentu.
 5. **Transport Controls:** Tombol *Previous, Play/Pause, Next, Shuffle,* dan *Repeat*.
### 🎛️ Screen 2: Equalizer Room (Layar Pengolah Suara)
Pusat kendali *Sound Enhancer* untuk memanipulasi frekuensi audio secara presisi.
#### Komponen Utama:
 1. **Master Power Toggle:** Sakelar untuk mengaktifkan/mengarahkan aliran audio melewati rantai DSP Tone.js.
 2. **Preamp & Gain Boost Slider:** Pengatur amplitudo utama (0\times hingga 2.0\times) yang dilindungi oleh Tone.Limiter.
 3. **10-Band Graphic Sliders:**
   * Frekuensi: 31\text{ Hz}, 62\text{ Hz}, 125\text{ Hz}, 250\text{ Hz}, 500\text{ Hz}, 1\text{ kHz}, 2\text{ kHz}, 4\text{ kHz}, 8\text{ kHz}, 16\text{ kHz}.
   * Setiap *slider* mengontrol gain dari -12\text{ dB} hingga +12\text{ dB}.
 4. **Preset Selector & Manager:**
   * Dropdown preset bawaan (*Flat, Bass Boost, Vocal, Rock, Pop*).
   * Tombol *“Save Preset”* untuk menyimpan konfigurasi slider saat ini ke tabel eqPresets di Dexie.js.
### 📁 Screen 3: File Library (Layar Manajemen Folder & Playlist)
Pusat pemindaian *filesystem* lokal dan navigasi seluruh berkas musik.
#### Komponen Utama:
 1. **Folder Scanner Engine:**
   * Tombol utama **SCAN FOLDER** memanfaatkan window.showDirectoryPicker() (dengan *fallback* <input webkitdirectory> untuk kompatibilitas browser).
   * Proses pemindaian berjalan secara *asynchronous*: memfilter ekstensi berkas (.mp3, .flac, .wav, .ogg, .m4a), mengekstrak tag ID3 via jsmediatags, lalu menyimpannya secara *bulk* ke IndexedDB.
 2. **Search & Quick Filter Bar:** Pencarian instan judul lagu atau artis berdasarkan data terindeks di Dexie.js.
 3. **Track List View:**
   * Daftar lagu yang menampilkan nama berkas/metadata, durasi, dan ukuran berkas.
   * *Item Click:* Menjadwalkan berkas ke antrean pemutaran Howler.js dan mengalihkan *audio stream*.
   * Tombol *Delete/Remove* dari pustaka lokal.
### ⚙️ Screen 4: Settings Page (Layar Pengaturan)
Pusat konfigurasi aplikasi, manajemen memori, dan pemuat *plugin*.
#### Komponen Utama:
 1. **Visualizer Importer:**
   * Fitur unggah file berkas kustom (.js atau .json) untuk menambahkan modul gaya visualizer baru ke dalam tabel visualizers IndexedDB.
 2. **Storage & Memory Management:**
   * Indikator penggunaan kapasitas memori simpanan IndexedDB.
   * Tombol *“Clear Cache & Database”* untuk membersihkan riwayat pustaka dan *Blob* audio.
 3. **Audio Playback Options:**
   * Toggle *Gapless / Crossfade Transition* (Mengatur durasi *fade-in / fade-out* antar lagu menggunakan fungsi Howler.fade()).
   * Toggle *ReplayGain / Volume Normalization*.
## 🛠️ 5. Struktur Direktori Proyek (Svelte)
```text
iramas-app/
├── public/
│   ├── favicon.ico
│   └── manifest.json         # Konfigurasi PWA (Offline-First)
├── src/
│   ├── assets/
│   ├── lib/
│   │   ├── components/       # Komponent UI Svelte
│   │   │   ├── Navbar.svelte
│   │   │   ├── VisualizerCanvas.svelte
│   │   │   ├── TrackCard.svelte
│   │   │   └── EqSlider.svelte
│   │   ├── dsp/              # Audio Engine Modules
│   │   │   ├── audioCore.js   # Inisialisasi Howler.js & MediaSession
│   │   │   ├── eqChain.js     # Tone.EQ10, Compressor, Limiter
│   │   │   └── visualizerEngine.js
│   │   ├── db/
│   │   │   └── database.js    # Inisialisasi Dexie.js
│   │   └── utils/
│   │       ├── fsScanner.js   # File System Access API & Fallback
│   │       └── id3Parser.js   # Wrapper jsmediatags
│   ├── views/                # 4 Main Screens
│   │   ├── PlayerView.svelte
│   │   ├── EqualizerView.svelte
│   │   ├── LibraryView.svelte
│   │   └── SettingsView.svelte
│   ├── App.svelte            # Entry point + Screen Router
│   └── main.js
├── package.json
└── vite.config.js

```
## 🚀 6. Alur Kerja Komunikasi Antar-Modul
 1. **Inisialisasi Pemindaian:** LibraryView memicu fsScanner.js \rightarrow Berkas audio dibaca \rightarrow id3Parser.js mengambil metadata \rightarrow Hasilnya disimpan ke database.js (Dexie).
 2. **Inisialisasi Pemutaran:** User memilih lagu di LibraryView \rightarrow Data *Blob* diambil dari Dexie \rightarrow Dimuat ke audioCore.js (Howler.js) \rightarrow Metadata dikirimkan ke navigator.mediaSession.
 3. **Pemrosesan Suara:** Sinyal pemutaran dari Howler disalurkan ke eqChain.js (Tone.js) \rightarrow Frekuensi difilter sesuai slider di EqualizerView \rightarrow Dibatasi oleh Limiter \rightarrow Sinyal akhir dikirim ke *speaker*.
 4. **Visualisasi:** Data frekuensi dari Tone.Analyser diambil 60\text{ kali per detik} dan dirender oleh VisualizerCanvas.svelte pada PlayerView.
