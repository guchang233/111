// Shared helpers for deterministic still/animation frames.

export function rng(seed = 1) {
  // mulberry32: small, fast, deterministic
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function fontsReady(specs) {
  // specs: [[cssFontShorthand, sampleText], ...]
  await Promise.all(specs.map(([spec, text]) => document.fonts.load(spec, text)));
  await document.fonts.ready;
}

// Film grain overlay. Breaks up banding after B站 transcoding and adds texture.
export function grain({ seed = 7, opacity = 0.09, blend = 'overlay', size = 1 } = {}) {
  const dpr = window.devicePixelRatio || 1;
  const c = document.createElement('canvas');
  c.className = 'grain';
  const w = Math.round(innerWidth * dpr / size), h = Math.round(innerHeight * dpr / size);
  c.width = w; c.height = h;
  c.style.mixBlendMode = blend;
  c.style.opacity = opacity;
  c.style.imageRendering = 'pixelated';
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const r = rng(seed);
  for (let i = 0; i < w * h; i++) {
    // approx gaussian: sum of 3 uniforms
    const g = (r() + r() + r()) / 3;
    const v = Math.max(0, Math.min(255, 128 + (g - 0.5) * 2.4 * 255));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  document.body.appendChild(c);
  return c;
}

export function hiDPICanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

export function ready() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
}

export const ease = {
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
