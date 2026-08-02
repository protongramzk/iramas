import Dexie from 'dexie';

export const db = new Dexie('IramasDB');

// Version 1 (From CONCEPT.md)
db.version(1).stores({
  tracks: '++id, name, title, artist, album, duration, size, addedAt',
  eqPresets: '++id, name, gains, isDefault',
  visualizers: '++id, name, author, type, codeString, isSelected',
  settings: 'key, value'
});

// Version 3 (From FEATURES.md updates)
db.version(3).stores({
  tracks: '++id, name, title, artist, album, duration, size, playCount, isFavorite, addedAt',
  playlists: '++id, name, trackIds, createdAt',
  eqPresets: '++id, name, gains, isDefault',
  visualizers: '++id, name, author, type, codeString, isSelected',
  settings: 'key, value'
});

// Helper functions for DB seeding and operations
export async function initSettings() {
  const activeTheme = await db.settings.get('activeThemeId');
  if (!activeTheme) {
    await db.settings.put({ key: 'activeThemeId', value: 'dark-cassava' });
  }

  const crossfade = await db.settings.get('crossfade');
  if (!crossfade) {
    await db.settings.put({ key: 'crossfade', value: false });
  }

  const volumeNormalizer = await db.settings.get('volumeNormalization');
  if (!volumeNormalizer) {
    await db.settings.put({ key: 'volumeNormalization', value: false });
  }

  // Seed default EQ presets if they don't exist
  const count = await db.eqPresets.count();
  if (count === 0) {
    const defaultPresets = [
      { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], isDefault: 1 },
      { name: 'Bass Boost', gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0], isDefault: 1 },
      { name: 'Vocal', gains: [-2, -1, 0, 2, 4, 4, 3, 2, 0, -1], isDefault: 1 },
      { name: 'Rock', gains: [4, 3, -1, -2, -1, 1, 3, 4, 4, 3], isDefault: 1 },
      { name: 'Pop', gains: [-1, 2, 3, 4, 2, -1, -2, -2, -1, -1], isDefault: 1 }
    ];
    await db.eqPresets.bulkAdd(defaultPresets);
  }

  // Seed standard custom visualizer script
  const visCount = await db.visualizers.count();
  if (visCount === 0) {
    const defaultVis = {
      name: 'Neon Pulse Waves',
      author: 'Iramas Core',
      type: 'js',
      codeString: `
export function renderVisualizer(ctx, width, height, frequencyData) {
  ctx.fillStyle = 'rgba(15, 15, 15, 0.2)';
  ctx.fillRect(0, 0, width, height);

  const barWidth = (width / frequencyData.length) * 2.5;
  let barHeight;
  let x = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    barHeight = frequencyData[i] / 2;
    // Premium theme-aware neon color look
    const r = 0;
    const g = 255;
    const b = 102;
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (barHeight / 150) + ')';
    ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
    x += barWidth;
  }
}
      `.trim(),
      isSelected: 1
    };
    await db.visualizers.add(defaultVis);
  }
}
