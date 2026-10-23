"use client";

// BGM Chiptune Melancólico: "Fallen Down" de Undertale (Toby Fox)
// Síntesis Web Audio API en tiempo real de alta fidelidad (0 KB de descarga).
// Timbre: Celesta / Music Box cálido con arpegios nostálgicos y eco de caverna (Ruins).

import { isMuted } from "@/components/fx";

let sharedAudioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let delayNode: DelayNode | null = null;
let delayGainNode: GainNode | null = null;
let delayFilterNode: BiquadFilterNode | null = null;
let masterFilterNode: BiquadFilterNode | null = null;

let isPlaying = false;
let loopTimeout: ReturnType<typeof setTimeout> | null = null;
let activeOscillators: OscillatorNode[] = [];

const BPM = 110;
const BEAT_SEC = 60 / BPM; // ~0.54545s por pulso
const TOTAL_BEATS = 48; // 16 compases
const TOTAL_DURATION = TOTAL_BEATS * BEAT_SEC; // ~26.18s

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  return sharedAudioCtx;
}

function setupAudioGraph(ctx: AudioContext) {
  if (bgmMasterGain) return;

  masterFilterNode = ctx.createBiquadFilter();
  masterFilterNode.type = "lowpass";
  masterFilterNode.frequency.setValueAtTime(4000, ctx.currentTime);

  bgmMasterGain = ctx.createGain();
  bgmMasterGain.gain.setValueAtTime(0.22, ctx.currentTime);

  delayNode = ctx.createDelay();
  delayNode.delayTime.setValueAtTime(BEAT_SEC * 0.5, ctx.currentTime);

  delayFilterNode = ctx.createBiquadFilter();
  delayFilterNode.type = "lowpass";
  delayFilterNode.frequency.setValueAtTime(1400, ctx.currentTime);

  delayGainNode = ctx.createGain();
  delayGainNode.gain.setValueAtTime(0.28, ctx.currentTime);

  delayNode.connect(delayFilterNode);
  delayFilterNode.connect(delayGainNode);
  delayGainNode.connect(delayNode);

  bgmMasterGain.connect(masterFilterNode);
  masterFilterNode.connect(ctx.destination);

  delayFilterNode.connect(masterFilterNode);
}

