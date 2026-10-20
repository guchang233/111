// 六 · Dieting makes it worse: 2516 teenagers (Project EAT, 74 × 34 dots), five years on: ×3 overweight,
// ×6 loss-of-control binge eating (odds, girls 2.7/6.4, boys 3.2/5.9). Anorexia: SMR 5.86 (Arcelus 2011).
import { el, show, clamp, prog, ease, rgba, rng } from '/film/lib.js';
import { RED, IV, slam, applySlam } from '../kit.js';

const COLS = 74, ROWS = 34, SX = 22, SY = 16, OX = 960 - ((COLS - 1) * SX) / 2, OY = 230;

export default {
  init(L, D) {
    const st = L.st, ui = L.ui, R = rng(2516);
    st.sel = Array.from({ length: COLS * ROWS }, () => R() < 0.22);
    st.ph = Array.from({ length: COLS * ROWS }, () => R());
    const big = (x, s, lab, col) => {
      const b = el(ui, 'div', 'a', '', { left: `${x}px`, top: '300px', width: '700px', textAlign: 'center', transformOrigin: '50% 50%' });
      el(b, 'div', 'num', s, { fontSize: '260px', lineHeight: 1, color: col });
      el(b, 'div', 'lab', lab, { marginTop: '22px', fontSize: '22px' });
      return b;
    };
    st.x3 = big(210, '×3', '5 年后超重的几率', IV);
    st.x6 = big(1010, '×6', '出现失控暴食的几率', RED);
    st.an = big(610, '5.86', '神经性厌食 · 标准化死亡率比', RED);
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, C = D.C, bar = C.bar;
    const fieldA = 1 - prog(t, C.x3 - 0.2, C.x3 + 0.1);
    if (fieldA > 0) {
      const hi = clamp((t - (C.dots + 2 * bar)) / 0.5);
      for (let i = 0; i < COLS * ROWS; i++) {
        const c = i % COLS, r = Math.floor(i / COLS);
        const on = clamp((t - C.dots - ((c + r * 0.5) / (COLS + ROWS * 0.5)) * bar) / 0.15);
        if (on <= 0) continue;
        const s = st.sel[i];
        ctx.fillStyle = s && hi > 0 ? rgba(IV, (0.35 + 0.65 * hi) * fieldA) : rgba(IV, (0.35 - 0.2 * hi) * on * fieldA);
        ctx.beginPath(); ctx.arc(OX + c * SX, OY + r * SY, s && hi > 0 ? 3.2 : 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    applySlam(st.x3, slam(t, C.x3, C.an - C.x3 - 0.3, 0.3));
    applySlam(st.x6, slam(t, C.x6, C.an - C.x6 - 0.3, 0.3));
    applySlam(st.an, slam(t, C.an_x, 1e9));
    if (t > C.an_x) {                                      // one line under it, drawn slowly
      ctx.fillStyle = RED; ctx.fillRect(960 - 200 * ease.out(prog(t, C.an_x, C.an_x + 1.2)), 700, 400 * ease.out(prog(t, C.an_x, C.an_x + 1.2)), 3);
    }
  },
};
