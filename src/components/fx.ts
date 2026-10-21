"use client";

// Efectos imperativos: confeti pixel, textos flotantes, toasts y sonidos 8-bit.

const COLORS = ["#39ff14", "#ffd700", "#ff3ea5", "#00e5ff", "#ff6b1a", "#f2f2f2"];

export function confetti(count = 70) {
  if (typeof document === "undefined") return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "px-confetti";
    const size = [6, 8, 10][i % 3];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.width = el.style.height = `${size}px`;
    el.style.background = COLORS[i % COLORS.length];
    el.style.setProperty("--dx", `${(Math.random() - 0.5) * 200}px`);
    el.style.setProperty("--rot", `${(Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 540)}deg`);
    el.style.setProperty("--dur", `${1.3 + Math.random() * 1.2}s`);
    el.style.animationDelay = `${Math.random() * 0.35}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}

export function floater(text: string, x: number, y: number, color?: string) {
  const el = document.createElement("div");
  el.className = "px-floater";
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  if (color) el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

export type ToastInput = { title: string; body?: string; icon?: string; tone?: "neon" | "gold" | "pink" | "danger" | "cyan" };

export function toast(t: ToastInput) {
  window.dispatchEvent(new CustomEvent<ToastInput>("px:toast", { detail: t }));
}

// ---------- Sonido ----------
let ctx: AudioContext | null = null;
const MUTE_KEY = "maxeados:mute";

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return true;
  }
}

export function setMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {}
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "square", vol = 0.05) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(vol, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.02);
}

const SONGS: Record<string, [number, number, number][]> = {
  blip: [[880, 0, 0.06]],
  select: [[660, 0, 0.05], [990, 0.05, 0.07]],
  coin: [[988, 0, 0.08], [1319, 0.08, 0.25]],
  success: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.3]],
  levelup: [[392, 0, 0.1], [523, 0.1, 0.1], [659, 0.2, 0.1], [784, 0.3, 0.1], [1047, 0.4, 0.12], [784, 0.52, 0.08], [1047, 0.6, 0.4]],
  error: [[220, 0, 0.15], [165, 0.15, 0.3]],
};

export function sfx(name: keyof typeof SONGS) {
  if (typeof window === "undefined" || isMuted()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    for (const [f, s, d] of SONGS[name]) tone(f, s, d);
  } catch {}
}
