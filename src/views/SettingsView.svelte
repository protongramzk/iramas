<script>
  import { onMount } from 'svelte';
  import { db } from '../lib/db/database';
  import { crossfadeDuration, volumeNormalization } from '../lib/dsp/audioCore';
  import {
    Upload, Settings, HardDrive, Trash2, ToggleLeft, ToggleRight, Check, Palette
  } from 'lucide-svelte';

  let storageUsed = '0 B';
  let isCrossfade = false;
  let isNormalize = false;
  let activeThemeId = 'dark-cassava';
  let customVisFile;

  // Curated comfort-first themes config
  const themes = [
    { id: 'dark-cassava', name: 'Cassava Emerald', bg: '#121212', panel: '#1E1E1E', border: '#333333', accent: '#00FF66', dark: true },
    { id: 'dark-amber', name: 'Amber Terminal', bg: '#141210', panel: '#1F1A17', border: '#3A312B', accent: '#FFB000', dark: true },
    { id: 'dark-nord', name: 'Nordic Frost', bg: '#1A1C23', panel: '#232631', border: '#3B4252', accent: '#88C0D0', dark: true },
    { id: 'dark-dracula', name: 'Vampire Violet', bg: '#181824', panel: '#212130', border: '#363654', accent: '#BD93F9', dark: true },
    { id: 'light-paper', name: 'Industrial Paper', bg: '#F4F4F0', panel: '#E8E8E2', border: '#D0D0C8', accent: '#1A1A1A', dark: false },
    { id: 'light-nord', name: 'Snow Ice', bg: '#EBF0F5', panel: '#E1E8F0', border: '#C8D4E0', accent: '#5E81AC', dark: false },
    { id: 'light-sepia', name: 'Warm Sepia', bg: '#F7F3E9', panel: '#EDE7D8', border: '#DCD4C0', accent: '#8C6D46', dark: false }
  ];

  async function loadSettings() {
    // Read Storage usage sizing
    try {
      const estimate = await navigator.storage.estimate();
      storageUsed = formatBytes(estimate.usage || 0);
    } catch (e) {
      storageUsed = 'Unknown';
    }

    // Load configurations
    const theme = await db.settings.get('activeThemeId');
    if (theme) {
      activeThemeId = theme.value;
      applyTheme(activeThemeId);
    }

    const cf = await db.settings.get('crossfade');
    if (cf) {
      isCrossfade = cf.value;
      crossfadeDuration.set(isCrossfade ? 3 : 0);
    }

    const vn = await db.settings.get('volumeNormalization');
    if (vn) {
      isNormalize = vn.value;
      volumeNormalization.set(isNormalize);
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const dm = 2;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async function toggleCrossfade() {
    isCrossfade = !isCrossfade;
    await db.settings.put({ key: 'crossfade', value: isCrossfade });
    crossfadeDuration.set(isCrossfade ? 3 : 0); // 3 seconds crossfade
  }

  async function toggleNormalization() {
    isNormalize = !isNormalize;
    await db.settings.put({ key: 'volumeNormalization', value: isNormalize });
    volumeNormalization.set(isNormalize);
  }

  // Theme execution
  async function selectTheme(themeId) {
    activeThemeId = themeId;
    await db.settings.put({ key: 'activeThemeId', value: themeId });
    applyTheme(themeId);
  }

  function applyTheme(themeId) {
    const t = themes.find(x => x.id === themeId);
    if (!t) return;

    // Set root standard CSS variables for entire container app runtime
    document.documentElement.style.setProperty('--bg-primary', t.bg);
    document.documentElement.style.setProperty('--panel-bg', t.panel);
    document.documentElement.style.setProperty('--border-color', t.border);
    document.documentElement.style.setProperty('--accent-color', t.accent);

    // Also toggle light/dark class
    if (t.dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Visualizer Plugin JS/JSON loader upload handler
  async function handleVisualizerImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    let name = file.name.replace(/\.[^/.]+$/, "");
    let author = 'Local Custom';
    let codeString = text;

    // Check if JSON configuration file
    if (file.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(text);
        name = parsed.name || name;
        author = parsed.author || author;
        codeString = parsed.codeString || text;
      } catch (err) {
        alert("Invalid Visualizer JSON format structure.");
        return;
      }
    }

    // Save as newly active visualizer script to Dexie
    const newVis = {
      name: name,
      author: author,
      type: 'js',
      codeString: codeString,
      isSelected: 1
    };

    // Unselect other visualizers first
    await db.visualizers.where('isSelected').equals(1).modify({ isSelected: 0 });
    await db.visualizers.add(newVis);
    alert(`Successfully loaded & applied custom visualizer: ${name}`);
  }

  async function clearCacheAndDB() {
    if (confirm("Are you sure you want to clear entire database? This clears all cached music and playlists!")) {
      await db.tracks.clear();
      await db.playlists.clear();
      await db.eqPresets.clear();
      await db.visualizers.clear();
      await db.settings.clear();
      alert("Database and caches cleared successfully. Reloading app.");
      window.location.reload();
    }
  }

  onMount(async () => {
    await loadSettings();
  });
</script>

<div class="flex flex-col h-full bg-neutral-950 text-neutral-100 p-6 pb-24 overflow-y-auto">
  <!-- Settings Header bar -->
  <div class="flex flex-col mb-8">
    <h2 class="text-xl font-bold tracking-tight text-neutral-100">Suite Settings</h2>
    <p class="text-xs text-neutral-400 mt-0.5">Application Options & Styling</p>
  </div>

  <!-- Themes management panel -->
  <div class="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 mb-6">
    <div class="flex items-center gap-2 mb-4">
      <Palette size={16} class="text-primary" />
      <span class="text-xs font-bold tracking-wider text-neutral-400 uppercase">Interactive Themes</span>
    </div>

    <div class="grid grid-cols-2 gap-2.5">
      {#each themes as t}
        <button
          on:click={() => selectTheme(t.id)}
          class="flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 {activeThemeId === t.id ? 'bg-primary/5 border-primary text-primary' : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700/80 text-neutral-300'}"
        >
          <div class="flex items-center gap-2.5 truncate">
            <span class="w-3 h-3 rounded-full border border-neutral-800" style="background-color: {t.accent}" />
            <span class="truncate">{t.name}</span>
          </div>
          {#if activeThemeId === t.id}
            <Check size={14} class="text-primary flex-shrink-0" />
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Audio Playback options -->
  <div class="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 mb-6">
    <div class="flex items-center gap-2 mb-4">
      <Settings size={16} class="text-primary" />
      <span class="text-xs font-bold tracking-wider text-neutral-400 uppercase">Audio Playback Options</span>
    </div>

    <div class="flex flex-col gap-4">
      <!-- Gapless / Crossfade toggle -->
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-semibold text-neutral-200">Crossfade Transition</h4>
          <p class="text-[10px] text-neutral-500 mt-0.5">Smooth 3-second blend crossfade between songs</p>
        </div>
        <button on:click={toggleCrossfade} class="text-neutral-400 hover:text-white transition-colors">
          {#if isCrossfade}
            <ToggleRight size={32} class="text-primary" />
          {:else}
            <ToggleLeft size={32} />
          {/if}
        </button>
      </div>

      <!-- Volume Normalization toggle -->
      <div class="flex items-center justify-between border-t border-neutral-900 pt-4">
        <div>
          <h4 class="text-sm font-semibold text-neutral-200">ReplayGain / Volume Normalization</h4>
          <p class="text-[10px] text-neutral-500 mt-0.5">Auto-level master amplitude peaks to protect ears</p>
        </div>
        <button on:click={toggleNormalization} class="text-neutral-400 hover:text-white transition-colors">
          {#if isNormalize}
            <ToggleRight size={32} class="text-primary" />
          {:else}
            <ToggleLeft size={32} />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Visualizer Importer Custom JS script -->
  <div class="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 mb-6">
    <div class="flex items-center gap-2 mb-3">
      <Upload size={16} class="text-primary" />
      <span class="text-xs font-bold tracking-wider text-neutral-400 uppercase">Visualizer Importer</span>
    </div>
    <p class="text-[10px] text-neutral-500 mb-4 leading-relaxed">
      Import a custom visualizer script file (.js or .json) specifying a standard <code class="bg-neutral-950 px-1 py-0.5 rounded text-neutral-400">renderVisualizer(ctx, width, height, frequencyData)</code> renderer block module.
    </p>

    <input
      type="file"
      accept=".js,.json"
      bind:this={customVisFile}
      on:change={handleVisualizerImport}
      class="hidden"
    />

    <button
      on:click={() => customVisFile.click()}
      class="w-full flex items-center justify-center gap-2 py-3 bg-neutral-950 border border-neutral-850 hover:border-neutral-700/80 text-xs font-bold rounded-xl transition-all duration-200"
    >
      <Upload size={14} />
      <span>Upload Script File</span>
    </button>
  </div>

  <!-- Memory & Cache cleaner storage -->
  <div class="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5">
    <div class="flex items-center gap-2 mb-4">
      <HardDrive size={16} class="text-primary" />
      <span class="text-xs font-bold tracking-wider text-neutral-400 uppercase">Storage & Cache Usage</span>
    </div>

    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-sm font-semibold text-neutral-200">IndexedDB Storage Capacity</h4>
        <p class="text-[10px] text-neutral-500 mt-0.5">Used cache files: <span class="text-neutral-300 font-mono font-bold">{storageUsed}</span></p>
      </div>
      <button
        on:click={clearCacheAndDB}
        class="flex items-center gap-1.5 px-4 py-2 bg-red-950/20 hover:bg-red-950 border border-red-900/30 text-red-400 text-xs font-bold rounded-xl transition-all duration-200"
      >
        <Trash2 size={13} />
        <span>Clear Database</span>
      </button>
    </div>
  </div>
</div>

<style>
  .text-primary {
    color: var(--accent-color, #00FF66);
  }
  .border-primary {
    border-color: var(--accent-color, #00FF66);
  }
</style>
