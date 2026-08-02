import { Howl, Howler } from 'howler';
import { writable, get } from 'svelte/store';
import { eqChain } from './eqChain';
import { db } from '../db/database';

// Svelte stores for reactive playback states
export const currentTrack = writable(null);
export const isPlaying = writable(false);
export const progress = writable(0); // 0 to 100
export const duration = writable(0); // in seconds
export const currentTime = writable(0); // in seconds
export const queue = writable([]); // Array of track objects
export const currentQueueIndex = writable(-1);
export const volume = writable(0.8);
export const shuffleEnabled = writable(false);
export const repeatMode = writable('none'); // 'none', 'one', 'all'
export const crossfadeDuration = writable(0); // in seconds, default 0 (gapless)
export const volumeNormalization = writable(false); // volume normalization toggle

let activeHowl = null;
let progressInterval = null;
let originalQueue = []; // Holds the unmodified queue for toggleShuffle

// Sleep timer states
export const sleepTimerRemaining = writable(null); // seconds or null
let sleepTimerId = null;

// Initialize Web Audio source connection to Tone.js DSP
let audioConnected = false;
function connectHowlerToTone() {
  if (audioConnected) return;
  try {
    const ctx = Howler.ctx;
    if (ctx) {
      // Connect Howler master gain node to Tone.js destination/input
      const masterGain = Howler._masterGain;
      if (masterGain) {
        masterGain.disconnect();
        eqChain.connectSource(masterGain);
        audioConnected = true;
        console.log("Connected Howler Master Gain to Tone.js EQ Chain");
      }
    }
  } catch (err) {
    console.warn("Failed to connect Howler to Tone.js context, retrying on first user interaction:", err);
  }
}

// Format time utility
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Media Session API for OS integration
function updateMediaSession(track) {
  if ('mediaSession' in navigator && track) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || track.name,
      artist: track.artist || 'Unknown Artist',
      album: track.album || 'Unknown Album',
      artwork: track.coverArt ? [{ src: track.coverArt, sizes: '512x512', type: 'image/jpeg' }] : []
    });

    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime);
      }
    });
  }
}

// Main Playback controls
export async function loadAndPlayTrack(track, queueIndex = -1) {
  if (!track) return;

  // Stop current active song
  if (activeHowl) {
    // Implement crossfade if active
    const fadeMs = get(crossfadeDuration) * 1000;
    if (fadeMs > 0) {
      const existingHowl = activeHowl;
      existingHowl.fade(get(volume), 0, fadeMs);
      setTimeout(() => {
        existingHowl.stop();
        existingHowl.unload();
      }, fadeMs);
    } else {
      activeHowl.stop();
      activeHowl.unload();
    }
  }

  clearInterval(progressInterval);

  currentTrack.set(track);
  if (queueIndex !== -1) {
    currentQueueIndex.set(queueIndex);
  }

  // Create Object URL if track has blob data
  let src = track.url;
  if (track.blob) {
    src = URL.createObjectURL(track.blob);
  }

  if (!src) {
    console.error("No valid audio source found for track:", track);
    return;
  }

  // Set up Volume Normalization (Psychoacoustic volume levelling)
  let initialVol = get(volume);
  if (get(volumeNormalization)) {
    // ReplayGain/Normalization simulation: Reduce higher amplitude/size files, boost lower
    const sizeRatio = (track.size || 5000000) / 5000000;
    const factor = Math.max(0.6, Math.min(1.2, 1 / sizeRatio));
    initialVol = initialVol * factor;
  }

  activeHowl = new Howl({
    src: [src],
    format: [track.name.split('.').pop().toLowerCase()],
    html5: false, // Must be Web Audio for Tone.js integration
    volume: initialVol,
    onload: () => {
      duration.set(activeHowl.duration());
      connectHowlerToTone();
    },
    onplay: () => {
      isPlaying.set(true);
      startProgressTimer();
      updateMediaSession(track);

      // Update play count in DB
      db.tracks.update(track.id, { playCount: (track.playCount || 0) + 1 }).catch(() => {});
    },
    onpause: () => {
      isPlaying.set(false);
    },
    onstop: () => {
      isPlaying.set(false);
      progress.set(0);
      currentTime.set(0);
    },
    onend: () => {
      handleTrackEnd();
    }
  });

  // Fade in if crossfade is set
  const fadeMs = get(crossfadeDuration) * 1000;
  if (fadeMs > 0) {
    activeHowl.volume(0);
    activeHowl.play();
    activeHowl.fade(0, initialVol, fadeMs);
  } else {
    activeHowl.play();
  }
}

function startProgressTimer() {
  progressInterval = setInterval(() => {
    if (activeHowl && activeHowl.playing()) {
      const seekPos = activeHowl.seek() || 0;
      currentTime.set(seekPos);
      const totalDur = activeHowl.duration() || 1;
      progress.set((seekPos / totalDur) * 100);
    }
  }, 250);
}

function handleTrackEnd() {
  const mode = get(repeatMode);
  if (mode === 'one') {
    activeHowl.play();
  } else {
    playNext();
  }
}

