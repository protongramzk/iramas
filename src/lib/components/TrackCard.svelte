<script>
  import { Play, Plus, Trash2, Heart, Check } from 'lucide-svelte';
  import { db } from '../db/database';

  export let track;
  export let onPlay = () => {};
  export let onQueue = () => {};
  export let onDelete = null;

  let isFavorite = track.isFavorite === 1;

  async function toggleFavorite() {
    isFavorite = !isFavorite;
    const val = isFavorite ? 1 : 0;
    await db.tracks.update(track.id, { isFavorite: val });
    track.isFavorite = val;
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const dm = 1;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
</script>

<div class="group flex items-center justify-between p-3.5 bg-neutral-900/40 hover:bg-neutral-800/60 border border-neutral-800/50 hover:border-neutral-700/60 rounded-xl transition-all duration-300">
  <div class="flex items-center gap-4 flex-1 min-w-0">
    <div class="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0 flex items-center justify-center border border-neutral-700/50">
      {#if track.coverArt}
        <img src={track.coverArt} alt="Cover" class="w-full h-full object-cover" />
      {:else}
        <span class="text-neutral-500 font-bold text-xs uppercase">{track.artist?.slice(0, 2) || 'IR'}</span>
      {/if}
      <button
        on:click={onPlay}
        class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200"
      >
        <Play size={18} class="text-primary fill-primary" />
      </button>
    </div>

    <div class="flex-1 min-w-0">
      <h4 class="text-sm font-semibold text-neutral-100 truncate group-hover:text-primary transition-colors duration-200">
        {track.title || track.name}
      </h4>
      <p class="text-xs text-neutral-400 truncate mt-0.5">
        {track.artist || 'Unknown Artist'} • {track.album || 'Unknown Album'}
      </p>
      <div class="flex gap-2 items-center mt-1 text-[10px] text-neutral-500">
        <span>{formatBytes(track.size)}</span>
        {#if track.playCount > 0}
          <span>• {track.playCount} plays</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="flex items-center gap-1.5 ml-3">
    <button
      on:click={toggleFavorite}
      class="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-800 rounded-lg transition-all duration-200"
      title="Toggle Favorite"
    >
      <Heart size={16} class={isFavorite ? 'fill-red-500 text-red-500' : ''} />
    </button>

    <button
      on:click={onQueue}
      class="p-2 text-neutral-400 hover:text-primary hover:bg-neutral-800 rounded-lg transition-all duration-200"
      title="Add to Queue"
    >
      <Plus size={16} />
    </button>

    {#if onDelete}
      <button
        on:click={onDelete}
        class="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-all duration-200"
        title="Remove"
      >
        <Trash2 size={16} />
      </button>
    {/if}
  </div>
</div>

<style>
  .text-primary {
    color: var(--accent-color, #00FF66);
  }
  .fill-primary {
    fill: var(--accent-color, #00FF66);
  }
</style>
