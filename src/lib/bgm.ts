"use client";

// BGM: "Fallen Down" de Undertale (Toby Fox)
// Síntesis Web Audio de Piano Acústico Melancólico (Sad Piano).
// Sonido: Cuerdas de piano dobles desafinadas acústicamente (chorus natural),
// envolvente dinámica de martillo de fieltro (lowpass sweep) y resonancia de caja armónica (Convolver Reverb).
// 0 KB de descarga externa.

import { isMuted } from "@/components/fx";

let sharedAudioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let dryGainNode: GainNode | null = null;
let reverbGainNode: GainNode | null = null;
let convolverNode: ConvolverNode | null = null;
let masterCompressorNode: DynamicsCompressorNode | null = null;
let masterWarmFilterNode: BiquadFilterNode | null = null;

let isPlaying = false;
let loopTimeout: ReturnType<typeof setTimeout> | null = null;
let activeOscillators: OscillatorNode[] = [];

// Tempo melancólico y pausado de vals (86 BPM da ese aire nostálgico y reflexivo)
const BPM = 86;
const BEAT_SEC = 60 / BPM; // ~0.6976s por pulso (compás 3/4)
const TOTAL_BEATS = 48; // 16 compases
const TOTAL_DURATION = TOTAL_BEATS * BEAT_SEC; // ~33.48s

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

// Generar impulso de reverberación acústica (sala de madera / caja de resonancia de piano)
function createPianoRoomImpulse(ctx: AudioContext, duration = 2.0, decay = 2.6): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    // Caída exponencial natural
    const envelope = Math.exp(-t * decay);
    // Amortiguación de frecuencias altas por la madera del piano
    const damp = 1.0 - t * 0.75;
    left[i] = (Math.random() * 2 - 1) * envelope * damp;
    right[i] = (Math.random() * 2 - 1) * envelope * damp;
  }

  return impulse;
}

// Configurar cadena de audio del piano triste
function setupAudioGraph(ctx: AudioContext) {
  if (bgmMasterGain) return;

  // 1. Ganancia maestra del BGM (0.24 = presencia cálida y clara, nunca saturada)
  bgmMasterGain = ctx.createGain();
  bgmMasterGain.gain.setValueAtTime(0.24, ctx.currentTime);

  // 2. Filtro maestro cálido (corta agudos chillones arriba de 3600Hz para dar carácter íntimo)
  masterWarmFilterNode = ctx.createBiquadFilter();
  masterWarmFilterNode.type = "lowpass";
  masterWarmFilterNode.frequency.setValueAtTime(3600, ctx.currentTime);

  // 3. Compresor de dinámica para suavizar picos y dar cuerpo acústico uniforme
  masterCompressorNode = ctx.createDynamicsCompressor();
  masterCompressorNode.threshold.setValueAtTime(-14, ctx.currentTime);
  masterCompressorNode.knee.setValueAtTime(8, ctx.currentTime);
  masterCompressorNode.ratio.setValueAtTime(2.5, ctx.currentTime);
  masterCompressorNode.attack.setValueAtTime(0.015, ctx.currentTime);
  masterCompressorNode.release.setValueAtTime(0.25, ctx.currentTime);

  // 4. Convolver de sala acústica (Piano Hall Reverb)
  convolverNode = ctx.createConvolver();
  try {
    convolverNode.buffer = createPianoRoomImpulse(ctx, 2.2, 2.8);
  } catch {}

  // 5. Mezcla Wet / Dry (65% directo, 35% reverberación de sala)
  dryGainNode = ctx.createGain();
  dryGainNode.gain.setValueAtTime(0.68, ctx.currentTime);

  reverbGainNode = ctx.createGain();
  reverbGainNode.gain.setValueAtTime(0.36, ctx.currentTime);

  // Conexiones:
  // Salida directa -> Master
  dryGainNode.connect(masterWarmFilterNode);

  // Convolver -> ReverbGain -> Master
  convolverNode.connect(reverbGainNode);
  reverbGainNode.connect(masterWarmFilterNode);

  // Master -> Compresor -> Ganancia maestra -> Destino
  masterWarmFilterNode.connect(masterCompressorNode);
  masterCompressorNode.connect(bgmMasterGain);
  bgmMasterGain.connect(ctx.destination);
}

