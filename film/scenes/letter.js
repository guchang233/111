// II · Sincerely, first chorus: the melody is typed out as a letter, one bar per line, each note
// struck where it falls in time. The chorus lines come out in Violet's emerald. Signed "Sincerely,".
import { C, el, show, html, env, clamp, rgba, N, rng, noteName, PURE } from '../lib.js';

const X0 = 300, X1 = 1600, Y0 = 214, LH = 42;

export default {
  bg: 'dark',
  glyphs: 'ABCDEFG♯♭0123456789Sincerely,',
  init(L, D) {
    const st = L.st, ui = L.ui, dat = D.sin_a;
    st.bars = dat.bars;                                   // bar downbeats, seconds from the segment start
    st.dur = dat.dur;
    const mel = dat.notes.map(N).filter((n) => n.role === 'm');
    if (PURE) {                                           // no letters: each note is a point of light on its line,
      st.dots = [];                                       // lifted or lowered by its pitch, so every line keeps the contour
      for (const n of mel) {
        let bi = 0;
        while (bi + 1 < st.bars.length && st.bars[bi + 1] <= n.s + 1e-6) bi++;
        if (bi >= 16) continue;
        const b0 = st.bars[bi], b1 = st.bars[bi + 1] ?? st.dur;
        st.dots.push({ s: n.s, p: n.p, v: n.v / 127, bi, x: X0 + ((n.s - b0) / (b1 - b0)) * (X1 - X0) });
      }
      for (let bi = 0; bi < 16; bi++) {
        const row = st.dots.filter((d) => d.bi === bi);
        const mean = row.reduce((a, d) => a + d.p, 0) / Math.max(1, row.length);
        for (const d of row) d.y = Y0 + bi * LH + 18 - clamp((d.p - mean) * 2.2, -15, 15);
      }
      return;
    }
    el(ui, 'div', 'a kicker', 'II &nbsp;·&nbsp; SINCERELY &nbsp;·&nbsp; 紫罗兰永恒花园 OP &nbsp;·&nbsp; 钢琴改编 ANIMENZ', { left: '120px', top: '104px' });
    const R = rng(1584);
    st.glyphs = [];
    for (const n of mel) {
      let bi = 0;
      while (bi + 1 < st.bars.length && st.bars[bi + 1] <= n.s + 1e-6) bi++;
      if (bi >= 16) continue;
      const b0 = st.bars[bi], b1 = st.bars[bi + 1] ?? st.dur;
      const x = X0 + ((n.s - b0) / (b1 - b0)) * (X1 - X0);
      const chorus = bi >= 8;                             // bars 68–75
      const g = el(ui, 'span', 'a', noteName(n.p).replace('♯', '<span style="font-size:0.7em">♯</span>').replace('♭', '<span style="font-size:0.7em">♭</span>'), {
        left: `${x.toFixed(1)}px`, top: `${Y0 + bi * LH}px`, fontFamily: 'var(--type)', fontSize: chorus ? '25px' : '23px',
        color: chorus ? C.violetHi : '#e9e4da', whiteSpace: 'nowrap',
        transform: `translateY(${((R() - 0.5) * 1.6).toFixed(2)}px) rotate(${((R() - 0.5) * 0.8).toFixed(2)}deg)`,
        textShadow: `0 0 ${(0.4 + R() * 0.6).toFixed(2)}px rgba(236,231,222,0.35)`,
      });
      g._s = n.s; g._ink = (0.62 + 0.38 * (n.v / 127)) * (0.86 + R() * 0.14);
      st.glyphs.push(g);
    }
    st.caret = el(ui, 'span', 'a', '', { width: '3px', height: '26px', background: C.violet });
    st.sign = el(ui, 'div', 'a', '', { left: '1300px', top: `${Y0 + 16 * LH + 14}px`, fontFamily: 'var(--type)', fontSize: '34px', color: '#e9e4da', whiteSpace: 'nowrap' });
    st.signText = 'Sincerely,';
    st.signSpans = [...st.signText].map((c) => el(st.sign, 'span', 'ch', c));
    st.signCaret = el(st.sign, 'span', 'caret');
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, Cq = D.C;
    const u = t - Cq.sin_a;
    // ruled lines, like night letter paper
    ctx.strokeStyle = rgba(C.ivory, 0.055); ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) { const y = Y0 + i * LH + 33; ctx.beginPath(); ctx.moveTo(X0 - 30, y); ctx.lineTo(X1 + 110, y); ctx.stroke(); }
    ctx.strokeStyle = rgba(C.violet, 0.18); ctx.beginPath(); ctx.moveTo(X0 - 52, Y0 - 10); ctx.lineTo(X0 - 52, Y0 + 16 * LH + 40); ctx.stroke();
    if (PURE) return drawDots(ctx, st, u);
    let last = null;
    for (const g of st.glyphs) {
      const on = u >= g._s;
      show(g, on ? g._ink * clamp((u - g._s) / 0.04) : 0);
      if (on) last = g;
    }
    if (last && u < st.dur - 0.9) {
      st.caret.style.left = (parseFloat(last.style.left) + last.offsetWidth + 6) + 'px';
      st.caret.style.top = (parseFloat(last.style.top) + 2) + 'px';
      show(st.caret, 1);
    } else show(st.caret, 0);
    // the sign-off over the last bar, typed
    const s0 = st.dur - 1.15, step = 0.08;
    st.signSpans.forEach((sp, i) => show(sp, u >= s0 + i * step ? 0.92 : 0));
    const done = u >= s0 + st.signSpans.length * step;
    show(st.signCaret, u >= s0 - 0.2 ? (done ? (Math.floor((u - s0) / 0.4) % 2 ? 0 : 1) : 1) : 0);
  },
};

function drawDots(ctx, st, u) {
  let prev = null, last = null;
  for (const d of st.dots) {
    if (d.s > u) break;
    const chorus = d.bi >= 8, col = chorus ? C.violetHi : C.ivoryHi, age = u - d.s;
    if (prev && prev.bi === d.bi) {                     // the line of the melody, like a pen stroke
      ctx.strokeStyle = rgba(col, (chorus ? 0.42 : 0.26) * clamp(age / 0.08));
      ctx.lineWidth = chorus ? 1.2 : 0.9;
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    }
    const k = Math.exp(-age / 0.35);
    if (k > 0.02) {
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, 26);
      g.addColorStop(0, rgba(col, 0.5 * k * (0.4 + d.v))); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, 26, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = rgba(col, (0.55 + 0.45 * d.v) * clamp(age / 0.04));
    ctx.beginPath(); ctx.arc(d.x, d.y, (chorus ? 2.6 : 2.0) + 1.8 * d.v + 2.2 * k, 0, Math.PI * 2); ctx.fill();
    prev = d; last = d;
  }
  if (last && u < st.dur - 0.4) {                        // the caret follows the pen
    const y = Y0 + last.bi * LH + 5;
    ctx.fillStyle = rgba(C.violet, 0.9); ctx.fillRect(last.x + 12, y, 3, 26);
  }
}
