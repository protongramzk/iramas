<script>
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { db } from '../lib/db/database';
  import { scanFolder, processFilesBulk } from '../lib/utils/fsScanner';
  import { loadAndPlayTrack, setQueue, addToQueue, playNextInQueue, queue, currentQueueIndex } from '../lib/dsp/audioCore';
  import TrackCard from '../lib/components/TrackCard.svelte';
  import {
    FolderPlus, Search, ListMusic, RefreshCw, Layers, Check, Trash2, Heart, Plus, FolderHeart, Upload
  } from 'lucide-svelte';

  let tracks = [];
  let filteredTracks = [];
  let searchQuery = '';
  let activeTab = 'all'; // 'all', 'favorites', 'playlists', 'queue'

  // Folders scan state tracker
  let scanning = false;
  let scanProgress = '';
  let fallbackInput;

  // Custom playlists creation
  let playlists = [];
  let showPlaylistModal = false;
  let newPlaylistName = '';
  let selectedTrackForPlaylist = null;

  async function loadLibrary() {
    tracks = await db.tracks.toArray();
    filterTracks();
    await loadPlaylists();
  }

  async function loadPlaylists() {
    playlists = await db.playlists.toArray();
  }

  function filterTracks() {
    let list = [...tracks];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q)) ||
        (t.album && t.album.toLowerCase().includes(q))
      );
    }

    // Tabs filter
    if (activeTab === 'favorites') {
      list = list.filter(t => t.isFavorite === 1);
    }

    filteredTracks = list;
  }

  async function handleScan() {
    scanning = true;
    scanProgress = 'Initializing scanner...';
    try {
      const res = await scanFolder((processed, total) => {
        scanProgress = `Processing files: ${processed} / ${total}`;
      });

      if (res.useFallback) {
        fallbackInput.click();
      } else if (res.success) {
        await loadLibrary();
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!fallbackInput) {
        scanning = false;
      }
    }
  }

  async function handleFallbackSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      scanning = false;
      return;
    }

    const musicFiles = files.filter(f => {
      const name = f.name.toLowerCase();
      return f.type.startsWith('audio/') ||
             name.endsWith('.mp3') ||
             name.endsWith('.aac') ||
             name.endsWith('.wav') ||
             name.endsWith('.flac') ||
             name.endsWith('.ogg') ||
             name.endsWith('.m4a') ||
             name.endsWith('.mp4') ||
             name.endsWith('.wma') ||
             name.endsWith('.webm');
    });

    scanning = true;
    scanProgress = `Reading ${musicFiles.length} files...`;

    try {
      await processFilesBulk(musicFiles, (processed, total) => {
        scanProgress = `Caching files: ${processed} / ${total}`;
      });
      await loadLibrary();
    } catch (err) {
      console.error(err);
    } finally {
      scanning = false;
    }
  }

  function playTrack(track, list = null) {
    const playList = list || filteredTracks;
    setQueue(playList);
    const idx = playList.findIndex(t => t.id === track.id);
    loadAndPlayTrack(track, idx);
  }

  async function removeTrack(id) {
    await db.tracks.delete(id);
    await loadLibrary();
  }

  async function createPlaylist() {
    if (!newPlaylistName.trim()) return;

    const trackIds = selectedTrackForPlaylist ? [selectedTrackForPlaylist.id] : [];
    const plist = {
      name: newPlaylistName.trim(),
      trackIds: trackIds,
      createdAt: Date.now()
    };

    await db.playlists.add(plist);
    await loadPlaylists();

    newPlaylistName = '';
    selectedTrackForPlaylist = null;
    showPlaylistModal = false;
  }

  async function addTrackToPlaylist(playlistId, trackId) {
    const playlist = await db.playlists.get(playlistId);
    if (playlist) {
      if (!playlist.trackIds.includes(trackId)) {
        playlist.trackIds.push(trackId);
        await db.playlists.update(playlistId, { trackIds: playlist.trackIds });
        await loadPlaylists();
      }
    }
  }

  async function deletePlaylist(id) {
    await db.playlists.delete(id);
    await loadPlaylists();
  }

  async function playPlaylist(playlist) {
    const allTracks = await db.tracks.toArray();
    const plistTracks = playlist.trackIds.map(tid => allTracks.find(t => t.id === tid)).filter(Boolean);
    if (plistTracks.length > 0) {
      playTrack(plistTracks[0], plistTracks);
    }
  }

  onMount(async () => {
    await loadLibrary();
  });

  $: {
    searchQuery;
    activeTab;
    tracks;
    filterTracks();
  }
