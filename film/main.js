// Film runtime: one layer per scene, composited by the timeline. window.renderFrame(t) is pure in t.
import { W, H, clamp, ease } from './lib.js';

const IDS = ['coldopen', 'title', 'whole', 'atfield', 'epi_violet', 'letter', 'chords',
             'epi_frieren', 'flowers', 'magic', 'rebuild'];
const only = new URLSearchParams(location.search).get('only');
const SCENES = {};
for (const id of IDS) {
  if (only && !only.split(',').includes(id)) continue;
  SCENES[id] = (await import(`./scenes/${id}.js`)).default;
}

const load = (n) => fetch(`/film/data/${n}.json`).then((r) => r.json());
const D = {};
for (const n of ['timeline', 'eva_intro', 'eva_phrase', 'eva_chorus', 'sin_a', 'sincerely', 'fri_d', 'frieren_a', 'frieren_b', 'a4']) D[n] = await load(n);
D.C = D.timeline.cues;

const dpr = window.devicePixelRatio || 1;
const stage = document.getElementById('stage');
const layers = [];
for (const spec of D.timeline.scenes) {
  if (only && !only.split(',').includes(spec.id)) continue;
  const scene = SCENES[spec.id];
  const el = document.createElement('div');
  el.className = 'layer ' + (scene.bg || 'dark');
  const cv = document.createElement('canvas');
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  const ui = document.createElement('div');
  ui.className = 'ui';
  el.appendChild(cv); el.appendChild(ui);
  stage.appendChild(el);
  const L = { spec, el, cv, ctx, ui, vis: false, st: {} };
  scene.init(L, D);
  layers.push(L);
}

// make sure every glyph the film will ever show is loaded before the first frame
const texts = layers.map((L) => L.el.textContent + (SCENES[L.spec.id].glyphs || '')).join('');
const faces = [['Noto Serif SC', [300, 400, 500, 600, 700, 900]], ['Cormorant Garamond', [400, 500, 600, 700]],
               ['IBM Plex Mono', [300, 400, 500]], ['Courier Prime', [400]]];
const loads = [];
for (const [fam, ws] of faces) for (const w of ws) loads.push(document.fonts.load(`${w} 24px "${fam}"`, texts));
loads.push(document.fonts.load(`italic 400 24px "Cormorant Garamond"`, texts));
await Promise.all(loads);
await document.fonts.ready;

for (const L of layers) { L.el.style.visibility = 'visible'; L.el.style.display = 'none'; }

window.renderFrame = (t) => {
  for (const L of layers) {
    const s = L.spec;
    let a = 0;
    if (t >= s.start && t < s.end) {
      const i = s.fade_in > 0 ? clamp((t - s.start) / s.fade_in) : 1;
      const o = s.fade_out > 0 ? clamp((s.end - t) / s.fade_out) : 1;
      a = ease.sine(Math.min(i, o));
    }
    if (a <= 0) {
      if (L.vis) { L.el.style.display = 'none'; L.vis = false; }
      continue;
    }
    if (!L.vis) { L.el.style.display = 'block'; L.vis = true; }
    L.el.style.opacity = a;
    L.ctx.clearRect(0, 0, W, H);
    SCENES[s.id].draw(L, t, D);
  }
  return true;
};
window.__duration = D.timeline.duration;
window.__fps = D.timeline.fps;
window.__ready = true;
