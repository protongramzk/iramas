import { parse } from 'jsmediatags';

export async function parseID3(blob) {
  return new Promise((resolve) => {
    // Check if it's a blob and is valid
    if (!(blob instanceof Blob)) {
      resolve({
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

        // Extract cover art from tags
        if (tags.picture) {
          try {
            const { data, format } = tags.picture;
            let base64String = "";
            for (let i = 0; i < data.length; i++) {
              base64String += String.fromCharCode(data[i]);
              if (i % 10000 === 0 && i > 0) {
                // Yield to prevent thread locking on very large arrays
              }
            }
            coverArt = `data:${format};base64,${btoa(base64String)}`;
          } catch (err) {
            console.error("Error reading cover art picture bytes:", err);
          }
        }

        resolve({
          title: tags.title || null,
          artist: tags.artist || null,
          album: tags.album || null,
          coverArt: coverArt
        });
      },
      onError: function (error) {
        console.warn("jsmediatags parsing error:", error.type, error.info);
        resolve({
          title: null,
          artist: null,
          album: null,
          coverArt: null
        });
      }
    });
  });
}