const LEAD_NOTES: [number, number, number][] = [[0.0, 0.5, 739.99], [0.5, 0.5, 554.37], [1.0, 0.5, 739.99], [1.5, 0.5, 554.37], [2.0, 0.5, 739.99], [2.5, 0.5, 554.37], [3.0, 0.5, 739.99], [3.5, 0.5, 554.37], [4.0, 0.5, 739.99], [4.5, 0.5, 554.37], [5.0, 0.5, 739.99], [5.5, 0.5, 554.37], [6.0, 0.5, 493.88], [6.5, 0.5, 440.0], [7.0, 1.0, 554.37], [8.0, 0.5, 440.0], [8.5, 0.5, 493.88], [9.0, 0.5, 659.26], [9.5, 0.5, 622.25], [10.0, 0.5, 659.26], [10.5, 0.5, 739.99], [11.0, 0.5, 622.25], [11.5, 0.5, 493.88], [12.0, 0.5, 739.99], [12.5, 0.5, 493.88], [13.0, 0.5, 739.99], [13.5, 0.5, 493.88], [14.0, 0.5, 739.99], [14.5, 0.5, 493.88], [15.0, 0.5, 739.99], [15.5, 0.5, 466.16], [16.0, 0.5, 739.99], [16.5, 0.5, 466.16], [17.0, 1.0, 783.99], [18.0, 0.5, 739.99], [18.5, 0.5, 587.33], [19.0, 0.5, 739.99], [19.5, 0.5, 587.33], [20.0, 0.5, 659.26], [20.5, 0.5, 739.99], [21.0, 1.0, 659.26], [22.0, 1.0, 587.33], [23.0, 1.0, 554.37], [24.0, 0.5, 739.99], [24.5, 0.5, 554.37], [25.0, 0.5, 739.99], [25.5, 0.5, 554.37], [26.0, 0.5, 739.99], [26.5, 0.5, 554.37], [27.0, 0.5, 739.99], [27.5, 0.5, 554.37], [28.0, 0.5, 739.99], [28.5, 0.5, 554.37], [29.0, 0.5, 739.99], [29.5, 0.5, 554.37], [30.0, 0.5, 493.88], [30.5, 0.5, 440.0], [31.0, 1.0, 554.37], [32.0, 0.5, 440.0], [32.5, 0.5, 493.88], [33.0, 0.5, 659.26], [33.5, 0.5, 622.25], [34.0, 0.5, 659.26], [34.5, 0.5, 739.99], [35.0, 0.5, 622.25], [35.5, 0.5, 493.88], [36.0, 0.5, 739.99], [36.5, 0.5, 493.88], [37.0, 0.5, 739.99], [37.5, 0.5, 493.88], [38.0, 0.5, 739.99], [38.5, 0.5, 493.88], [39.0, 0.5, 739.99], [39.5, 0.5, 466.16], [40.0, 0.5, 739.99], [40.5, 0.5, 466.16], [41.0, 1.0, 783.99], [42.0, 0.5, 739.99], [42.5, 0.5, 587.33], [43.0, 0.5, 739.99], [43.5, 0.5, 587.33], [44.0, 0.5, 659.26], [44.5, 0.5, 739.99], [45.0, 1.0, 659.26], [46.0, 1.0, 587.33], [47.0, 1.0, 554.37]];
const ARP_NOTES: [number, number, number][] = [[0.0, 0.5, 293.66], [0.5, 0.5, 369.99], [1.0, 0.5, 440.0], [1.5, 0.5, 369.99], [2.0, 0.5, 440.0], [2.5, 0.5, 369.99], [3.0, 0.5, 293.66], [3.5, 0.5, 369.99], [4.0, 0.5, 440.0], [4.5, 0.5, 369.99], [5.0, 0.5, 440.0], [5.5, 0.5, 369.99], [6.0, 0.5, 246.94], [6.5, 0.5, 311.13], [7.0, 0.5, 369.99], [7.5, 0.5, 311.13], [8.0, 0.5, 369.99], [8.5, 0.5, 311.13], [9.0, 0.5, 246.94], [9.5, 0.5, 311.13], [10.0, 0.5, 369.99], [10.5, 0.5, 311.13], [11.0, 0.5, 369.99], [11.5, 0.5, 311.13], [12.0, 0.5, 196.0], [12.5, 0.5, 246.94], [13.0, 0.5, 293.66], [13.5, 0.5, 246.94], [14.0, 0.5, 293.66], [14.5, 0.5, 246.94], [15.0, 0.5, 196.0], [15.5, 0.5, 233.08], [16.0, 0.5, 293.66], [16.5, 0.5, 233.08], [17.0, 0.5, 293.66], [17.5, 0.5, 233.08], [18.0, 0.5, 293.66], [18.5, 0.5, 369.99], [19.0, 0.5, 440.0], [19.5, 0.5, 369.99], [20.0, 0.5, 440.0], [20.5, 0.5, 369.99], [21.0, 0.5, 277.18], [21.5, 0.5, 329.63], [22.0, 0.5, 440.0], [22.5, 0.5, 329.63], [23.0, 0.5, 440.0], [23.5, 0.5, 329.63], [24.0, 0.5, 293.66], [24.5, 0.5, 369.99], [25.0, 0.5, 440.0], [25.5, 0.5, 369.99], [26.0, 0.5, 440.0], [26.5, 0.5, 369.99], [27.0, 0.5, 293.66], [27.5, 0.5, 369.99], [28.0, 0.5, 440.0], [28.5, 0.5, 369.99], [29.0, 0.5, 440.0], [29.5, 0.5, 369.99], [30.0, 0.5, 246.94], [30.5, 0.5, 311.13], [31.0, 0.5, 369.99], [31.5, 0.5, 311.13], [32.0, 0.5, 369.99], [32.5, 0.5, 311.13], [33.0, 0.5, 246.94], [33.5, 0.5, 311.13], [34.0, 0.5, 369.99], [34.5, 0.5, 311.13], [35.0, 0.5, 369.99], [35.5, 0.5, 311.13], [36.0, 0.5, 196.0], [36.5, 0.5, 246.94], [37.0, 0.5, 293.66], [37.5, 0.5, 246.94], [38.0, 0.5, 293.66], [38.5, 0.5, 246.94], [39.0, 0.5, 196.0], [39.5, 0.5, 233.08], [40.0, 0.5, 293.66], [40.5, 0.5, 233.08], [41.0, 0.5, 293.66], [41.5, 0.5, 233.08], [42.0, 0.5, 293.66], [42.5, 0.5, 369.99], [43.0, 0.5, 440.0], [43.5, 0.5, 369.99], [44.0, 0.5, 440.0], [44.5, 0.5, 369.99], [45.0, 0.5, 277.18], [45.5, 0.5, 329.63], [46.0, 0.5, 440.0], [46.5, 0.5, 329.63], [47.0, 0.5, 440.0], [47.5, 0.5, 329.63]];
const BASS_NOTES: [number, number, number][] = [[0.0, 2.7, 146.83], [3.0, 2.7, 146.83], [6.0, 2.7, 123.47], [9.0, 2.7, 123.47], [12.0, 2.7, 98.0], [15.0, 2.7, 98.0], [18.0, 2.7, 146.83], [21.0, 2.7, 110.0], [24.0, 2.7, 146.83], [27.0, 2.7, 146.83], [30.0, 2.7, 123.47], [33.0, 2.7, 123.47], [36.0, 2.7, 98.0], [39.0, 2.7, 98.0], [42.0, 2.7, 146.83], [45.0, 2.7, 110.0]];

