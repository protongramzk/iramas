<script>
  import { onMount, onDestroy } from 'svelte';
  import {
    currentTrack, isPlaying, progress, duration, currentTime,
    play, pause, stop, seek, setVolume, volume, playNext, playPrev,
    shuffleEnabled, repeatMode, toggleShuffle, formatTime, sleepTimerRemaining,
    clearSleepTimer, setSleepTimer
  } from '../lib/dsp/audioCore';
  import VisualizerCanvas from '../lib/components/VisualizerCanvas.svelte';
  import {
    Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Moon, Clock
  } from 'lucide-svelte';

  let volumeVal = $volume;
  let showTimerSelect = false;

  function handleVolume(e) {
    const val = parseFloat(e.target.value);
    volumeVal = val;
    setVolume(val);
  }

  function handleSeek(e) {
    const pct = parseFloat(e.target.value);
    const target = (pct / 100) * $duration;
    seek(target);
  }

  function toggleRepeat() {
    repeatMode.update((mode) => {
      if (mode === 'none') return 'all';
      if (mode === 'all') return 'one';
      return 'none';
    });
  }

  function setTimer(minutes) {
    setSleepTimer(minutes);
    showTimerSelect = false;
  }
</script>

<div class="flex flex-col h-full bg-neutral-950 text-neutral-100 p-6 pb-24 overflow-y-auto">
  <!-- Top bar header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex flex-col">
      <h2 class="text-xl font-bold tracking-tight text-neutral-100">Now Playing</h2>
      <p class="text-xs text-neutral-400 mt-0.5">Iramas Audio Suite</p>
    </div>

    <div class="relative">
      <button
        on:click={() => showTimerSelect = !showTimerSelect}
        class="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:border-neutral-700/80 hover:text-primary transition-all duration-200"
      >
        <Moon size={14} class={$sleepTimerRemaining ? 'text-primary animate-pulse' : ''} />
        <span>
          {$sleepTimerRemaining
            ? (typeof $sleepTimerRemaining === 'number' ? `${Math.ceil($sleepTimerRemaining / 60)}m left` : 'Track End')
            : 'Sleep Timer'
          }
        </span>
      </button>

      {#if showTimerSelect}
        <div class="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-1">
          <button on:click={() => setTimer(15)} class="px-3 py-2 text-left text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors">15 Minutes</button>
          <button on:click={() => setTimer(30)} class="px-3 py-2 text-left text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors">30 Minutes</button>
          <button on:click={() => setTimer(45)} class="px-3 py-2 text-left text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors">45 Minutes</button>
          <button on:click={() => setTimer(60)} class="px-3 py-2 text-left text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors">60 Minutes</button>
          {#if $sleepTimerRemaining}
            <button on:click={() => setTimer(null)} class="px-3 py-2 text-left text-xs text-red-400 hover:bg-neutral-800 rounded-lg transition-colors">Cancel Timer</button>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Visualizer Core Panel -->
  <div class="flex-1 min-h-[180px] max-h-[300px] mb-6">
    <VisualizerCanvas />
  </div>

  <!-- Artwork Container + Track Meta -->
  <div class="flex items-center gap-5 mb-8">
    <div class="w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/80 flex-shrink-0 shadow-lg flex items-center justify-center">
      {#if $currentTrack && $currentTrack.coverArt}
        <img src={$currentTrack.coverArt} alt="Artwork" class="w-full h-full object-cover" />
      {:else}
        <div class="w-full h-full bg-gradient-to-tr from-neutral-900 to-neutral-800 flex items-center justify-center text-primary font-black text-lg tracking-wider">
          IR
        </div>
      {/if}
    </div>

    <!-- Scrolling Marquee Metadata -->
    <div class="flex-1 min-w-0">
      <div class="relative overflow-hidden w-full h-6">
        {#if $currentTrack}
          <div class="text-lg font-bold text-neutral-100 whitespace-nowrap marquee-text">
            {$currentTrack.title || $currentTrack.name}
          </div>
        {:else}
          <div class="text-lg font-bold text-neutral-500">No song playing</div>
        {/if}
      </div>
      <p class="text-sm text-neutral-400 mt-0.5 truncate">
        {$currentTrack ? ($currentTrack.artist || 'Unknown Artist') : 'Scan directory in Library'}
      </p>
    </div>
  </div>

  <!-- Progress Bar Scrubber -->
  <div class="mb-8">
    <div class="flex items-center justify-between text-[11px] font-mono font-medium text-neutral-400 mb-2">
      <span>{formatTime($currentTime)}</span>
      <span>{formatTime($duration)}</span>
    </div>
    <div class="relative group w-full h-1.5 bg-neutral-900 rounded-full cursor-pointer">
      <input
        type="range"
        min="0"
        max="100"
        value={$progress}
        on:input={handleSeek}
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <!-- Active slider track highlight -->
      <div class="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,102,0.8)]" style="width: {$progress}%"></div>
    </div>
  </div>

  <!-- Transport Controllers -->
  <div class="flex items-center justify-between mb-8">
    <button
      on:click={toggleShuffle}
      class="p-2.5 text-neutral-400 hover:text-white transition-all duration-200"
      title="Shuffle"
    >
      <Shuffle size={18} class={$shuffleEnabled ? 'text-primary stroke-[2.5px] drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]' : ''} />
    </button>

    <div class="flex items-center gap-6">
      <button
        on:click={playPrev}
        class="p-3 text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-850 rounded-full transition-all duration-200"
      >
        <SkipBack size={20} class="fill-neutral-300" />
      </button>

      {#if $isPlaying}
        <button
          on:click={pause}
          class="p-4.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-full shadow-xl transition-transform duration-200 hover:scale-105"
        >
          <Pause size={24} class="fill-neutral-950 text-neutral-950" />
        </button>
      {:else}
        <button
          on:click={play}
          class="p-4.5 bg-primary hover:bg-emerald-400 text-neutral-950 rounded-full shadow-lg shadow-emerald-950/40 transition-transform duration-200 hover:scale-105"
        >
          <Play size={24} class="fill-neutral-950 text-neutral-950 ml-0.5" />
        </button>
      {/if}

      <button
        on:click={playNext}
        class="p-3 text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-850 rounded-full transition-all duration-200"
      >
        <SkipForward size={20} class="fill-neutral-300" />
      </button>
    </div>

    <button
      on:click={toggleRepeat}
      class="p-2.5 text-neutral-400 hover:text-white transition-all duration-200"
      title="Repeat Mode"
    >
      <Repeat size={18} class={$repeatMode !== 'none' ? 'text-primary stroke-[2.5px] drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]' : ''} />
      {#if $repeatMode === 'one'}
        <span class="absolute text-[8px] font-black text-primary bg-neutral-900 border border-neutral-800 px-1 rounded-full -mt-2 -ml-1">1</span>
      {/if}
    </button>
  </div>

  <!-- Master Volume Rail -->
  <div class="flex items-center gap-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4">
    <Volume2 size={16} class="text-neutral-400 flex-shrink-0" />
    <div class="relative flex-1 h-1.5 bg-neutral-850 rounded-full">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volumeVal}
        on:input={handleVolume}
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <!-- Vol track highlight -->
      <div class="absolute top-0 left-0 h-full bg-primary rounded-full" style="width: {volumeVal * 100}%"></div>
    </div>
  </div>
</div>

<style>
  .text-primary {
    color: var(--accent-color, #00FF66);
  }
  .bg-primary {
    background-color: var(--accent-color, #00FF66);
  }
</style>
