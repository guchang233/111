// I · the EVA chorus as an AT field: the melody is drawn as one luminous line; every bass strike
// throws octagonal ripples from the pen. Numbers read out like a MAGI console, quietly.
import { C, el, show, text, html, env, clamp, rgba, N, ease, noteName, hz } from '../lib.js';

const EVA = '#e8502e', IV = '#ece7de';
const X0 = 150, X1 = 1770;

function octagon(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
}

export default {
  bg: 'dark',
  glyphs: '0123456789.ABCDEFG♯♭HzBAR/♩=·',
  init(L, D) {
    const st = L.st, ui = L.ui, dat = D.eva_chorus;
    st.notes = dat.notes.map(N);
    st.dur = dat.dur;
    st.bars = dat.bars;
    st.mel = st.notes.filter((n) => n.role === 'm');
    // a clean melody line: the highest right-hand note struck in the last 0.3 s (tremolo and
    // ornaments fold into the note above them); between notes the line holds its last height
    const rh = st.notes.filter((n) => n.tr === 0);
    st.env = [];
    let hold = -1;
    for (let k = 0, tt = 0; tt <= st.dur + 0.01; k++, tt = k / 60) {
      let p = -1;
      for (const n of rh) {
        const recent = n.s <= tt && n.s > tt - 0.3;              // struck in the last 0.3 s
        const held = n.s <= tt && tt < n.s + n.d && n.d > 0.3;  // or still held long
        if (recent || held) p = Math.max(p, n.p);
      }
      if (p < 0) p = hold;
      st.env.push(p); hold = p;
    }
    // bass strikes: LH onsets grouped within 20 ms
    st.hits = [];
    for (const n of st.notes.filter((n) => n.tr === 1)) {
      const last = st.hits[st.hits.length - 1];
      if (last && n.s - last.s < 0.02) { last.v = Math.max(last.v, n.v); continue; }
      st.hits.push({ s: n.s, v: n.v });
    }
    el(ui, 'div', 'a kicker', 'I &nbsp;·&nbsp; 残酷天使的行动纲领 &nbsp;·&nbsp; 钢琴改编 ANIMENZ', { left: '120px', top: '104px' });
    st.note = el(ui, 'div', 'a', '', { right: '120px', top: '92px', textAlign: 'right', color: '#f2eee6' });
    st.noteName = el(st.note, 'div', 'serif-en', '', { fontSize: '84px', fontWeight: 500, lineHeight: 1 });
    st.noteHz = el(st.note, 'div', 'mono', '', { fontSize: '15px', letterSpacing: '0.16em', color: 'rgba(236,231,222,0.55)', marginTop: '10px' });
    st.bar = el(ui, 'div', 'a mono', '', { left: '120px', bottom: '84px', fontSize: '13px', letterSpacing: '0.2em', color: 'rgba(236,231,222,0.45)' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st;
    const u = t - D.C.eva_ch;
    const xOf = (s) => X0 + (s / st.dur) * (X1 - X0);
    const yOf = (p) => 880 - ((p - 26) / (100 - 26)) * 660;
    const out = 1 - clamp((u - st.dur - 0.6) / 1.0);
    // the fanfare: one wide field opening from the centre
    const f = u / 1.6;
    if (f > 0 && f < 1) {
      ctx.lineWidth = 1.4;
      for (const k of [1, 0.78, 0.58]) { ctx.strokeStyle = rgba(EVA, 0.75 * (1 - f)); octagon(ctx, 960, 540, (30 + 760 * ease.out(f)) * k); }
    }
    // faint score: harmony and bass as short dashes
    for (const n of st.notes) {
      if (n.role === 'm' || n.s > u) continue;
      const a = (n.tr === 1 ? 0.28 : 0.2) * out;
      ctx.fillStyle = rgba(IV, a);
      ctx.fillRect(xOf(n.s), yOf(n.p) - 1, Math.max(2, xOf(n.s + n.d) - xOf(n.s) - 1), 2);
    }
    // the melody: one continuous line along the upper envelope, drawn up to "now"
    let head = null;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    let started = false, lastP = -1;
    const kNow = Math.min(st.env.length - 1, Math.floor(u * 60));
    for (let k = 0; k <= kNow; k++) {
      const p = st.env[k];
      if (p < 0) { started = false; continue; }
      const x = xOf(k / 60), y = yOf(p);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else if (p !== lastP) { ctx.lineTo(x - 1.2, yOf(lastP)); ctx.lineTo(x, y); }
      else ctx.lineTo(x, y);
      lastP = p;
      head = { x, y, p };
    }
    ctx.strokeStyle = rgba('#f2eee6', 0.9 * out); ctx.lineWidth = 2.2; ctx.stroke();
    // ripples from the pen on every bass strike
    if (head) {
      for (const h of st.hits) {
        const age = u - h.s;
        if (age < 0 || age > 1.3) continue;
        const q = age / 1.3, R = (14 + 150 * (h.v / 127)) * ease.out(q) + 6;
        ctx.lineWidth = 1.3 * (1 - q) + 0.4;
        // ripple sits where the pen was at the strike
        const kk = Math.min(st.env.length - 1, Math.max(0, Math.round(h.s * 60)));
        let pp = st.env[kk]; for (let j = kk; pp < 0 && j > 0; j--) pp = st.env[j];
        const px = xOf(h.s), py = pp > 0 ? yOf(pp) : head.y;
        for (const k of [1, 0.74, 0.5]) { ctx.strokeStyle = rgba(EVA, 0.85 * (1 - q) * (h.v / 127) * out); octagon(ctx, px, py, R * k); }
      }
      const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 30);
      g.addColorStop(0, rgba(EVA, 0.55 * out)); g.addColorStop(1, rgba(EVA, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(head.x, head.y, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba('#f2eee6', out); ctx.beginPath(); ctx.arc(head.x, head.y, 3.8, 0, Math.PI * 2); ctx.fill();
      html(st.noteName, noteName(head.p).replace('♭', '<span style="font-family:var(--serif-cn);font-weight:300;font-size:0.5em;vertical-align:0.62em">♭</span>'));
      text(st.noteHz, `${hz(head.p).toFixed(2)} Hz`);
    }
    // the landing: the run ends on the lowest C
    const land = st.notes.filter((n) => n.p <= 25);
    if (land.length) {
      const age = u - land[0].s;
      if (age > 0 && age < 2.6) {
        const q = age / 2.6;
        ctx.lineWidth = 1.6 * (1 - q) + 0.3;
        for (const k of [1, 0.8, 0.6, 0.4]) { ctx.strokeStyle = rgba(EVA, 0.9 * (1 - q)); octagon(ctx, xOf(land[0].s), yOf(land[0].p), (30 + 520 * ease.out(q)) * k); }
      }
    }
    let bar = 48;
    st.bars.forEach((b, i) => { if (u >= b) bar = 48 + i; });
    text(st.bar, `BAR ${Math.min(bar, 60)} / 60 · ♩ = 129`);
    const vis = env(t, D.C.eva_ch + 0.3, D.C.eva_ch_end + 0.4, 0.4, 0.8);
    show(st.note, vis); show(st.bar, vis);
  },
};
