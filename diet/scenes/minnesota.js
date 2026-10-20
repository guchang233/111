// 二 · Minnesota, 1944: 36 men, 1570 kcal a day for 24 weeks. Weight falls 25%; when they may eat again,
// fat comes back past where it started (+4 kg on average; Dulloo 1997). Curves are schematic, labelled so.
import { el, show, text, clamp, prog, ease, rgba } from '/film/lib.js';
import { RED, IV, slam, applySlam, pulse } from '../kit.js';

const GX0 = 240, GX1 = 1680, GY0 = 760, GY1 = 220;             // graph box
const wk = (w) => GX0 + (w / 44) * (GX1 - GX0);
const yv = (v) => GY0 - ((v - 20) / (150 - 20)) * (GY0 - GY1);  // % of start
const weight = (w) => (w <= 24 ? 100 - 25 * ease.out(w / 24) : 75 + 27 * ease.out(Math.min(1, (w - 24) / 20)));
const fat = (w) => (w <= 24 ? 100 - 70 * ease.out(w / 24) : 30 + 110 * ease.io(Math.min(1, (w - 24) / 18)));

export default {
  init(L, D) {
    const st = L.st, ui = L.ui;
    st.year = el(ui, 'div', 'a heavy', '1944', { right: '230px', top: '300px', fontSize: '300px', color: 'transparent', WebkitTextStroke: '1.5px rgba(236,231,222,0.85)' });
    st.cal = el(ui, 'div', 'a', '', { right: '230px', top: '250px', textAlign: 'right', transformOrigin: '100% 50%' });
    el(st.cal, 'div', 'num', '1570', { fontSize: '230px', lineHeight: 1 });
    el(st.cal, 'div', 'lab', '大卡 / 天 &nbsp;·&nbsp; 连续 24 周', { marginTop: '18px' });
    st.vs = el(ui, 'div', 'a', '', { right: '230px', top: '560px', textAlign: 'right' });
    st.vsN = el(st.vs, 'div', 'num', '1200', { fontSize: '110px', lineHeight: 1, color: RED, position: 'relative' });
    el(st.vs, 'div', 'lab', '网上流行的「减肥餐」', { marginTop: '12px' });
    st.gl = [['体重', IV, 0], ['脂肪量', RED, 1]].map(([n, c]) => el(ui, 'div', 'a lab', n, { color: c }));
    st.note = el(ui, 'div', 'a lab', '曲线为示意 &nbsp;·&nbsp; 据 Keys 1950；Dulloo 1997', { left: `${GX0}px`, top: `${GY0 + 56}px`, fontSize: '14px' });
    st.axis = [['0', 0], ['24 周 · 恢复进食', 24], ['44 周', 44]].map(([n, w]) => el(ui, 'div', 'a lab', n, { left: `${wk(w)}px`, top: `${GY0 + 16}px`, fontSize: '14px' }));
    st.base = el(ui, 'div', 'a lab', '挨饿前', { left: `${GX1 + 16}px`, top: `${yv(100) - 10}px`, fontSize: '14px' });
    st.plus = el(ui, 'div', 'a', '', { left: `${wk(38) - 80}px`, top: `${yv(140) - 210}px`, transformOrigin: '50% 100%' });
    el(st.plus, 'div', 'num', '+4<span style="font-size:0.45em"> kg</span>', { fontSize: '150px', lineHeight: 1, color: RED });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, C = D.C, bar = C.bar, s0 = L.spec.start;
    pulse(ctx, t, C.beat, 0.35 + 0.65 * prog(t, C.m_curve, C.m_end));
    // 36 men
    const gridA = clamp((t - s0 - bar) / 0.3) * (1 - prog(t, C.m_curve - 0.3, C.m_curve));
    if (gridA > 0) {
      for (let i = 0; i < 36; i++) {
        const lit = clamp((t - s0 - bar - (i / 36) * 4 * C.beat) / 0.12);
        const x = 300 + (i % 6) * 74, y = 330 + Math.floor(i / 6) * 74;
        ctx.strokeStyle = rgba(IV, 0.35 * gridA); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = rgba(IV, 0.9 * lit * gridA); ctx.beginPath(); ctx.arc(x, y, 13 * (1 - 0.12 * prog(t, C.m_1570, C.m_curve)), 0, Math.PI * 2); ctx.fill();
      }
    }
    show(st.year, clamp((t - s0) / 0.2) * (1 - prog(t, C.m_1570 - 0.1, C.m_1570)));
    const cs = slam(t, C.m_1570, C.m_curve - C.m_1570 - 0.3, 0.3); applySlam(st.cal, cs);
    show(st.vs, clamp((t - C.m_1570 - bar) / 0.15) * (1 - prog(t, C.m_curve - 0.3, C.m_curve)));
    if (t > C.m_1570 + bar && t < C.m_curve) {           // strike the 1200 through
      const k = ease.out(clamp((t - C.m_1570 - bar - C.beat) / 0.25));
      ctx.strokeStyle = RED; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(1690 - 260, 620); ctx.lineTo(1690 - 260 + 260 * k, 620 - 0 * k); ctx.stroke();
    }
    // the graph
    const gA = clamp((t - C.m_curve) / 0.3);
    if (gA <= 0) { st.gl.forEach((e) => show(e, 0)); st.axis.forEach((e) => show(e, 0)); show(st.note, 0); show(st.base, 0); show(st.plus, 0); return; }
    const dimSym = 1 - 0.75 * (prog(t, C.m_curve + bar, C.m_curve + bar + 0.3) - prog(t, C.m_end - 0.3, C.m_end));
    const a = gA * dimSym;
    ctx.strokeStyle = rgba(IV, 0.18 * a); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(GX0, GY0); ctx.lineTo(GX1, GY0); ctx.stroke();
    ctx.setLineDash([5, 7]); ctx.strokeStyle = rgba(IV, 0.4 * a);
    ctx.beginPath(); ctx.moveTo(GX0, yv(100)); ctx.lineTo(GX1, yv(100)); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(RED, 0.5 * a * clamp((t - C.m_end) / 0.3));
    ctx.beginPath(); ctx.moveTo(wk(24), GY1 - 20); ctx.lineTo(wk(24), GY0); ctx.stroke();
    // weight: drawn to week 24 over bars 19–20, then to 44 after the experiment ends
    const wNow = t < C.m_end ? 24 * ease.io(prog(t, C.m_curve, C.m_curve + 2 * bar)) : 24 + 20 * ease.io(prog(t, C.m_end + bar, C.m_fat));
    const fNow = t < C.m_fat ? -1 : 44 * ease.io(prog(t, C.m_fat, C.m_fat + 0.9 * bar));
    const curve = (fn, w1, col, lw) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const w = (w1 * i) / 200; i ? ctx.lineTo(wk(w), yv(fn(w))) : ctx.moveTo(wk(w), yv(fn(w))); }
      ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(wk(w1), yv(fn(w1)), lw + 3, 0, Math.PI * 2); ctx.fill();
    };
    curve(weight, wNow, rgba(IV, 0.9 * a), 3);
    if (fNow >= 0) {
      curve(fat, fNow, RED, 4);
      if (fNow > 24) {                                    // the overshoot, filled
        ctx.fillStyle = rgba(RED, 0.16); ctx.beginPath(); ctx.moveTo(wk(24), yv(100));
        for (let w = 24; w <= fNow; w += 0.25) ctx.lineTo(wk(w), yv(Math.max(100, fat(w))));
        ctx.lineTo(wk(fNow), yv(100)); ctx.closePath(); ctx.fill();
      }
    }
    // labels at the pens
    const lab = (e, fn, w1) => { e.style.left = `${wk(w1) + 18}px`; e.style.top = `${yv(fn(w1)) - 34}px`; };
    lab(st.gl[0], weight, wNow); show(st.gl[0], a);
    lab(st.gl[1], fat, Math.max(0, fNow)); show(st.gl[1], fNow >= 0 ? 1 : 0);
    st.axis.forEach((e, i) => show(e, a * (i === 1 ? clamp((t - C.m_end) / 0.3) : 1)));
    show(st.note, a); show(st.base, a);
    applySlam(st.plus, slam(t, C.m_plus4, 1e9));
  },
};
