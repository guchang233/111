// 一 · What the scale doesn't say: body composition as one bar; starving takes the muscle, the fat stays.
// Then: normal-weight obesity, metabolic syndrome 16.6% vs 4.8% (NHANES III).
import { el, show, text, clamp, prog, ease, rgba, rng } from '/film/lib.js';
import { RED, IV, slam, applySlam } from '../kit.js';

const X0 = 260, BW = 1400, Y = 420, BH = 120, KG = 52;
const SEG = [['肌肉', 20.8, IV], ['骨骼 · 器官 · 水分', 18.7, 'rgba(236,231,222,0.32)'], ['脂肪', 12.5, RED]];
const PX = BW / KG;

export default {
  init(L, D) {
    const st = L.st, ui = L.ui;
    st.labs = SEG.map(([n]) => el(ui, 'div', 'a lab', n, {}));
    st.kgs = SEG.map(() => el(ui, 'div', 'a num', '', { fontSize: '34px', color: IV }));
    st.total = el(ui, 'div', 'a', '', { right: '260px', top: '250px', textAlign: 'right' });
    el(st.total, 'div', 'lab', '体重 · KG');
    st.tn = el(st.total, 'div', 'num', '', { fontSize: '96px', lineHeight: 1, marginTop: '10px' });
    st.share = el(ui, 'div', 'a', '', { left: '260px', top: '250px' });
    el(st.share, 'div', 'lab', '脂肪占比');
    st.sn = el(st.share, 'div', 'num', '', { fontSize: '96px', lineHeight: 1, marginTop: '10px', color: RED });
    const big = (x, n, lab, col) => {
      const b = el(ui, 'div', 'a', '', { left: `${x}px`, top: '250px', width: '640px', textAlign: 'center', transformOrigin: '50% 50%' });
      el(b, 'div', 'num', n, { fontSize: '200px', lineHeight: 1, color: col });
      el(b, 'div', 'lab', lab, { marginTop: '26px' });
      return b;
    };
    st.a = big(300, '16.6<span style="font-size:0.45em">%</span>', '正常体重肥胖', RED);
    st.b = big(980, '4.8<span style="font-size:0.45em">%</span>', '体重、体脂都正常', 'rgba(236,231,222,0.55)');
    st.k = el(ui, 'div', 'a lab', '代谢综合征的比例 &nbsp;·&nbsp; 美国 NHANES III', { left: '0', right: '0', top: '640px', textAlign: 'center' });
    const R = rng(7);
    st.parts = Array.from({ length: 260 }, () => ({ y: Y + R() * BH, at: R(), vx: 40 + R() * 260, vy: (R() - 0.6) * 160, r: 1 + R() * 2.2 }));
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, C = D.C, bar = C.bar, s0 = L.spec.start;
    const p = ease.io(prog(t, s0 + bar, s0 + 5 * bar));          // bars 8–12: the diet
    const lost = 6.7 * p, mus = 20.8 - lost;
    const barVis = 1 - prog(t, C.nwo - 0.25, C.nwo);
    const kg = [mus, 18.7, 12.5];
    let x = X0;
    kg.forEach((v, i) => {
      const w = v * PX - 6;
      ctx.fillStyle = SEG[i][2]; ctx.globalAlpha = barVis;
      ctx.fillRect(x, Y, w, BH);
      ctx.globalAlpha = 1;
      st.labs[i].style.left = `${x}px`; st.labs[i].style.top = `${Y + BH + 22}px`;
      st.kgs[i].style.left = `${x}px`; st.kgs[i].style.top = `${Y + BH + 54}px`;
      text(st.kgs[i], v.toFixed(1));
      show(st.labs[i], barVis * clamp((t - s0) / 0.4)); show(st.kgs[i], barVis * clamp((t - s0) / 0.4));
      x += w + 6;
    });
    // the muscle that left, as dust off its edge
    const edge = X0 + mus * PX - 6;
    for (const q of st.parts) {
      const born = s0 + bar + q.at * 4 * bar, age = t - born;
      if (age < 0 || age > 1.6) continue;
      const ex = X0 + (20.8 - 6.7 * ease.io(clamp((born - s0 - bar) / (4 * bar)))) * PX - 6;
      ctx.fillStyle = rgba(IV, 0.8 * (1 - age / 1.6) * barVis);
      ctx.fillRect(ex + q.vx * age * 0.6 - 40 * age * age, q.y + q.vy * age + 120 * age * age, q.r, q.r);
    }
    // ghost of where the bar used to end
    if (p > 0) { ctx.strokeStyle = rgba(IV, 0.25 * barVis); ctx.setLineDash([4, 6]); ctx.strokeRect(X0, Y, BW - 6 * 0, BH); ctx.setLineDash([]); }
    const tot = KG - lost;
    text(st.tn, tot.toFixed(1)); text(st.sn, ((12.5 / tot) * 100).toFixed(1) + '%');
    show(st.total, barVis * clamp((t - s0) / 0.4)); show(st.share, barVis * clamp((t - s0 - bar) / 0.4));
    applySlam(st.a, slam(t, C.nwo, 1e9));
    applySlam(st.b, slam(t, C.nwo + C.beat, 1e9));
    show(st.k, clamp((t - C.nwo - C.beat * 1.5) / 0.4));
  },
};
