<script>
  import { onMount, onDestroy } from 'svelte';
  import { eqChain } from '../dsp/eqChain';
  import { db } from '../db/database';

  let canvasElement;
  let animationId;
  let customRenderer = null;
  let analyser = eqChain.getAnalyser();
  let isVisible = true;

  function handleVisibilityChange() {
    isVisible = document.visibilityState === 'visible';
    if (isVisible) {
      cancelAnimationFrame(animationId);
      draw();
    } else {
      cancelAnimationFrame(animationId);
    }
  }

  // Load selected custom visualizer from IndexedDB
  async function loadSelectedVisualizer() {
    try {
      const selected = await db.visualizers.where('isSelected').equals(1).first();
      if (selected && selected.codeString) {
        // Safe evaluation / Dynamic loading wrapper for Custom JS render script contracts
        const dataUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(selected.codeString);
        const module = await import(/* @vite-ignore */ dataUri);
        if (typeof module.renderVisualizer === 'function') {
          customRenderer = module.renderVisualizer;
        } else {
          customRenderer = null;
        }
      } else {
        customRenderer = null;
      }
    } catch (err) {
      console.warn("Failed to dynamically load custom visualizer:", err);
      customRenderer = null;
    }
  }

  // Draw loop
  function draw() {
    if (!isVisible) return;
    animationId = requestAnimationFrame(draw);

    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const width = canvasElement.width;
    const height = canvasElement.height;

    // Retrieve FFT byte frequency data from Tone.Analyser
    const frequencyData = analyser.getValue();

    // Map float array from Tone.js Analyser to standard 0-255 frequency scale
    const byteData = Array.from(frequencyData).map(v => {
      // Convert typical dB decibels to 0-255 amplitude scale
      const dbVal = isFinite(v) ? v : -140;
      return Math.max(0, Math.min(255, Math.floor((dbVal + 140) * 2)));
    });

    if (customRenderer) {
      try {
        customRenderer(ctx, width, height, byteData);
      } catch (err) {
        console.error("Error running custom visualizer renderer script:", err);
        drawFallback(ctx, width, height, byteData);
      }
    } else {
      drawFallback(ctx, width, height, byteData);
    }
  }

  // Default Fallback Visualizer (Premium modern aesthetic wave)
  function drawFallback(ctx, width, height, data) {
    ctx.fillStyle = 'rgba(15, 15, 15, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Linear gradient for standard Electric Neon wave
    const grad = ctx.createLinearGradient(0, height, 0, 0);
    grad.addColorStop(0, '#101010');
    grad.addColorStop(0.5, 'rgba(0, 255, 102, 0.4)');
    grad.addColorStop(1, '#00FF66');

    ctx.fillStyle = grad;

    const barWidth = (width / data.length) * 1.5;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const amplitude = data[i] || 0;
      const barHeight = (amplitude / 255) * height * 0.8;

      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
  }

  // Handle Resize
  function resizeCanvas() {
    if (canvasElement) {
      const rect = canvasElement.parentElement.getBoundingClientRect();
      canvasElement.width = rect.width * window.devicePixelRatio;
      canvasElement.height = rect.height * window.devicePixelRatio;
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    }
  }

  onMount(async () => {
    await loadSelectedVisualizer();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    draw();
  });

  onDestroy(() => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resizeCanvas);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
</script>

<div class="relative w-full h-full bg-neutral-950 overflow-hidden rounded-2xl border border-neutral-800 shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]">
  <canvas bind:this={canvasElement} class="w-full h-full block" />
</div>
