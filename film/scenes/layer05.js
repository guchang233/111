// LAYER 05 · 音色 → LAYER 06 · 波
// Frieren's theme blooms on a faint magic circle; then one note, A4, is taken apart into rotating
// circles (its real measured partials), which are removed one by one until a single sine remains.
import { C, el, show, html, text, env, clamp, rgba, N, prog, ease } from '../lib.js';

const GOLD = '#cdb986', WHITE = '#ece7de';
const CX = 640, CY = 566, R0 = 352, R1 = 330, R2 = 298, R3 = 272, K = 118;
const WX = 1112, WW = 690;
const TURN = 2.6;                                   // seconds per visual turn of the fundamental

export default {
  bg: 'night',
  glyphs: '0123456789.f·◦ n=…○→×aₙΣ()+φπ',
  init(L, D) {
    const st = L.st, ui = L.ui, Cq = D.C;
    st.notes = D.frieren_a.notes.map(N);
    st.parts = D.a4.partials;                       // [[freq, amp], ...] measured from the A4 sample
    st.amp = st.parts.map((p) => p[1]);
    st.ph = st.amp.map((_, i) => 0.37 * (i + 1));    // the same phases the soundtrack uses
    st.kick = el(ui, 'div', 'a kicker', '', { left: '120px', top: '104px' });
    st.src = el(ui, 'div', 'a kicker', 'SONG 03 &nbsp;·&nbsp; 葬送的芙莉莲 · 组曲 &nbsp;·&nbsp; 钢琴改编 ANIMENZ', { left: '120px', bottom: '84px' });
    st.one = el(ui, 'div', 'a', '只取一个音：<span class="serif-en" style="font-size:1.25em">A</span>。', {
      left: '0', width: '1280px', textAlign: 'center', top: '960px', fontFamily: 'var(--serif-cn)', fontSize: '30px', letterSpacing: '0.08em', color: '#eee9e0' });
    st.head = el(ui, 'div', 'a', '', { right: '120px', top: '98px', textAlign: 'right' });
    st.h1 = el(st.head, 'div', '', '一个音，是一组旋转的圆。', { fontFamily: 'var(--serif-cn)', fontWeight: 300, fontSize: '46px', letterSpacing: '0.08em', color: '#eee9e0' });
    st.h2 = el(st.head, 'div', '', 'x(t) = Σ a<sub style="font-size:0.6em">n</sub> sin(2π n f t + φ<sub style="font-size:0.6em">n</sub>)', { fontFamily: 'var(--serif-en)', fontStyle: 'italic', fontSize: '30px', color: 'rgba(205,185,134,0.9)', marginTop: '18px' });
    st.h3 = el(ui, 'div', 'a', '', { right: '120px', top: '98px', textAlign: 'right', fontFamily: 'var(--serif-cn)', fontWeight: 300, fontSize: '46px', letterSpacing: '0.08em', color: '#eee9e0', whiteSpace: 'nowrap' });
    st.legend = el(ui, 'div', 'a mono', `n = 1 … 12 &nbsp;<b style="color:${GOLD};font-weight:400">○</b>&nbsp; 每个圆 = 一个泛音<br>半径 = 实测振幅 a<sub>n</sub> &nbsp;·&nbsp; 转速 = n × f`,
      { right: '120px', bottom: '84px', fontSize: '12.5px', letterSpacing: '0.14em', color: 'rgba(236,231,222,0.45)', textAlign: 'right', lineHeight: 2 });
    st.hz = el(ui, 'div', 'a', '<span class="mono" style="font-size:88px;font-weight:300">440</span><span class="kicker" style="margin-left:16px">HZ · 每秒振动 440 次</span>',
      { left: `${WX}px`, top: '760px', whiteSpace: 'nowrap', color: '#eee9e0' });
    st.count = el(ui, 'div', 'a mono', '', { left: `${WX}px`, top: '905px', fontSize: '14px', letterSpacing: '0.18em', color: 'rgba(236,231,222,0.55)', whiteSpace: 'nowrap' });
    // inscription ring: the measured recipe of the A4, written around the circle
    const Rt = (R1 + R2) / 2 - 5;
    const words = st.parts.map((p, i) => `${i + 1}f · ${p[1].toFixed(3)}`).join('   ◦   ') + '   ◦   ';
    st.ring = el(ui, 'div', 'a', `<svg width="${2 * R0}" height="${2 * R0}" viewBox="${-R0} ${-R0} ${2 * R0} ${2 * R0}" style="overflow:visible">
      <defs><path id="insc" d="M ${-Rt} 0 a ${Rt} ${Rt} 0 1 1 ${2 * Rt} 0 a ${Rt} ${Rt} 0 1 1 ${-2 * Rt} 0"/></defs>
      <text font-family="IBM Plex Mono" font-size="13.5" fill="${GOLD}" letter-spacing="0.16em" opacity="0.85">
      <textPath href="#insc" textLength="${(2 * Math.PI * Rt - 8).toFixed(1)}" lengthAdjust="spacing">${words}</textPath></text></svg>`,
      { left: `${CX - R0}px`, top: `${CY - R0}px`, width: `${2 * R0}px`, height: `${2 * R0}px`, transformOrigin: '50% 50%' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, Cq = D.C;
    const u = t - Cq.fri_a;                                         // into the theme
    const fullIn = ease.io(prog(t, Cq.a4_additive - 0.4, Cq.a4_additive + 1.4));   // magic circle fully drawn
    const ringA = 0.18 + 0.72 * fullIn;
    const fade = 1 - prog(t, Cq.l6_fade, Cq.l6_fade + 0.9);
    const rot = t * 0.035;
    // ---- rings, ticks, dodecagon, star {12/5} ----
    ctx.save(); ctx.translate(CX, CY); ctx.rotate(rot * 0.5);
    ctx.strokeStyle = rgba(GOLD, 0.8 * ringA * fade); ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(0, 0, R0, 0, Math.PI * 2 * Math.max(0.0001, 0.2 + 0.8 * fullIn)); ctx.stroke();
    ctx.lineWidth = 0.6; ctx.strokeStyle = rgba(GOLD, 0.55 * ringA * fade);
    for (const r of [R1, R2]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([1, 5]); ctx.strokeStyle = rgba(GOLD, 0.32 * ringA * fade); ctx.beginPath(); ctx.arc(0, 0, R3, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 360; i++) {
      const a = (i / 360) * Math.PI * 2, long = i % 30 === 0, mid = i % 10 === 0;
      const r2 = R0 - (long ? 16 : mid ? 9 : 4);
      ctx.strokeStyle = rgba(GOLD, (long ? 0.9 : 0.5) * ringA * fade); ctx.lineWidth = long ? 1.1 : 0.6;
      ctx.beginPath(); ctx.moveTo(R0 * Math.cos(a), R0 * Math.sin(a)); ctx.lineTo(r2 * Math.cos(a), r2 * Math.sin(a)); ctx.stroke();
    }
    ctx.strokeStyle = rgba(GOLD, 0.38 * ringA * fade); ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + (i / 12) * Math.PI * 2; i ? ctx.lineTo(R3 * Math.cos(a), R3 * Math.sin(a)) : ctx.moveTo(R3 * Math.cos(a), R3 * Math.sin(a)); }
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.16 * ringA * fade);
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI * 2, b = -Math.PI / 2 + (((i + 5) % 12) / 12) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(R3 * Math.cos(a), R3 * Math.sin(a)); ctx.lineTo(R3 * Math.cos(b), R3 * Math.sin(b)); ctx.stroke();
    }
    ctx.restore();
    st.ring.style.transform = `rotate(${(-rot * 180 / Math.PI).toFixed(3)}deg)`;
    show(st.ring, fullIn * fade);

    // ---- the theme: each note blooms where its pitch lives (A at the top) ----
    const thVis = 1 - prog(t, Cq.a4_additive - 0.6, Cq.a4_additive + 0.6);
    if (thVis > 0) {
      for (const n of st.notes) {
        if (n.s > u) break;
        const age = u - n.s;
        const a = -Math.PI / 2 + (((n.p - 9) % 12 + 12) % 12) / 12 * Math.PI * 2;
        const r = 70 + (n.p - 45) * 5.4;
        const x = CX + r * Math.cos(a), y = CY + r * Math.sin(a);
        const ring = clamp(1 - age / 1.6);
        if (ring > 0) {
          ctx.strokeStyle = rgba(GOLD, 0.95 * ring * thVis); ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.arc(x, y, 3 + 26 * ease.out(1 - ring), 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = rgba(WHITE, Math.min(1, (0.45 + 0.55 * Math.exp(-age / 0.8)) * thVis * (0.35 + n.v / 110)));
        ctx.beginPath(); ctx.arc(x, y, 2.6 + 2.4 * Math.exp(-age / 0.3), 0, Math.PI * 2); ctx.fill();
      }
    }
    // ---- the single A4 ----
    const a4age = t - Cq.a4;
    if (a4age > 0 && t < Cq.a4_additive + 0.8) {
      const k = Math.exp(-a4age / 1.8);
      const x = CX, y = CY - (70 + (69 - 45) * 5.4);
      ctx.strokeStyle = rgba(WHITE, 0.9 * k); ctx.lineWidth = 1.2;
      for (const d of [0, 0.35, 0.7]) { const q = clamp((a4age - d) / 1.6); if (q > 0 && q < 1) { ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.arc(x, y, 6 + 90 * ease.out(q), 0, Math.PI * 2); ctx.stroke(); } }
      ctx.globalAlpha = 1;
      ctx.fillStyle = rgba(WHITE, 0.95); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    }
    show(st.one, env(t, Cq.a4 + 0.2, Cq.a4_additive + 1.4, 0.4, 0.6));

    // ---- epicycles and the waveform they draw ----
    const ep = fullIn * fade;
    if (ep > 0.001) {
      const g = st.amp.map((_, i) => {                              // harmonic gains (removal schedule)
        const n = i + 1, idx = 12 - n;
        if (idx >= Cq.l6_drop.length) return 1;
        return clamp(1 - (t - Cq.l6_drop[idx]) / 0.25);
      });
      const th0 = (t - Cq.a4_additive) * (2 * Math.PI / TURN);
      const yOf = (th) => st.amp.reduce((s, a, i) => s + a * g[i] * Math.sin((i + 1) * th + st.ph[i]), 0);
      const norm = 1 / st.amp.reduce((s, a) => s + a, 0) * 2.2;
      let x = CX, y = CY;
      const joints = [];
      st.amp.forEach((a, i) => {
        if (g[i] <= 0.001) return;
        const n = i + 1, r = a * g[i] * K * norm * 1.6, angle = n * th0 + st.ph[i];
        ctx.strokeStyle = rgba(i === 0 ? WHITE : GOLD, Math.max(0.3, 0.85 - i * 0.05) * ep); ctx.lineWidth = i === 0 ? 0.9 : 0.8;
        ctx.beginPath(); ctx.arc(x, y, Math.max(r, 0.5), 0, Math.PI * 2); ctx.stroke();
        const nx = x + r * Math.cos(angle), ny = y - r * Math.sin(angle);
        ctx.strokeStyle = rgba(WHITE, 0.85 * ep); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
        joints.push([x, y]); x = nx; y = ny;
      });
      for (const [jx, jy] of joints) { ctx.fillStyle = rgba(WHITE, 0.85 * ep); ctx.beginPath(); ctx.arc(jx, jy, 2.2, 0, Math.PI * 2); ctx.fill(); }
      const scale = K * norm * 1.6;
      const tipY = CY - yOf(th0) * scale;
      ctx.strokeStyle = rgba(WHITE, 0.6 * ep); ctx.lineWidth = 0.8; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(WX, tipY); ctx.stroke(); ctx.setLineDash([]);
      const gl = ctx.createRadialGradient(x, y, 0, x, y, 26); gl.addColorStop(0, rgba(GOLD, 0.55 * ep)); gl.addColorStop(1, rgba(GOLD, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(WHITE, ep); ctx.beginPath(); ctx.arc(x, y, 3.4, 0, Math.PI * 2); ctx.fill();
      // the trace: past values of the tip, newest at the left
      const PER = 2.2, span = Math.min(PER * 2 * Math.PI, Math.max(0, th0));
      ctx.strokeStyle = rgba(WHITE, 0.95 * ep); ctx.lineWidth = 1.6; ctx.beginPath();
      const steps = 900;
      for (let i = 0; i <= steps; i++) {
        const q = i / steps, th = th0 - q * span;
        const px = WX + q * WW * (span / (PER * 2 * Math.PI)), py = CY - yOf(th) * scale;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.4 * ep); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(WX, CY); ctx.lineTo(WX + WW, CY); ctx.stroke();
      ctx.fillStyle = rgba(WHITE, ep); ctx.beginPath(); ctx.arc(WX, tipY, 3.4, 0, Math.PI * 2); ctx.fill();
      const live = g.filter((v) => v > 0.5).length;
      text(st.count, t >= Cq.l6_in ? `HARMONICS · ${String(live).padStart(2, '0')} / 12` : 'HARMONICS · 12 / 12');
    }
    show(st.count, env(t, Cq.a4_additive + 0.8, Cq.l6_fade + 0.6, 0.5, 0.5));
    // ---- type ----
    const l6 = t >= Cq.l6_in;
    html(st.kick, l6 ? 'LAYER 06 <em style="color:var(--frieren)">/</em> 06 &nbsp;·&nbsp; WAVE' : 'LAYER 05 <em style="color:var(--frieren)">/</em> 06 &nbsp;·&nbsp; TIMBRE');
    show(st.kick, env(t, Cq.fri_a + 0.4, Cq.l6_fade + 0.8, 0.6, 0.6));
    show(st.src, env(t, Cq.fri_a + 0.4, Cq.a4 + 0.4, 0.6, 0.6));
    show(st.head, env(t, Cq.a4_additive + 0.9, Cq.l6_in + 0.2, 0.6, 0.4));
    show(st.legend, env(t, Cq.a4_additive + 1.5, Cq.l6_pure, 0.6, 0.5));
    html(st.h3, t < Cq.l6_pure ? '去掉泛音，一个，一个。' : '只剩一条正弦波。');
    show(st.h3, env(t, Cq.l6_in + 0.3, Cq.l6_fade + 0.6, 0.5, 0.5));
    show(st.hz, env(t, Cq.l6_pure + 0.3, Cq.l6_fade + 0.6, 0.6, 0.5));
  },
};
