import { parse } from 'jsmediatags';

export async function parseID3(blob) {
  return new Promise((resolve) => {
    let resolved = false;

    // Timeout safeguard of 5 seconds
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn("jsmediatags parsing timed out, returning fallback metadata");
        resolve({
          title: null,
          artist: null,
          album: null,
          coverArt: null
        });
      }
    }, 5000);

    const safeResolve = (data) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(data);
      }
    };

    // Check if it's a blob and is valid
    if (!(blob instanceof Blob)) {
      safeResolve({
        title: 'Unknown Title',
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        coverArt: null
      });
      return;
    }

    parse(blob, {
      onSuccess: function (tag) {
        const tags = tag.tags || {};
        let coverArt = null;

        // Extract cover art from tags using high-performance non-blocking FileReader
        if (tags.picture) {
          try {
            const { data, format } = tags.picture;
            const imgBlob = new Blob([new Uint8Array(data)], { type: format });
            const reader = new FileReader();

            reader.onloadend = function () {
              coverArt = reader.result;
              safeResolve({
                title: tags.title || null,
                artist: tags.artist || null,
                album: tags.album || null,
                coverArt: coverArt
              });
            };

            reader.onerror = function () {
              safeResolve({
                title: tags.title || null,
                artist: tags.artist || null,
                album: tags.album || null,
                coverArt: null
              });
            };

            reader.readAsDataURL(imgBlob);
            return; // Let readAsDataURL complete asynchronously
          } catch (err) {
            console.error("Error reading cover art picture bytes:", err);
          }
        }

        safeResolve({
          title: tags.title || null,
          artist: tags.artist || null,
          album: tags.album || null,
          coverArt: coverArt
        });
      },
      onError: function (error) {
        console.warn("jsmediatags parsing error:", error.type, error.info);
        safeResolve({
          title: null,
          artist: null,
          album: null,
          coverArt: null
        });
      }
    });
  });
}