function playLeadNote(
  ctx: AudioContext,
  dest: AudioNode,
  echoDest: AudioNode | null,
  startTime: number,
  durationSec: number,
  freq: number
) {
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(freq, startTime);

  gain1.gain.setValueAtTime(0.0001, startTime);
  gain1.gain.linearRampToValueAtTime(0.09, startTime + 0.015);
  gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.35);

  osc1.connect(gain1);
  gain1.connect(dest);
  if (echoDest) gain1.connect(echoDest);

  osc1.start(startTime);
  osc1.stop(startTime + durationSec + 0.4);
  activeOscillators.push(osc1);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  gain2.gain.setValueAtTime(0.0001, startTime);
  gain2.gain.linearRampToValueAtTime(0.035, startTime + 0.008);
  gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

  osc2.connect(gain2);
  gain2.connect(dest);
  if (echoDest) gain2.connect(echoDest);

  osc2.start(startTime);
  osc2.stop(startTime + 0.22);
  activeOscillators.push(osc2);
}

function playArpNote(
  ctx: AudioContext,
  dest: AudioNode,
  startTime: number,
  durationSec: number,
  freq: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.038, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(durationSec, 0.55));

  osc.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + Math.max(durationSec, 0.55) + 0.05);
  activeOscillators.push(osc);
}

function playBassNote(
  ctx: AudioContext,
  dest: AudioNode,
  startTime: number,
  durationSec: number,
  freq: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.045, startTime + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.05);
  activeOscillators.push(osc);
}

