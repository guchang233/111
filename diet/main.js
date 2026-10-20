// 《越饿越胖》 runtime: one layer per scene plus a caption track; window.renderFrame(t) is pure in t.
import { W, H, clamp, ease, el, show } from '/film/lib.js';

const D = { timeline: await (await fetch('/diet/data/timeline.json')).json() };
D.C = D.timeline.cues;
const only = new URLSearchParams(location.search).get('only');
const stage = document.getElementById('stage');
const dpr = window.devicePixelRatio || 1;
const layers = [];
for (const spec of D.timeline.scenes) {
  if (only && !only.split(',').includes(spec.id)) continue;
  const scene = (await import(`/diet/scenes/${spec.id}.js`)).default;
  const e = document.createElement('div');
  e.className = 'layer ' + (scene.bg || '');
  const cv = document.createElement('canvas');
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const ui = document.createElement('div'); ui.className = 'ui';
  e.append(cv, ui); stage.appendChild(e);
  const L = { spec, scene, el: e, ctx, ui, st: {}, vis: false };
  scene.init(L, D);
  e.style.display = 'none';
  layers.push(L);
}

// captions
const capRoot = document.createElement('div'); capRoot.id = 'caps'; stage.appendChild(capRoot);
const caps = D.timeline.captions.map((c) => {
  const e = el(capRoot, 'div', `cap ${c.preset}${c.warm ? ' warm' : ''}`);
  e.textContent = c.text;
  if (c.preset === 'line') Object.assign(e.style, { top: '846px', fontSize: '46px' });
  if (c.preset === 'mid') Object.assign(e.style, { top: `${c.y - c.size / 2}px`, fontSize: `${c.size}px` });
  if (c.color === 'red') e.style.color = 'var(--red)';
  show(e, 0);
  return { c, e };
});

const texts = stage.textContent;
const loads = [];
for (const [fam, ws] of [['Noto Sans SC', [400, 500, 700, 900]], ['Noto Serif SC', [300, 400, 700, 900]], ['IBM Plex Mono', [300, 400, 500]], ['Courier Prime', [400]]])
  for (const w of ws) loads.push(document.fonts.load(`${w} 24px "${fam}"`, texts + '0123456789.,%+−×kg大卡天岁年周'));
await Promise.all(loads); await document.fonts.ready;

window.renderFrame = (t) => {
  for (const L of layers) {
    const s = L.spec, on = t >= s.start && t < s.end;
    if (!on) { if (L.vis) { L.el.style.display = 'none'; L.vis = false; } continue; }
    if (!L.vis) { L.el.style.display = 'block'; L.vis = true; }
    const fi = s.fade_in ? clamp((t - s.start) / s.fade_in) : 1, fo = s.fade_out ? clamp((s.end - t) / s.fade_out) : 1;
    L.el.style.opacity = ease.sine(Math.min(fi, fo));
    L.ctx.clearRect(0, 0, W, H);
    L.scene.draw(L, t, D);
  }
  for (const { c, e } of caps) {
    if (t < c.t0 - 0.01 || t > c.t1 + 0.4) { show(e, 0); continue; }
    if (c.preset === 'kicker') { show(e, clamp((t - c.t0) / 0.4) * clamp((c.t1 - t) / 0.3)); continue; }
    const i = clamp((t - c.t0) / 0.16), o = clamp((c.t1 - t) / 0.3 + 1);
    show(e, Math.min(ease.out(i), o));
    e.style.transform = `translateY(${((1 - ease.out(i)) * 10).toFixed(2)}px)`;
  }
  return true;
};
window.__duration = D.timeline.duration;
window.__fps = D.timeline.fps;
window.__ready = true;
