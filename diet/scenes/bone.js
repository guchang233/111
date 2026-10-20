// 四 · Sixteen comes once: bone mass by age (schematic logistic: ~90% of peak by 18). Starving from 14
// bends the curve; the gap never closes on the chart.
import { el, show, text, clamp, prog, ease, rgba } from '/film/lib.js';
import { RED, IV, slam, applySlam } from '../kit.js';

const X0 = 300, X1 = 1620, Y0 = 780, Y1 = 240;
const ax = (a) => X0 + (a / 30) * (X1 - X0), ay = (v) => Y0 - (v / 100) * (Y0 - Y1);
const B = (a) => 100 / (1 + Math.exp(-(a - 12.5) / 2.6));
const Bd = (a) => (a <= 14 ? B(a) : B(14) + (B(a) - B(14)) * 0.72);

export default {
  init(L, D) {
    const st = L.st, ui = L.ui;
    st.labs = [0, 10, 18, 30].map((a) => el(ui, 'div', 'a lab', `${a} 岁`, { left: `${ax(a) - 20}px`, top: `${Y0 + 18}px`, fontSize: '15px' }));
    st.yl = el(ui, 'div', 'a lab', '骨量 · 占一生峰值', { left: `${X0}px`, top: `${Y1 - 50}px`, fontSize: '15px' });
    st.age = el(ui, 'div', 'a num', '', { fontSize: '44px', color: IV });
    st.p90 = el(ui, 'div', 'a', '', { left: `${ax(18) + 40}px`, top: `${ay(89) + 70}px`, transformOrigin: '0 0' });
    el(st.p90, 'div', 'num', '90<span style="font-size:0.45em">%</span>', { fontSize: '140px', lineHeight: 1 });
    st.note = el(ui, 'div', 'a lab', '示意', { left: `${X1 - 40}px`, top: `${Y0 + 50}px`, fontSize: '14px' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, C = D.C, bar = C.bar, s0 = L.spec.start;
    const A = clamp((t - s0) / 0.4);
    ctx.strokeStyle = rgba(IV, 0.2 * A); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y0); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.stroke();
    ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(X0, ay(100)); ctx.lineTo(X1, ay(100)); ctx.stroke(); ctx.setLineDash([]);
    // adolescence window
    ctx.fillStyle = rgba(RED, 0.08 * A); ctx.fillRect(ax(10), Y1, ax(18) - ax(10), Y0 - Y1);
    const aNow = 30 * ease.io(prog(t, C.bone - bar * 0.5, C.bone + 1.5 * bar));
    const curve = (fn, a0, a1, col, lw, dash) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const a = a0 + ((a1 - a0) * i) / 200; i ? ctx.lineTo(ax(a), ay(fn(a))) : ctx.moveTo(ax(a), ay(fn(a))); }
      ctx.stroke(); ctx.setLineDash([]);
    };
    curve(B, 0, aNow, rgba(IV, 0.9 * A), 3);
    ctx.fillStyle = IV; ctx.beginPath(); ctx.arc(ax(aNow), ay(B(aNow)), 6, 0, Math.PI * 2); ctx.fill();
    st.age.style.left = `${ax(aNow) - 30}px`; st.age.style.top = `${ay(B(aNow)) + 20}px`;
    text(st.age, `${Math.floor(aNow)}`); show(st.age, A * clamp(aNow / 0.6) * (1 - prog(t, C.bone + 1.5 * bar, C.bone + 1.7 * bar)));
    if (aNow > 18) { ctx.strokeStyle = rgba(IV, 0.5); ctx.beginPath(); ctx.moveTo(ax(18), ay(B(18))); ctx.lineTo(ax(18), Y0); ctx.stroke(); }
    applySlam(st.p90, slam(t, C.bone + C.beat * 3.2, 1e9));
    // the bent curve and the gap
    const g = ease.io(prog(t, C.bone_gap, C.bone_gap + bar));
    if (g > 0) {
      const a1 = 14 + 16 * g;
      ctx.fillStyle = rgba(RED, 0.22 + 0.15 * Math.max(0, Math.sin((t - C.bone_gap) * 2.4)));
      ctx.beginPath(); ctx.moveTo(ax(14), ay(B(14)));
      for (let a = 14; a <= a1; a += 0.1) ctx.lineTo(ax(a), ay(B(a)));
      for (let a = a1; a >= 14; a -= 0.1) ctx.lineTo(ax(a), ay(Bd(a)));
      ctx.closePath(); ctx.fill();
      curve(Bd, 14, a1, RED, 3, [10, 8]);
    }
    st.labs.forEach((e) => show(e, A)); show(st.yl, A); show(st.note, A);
  },
};