function scheduleLoop(ctx: AudioContext, startAt: number) {
  if (!isPlaying || !bgmMasterGain) return;

  for (const [beat, dur, freq] of LEAD_NOTES) {
    const noteStart = startAt + beat * BEAT_SEC;
    if (noteStart >= ctx.currentTime - 0.1) {
      playLeadNote(ctx, bgmMasterGain, delayNode, noteStart, dur * BEAT_SEC, freq);
    }
  }

  for (const [beat, dur, freq] of ARP_NOTES) {
    const noteStart = startAt + beat * BEAT_SEC;
    if (noteStart >= ctx.currentTime - 0.1) {
      playArpNote(ctx, bgmMasterGain, noteStart, dur * BEAT_SEC, freq);
    }
  }

  for (const [beat, dur, freq] of BASS_NOTES) {
    const noteStart = startAt + beat * BEAT_SEC;
    if (noteStart >= ctx.currentTime - 0.1) {
      playBassNote(ctx, bgmMasterGain, noteStart, dur * BEAT_SEC, freq);
    }
  }

  const nextLoopTime = startAt + TOTAL_DURATION;
  const delayToNextMs = Math.max((nextLoopTime - ctx.currentTime - 0.4) * 1000, 500);

  loopTimeout = setTimeout(() => {
    if (isPlaying) {
      scheduleLoop(ctx, nextLoopTime);
    }
  }, delayToNextMs);
}

function playImmediate(ctx: AudioContext) {
  if (isPlaying) return;
  isPlaying = true;

  if (bgmMasterGain) {
    try {
      bgmMasterGain.gain.cancelScheduledValues(ctx.currentTime);
      bgmMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      bgmMasterGain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.4);
    } catch {}
  }

  scheduleLoop(ctx, ctx.currentTime + 0.08);
}

export function startBgm() {
  if (typeof window === "undefined" || isMuted()) return;

  const ctx = getSharedAudioContext();
  if (!ctx) return;

  setupAudioGraph(ctx);

  if (ctx.state === "suspended") {
    const unlockAndStart = () => {
      void ctx.resume().then(() => {
        if (!isMuted() && !isPlaying) {
          playImmediate(ctx);
        }
      });
      events.forEach((ev) => window.removeEventListener(ev, unlockAndStart));
    };

    const events = ["pointerdown", "click", "touchstart", "touchend", "keydown"];
    events.forEach((ev) =>
      window.addEventListener(ev, unlockAndStart, { passive: true, once: true })
    );

    void ctx.resume().then(() => {
      if (ctx.state === "running" && !isMuted() && !isPlaying) {
        events.forEach((ev) => window.removeEventListener(ev, unlockAndStart));
        playImmediate(ctx);
      }
    });
    return;
  }

  if (!isPlaying) {
    playImmediate(ctx);
  }
}

export function stopBgm() {
  isPlaying = false;
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }

  if (bgmMasterGain && sharedAudioCtx) {
    try {
      const t = sharedAudioCtx.currentTime;
      bgmMasterGain.gain.cancelScheduledValues(t);
      bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, t);
      bgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    } catch {}
  }

  setTimeout(() => {
    if (!isPlaying) {
      activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      activeOscillators = [];
    }
  }, 380);
}

export function duckBgm(duration = 0.5) {
  if (!isPlaying || !bgmMasterGain || !sharedAudioCtx) return;
  try {
    const t = sharedAudioCtx.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(t);
    bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, t);
    bgmMasterGain.gain.linearRampToValueAtTime(0.04, t + 0.04);
    bgmMasterGain.gain.setValueAtTime(0.04, t + duration);
    bgmMasterGain.gain.exponentialRampToValueAtTime(0.22, t + duration + 0.35);
  } catch {}
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (bgmMasterGain && sharedAudioCtx) {
        try {
          bgmMasterGain.gain.setValueAtTime(0.0001, sharedAudioCtx.currentTime);
        } catch {}
      }
    } else {
      if (!isMuted() && isPlaying && bgmMasterGain && sharedAudioCtx) {
        try {
          bgmMasterGain.gain.setValueAtTime(0.0001, sharedAudioCtx.currentTime);
          bgmMasterGain.gain.exponentialRampToValueAtTime(0.22, sharedAudioCtx.currentTime + 0.4);
        } catch {}
      }
    }
  });
}
