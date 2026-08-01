// Tonos cortos con Web Audio, sin assets. El navegador exige un gesto previo
// del usuario: hasta entonces el contexto queda suspendido y no suena nada.

let ctx = null;

function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx?.state === 'suspended') ctx.resume();
  return ctx;
}

export function playTone(freqs, step = 0.16) {
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime;
  freqs.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    const start = t0 + i * step;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + step);
    o.connect(g); g.connect(ac.destination);
    o.start(start); o.stop(start + step + 0.02);
  });
}

export const TONES = {
  confirm:      [880],
  live:         [990],
  result:       [660, 990],
  personal:     [880, 1320],
  champion:     [660, 880, 1320],
  notification: [1320, 880],
};