</script>

<div class="flex flex-col h-full bg-neutral-950 text-neutral-100 p-6 pb-24 overflow-y-auto">
  <!-- Hidden Upload File picker input -->
  <input
    type="file"
    bind:this={fallbackInput}
    on:change={handleFallbackSelect}
    accept="audio/*,.mp3,.aac,.wav,.flac,.ogg,.m4a"
    multiple
    class="hidden"
  />

  <!-- Library Header bar -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex flex-col">
      <h2 class="text-xl font-bold tracking-tight text-neutral-100">File Library</h2>
      <p class="text-xs text-neutral-400 mt-0.5">Manage Your Music Database</p>
    </div>

    <!-- Upload Music Trigger -->
    <button
      on:click={() => fallbackInput.click()}
      disabled={scanning}
      class="flex items-center gap-2 px-4 py-2.5 bg-primary text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 text-xs font-bold rounded-xl shadow-lg transition-all duration-300"
    >
      {#if scanning}
        <RefreshCw size={14} class="animate-spin" />
        <span>Uploading...</span>
      {:else}
        <Upload size={14} />
        <span>Upload Music</span>
      {/if}
    </button>
  </div>

  <!-- Progress alert for folders scan -->
  {#if scanning}
    <div class="mb-5 bg-primary/10 border border-primary text-primary px-4 py-3 rounded-xl text-xs font-semibold animate-pulse flex items-center justify-between">
      <span>{scanProgress}</span>
    </div>
  {/if}

  <!-- Search & Quick Filter Bar -->
  <div class="relative mb-5">
    <Search size={16} class="absolute left-4 top-3.5 text-neutral-500" />
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search songs, artists, or albums..."
      class="w-full bg-neutral-900 border border-neutral-800/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-neutral-200 focus:outline-none focus:border-primary/60 placeholder-neutral-500 transition-colors duration-200"
    />
  </div>

  <!-- Tabs Nav Row -->
  <div class="flex gap-2 mb-6 border-b border-neutral-900 pb-3 overflow-x-auto">
    <button
      on:click={() => activeTab = 'all'}
      class="px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 {activeTab === 'all' ? 'bg-neutral-900 border-neutral-800 text-primary' : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200'}"
    >
      All Songs
    </button>
    <button
      on:click={() => activeTab = 'favorites'}
      class="px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 {activeTab === 'favorites' ? 'bg-neutral-900 border-neutral-800 text-primary' : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200'}"
    >
      Favorites
    </button>
    <button
      on:click={() => activeTab = 'playlists'}
      class="px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 {activeTab === 'playlists' ? 'bg-neutral-900 border-neutral-800 text-primary' : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200'}"
    >
      Playlists
    </button>
    <button
      on:click={() => activeTab = 'queue'}
      class="px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 {activeTab === 'queue' ? 'bg-neutral-900 border-neutral-800 text-primary' : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200'}"
    >
      Active Queue
    </button>
  </div>

  <!-- Main View Render Block -->
  <div class="flex-1">
    {#if activeTab === 'all' || activeTab === 'favorites'}
      <!-- Display general lists -->
      {#if filteredTracks.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center text-neutral-500">
          <ListMusic size={36} class="mb-3 text-neutral-600" />
          <p class="text-xs font-semibold">No music tracks found</p>
          <p class="text-[10px] mt-1 text-neutral-600">Upload music to index local files.</p>
        </div>
      {:else}
        <div class="flex flex-col gap-2.5">
          {#each filteredTracks as track}
            <TrackCard
              {track}
              onPlay={() => playTrack(track)}
              onQueue={() => addToQueue(track)}
              onDelete={() => removeTrack(track.id)}
            />
          {/each}
        </div>
      {/if}

    {:else if activeTab === 'playlists'}
      <!-- Playlist Mode View -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">My Playlists</span>
          <button
            on:click={() => showPlaylistModal = true}
            class="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-bold rounded-lg transition-colors"
          >
            <Plus size={12} />
            <span>Create Playlist</span>
          </button>
        </div>

        {#if playlists.length === 0}
          <div class="flex flex-col items-center justify-center py-12 text-neutral-500">
            <FolderHeart size={28} class="mb-2 text-neutral-600" />
            <p class="text-xs font-semibold">No custom playlists created</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 gap-3">
            {#each playlists as plist}
              <div class="flex items-center justify-between p-4 bg-neutral-900/40 border border-neutral-800 rounded-xl hover:border-neutral-700/60 transition-colors">
                <div class="flex-1 min-w-0 pr-3">
                  <h4 class="text-sm font-semibold text-neutral-200 truncate">{plist.name}</h4>
                  <p class="text-xs text-neutral-500 mt-0.5">{plist.trackIds.length} tracks</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    on:click={() => playPlaylist(plist)}
                    class="px-3.5 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold rounded-lg hover:bg-primary hover:text-neutral-950 transition-all duration-200"
                  >
                    Play
                  </button>
                  <button
                    on:click={() => deletePlaylist(plist.id)}
                    class="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    title="Delete Playlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    {:else if activeTab === 'queue'}
      <!-- Display temporary active queue with drag to reorder / drag trigger buttons -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">Queue list</span>
          <button
            on:click={() => setQueue([])}
            class="text-[11px] font-bold text-red-400 hover:underline"
          >
            Clear All
          </button>
        </div>

        {#if $queue.length === 0}
          <div class="flex flex-col items-center justify-center py-16 text-neutral-500">
            <Layers size={32} class="mb-2 text-neutral-600" />
            <p class="text-xs font-semibold">Active queue is empty</p>
          </div>
        {:else}
          <div class="flex flex-col gap-2.5">
            {#each $queue as qTrack, idx}
              <div class="flex items-center justify-between p-3 bg-neutral-900 border {$currentQueueIndex === idx ? 'border-primary bg-primary/5' : 'border-neutral-800/80'} rounded-xl">
                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-semibold text-neutral-200 truncate">{qTrack.title || qTrack.name}</h4>
                  <p class="text-[10px] text-neutral-500 truncate">{qTrack.artist || 'Unknown Artist'}</p>
                </div>
                <div class="flex items-center gap-1.5 ml-3">
                  {#if $currentQueueIndex !== idx}
                    <button
                      on:click={() => loadAndPlayTrack(qTrack, idx)}
                      class="px-2.5 py-1 bg-neutral-800 text-neutral-300 hover:text-white text-[10px] font-bold rounded-md"
                    >
                      Play
                    </button>
                  {:else}
                    <span class="text-[10px] font-bold text-primary animate-pulse px-2">Active</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Create Playlist modal backdrop -->
  {#if showPlaylistModal}
    <div transition:fade={{ duration: 150 }} class="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
      <div transition:scale={{ duration: 150, start: 0.9 }} class="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <h3 class="text-sm font-bold text-neutral-100 mb-4">Create Playlist</h3>
        <input
          type="text"
          bind:value={newPlaylistName}
          placeholder="Playlist name..."
          class="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-primary mb-5"
        />
        <div class="flex gap-2 justify-end text-xs font-bold">
          <button
            on:click={() => showPlaylistModal = false}
            class="px-4 py-2.5 text-neutral-400 hover:bg-neutral-850 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            on:click={createPlaylist}
            class="px-4 py-2.5 bg-primary text-neutral-950 hover:bg-emerald-400 rounded-xl transition-colors"
          >
            Create Playlist
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .text-primary {
    color: var(--accent-color, #00FF66);
  }
  .bg-primary {
    background-color: var(--accent-color, #00FF66);
  }
  .border-primary {
    border-color: var(--accent-color, #00FF66);
  }
</style>
