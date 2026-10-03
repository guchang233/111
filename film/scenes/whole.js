// The song, whole: the EVA phrase as a scrolling piano roll. Played notes burn bright, the score ahead waits.
import { C, el, show, html, env, clamp, rgba, N } from '../lib.js';

export default {
  bg: 'dark',
  init(L, D) {
    const st = L.st;
    st.notes = D.eva_phrase.notes.map(N);
    st.chords = D.eva_phrase.chords;
    el(L.ui, 'div', 'a kicker', 'SONG 01 &nbsp;·&nbsp; 残酷天使的行动纲领 &nbsp;·&nbsp; 钢琴改编 ANIMENZ', { left: '120px', top: '104px' });
    st.cap1 = el(L.ui, 'div', 'a cap', '这是一首歌。', { left: '0', right: '0', textAlign: 'center', top: '952px', color: '#eee9e0' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st;
    const u = t - D.C.phrase;                       // seconds into the phrase
    const SPEED = 150, PX = Math.min(1180, 380 + Math.max(u, 0) * SPEED);   // playhead walks in, then the roll scrolls
    const xOf = (s) => PX + (s - u) * SPEED;
    const yOf = (p) => 860 - ((p - 26) / (88 - 26)) * 640;
    // beat grid, very faint
    const beat = D.eva_phrase.bar / 4;
    ctx.lineWidth = 1;
    for (let k = 0; k <= 32; k++) {
      const x = xOf(k * beat);
      if (x < -10 || x > 1930) continue;
      ctx.strokeStyle = rgba(C.ivory, k % 4 === 0 ? 0.08 : 0.035);
      ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x, 880); ctx.stroke();
    }
    // notes
    for (const n of st.notes) {
      const x0 = xOf(n.s), x1 = xOf(n.s + n.d);
      if (x1 < -20 || x0 > 1940) continue;
      const y = yOf(n.p), mel = n.role === 'm', h = mel ? 7 : n.role === 'b' ? 5 : 4;
      const played = u >= n.s;
      const sounding = u >= n.s && u < n.s + n.d;
      const k = mel ? 1 : n.role === 'b' ? 0.62 : 0.5;
      let a = played ? (0.5 + 0.5 * (n.v / 127)) * k : 0.14 * k + 0.04;
      if (sounding) a = mel ? 1 : 0.85;
      ctx.fillStyle = rgba(sounding ? C.ivoryHi : C.ivory, a);
      const w = Math.max(2, x1 - x0 - 2);
      ctx.beginPath(); ctx.roundRect(x0, y - h / 2, w, h, h / 2); ctx.fill();
      if (sounding) {
        const g = ctx.createRadialGradient(PX, y, 0, PX, y, 22);
        g.addColorStop(0, rgba(C.ivoryHi, 0.45 * (n.v / 127))); g.addColorStop(1, rgba(C.ivoryHi, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(PX, y, 22, 0, Math.PI * 2); ctx.fill();
      }
    }
    // playhead
    ctx.strokeStyle = rgba(C.ivoryHi, 0.55); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PX, 190); ctx.lineTo(PX, 890); ctx.stroke();
    // chord names riding under the roll
    ctx.font = '400 19px "IBM Plex Mono"'; ctx.textBaseline = 'alphabetic';
    for (const c of st.chords) {
      const x = xOf(c.t);
      if (x < -60 || x > 1940) continue;
      const on = u >= c.t && u < c.t + c.d;
      ctx.fillStyle = rgba(C.ivory, on ? 0.92 : u > c.t ? 0.42 : 0.16);
      ctx.fillText(c.name, x + 4, 924);
    }
    show(st.cap1, env(t, D.C.eva_end - 2.6, D.C.eva_end + 0.6, 0.6, 0.5));
  },
};
