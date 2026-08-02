<script>
  import { eqChain } from '../dsp/eqChain';

  export let index;
  export let label;
  export let gain = 0;
  export let onChange = () => {};

  function handleInput(e) {
    const val = parseFloat(e.target.value);
    gain = val;
    eqChain.setBandGain(index, val);
    onChange(index, val);
  }
</script>

<div class="flex flex-col items-center h-full min-w-[34px] bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-2 py-4 shadow-sm hover:border-neutral-700/60 transition-colors duration-200">
  <!-- Value representation -->
  <span class="text-[10px] font-mono font-medium tracking-tight text-neutral-400 mb-2">
    {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}dB
  </span>

  <!-- Vertical slider tracker -->
  <div class="relative flex-1 flex items-center justify-center my-3 w-4">
    <input
      type="range"
      min="-12"
      max="12"
      step="1"
      value={gain}
      on:input={handleInput}
      class="slider-vertical w-1.5 h-full rounded-full cursor-pointer appearance-none bg-neutral-800 accent-primary focus:outline-none"
      style="writing-mode: bt-lr; -webkit-appearance: slider-vertical;"
    />
  </div>

  <!-- Label of the frequency band -->
  <span class="text-[9px] font-bold tracking-widest text-neutral-500 uppercase mt-2">
    {label}
  </span>
</div>

<style>
  /* Vertical input sliders layout specs */
  .slider-vertical::-webkit-slider-runnable-track {
    background: #1f1f1f;
    border-radius: 9999px;
    width: 6px;
  }
  .slider-vertical::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: var(--accent-color, #00FF66);
    box-shadow: 0 0 8px var(--accent-color, #00FF66);
    cursor: pointer;
    margin-top: -4px;
    transition: transform 0.1s;
  }
  .slider-vertical::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
</style>
