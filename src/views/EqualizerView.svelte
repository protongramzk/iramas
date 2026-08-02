<script>
  import { onMount } from 'svelte';
  import { eqChain } from '../lib/dsp/eqChain';
  import { db } from '../lib/db/database';
  import EqSlider from '../lib/components/EqSlider.svelte';
  import { Power, Save, Trash2, Check } from 'lucide-svelte';

  let isEnabled = eqChain.isPowered();
  let preampVal = eqChain.getPreamp();
  let bandGains = eqChain.getBandGains();
  let presets = [];
  let selectedPresetId = null;
  let customPresetName = '';
  let showSaveModal = false;

  const frequencies = [
    { label: '31Hz', index: 0 },
    { label: '62Hz', index: 1 },
    { label: '125Hz', index: 2 },
    { label: '250Hz', index: 3 },
    { label: '500Hz', index: 4 },
    { label: '1kHz', index: 5 },
    { label: '2kHz', index: 6 },
    { label: '4kHz', index: 7 },
    { label: '8kHz', index: 8 },
    { label: '16kHz', index: 9 }
  ];

  async function loadPresets() {
    presets = await db.eqPresets.toArray();
  }

  function togglePower() {
    isEnabled = !isEnabled;
    eqChain.toggleEqPower(isEnabled);
  }

  function handlePreamp(e) {
    const val = parseFloat(e.target.value);
    preampVal = val;
    eqChain.setPreamp(val);
  }

  function handleBandChange(index, value) {
    bandGains[index] = value;
    bandGains = [...bandGains];
    selectedPresetId = null; // Mark manual tuning
  }

  async function selectPreset(preset) {
    selectedPresetId = preset.id;
    bandGains = [...preset.gains];
    bandGains.forEach((g, idx) => {
      eqChain.setBandGain(idx, g);
    });
  }

  async function savePreset() {
    if (!customPresetName.trim()) return;

    const newPreset = {
      name: customPresetName.trim(),
      gains: [...bandGains],
      isDefault: 0
    };

    const id = await db.eqPresets.add(newPreset);
    await loadPresets();
    selectedPresetId = id;
    customPresetName = '';
    showSaveModal = false;
  }

  async function deletePreset(id, e) {
    e.stopPropagation();
    await db.eqPresets.delete(id);
    await loadPresets();
    if (selectedPresetId === id) {
      selectedPresetId = null;
    }
  }

  onMount(async () => {
    await loadPresets();
  });
</script>

<div class="flex flex-col h-full bg-neutral-950 text-neutral-100 p-6 pb-24 overflow-y-auto">
  <!-- Equalizer header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex flex-col">
      <h2 class="text-xl font-bold tracking-tight text-neutral-100">Equalizer Room</h2>
      <p class="text-xs text-neutral-400 mt-0.5">High-Precision Sound Enhancer</p>
    </div>

    <!-- Power Toggle -->
    <button
      on:click={togglePower}
      class="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-300 {isEnabled ? 'bg-primary/10 border-primary text-primary shadow-[0_0_12px_rgba(0,255,102,0.2)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}"
    >
      <Power size={14} />
      <span>{isEnabled ? 'DSP ON' : 'DSP BYPASS'}</span>
    </button>
  </div>

  <!-- Master Preamp Section -->
  <div class="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 mb-6">
    <div class="flex items-center justify-between mb-3 text-xs">
      <span class="font-bold tracking-widest text-neutral-400 uppercase">Preamp Gain Boost</span>
      <span class="font-mono font-medium text-primary">{(preampVal * 100).toFixed(0)}%</span>
    </div>
    <div class="relative w-full h-1.5 bg-neutral-850 rounded-full">
      <input
        type="range"
        min="0"
        max="2"
        step="0.05"
        value={preampVal}
        on:input={handlePreamp}
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={!isEnabled}
      />
      <div class="absolute top-0 left-0 h-full bg-primary rounded-full" style="width: {(preampVal / 2) * 100}%"></div>
    </div>
  </div>

  <!-- 10-Band Graphic Equalizer Faders -->
  <div class="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-4 mb-6">
    <div class="flex justify-between items-center overflow-x-auto gap-2 py-2 h-[220px]">
      {#each frequencies as freq}
        <EqSlider
          index={freq.index}
          label={freq.label}
          gain={bandGains[freq.index] || 0}
          onChange={handleBandChange}
        />
      {/each}
    </div>
  </div>

  <!-- Presets List & Save Config -->
  <div class="flex-1">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold tracking-wider text-neutral-400 uppercase">Acoustic Presets</h3>
      <button
        on:click={() => showSaveModal = true}
        class="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
      >
        <Save size={12} />
        <span>Save New</span>
      </button>
    </div>

    <!-- Scrollable Presets Box -->
    <div class="grid grid-cols-2 gap-2.5">
      {#each presets as preset}
        <div
          on:click={() => selectPreset(preset)}
          class="flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all duration-200 {selectedPresetId === preset.id ? 'bg-primary/5 border-primary text-primary' : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700/80 text-neutral-300'}"
        >
          <div class="flex items-center gap-2 truncate">
            {#if selectedPresetId === preset.id}
              <Check size={14} class="text-primary flex-shrink-0" />
            {/if}
            <span class="truncate">{preset.name}</span>
          </div>
          {#if preset.isDefault !== 1}
            <button
              on:click={(e) => deletePreset(preset.id, e)}
              class="text-neutral-500 hover:text-red-400 p-1 rounded-lg transition-colors"
              title="Delete preset"
            >
              <Trash2 size={12} />
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Modal backdrop -->
  {#if showSaveModal}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
      <div class="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <h3 class="text-sm font-bold text-neutral-100 mb-4">Save EQ Preset</h3>
        <input
          type="text"
          bind:value={customPresetName}
          placeholder="e.g. Smooth Acoustic"
          class="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-5"
        />
        <div class="flex gap-2 justify-end text-xs font-bold">
          <button
            on:click={() => showSaveModal = false}
            class="px-4 py-2.5 text-neutral-400 hover:bg-neutral-850 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            on:click={savePreset}
            class="px-4 py-2.5 bg-primary text-neutral-950 hover:bg-emerald-400 rounded-xl transition-colors"
          >
            Save Preset
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