export function play() {
  if (activeHowl) {
    activeHowl.play();
  } else {
    // Play first track in queue if stopped
    const q = get(queue);
    if (q.length > 0) {
      loadAndPlayTrack(q[0], 0);
    }
  }
}

export function pause() {
  if (activeHowl) {
    activeHowl.pause();
  }
}

export function stop() {
  if (activeHowl) {
    activeHowl.stop();
  }
}

export function seek(seconds) {
  if (activeHowl) {
    activeHowl.seek(seconds);
    currentTime.set(seconds);
    const dur = activeHowl.duration() || 1;
    progress.set((seconds / dur) * 100);
  }
}

export function setVolume(val) {
  volume.set(val);
  if (activeHowl) {
    activeHowl.volume(val);
  }
}

// Queue management operations
export function setQueue(trackList) {
  queue.set([...trackList]);
  originalQueue = [...trackList];
  currentQueueIndex.set(-1);
}

export function playNext() {
  const q = get(queue);
  const index = get(currentQueueIndex);
  const mode = get(repeatMode);

  if (q.length === 0) return;

  let nextIndex = index + 1;
  if (nextIndex >= q.length) {
    if (mode === 'all') {
      nextIndex = 0;
    } else {
      return; // end of queue
    }
  }

  loadAndPlayTrack(q[nextIndex], nextIndex);
}

export function playPrev() {
  const q = get(queue);
  const index = get(currentQueueIndex);

  if (q.length === 0) return;

  let prevIndex = index - 1;
  if (prevIndex < 0) {
    if (get(repeatMode) === 'all') {
      prevIndex = q.length - 1;
    } else {
      prevIndex = 0; // clamp to start
    }
  }

  loadAndPlayTrack(q[prevIndex], prevIndex);
}

export function addToQueue(track) {
  queue.update((q) => {
    const updated = [...q, track];
    originalQueue = [...originalQueue, track];
    return updated;
  });
}

export function playNextInQueue(track) {
  queue.update((q) => {
    const index = get(currentQueueIndex);
    const updated = [...q];
    updated.splice(index + 1, 0, track);
    originalQueue = [...updated];
    return updated;
  });
}

export function reorderQueue(fromIndex, toIndex) {
  queue.update((q) => {
    const updated = [...q];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);

    // Adjust current playing index
    const currIdx = get(currentQueueIndex);
    if (currIdx === fromIndex) {
      currentQueueIndex.set(toIndex);
    } else if (currIdx > fromIndex && currIdx <= toIndex) {
      currentQueueIndex.set(currIdx - 1);
    } else if (currIdx < fromIndex && currIdx >= toIndex) {
      currentQueueIndex.set(currIdx + 1);
    }

    originalQueue = [...updated];
    return updated;
  });
}

export function toggleShuffle() {
  shuffleEnabled.update((enabled) => {
    const nextEnabled = !enabled;
    if (nextEnabled) {
      // Shuffle active
      const q = [...get(queue)];
      const current = get(currentTrack);
      // Fisher-Yates shuffle
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
      }
      // Put current track first in shuffle if playing
      if (current) {
        const idx = q.findIndex(t => t.id === current.id);
        if (idx > -1) {
          q.splice(idx, 1);
          q.unshift(current);
        }
      }
      queue.set(q);
      currentQueueIndex.set(0);
    } else {
      // Restore original queue order
      queue.set([...originalQueue]);
      const current = get(currentTrack);
      if (current) {
        const idx = originalQueue.findIndex(t => t.id === current.id);
        currentQueueIndex.set(idx);
      }
    }
    return nextEnabled;
  });
}

// Sleep Timer with Psychoacoustic Fade Out and Engine Shutdown
export function setSleepTimer(minutes) {
  clearSleepTimer();
  if (minutes === null) return;

  let secondsRemaining = minutes * 60;
  sleepTimerRemaining.set(secondsRemaining);

  sleepTimerId = setInterval(() => {
    secondsRemaining--;
    sleepTimerRemaining.set(secondsRemaining);

    // Psychoacoustic fade out in the last 15 seconds
    if (secondsRemaining <= 15 && secondsRemaining > 0 && activeHowl) {
      const volNow = get(volume);
      const targetVol = 0;
      activeHowl.fade(volNow, targetVol, secondsRemaining * 1000);
    }

    if (secondsRemaining <= 0) {
      triggerSleepShutdown();
    }
  }, 1000);
}

export function setSleepTimerOnTrackEnd() {
  clearSleepTimer();
  // We can track the state or listen to track end events
  sleepTimerRemaining.set("track-end");
}

export function clearSleepTimer() {
  if (sleepTimerId) {
    clearInterval(sleepTimerId);
    sleepTimerId = null;
  }
  sleepTimerRemaining.set(null);
}

function triggerSleepShutdown() {
  clearSleepTimer();
  stop();

  // DSP & Engine Shutdown to conserve battery/RAM
  try {
    const ctx = Howler.ctx;
    if (ctx && ctx.state !== 'suspended') {
      ctx.suspend();
    }
  } catch (err) {
    console.error("Failed to suspend AudioContext on sleep timer end:", err);
  }

  // Stop progress interval
  clearInterval(progressInterval);
}
