import { db } from '../db/database';
import { parseID3 } from './id3Parser';

// Main folder scan function using File System Access API with <input webkitdirectory> fallback
export async function scanFolder(onProgress) {
  // Try modern window.showDirectoryPicker() first
  if (typeof window !== 'undefined' && window.showDirectoryPicker) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const files = [];
      await traverseDirectory(dirHandle, files);
      await processFilesBulk(files, onProgress);
      return { success: true, count: files.length };
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("User aborted directory scanning selection.");
        return { success: false, aborted: true };
      }
      console.warn("showDirectoryPicker failed or declined, falling back to manual picker:", err);
    }
  }

  // Fallback trigger using a hidden file input element (Svelte view will trigger this directly)
  return { success: false, useFallback: true };
}

// Traverse filesystem directories recursively
async function traverseDirectory(dirHandle, fileList) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const nameLower = entry.name.toLowerCase();
      if (
        nameLower.endsWith('.mp3') ||
        nameLower.endsWith('.aac') ||
        nameLower.endsWith('.wav') ||
        nameLower.endsWith('.flac') ||
        nameLower.endsWith('.ogg') ||
        nameLower.endsWith('.m4a')
      ) {
        const file = await entry.getFile();
        fileList.push(file);
      }
    } else if (entry.kind === 'directory') {
      await traverseDirectory(entry, fileList);
    }
  }
}

// Bulk processes files asynchronously, parsing ID3 and saving them to Dexie.js
export async function processFilesBulk(files, onProgress) {
  const total = files.length;
  let processed = 0;

  for (const file of files) {
    try {
      // Prevent duplicate track insertion based on unique name and file size matching
      const existing = await db.tracks.where('name').equals(file.name).first();
      if (existing && existing.size === file.size) {
        console.log("Track already exists in library, skipping duplicates:", file.name);
        processed++;
        if (onProgress) {
          onProgress(processed, total);
        }
        continue;
      }

      // Parse ID3 metadata
      const meta = await parseID3(file);

      const track = {
        name: file.name,
        title: meta.title || file.name.replace(/\.[^/.]+$/, ""), // Strip extension
        artist: meta.artist || 'Unknown Artist',
        album: meta.album || 'Unknown Album',
        duration: 0, // Will be resolved dynamically during load/play
        size: file.size,
        blob: file, // Store binary Blob directly in IndexedDB for client-side offline-first
        playCount: 0,
        isFavorite: 0,
        addedAt: Date.now()
      };

      if (meta.coverArt) {
        track.coverArt = meta.coverArt;
      }

      // Save to Dexie tracks store
      await db.tracks.add(track);
    } catch (err) {
      console.error("Failed to process local music track file:", file.name, err);
    }

    processed++;
    if (onProgress) {
      onProgress(processed, total);
    }
  }
}
