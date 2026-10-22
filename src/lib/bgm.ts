"use client";

// Reproductor BGM Chiptune Melancólico (Estilo "Fallen Down" de Undertale)
// Síntesis Web Audio API en tiempo real (0 KB de descarga).

let audioCtx: AudioContext | null = null;
let bgmGain: GainNode | null = null;
let isPlaying = false;
let loopTimeout: ReturnType<typeof setTimeout> | null = null;

// Frecuencias exactas (Hz) en escala D Mayor (Re Mayor)
const N = {
  // Bajos (Octava 2 y 3)
  D2: 73.42,
  G2: 98.0,
  B2: 123.47,
  A2: 110.0,
  D3: 146.83,
  E3: 164.81,
  Fs3: 185.0,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  // Medios / Acompañamiento (Octava 4)
  D4: 293.66,
  E4: 329.63,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  Cs5: 554.37,
  // Melodía (Octava 5 - estilo cajita musical / Undertale)
  D5: 587.33,
  E5: 659.25,
  Fs5: 739.99,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
};

// Secuencia en compás de 3/4 melancólico (~100 BPM, 1 beat = 0.6s)
// Estructura inspirada en la progresión nostálgica de "Fallen Down" (Toriel / Ruins)
type NoteEvent = [freq: number, time: number, duration: number, type: OscillatorType, vol: number];

function createMelodyEvents(): { totalDuration: number; events: NoteEvent[] } {
  const beat = 0.58; // segundos por pulso
  const measure = beat * 3; // compás 3/4
  const events: NoteEvent[] = [];

  const add = (freq: number, m: number, b: number, dur = 0.8, type: OscillatorType = "sine", vol = 0.04) => {
    const time = m * measure + b * beat;
    events.push([freq, time, dur, type, vol]);
  };

  // Frase 1: Re Mayor (Paz y nostalgia)
  // Bajo cálido
  add(N.D3, 0, 0, 1.6, "triangle", 0.05);
  add(N.A3, 0, 1, 1.0, "triangle", 0.03);
  add(N.Fs4, 0, 2, 1.0, "triangle", 0.03);
  // Melodía tipo cajita musical (Fallen Down motif)
  add(N.Fs5, 0, 0, 0.7, "sine", 0.045);
  add(N.E5, 0, 1, 0.6, "sine", 0.04);
  add(N.D5, 0, 2, 0.9, "sine", 0.045);

  // Frase 2: Sol Mayor (Elevación suave)
  add(N.G2, 1, 0, 1.6, "triangle", 0.05);
  add(N.D4, 1, 1, 1.0, "triangle", 0.03);
  add(N.B4, 1, 2, 1.0, "triangle", 0.03);
  add(N.B4, 1, 0, 0.6, "sine", 0.035);
  add(N.D5, 1, 1, 0.6, "sine", 0.04);
  add(N.Fs5, 1, 2, 1.1, "sine", 0.045);

  // Frase 3: Si menor (Melancolía)
  add(N.B2, 2, 0, 1.6, "triangle", 0.05);
  add(N.Fs3, 2, 1, 1.0, "triangle", 0.03);
  add(N.D4, 2, 2, 1.0, "triangle", 0.03);
  add(N.E5, 2, 0, 0.7, "sine", 0.045);
  add(N.D5, 2, 1, 0.6, "sine", 0.04);
  add(N.Cs5, 2, 2, 0.9, "sine", 0.04);

  // Frase 4: La Mayor (Resolución suspendida)
  add(N.A2, 3, 0, 1.6, "triangle", 0.05);
  add(N.E3, 3, 1, 1.0, "triangle", 0.03);
  add(N.Cs5, 3, 2, 1.0, "triangle", 0.03);
  add(N.B4, 3, 0, 0.6, "sine", 0.035);
  add(N.A4, 3, 1, 0.6, "sine", 0.035);
  add(N.Fs5, 3, 2, 1.2, "sine", 0.045);

  // Frase 5: Re Mayor segunda parte (eco más alto)
  add(N.D3, 4, 0, 1.6, "triangle", 0.05);
  add(N.A3, 4, 1, 1.0, "triangle", 0.03);
  add(N.D5, 4, 2, 1.0, "triangle", 0.03);
  add(N.A5, 4, 0, 0.8, "sine", 0.04);
  add(N.Fs5, 4, 1, 0.6, "sine", 0.04);
  add(N.D5, 4, 2, 0.9, "sine", 0.045);

  // Frase 6: Sol Mayor (caída de notas lentas)
  add(N.G2, 5, 0, 1.6, "triangle", 0.05);
  add(N.D4, 5, 1, 1.0, "triangle", 0.03);
  add(N.G4, 5, 2, 1.0, "triangle", 0.03);
  add(N.B4, 5, 0, 0.6, "sine", 0.035);
  add(N.D5, 5, 1, 0.6, "sine", 0.04);
  add(N.E5, 5, 2, 1.0, "sine", 0.04);

  // Frase 7: Mi menor / La7 (despedida triste)
  add(N.A2, 6, 0, 1.6, "triangle", 0.05);
  add(N.E4, 6, 1, 1.0, "triangle", 0.03);
  add(N.G4, 6, 2, 1.0, "triangle", 0.03);
  add(N.Fs5, 6, 0, 0.7, "sine", 0.04);
  add(N.E5, 6, 1, 0.6, "sine", 0.04);
  add(N.Cs5, 6, 2, 0.8, "sine", 0.035);

  // Frase 8: Cierre en Re Mayor suave
  add(N.D2, 7, 0, 2.0, "triangle", 0.05);
  add(N.Fs4, 7, 1, 1.2, "triangle", 0.03);
  add(N.A4, 7, 2, 1.2, "triangle", 0.03);
  add(N.D5, 7, 0, 2.2, "sine", 0.045);

  return { totalDuration: 8 * measure, events };
}

function playNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  vol: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Envolvente de sonido suave (suave al inicio, caída melancólica estilo caja de música)
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(vol, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

const { totalDuration, events } = createMelodyEvents();

function scheduleLoop(ctx: AudioContext, dest: AudioNode, startAt: number) {
  if (!isPlaying) return;

  const now = startAt;
  for (const [freq, offset, dur, type, vol] of events) {
    playNote(ctx, dest, freq, now + offset, dur, type, vol);
  }

  // Programar la siguiente repetición
  const nextLoopTime = (now + totalDuration - ctx.currentTime) * 1000 - 150;
  loopTimeout = setTimeout(() => {
    if (isPlaying) {
      scheduleLoop(ctx, dest, ctx.currentTime + 0.1);
    }
  }, Math.max(nextLoopTime, 1000));
}

// Iniciar música melancólica
export function startBgm() {
  if (typeof window === "undefined" || isPlaying) return;

  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }

    bgmGain ??= audioCtx.createGain();
    // Volumen de fondo bajo (0.28 maestro = muy sutil, nunca opaca los SFX)
    bgmGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    bgmGain.connect(audioCtx.destination);

    isPlaying = true;
    scheduleLoop(audioCtx, bgmGain, audioCtx.currentTime + 0.1);
  } catch {}
}

// Detener música
export function stopBgm() {
  isPlaying = false;
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  if (bgmGain && audioCtx) {
    try {
      // Fade out suave de 0.5s en lugar de cortar en seco
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, audioCtx.currentTime);
      bgmGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    } catch {}
  }
}

// Ducking automático: baja el volumen de la música cuando suena un SFX importante
export function duckBgm(duration = 0.5) {
  if (!isPlaying || !bgmGain || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    bgmGain.gain.cancelScheduledValues(t);
    // Baja el volumen al 20%
    bgmGain.gain.setValueAtTime(0.06, t);
    // Vuelve a subir suavemente
    bgmGain.gain.exponentialRampToValueAtTime(0.3, t + duration);
  } catch {}
}
