// Shared pieces for 《越饿越胖》 scenes.
import { clamp, ease, rgba } from '/film/lib.js';

export const RED = '#e5322d', IV = '#ece7de', WARM = '#f1c58f', DIM = 'rgba(236,231,222,0.35)';

// a red vignette that thumps on every beat (the heartbeat)
export function pulse(ctx, t, beat, k = 1, color = RED) {
  const age = ((t % beat) + beat) % beat;
  const a = k * 0.16 * Math.exp(-age / 0.16) + k * 0.07 * Math.exp(-Math.max(0, age - 0.24) / 0.14) * (age > 0.24 ? 1 : 0);
  if (a < 0.003) return;
  const g = ctx.createRadialGradient(960, 540, 300, 960, 540, 1150);
  g.addColorStop(0, rgba(color, 0)); g.addColorStop(1, rgba(color, a));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
}

// a slam: scale from 1.14 to 1 in 0.14 s, with a short shake; returns {s, dx, dy, a}
export function slam(t, t0, hold = 1e9, out = 0.25) {
  if (t < t0 || t > t0 + hold + out) return { s: 1, dx: 0, dy: 0, a: 0 };
  const u = t - t0, k = ease.out(clamp(u / 0.14));
  const sh = Math.exp(-u / 0.09) * 9;
  return { s: 1.14 - 0.14 * k, dx: Math.sin(u * 91) * sh, dy: Math.cos(u * 77) * sh * 0.6, a: Math.min(clamp(u / 0.03), clamp((t0 + hold + out - t) / out)) };
}
export function applySlam(e, m) {
  e.style.opacity = m.a; e.style.visibility = m.a > 0 ? 'visible' : 'hidden';
  e.style.transform = `translate(${m.dx.toFixed(1)}px, ${m.dy.toFixed(1)}px) scale(${m.s.toFixed(4)})`;
}