// Notas en registro cálido de piano acústico (Re Mayor, Octavas 3 y 4)
const LEAD_NOTES: [number, number, number][] = [[0.0, 0.5, 370.0], [0.5, 0.5, 277.19], [1.0, 0.5, 370.0], [1.5, 0.5, 277.19], [2.0, 0.5, 370.0], [2.5, 0.5, 277.19], [3.0, 0.5, 370.0], [3.5, 0.5, 277.19], [4.0, 0.5, 370.0], [4.5, 0.5, 277.19], [5.0, 0.5, 370.0], [5.5, 0.5, 277.19], [6.0, 0.5, 246.94], [6.5, 0.5, 220.0], [7.0, 1.0, 277.19], [8.0, 0.5, 220.0], [8.5, 0.5, 246.94], [9.0, 0.5, 329.63], [9.5, 0.5, 311.12], [10.0, 0.5, 329.63], [10.5, 0.5, 370.0], [11.0, 0.5, 311.12], [11.5, 0.5, 246.94], [12.0, 0.5, 370.0], [12.5, 0.5, 246.94], [13.0, 0.5, 370.0], [13.5, 0.5, 246.94], [14.0, 0.5, 370.0], [14.5, 0.5, 246.94], [15.0, 0.5, 370.0], [15.5, 0.5, 233.08], [16.0, 0.5, 370.0], [16.5, 0.5, 233.08], [17.0, 1.0, 392.0], [18.0, 0.5, 370.0], [18.5, 0.5, 293.67], [19.0, 0.5, 370.0], [19.5, 0.5, 293.67], [20.0, 0.5, 329.63], [20.5, 0.5, 370.0], [21.0, 1.0, 329.63], [22.0, 1.0, 293.67], [23.0, 1.0, 277.19], [24.0, 0.5, 370.0], [24.5, 0.5, 277.19], [25.0, 0.5, 370.0], [25.5, 0.5, 277.19], [26.0, 0.5, 370.0], [26.5, 0.5, 277.19], [27.0, 0.5, 370.0], [27.5, 0.5, 277.19], [28.0, 0.5, 370.0], [28.5, 0.5, 277.19], [29.0, 0.5, 370.0], [29.5, 0.5, 277.19], [30.0, 0.5, 246.94], [30.5, 0.5, 220.0], [31.0, 1.0, 277.19], [32.0, 0.5, 220.0], [32.5, 0.5, 246.94], [33.0, 0.5, 329.63], [33.5, 0.5, 311.12], [34.0, 0.5, 329.63], [34.5, 0.5, 370.0], [35.0, 0.5, 311.12], [35.5, 0.5, 246.94], [36.0, 0.5, 370.0], [36.5, 0.5, 246.94], [37.0, 0.5, 370.0], [37.5, 0.5, 246.94], [38.0, 0.5, 370.0], [38.5, 0.5, 246.94], [39.0, 0.5, 370.0], [39.5, 0.5, 233.08], [40.0, 0.5, 370.0], [40.5, 0.5, 233.08], [41.0, 1.0, 392.0], [42.0, 0.5, 370.0], [42.5, 0.5, 293.67], [43.0, 0.5, 370.0], [43.5, 0.5, 293.67], [44.0, 0.5, 329.63], [44.5, 0.5, 370.0], [45.0, 1.0, 329.63], [46.0, 1.0, 293.67], [47.0, 1.0, 277.19]];
const ARP_NOTES: [number, number, number][] = [[0.0, 0.5, 146.83], [0.5, 0.5, 185.0], [1.0, 0.5, 220.0], [1.5, 0.5, 185.0], [2.0, 0.5, 220.0], [2.5, 0.5, 185.0], [3.0, 0.5, 146.83], [3.5, 0.5, 185.0], [4.0, 0.5, 220.0], [4.5, 0.5, 185.0], [5.0, 0.5, 220.0], [5.5, 0.5, 185.0], [6.0, 0.5, 123.47], [6.5, 0.5, 155.56], [7.0, 0.5, 185.0], [7.5, 0.5, 155.56], [8.0, 0.5, 185.0], [8.5, 0.5, 155.56], [9.0, 0.5, 123.47], [9.5, 0.5, 155.56], [10.0, 0.5, 185.0], [10.5, 0.5, 155.56], [11.0, 0.5, 185.0], [11.5, 0.5, 155.56], [12.0, 0.5, 98.0], [12.5, 0.5, 123.47], [13.0, 0.5, 146.83], [13.5, 0.5, 123.47], [14.0, 0.5, 146.83], [14.5, 0.5, 123.47], [15.0, 0.5, 98.0], [15.5, 0.5, 116.54], [16.0, 0.5, 146.83], [16.5, 0.5, 116.54], [17.0, 0.5, 146.83], [17.5, 0.5, 116.54], [18.0, 0.5, 146.83], [18.5, 0.5, 185.0], [19.0, 0.5, 220.0], [19.5, 0.5, 185.0], [20.0, 0.5, 220.0], [20.5, 0.5, 185.0], [21.0, 0.5, 138.59], [21.5, 0.5, 164.81], [22.0, 0.5, 220.0], [22.5, 0.5, 164.81], [23.0, 0.5, 220.0], [23.5, 0.5, 164.81], [24.0, 0.5, 146.83], [24.5, 0.5, 185.0], [25.0, 0.5, 220.0], [25.5, 0.5, 185.0], [26.0, 0.5, 220.0], [26.5, 0.5, 185.0], [27.0, 0.5, 146.83], [27.5, 0.5, 185.0], [28.0, 0.5, 220.0], [28.5, 0.5, 185.0], [29.0, 0.5, 220.0], [29.5, 0.5, 185.0], [30.0, 0.5, 123.47], [30.5, 0.5, 155.56], [31.0, 0.5, 185.0], [31.5, 0.5, 155.56], [32.0, 0.5, 185.0], [32.5, 0.5, 155.56], [33.0, 0.5, 123.47], [33.5, 0.5, 155.56], [34.0, 0.5, 185.0], [34.5, 0.5, 155.56], [35.0, 0.5, 185.0], [35.5, 0.5, 155.56], [36.0, 0.5, 98.0], [36.5, 0.5, 123.47], [37.0, 0.5, 146.83], [37.5, 0.5, 123.47], [38.0, 0.5, 146.83], [38.5, 0.5, 123.47], [39.0, 0.5, 98.0], [39.5, 0.5, 116.54], [40.0, 0.5, 146.83], [40.5, 0.5, 116.54], [41.0, 0.5, 146.83], [41.5, 0.5, 116.54], [42.0, 0.5, 146.83], [42.5, 0.5, 185.0], [43.0, 0.5, 220.0], [43.5, 0.5, 185.0], [44.0, 0.5, 220.0], [44.5, 0.5, 185.0], [45.0, 0.5, 138.59], [45.5, 0.5, 164.81], [46.0, 0.5, 220.0], [46.5, 0.5, 164.81], [47.0, 0.5, 220.0], [47.5, 0.5, 164.81]];
const BASS_NOTES: [number, number, number][] = [[0.0, 2.7, 73.42], [3.0, 2.7, 73.42], [6.0, 2.7, 61.73], [9.0, 2.7, 61.73], [12.0, 2.7, 49.0], [15.0, 2.7, 49.0], [18.0, 2.7, 73.42], [21.0, 2.7, 55.0], [24.0, 2.7, 73.42], [27.0, 2.7, 73.42], [30.0, 2.7, 61.73], [33.0, 2.7, 61.73], [36.0, 2.7, 49.0], [39.0, 2.7, 49.0], [42.0, 2.7, 73.42], [45.0, 2.7, 55.0]];

