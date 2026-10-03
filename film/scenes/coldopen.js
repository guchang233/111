// Cold open: the EVA intro arpeggios appear as a constellation; Kaworu's line; the tempo slows into numbers.
import { C, el, show, text, env, clamp, rgba, N, prog, PURE } from '../lib.js';

export default {
  bg: 'dark',
  init(L, D) {
    const ui = L.ui;
    L.st.notes = D.eva_intro.notes.map(N).filter((n) => n.s < (PURE ? D.C.phrase : D.C.title_in));
    if (PURE) return;
    L.st.epi = el(ui, 'div', 'a vert', '歌真是好东西啊。', {
      right: '230px', top: '250px', fontWeight: 300, fontSize: '50px', letterSpacing: '0.34em', color: '#eee9e0',
    });
    L.st.who = el(ui, 'div', 'a vert', '渚薰　《新世纪福音战士》', {
      right: '330px', top: '560px', fontSize: '20px', letterSpacing: '0.42em', color: 'rgba(236,231,222,0.5)',
    });
    L.st.tempo = el(ui, 'div', 'a', '', { left: '200px', top: '880px', whiteSpace: 'nowrap' });
    L.st.tLabel = el(L.st.tempo, 'div', 'kicker', 'TEMPO · 每分钟拍数');
    L.st.tNum = el(L.st.tempo, 'div', 'mono', '158', { fontSize: '64px', fontWeight: 300, color: '#eee9e0', marginTop: '10px', letterSpacing: '0.02em' });
    L.st.tempos = D.eva_intro.tempos;
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, Cq = D.C;
    const xOf = (s) => 200 + (s / 15.5) * 1260;
    const yOf = (p) => 900 - ((p - 36) / (98 - 36)) * 700;
    const dim = PURE ? 1 : 1 - 0.55 * prog(t, Cq.eva_pause, Cq.title_in);
    // constellation lines between consecutive notes of the same hand
    ctx.lineWidth = 0.7;
    for (const tr of [0, 1]) {
      let prev = null;
      for (const n of st.notes) {
        if (n.tr !== tr) continue;
        if (n.s > t) break;
        if (prev && n.s - prev.s < 0.9) {                // no strokes across the pause
          const a = clamp((t - n.s) / 0.25) * 0.24 * dim;
          ctx.strokeStyle = rgba(C.ivory, a);
          ctx.beginPath(); ctx.moveTo(xOf(prev.s), yOf(prev.p)); ctx.lineTo(xOf(n.s), yOf(n.p)); ctx.stroke();
        }
        prev = n;
      }
    }
    // stars
    for (const n of st.notes) {
      if (n.s > t) break;
      const age = t - n.s;
      const x = xOf(n.s), y = yOf(n.p);
      const bloom = Math.exp(-age / 0.22);
      const r = (1.7 + n.v / 60) * (1 + 2.4 * bloom);
      const a = (0.45 + 0.55 * Math.exp(-age / 1.1)) * dim;
      if (bloom > 0.02) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
        g.addColorStop(0, rgba(C.ivoryHi, 0.35 * bloom * dim)); g.addColorStop(1, rgba(C.ivoryHi, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = rgba(C.ivoryHi, a);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    if (PURE) return;
    show(st.epi, env(t, 0.7, 9.3, 1.4, 0.9));
    show(st.who, env(t, 1.6, 9.3, 1.4, 0.9));
    // tempo readout during the ritardando
    let bpm = st.tempos[0][1];
    for (const [ts, b] of st.tempos) if (ts <= t) bpm = b;
    text(st.tNum, String(Math.round(bpm)));
    show(st.tempo, env(t, Cq.eva_rit - 0.5, Cq.title_in, 0.5, 0.6));
  },
};
