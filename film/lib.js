// Shared helpers for film scenes. Everything is a pure function of time: no timers, no CSS animation.

export const W = 1920, H = 1080;
// 纯享版 (?pure): the same film with no words on screen — only the music and what it draws
export const PURE = new URLSearchParams(location.search).has('pure');
export const C = {
  ink: '#0b0b0c', ivory: '#ece7de', ivoryHi: '#f2eee6', paper: '#ece7dd', paperInk: '#171615',
  eva: '#e8502e', violet: '#2f7d62', violetHi: '#58b28f', frieren: '#cdb986', mark: '#c3402e',
};
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));           // 0..1 progress of t through [a,b]
export const ease = {
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  in: (t) => t * t * t,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
// fade envelope: in over [a, a+fi], out over [b-fo, b]
export const env = (t, a, b, fi = 0.4, fo = 0.4) => {
  if (t < a || t > b) return 0;
  const i = fi > 0 ? clamp((t - a) / fi) : 1, o = fo > 0 ? clamp((b - t) / fo) : 1;
  return ease.sine(Math.min(i, o));
};

export function rng(seed = 1) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- DOM ---------------------------------------------------------------------
export function el(parent, tag, cls = '', html = '', style = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  Object.assign(e.style, style);
  parent.appendChild(e);
  e._o = -1;
  return e;
}
export function show(e, a) {            // opacity with visibility toggling
  a = Math.round(clamp(a) * 1000) / 1000;
  if (e._o === a) return;
  e._o = a;
  e.style.opacity = a;
  e.style.visibility = a <= 0 ? 'hidden' : 'visible';
}
export function text(e, s) { if (e._t !== s) { e._t = s; e.textContent = s; } }
export function html(e, s) { if (e._h !== s) { e._h = s; e.innerHTML = s; } }

// typed text: glyphs appear on a schedule, each struck slightly off its line (deterministic)
export function typeLine(container, line, t, { caret = null } = {}) {
  if (!container._built) {
    container._built = true;
    const R = rng(line.text.length * 97 + 13);
    container._spans = [...line.text].map((c) => {
      const s = el(container, 'span', 'ch', '', {});
      s.textContent = c === ' ' ? ' ' : c;
      const dy = (R() - 0.5) * 1.4, rot = (R() - 0.5) * 0.7, ink = 0.8 + R() * 0.2;
      s.style.transform = `translateY(${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
      s._ink = ink;
      s.style.textShadow = `0 0 ${(0.3 + R() * 0.5).toFixed(2)}px rgba(29,27,25,0.5)`;
      return s;
    });
    if (caret) { container._caret = el(container, 'span', 'caret'); }
  }
  const n = Math.floor((t - line.start) / line.interval) + 1;
  container._spans.forEach((s, i) => show(s, i < n ? s._ink : 0));
  if (container._caret) {
    const done = n >= container._spans.length;
    const blink = done ? (Math.floor((t - line.start - line.text.length * line.interval) / 0.45) % 2 === 0 ? 1 : 0) : 1;
    show(container._caret, t >= line.start - 0.3 ? blink : 0);
    // keep the caret after the last visible glyph
    const last = container._spans[Math.max(0, Math.min(n, container._spans.length)) - 1];
    if (last && last.nextSibling !== container._caret) last.after(container._caret);
  }
  return n;
}

// --- canvas ------------------------------------------------------------------
export function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
export function circle(ctx, x, y, r, fill = false) { ctx.beginPath(); ctx.arc(x, y, Math.max(r, 0), 0, Math.PI * 2); fill ? ctx.fill() : ctx.stroke(); }
export function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a)})`;
}
export const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const noteName = (m) => NOTE[m % 12] + (Math.floor(m / 12) - 1);
export const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// notes arrive as compact rows [start, dur, pitch, vel, track, role?]
export const N = (r) => ({ s: r[0], d: r[1], p: r[2], v: r[3], tr: r[4], role: r[5] });