// Sintetizar una nota de piano acústico realista con martillo de fieltro y resonancia
function playPianoString(
  ctx: AudioContext,
  startTime: number,
  durationSec: number,
  freq: number,
  velocity: number, // 0.0 a 1.0
  isMelody = false
) {
  if (!dryGainNode || !convolverNode) return;

  // A. Filtro dinámico de martillo (Hammer Felt Filter):
  // Al golpear la cuerda, el golpe tiene un ataque suave que decae rápido a un tono dulce y profundo.
  const hammerFilter = ctx.createBiquadFilter();
  hammerFilter.type = "lowpass";
  hammerFilter.Q.setValueAtTime(1.1, startTime);

  const initialCutoff = Math.min(freq * (isMelody ? 3.4 : 2.6) * (0.7 + velocity * 0.3), 3200);
  const sustainCutoff = Math.max(freq * 1.25, 240);

  hammerFilter.frequency.setValueAtTime(initialCutoff, startTime);
  hammerFilter.frequency.exponentialRampToValueAtTime(sustainCutoff, startTime + 0.16);

  // Envolvente de volumen de la nota
  const noteGain = ctx.createGain();
  const peakVolume = (isMelody ? 0.085 : 0.045) * velocity;

  noteGain.gain.setValueAtTime(0.0001, startTime);
  // Ataque de martillo: 0.008s para ataque orgánico, no seco ni sintético
  noteGain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.008);
  // Caída exponencial larga que imita la vibración de la cuerda con pedal de sustain
  const ringTime = isMelody ? durationSec + 0.75 : Math.max(durationSec, 0.85);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + ringTime);

  // B. Par de cuerdas dobles con micro-desafinación (Unison Detune):
  // El secreto del sonido de piano real frente a un beeper de celular.
  const oscA = ctx.createOscillator();
  oscA.type = "triangle";
  oscA.frequency.setValueAtTime(freq, startTime);
  oscA.detune.setValueAtTime(-1.4, startTime); // -1.4 cents

  const oscB = ctx.createOscillator();
  oscB.type = "triangle";
  oscB.frequency.setValueAtTime(freq, startTime);
  oscB.detune.setValueAtTime(1.6, startTime); // +1.6 cents

  // C. Armónico de golpe (Segundo armónico sutil para el brillo de la tecla)
  const oscHarmonic = ctx.createOscillator();
  const harmGain = ctx.createGain();
  oscHarmonic.type = "sine";
  oscHarmonic.frequency.setValueAtTime(freq * 2, startTime);

  harmGain.gain.setValueAtTime(0.0001, startTime);
  harmGain.gain.linearRampToValueAtTime(peakVolume * 0.28, startTime + 0.006);
  harmGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

  // Conectar osciladores -> filtro de martillo -> ganancia de nota
  oscA.connect(hammerFilter);
  oscB.connect(hammerFilter);
  oscHarmonic.connect(harmGain);
  harmGain.connect(hammerFilter);

  hammerFilter.connect(noteGain);

  // Enviar hacia señal directa y hacia la sala con reverberación
  noteGain.connect(dryGainNode);
  noteGain.connect(convolverNode);

  // Iniciar y programar parada
  const stopTime = startTime + ringTime + 0.05;
  oscA.start(startTime);
  oscA.stop(stopTime);
  oscB.start(startTime);
  oscB.stop(stopTime);
  oscHarmonic.start(startTime);
  oscHarmonic.stop(startTime + 0.25);

  activeOscillators.push(oscA, oscB, oscHarmonic);
}

