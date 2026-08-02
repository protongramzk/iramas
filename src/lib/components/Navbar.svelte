<script>
  import { Music, Sliders, FolderHeart, Settings } from 'lucide-svelte';

  export let activeView = 'player';
  export let onViewChange = () => {};

  const items = [
    { id: 'player', name: 'Player', icon: Music },
    { id: 'equalizer', name: 'Equalizer', icon: Sliders },
    { id: 'library', name: 'Library', icon: FolderHeart },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];
</script>

<div class="fixed bottom-0 left-0 right-0 h-16 bg-neutral-900 border-t border-neutral-800 flex justify-around items-center px-4 pb-safe z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.8)]">
  {#each items as item}
    <button
      on:click={() => onViewChange(item.id)}
      class="flex flex-col items-center justify-center w-16 h-full transition-all duration-200 {activeView === item.id ? 'text-primary' : 'text-neutral-400 hover:text-neutral-200'}"
    >
      <svelte:component this={item.icon} size={22} class="mb-1 {activeView === item.id ? 'stroke-[2.5px] drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]' : 'stroke-[2px]'}" />
      <span class="text-[10px] tracking-wide font-medium">{item.name}</span>
    </button>
  {/each}
</div>

<style>
  /* Safe-area insets for modern mobile PWA screens */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .text-primary {
    color: var(--accent-color, #00FF66);
  }
</style>
