<script>
  import { onMount } from 'svelte';
  import { db, initSettings } from './lib/db/database';
  import Navbar from './lib/components/Navbar.svelte';
  import PlayerView from './views/PlayerView.svelte';
  import EqualizerView from './views/EqualizerView.svelte';
  import LibraryView from './views/LibraryView.svelte';
  import SettingsView from './views/SettingsView.svelte';

  let currentView = 'player';
  let isDbInitialized = false;

  onMount(async () => {
    // Standard initialization of Database schema config and presets
    await initSettings();
    isDbInitialized = true;

    // Retrieve active theme setting from Dexie
    const themeObj = await db.settings.get('activeThemeId');
    if (themeObj) {
      applyTheme(themeObj.value);
    } else {
      applyTheme('dark-cassava');
    }
  });

  function applyTheme(themeId) {
    const themes = {
      'dark-cassava': { bg: '#121212', panel: '#1E1E1E', border: '#333333', accent: '#00FF66', dark: true },
      'dark-amber': { bg: '#141210', panel: '#1F1A17', border: '#3A312B', accent: '#FFB000', dark: true },
      'dark-nord': { bg: '#1A1C23', panel: '#232631', border: '#3B4252', accent: '#88C0D0', dark: true },
      'dark-dracula': { bg: '#181824', panel: '#212130', border: '#363654', accent: '#BD93F9', dark: true },
      'light-paper': { bg: '#F4F4F0', panel: '#E8E8E2', border: '#D0D0C8', accent: '#1A1A1A', dark: false },
      'light-nord': { bg: '#EBF0F5', panel: '#E1E8F0', border: '#C8D4E0', accent: '#5E81AC', dark: false },
      'light-sepia': { bg: '#F7F3E9', panel: '#EDE7D8', border: '#DCD4C0', accent: '#8C6D46', dark: false }
    };

    const t = themes[themeId] || themes['dark-cassava'];
    document.documentElement.style.setProperty('--bg-primary', t.bg);
    document.documentElement.style.setProperty('--panel-bg', t.panel);
    document.documentElement.style.setProperty('--border-color', t.border);
    document.documentElement.style.setProperty('--accent-color', t.accent);

    if (t.dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function handleViewChange(viewId) {
    currentView = viewId;
  }
</script>

<div class="w-full h-screen flex flex-col justify-between overflow-hidden relative selection:bg-neutral-800 selection:text-white" style="background-color: var(--bg-primary, #121212); font-family: 'Inter', sans-serif;">
  {#if isDbInitialized}
    <!-- Screen View Router Container -->
    <main class="flex-1 w-full max-w-md mx-auto relative overflow-hidden bg-neutral-950/20 shadow-2xl">
      {#if currentView === 'player'}
        <PlayerView />
      {:else if currentView === 'equalizer'}
        <EqualizerView />
      {:else if currentView === 'library'}
        <LibraryView />
      {:else if currentView === 'settings'}
        <SettingsView />
      {/if}
    </main>

    <!-- Bottom Navigation Component -->
    <Navbar activeView={currentView} onViewChange={handleViewChange} />
  {:else}
    <!-- Initializing Screen Loader -->
    <div class="flex-1 flex flex-col items-center justify-center text-center text-neutral-400 gap-3">
      <div class="w-8 h-8 border-2 border-neutral-700 border-t-emerald-400 rounded-full animate-spin" />
      <span class="text-xs font-semibold uppercase tracking-widest">Initializing Iramas...</span>
    </div>
  {/if}
</div>

<style>
  /* Base custom theme settings override */
  :global(:root) {
    --accent-color: #00FF66;
  }

  :global(body) {
    background-color: #0c0c0c;
    margin: 0;
    overflow: hidden;
  }
</style>
