// Finale: Frieren's suite closes as a mandala, every note drawn at its moment (angle) and pitch (radius).
import { C, el, show, html, env, clamp, rgba, N, prog, ease, PURE } from '../lib.js';

const GOLD = '#cdb986', WHITE = '#ece7de';
const CX = PURE ? 960 : 700, CY = 540;               // centred when there are no words beside it

export default {
  bg: 'night',
  init(L, D) {
    const st = L.st, ui = L.ui, Cq = D.C;
    st.notes = D.frieren_b.notes.map(N);
    st.T = Cq.reb_src[1] - Cq.reb_src[0];
    st.bars = D.frieren_b.bars;
    if (PURE) return;
    const vq = { top: '210px', fontWeight: 300, fontSize: '46px', letterSpacing: '0.32em', lineHeight: 2.2, color: '#eee9e0' };
    st.q1 = el(ui, 'div', 'a vert', '音乐，是心灵<br>在不知不觉中进行的计数。', { right: '250px', ...vq });
    st.q1w = el(ui, 'div', 'a vert', '莱布尼茨　一七一二年', { right: '476px', top: '560px', fontSize: '19px', letterSpacing: '0.42em', color: 'rgba(236,231,222,0.5)' });
    st.q2 = el(ui, 'div', 'a vert', '也许打动你的，<br>正是这份不知不觉。', { right: '250px', ...vq });
    st.cred = el(ui, 'div', 'a', `
      <div class="kicker" style="margin-bottom:18px">把三首歌拆到只剩数字 &nbsp;·&nbsp; 第零话</div>
      <div><span class="k">钢琴改编</span>Animenz</div>
      <div><span class="k">原曲</span>残酷天使的行动纲领 · Sincerely · 葬送的芙莉莲 OST（Evan Call）</div>
      <div><span class="k">钢琴音源</span>Salamander Grand Piano V3 · Alexander Holm · CC BY 3.0</div>
      <div><span class="k">字体</span>思源宋体 · Cormorant Garamond · IBM Plex Mono · Courier Prime</div>
      <div><span class="k">画面与声音</span>由代码逐帧计算生成</div>`,
      { left: '1180px', top: '650px', fontFamily: 'var(--serif-cn)', fontSize: '17px', lineHeight: 2.1, color: 'rgba(236,231,222,0.78)', whiteSpace: 'nowrap', letterSpacing: '0.03em' });
    st.cred.querySelectorAll('.k').forEach((k) => Object.assign(k.style, { display: 'inline-block', width: '104px', fontFamily: 'var(--mono)', fontSize: '12.5px', letterSpacing: '0.16em', color: 'rgba(205,185,134,0.85)' }));
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, Cq = D.C;
    const u = t - Cq.reb;
    const ang = (s) => -Math.PI / 2 + (s / st.T) * Math.PI * 2;
    const rad = (p) => 112 + (p - 33) * 4.6;
    const out = 1 - prog(t, Cq.end - 1.4, Cq.end - 0.1);
    // centre: the closed star of fifths inside a gold ring
    const core = ease.out(prog(t, Cq.reb + 0.4, Cq.reb + 2.6)) * out;
    if (core > 0) {
      ctx.strokeStyle = rgba(C.violetHi, 0.55 * core); ctx.lineWidth = 0.9; ctx.beginPath();
      for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + (((7 * k) % 12) / 12) * Math.PI * 2; const x = CX + 62 * Math.cos(a), y = CY + 62 * Math.sin(a); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.6 * core); ctx.beginPath(); ctx.arc(CX, CY, 80, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, 92, 0, Math.PI * 2); ctx.strokeStyle = rgba(GOLD, 0.25 * core); ctx.stroke();
    }
    // guide rings and the turning playhead
    ctx.strokeStyle = rgba(GOLD, 0.12 * out); ctx.lineWidth = 0.7;
    for (const r of [rad(45), rad(69), rad(93)]) { ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke(); }
    for (const b of st.bars) {
      const a = ang(b);
      ctx.strokeStyle = rgba(GOLD, 0.16 * out); ctx.beginPath(); ctx.moveTo(CX + 104 * Math.cos(a), CY + 104 * Math.sin(a)); ctx.lineTo(CX + 116 * Math.cos(a), CY + 116 * Math.sin(a)); ctx.stroke();
    }
    if (u >= 0 && u <= st.T) {
      const a = ang(u);
      ctx.strokeStyle = rgba(GOLD, 0.45 * out); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(CX + 100 * Math.cos(a), CY + 100 * Math.sin(a)); ctx.lineTo(CX + 470 * Math.cos(a), CY + 470 * Math.sin(a)); ctx.stroke();
    }
    // the notes
    const climax = env(t, Cq.reb_bars[328], Cq.reb_bars[332] + 1.5, 1.2, 2.0);
    for (const n of st.notes) {
      if (n.s > u) break;
      const age = u - n.s, r = rad(n.p);
      const a0 = ang(n.s), a1 = ang(Math.min(n.s + n.d, u));
      const v = n.v / 127;
      ctx.strokeStyle = rgba(WHITE, (0.32 + 0.5 * v + 0.25 * climax) * out);
      ctx.lineWidth = 1.3 + 1.6 * v;
      ctx.beginPath(); ctx.arc(CX, CY, r, a0, Math.max(a0 + 0.004, a1)); ctx.stroke();
      if (age < 0.9) {
        const x = CX + r * Math.cos(a0), y = CY + r * Math.sin(a0), k = Math.exp(-age / 0.25);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 18); g.addColorStop(0, rgba(GOLD, 0.7 * k * out)); g.addColorStop(1, rgba(GOLD, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (climax > 0) {
      ctx.strokeStyle = rgba(GOLD, 0.35 * climax * out); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(CX, CY, rad(98), 0, Math.PI * 2); ctx.stroke();
    }
    if (PURE) return;
    show(st.q1, env(t, Cq.quote, Cq.line - 0.3, 1.2, 0.8));
    show(st.q1w, env(t, Cq.quote + 1.0, Cq.line - 0.3, 1.0, 0.8));
    show(st.q2, env(t, Cq.line, Cq.credits - 0.2, 1.2, 0.8));
    show(st.cred, env(t, Cq.credits, Cq.end - 0.2, 1.0, 1.2));
  },
};
