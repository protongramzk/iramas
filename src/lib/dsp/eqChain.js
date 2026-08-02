import * as Tone from 'tone';

// State to track if EQ module is powered on
let isEqOn = true;

// Create EQ 10 bands
const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const filters = frequencies.map((freq) => {
  return new Tone.Filter({
    type: 'peaking',
    frequency: freq,
    Q: 1.4, // Standard graphic EQ Q factor
    gain: 0
  });
});

// Preamp Gain Node
const preamp = new Tone.Gain(1.0);

// Compressor for dynamic range control
const compressor = new Tone.Compressor({
  threshold: -24,
  ratio: 4,
  attack: 0.03,
  release: 0.08
});

// Limiter to prevent clipping (0 dBFS max)
const limiter = new Tone.Limiter(0);

// Analyser for real-time FFT visualization
const analyser = new Tone.Analyser({
  type: 'fft',
  size: 256
});

// Connect nodes together in a chain
// Source (from Howler/AudioContext) -> Filters (EQ) -> Preamp -> Compressor -> Limiter -> Analyser -> Destination
function buildChain() {
  // Disconnect existing if any
  preamp.disconnect();
  compressor.disconnect();
  limiter.disconnect();
  analyser.disconnect();
  filters.forEach(f => f.disconnect());

  if (isEqOn) {
    // Chain: Filters in sequence, then preamp, compressor, limiter, analyser, destination
    let lastNode = filters[0];
    for (let i = 1; i < filters.length; i++) {
      lastNode.connect(filters[i]);
      lastNode = filters[i];
    }
    lastNode.connect(preamp);
  } else {
    // Bypass filters, connect preamp directly
    preamp.connect(compressor);
  }

  preamp.connect(compressor);
  compressor.connect(limiter);
  limiter.connect(analyser);
  analyser.toDestination();
}

// Initialize chain on load
buildChain();

export const eqChain = {
  getAnalyser() {
    return analyser;
  },

  setPreamp(gainValue) {
    // gainValue normally between 0.0 and 2.0
    preamp.gain.value = gainValue;
  },

  getPreamp() {
    return preamp.gain.value;
  },

  setBandGain(index, gainDb) {
    if (filters[index]) {
      filters[index].gain.value = gainDb;
    }
  },

  getBandGains() {
    return filters.map(f => f.gain.value);
  },

  toggleEqPower(enabled) {
    isEqOn = enabled;
    buildChain();
  },

  isPowered() {
    return isEqOn;
  },

  // Audio source hook-in for external playback contexts
  connectSource(audioNode) {
    if (isEqOn) {
      audioNode.connect(filters[0]);
    } else {
      audioNode.connect(preamp);
    }
  }
};
