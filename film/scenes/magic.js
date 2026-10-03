// III · Frieren's A-major theme inside a magic circle. Every note blooms where its pitch lives on the
// circle; the twelve rotating circles carry the measured recipe of a piano tone, turn at the speed of
// the sounding melody note and swell when it is struck; to the right, its waveform (higher notes pack
// more cycles in).
import { C, el, show, html, text, env, clamp, rgba, N, prog, ease, PURE } from '../lib.js';

const GOLD = '#cdb986', WHITE = '#ece7de';
const CX = 640, CY = 566, R0 = 352, R1 = 330, R2 = 298, R3 = 272, K = 118;
const WX = 1112, WW = 690;
const TURN = 4.0;                                   // seconds per visual turn of A4's fundamental

export default {
  bg: 'night',
  glyphs: '0123456789.f·◦ n=…○→×aₙΣ()+φπ',
  init(L, D) {
    const st = L.st, ui = L.ui, Cq = D.C;
    st.notes = D.frieren_a.notes.map(N);
    st.parts = D.a4.partials;                       // [[freq, amp], ...] measured from the A4 sample
    st.amp = st.parts.map((p) => p[1]);
    st.ph = st.amp.map((_, i) => 0.37 * (i + 1));    // the same phases the soundtrack uses
    st.src = PURE ? null : el(ui, 'div', 'a kicker', 'III &nbsp;·&nbsp; 葬送的芙莉莲 · 组曲 &nbsp;·&nbsp; 钢琴改编 ANIMENZ', { left: '120px', top: '104px' });
    // the melody's phase, integrated so the circles turn at the speed of the sounding note; the
    // trace's cycles-per-width glides to each new note; the swell follows each strike
    const mel = [];
    for (const n of st.notes) { const l = mel[mel.length - 1]; if (l && Math.abs(n.s - l.s) < 0.02) { if (n.p > l.p) mel[mel.length - 1] = n; } else mel.push(n); }
    st.dt = 1 / 120;
    st.theta = [0]; st.per = []; st.amp1 = [];
    let cur = mel[0] ? mel[0].p : 69, per = 2.2 * Math.pow(2, (cur - 69) / 12), last = null, mi = 0;
    for (let k = 0; k * st.dt <= Cq.reb - Cq.fri_a + 1.5; k++) {
      const tt = k * st.dt;
      while (mi < mel.length && mel[mi].s <= tt) { last = mel[mi]; cur = last.p; mi++; }
      per += (2.2 * Math.pow(2, (cur - 69) / 12) - per) * (1 - Math.exp(-st.dt / 0.07));
      st.per.push(per);
      st.amp1.push(0.62 + (last ? 0.38 * (last.v / 127) * Math.exp(-(tt - last.s) / 0.8) : 0));
      st.theta.push(st.theta[k] + (2 * Math.PI / TURN) * Math.pow(2, (cur - 69) / 12) * st.dt);
    }
    // inscription ring: the measured recipe of the A4, written around the circle
    const Rt = (R1 + R2) / 2 - 5;
    if (PURE) return;
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
    const fullIn = ease.io(prog(t, Cq.fri_a - 0.2, Cq.fri_a + 1.6));               // magic circle drawn in
    const ringA = 0.18 + 0.72 * fullIn;
    const fade = 1 - prog(t, Cq.reb - 0.4, Cq.reb + 0.8);
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
    if (st.ring) st.ring.style.transform = `rotate(${(-rot * 180 / Math.PI).toFixed(3)}deg)`;
    if (st.ring) show(st.ring, fullIn * fade);

    // ---- the theme: each note blooms where its pitch lives (A at the top) ----
    const thVis = fade;
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
    // ---- epicycles and the waveform they draw ----
    const ep = fullIn * fade;
    if (ep > 0.001) {
      const kNow = clamp(Math.floor(u / st.dt), 0, st.per.length - 1);
      const th0 = st.theta[kNow], sw = st.amp1[kNow];
      const g = st.amp.map(() => sw);
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
      // the trace: the tip's past, newest at the left, as if the note had always been sounding
      ctx.strokeStyle = rgba(WHITE, 0.9 * ep); ctx.lineWidth = 1.35; ctx.lineJoin = 'round'; ctx.beginPath();
      const steps = 1100, cyc = st.per[kNow] * 2 * Math.PI;
      for (let i = 0; i <= steps; i++) {
        const q = i / steps, px = WX + q * WW, py = CY - yOf(th0 - q * cyc) * scale;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.4 * ep); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(WX, CY); ctx.lineTo(WX + WW, CY); ctx.stroke();
      ctx.fillStyle = rgba(WHITE, ep); ctx.beginPath(); ctx.arc(WX, tipY, 3.4, 0, Math.PI * 2); ctx.fill();
    }
    if (st.src) show(st.src, env(t, Cq.fri_a + 0.2, Cq.reb, 0.6, 0.6));
  },
};