// Programar ciclo de 16 compases de Fallen Down en estilo Piano Triste
function scheduleLoop(ctx: AudioContext, startAt: number) {
  if (!isPlaying || !bgmMasterGain) return;

  // 1. Melodía nostálgica (mano derecha del piano)
  for (const [beat, dur, freq] of LEAD_NOTES) {
    const noteStart = startAt + beat * BEAT_SEC;
    if (noteStart >= ctx.currentTime - 0.1) {
      // Variación dinámica humana según el tiempo del compás
      const isDownbeat = beat % 3 === 0;
      const vel = isDownbeat ? 0.88 : 0.74;
      playPianoString(ctx, noteStart, dur * BEAT_SEC, freq, vel, true);
    }
  }

  // 2. Acompañamiento arpegiado (mano izquierda, arpegios suaves y fluidos)
  for (const [beat, dur, freq] of ARP_NOTES) {
    const noteStart = startAt + beat * BEAT_SEC;
    if (noteStart >= ctx.currentTime - 0.1) {
      // Arpegios más suaves para no opacar la melodía
      const vel = 0.42;
      playPianoString(ctx, noteStart, dur * BEAT_SEC, freq, vel, false);
    }
  }

  // 3. Bajos profundos en el primer pulso de cada acorde
  for (const [beat, dur, freq] of BASS_NOTES) {
    const noteStart = startAt + beat * BEAT_SEC;
    if (noteStart >= ctx.currentTime - 0.1) {
      const vel = 0.58;
      playPianoString(ctx, noteStart, dur * BEAT_SEC, freq, vel, false);
    }
  }

  // Programar repetición continua perfecta
  const nextLoopTime = startAt + TOTAL_DURATION;
  const delayToNextMs = Math.max((nextLoopTime - ctx.currentTime - 0.5) * 1000, 500);

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
      bgmMasterGain.gain.exponentialRampToValueAtTime(0.24, ctx.currentTime + 0.5);
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
      bgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
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
  }, 450);
}

export function duckBgm(duration = 0.5) {
  if (!isPlaying || !bgmMasterGain || !sharedAudioCtx) return;
  try {
    const t = sharedAudioCtx.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(t);
    bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, t);
    // Baja el piano a 0.04 rápidamente para dejar espacio al SFX
    bgmMasterGain.gain.linearRampToValueAtTime(0.04, t + 0.04);
    bgmMasterGain.gain.setValueAtTime(0.04, t + duration);
    // Recupera la calidez del piano suavemente
    bgmMasterGain.gain.exponentialRampToValueAtTime(0.24, t + duration + 0.4);
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
          bgmMasterGain.gain.exponentialRampToValueAtTime(0.24, sharedAudioCtx.currentTime + 0.4);
        } catch {}
      }
    }
  });
}
