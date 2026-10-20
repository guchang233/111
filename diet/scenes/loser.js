// 三 · The body keeps a grudge: −58 kg, +41 kg six years later (Fothergill 2016); then six years drawn
// as 72 months filling in, each one burning ~500 kcal a day less than expected.
import { el, show, text, clamp, prog, ease, rgba } from '/film/lib.js';
import { RED, IV, slam, applySlam } from '../kit.js';

const BX = 520, BW = 180, BASE = 860, KG = 4.2;          // px per kg

export default {
  init(L, D) {
    const st = L.st, ui = L.ui;
    st.n14 = el(ui, 'div', 'a num', '14', { left: '0', right: '0', top: '230px', textAlign: 'center', fontSize: '260px', lineHeight: 1 });
    const big = (x, top, s, col, lab) => {
      const b = el(ui, 'div', 'a', '', { left: `${x}px`, top: `${top}px`, transformOrigin: '0 50%' });
      el(b, 'div', 'num', s, { fontSize: '170px', lineHeight: 1, color: col });
      el(b, 'div', 'lab', lab, { marginTop: '14px' });
      return b;
    };
    st.minus = big(820, 330, '−58<span style="font-size:0.42em"> kg</span>', IV, '比赛期间 · 平均');
    st.plus = big(820, 560, '+41<span style="font-size:0.42em"> kg</span>', RED, '6 年后 · 长回来');
    st.cal = el(ui, 'div', 'a', '', { left: '240px', top: '250px' });
    el(st.cal, 'div', 'lab', '每天比预期少烧');
    el(st.cal, 'div', 'num', '−500<span style="font-size:0.42em"> 大卡</span>', { fontSize: '120px', lineHeight: 1, marginTop: '10px', color: RED });
    st.day = el(ui, 'div', 'a', '', { left: '240px', top: '520px' });
    el(st.day, 'div', 'lab', '第');
    st.dn = el(st.day, 'div', 'num', '', { fontSize: '120px', lineHeight: 1, marginTop: '10px' });
    el(st.day, 'div', 'lab', '天', { marginTop: '10px' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, C = D.C, bar = C.bar, s0 = L.spec.start;
    show(st.n14, clamp((t - s0 - C.beat) / 0.2) * (1 - prog(t, C.bl_loss - 0.2, C.bl_loss)));
    // the bar: lose 58, gain back 41
    const barA = clamp((t - C.bl_loss) / 0.2) * (1 - prog(t, C.bl_days - 0.3, C.bl_days));
    if (barA > 0) {
      const start = 150, lost = 58 * ease.io(prog(t, C.bl_loss, C.bl_loss + 0.7 * bar)), back = 41 * ease.io(prog(t, C.bl_gain, C.bl_gain + 0.7 * bar));
      const h0 = start * KG, h = (start - lost + back) * KG;
      ctx.strokeStyle = rgba(IV, 0.3 * barA); ctx.setLineDash([5, 7]); ctx.strokeRect(BX, BASE - h0, BW, h0); ctx.setLineDash([]);
      ctx.fillStyle = rgba(IV, 0.85 * barA); ctx.fillRect(BX, BASE - (start - lost) * KG, BW, (start - lost) * KG);
      ctx.fillStyle = rgba(RED, barA); ctx.fillRect(BX, BASE - h, BW, back * KG);
    }
    applySlam(st.minus, { ...slam(t, C.bl_loss, C.bl_days - C.bl_loss - 0.3, 0.3) });
    applySlam(st.plus, { ...slam(t, C.bl_gain, C.bl_days - C.bl_gain - 0.3, 0.3) });
    // six years: 72 months, 6 rows
    const gA = clamp((t - C.bl_days) / 0.2);
    if (gA > 0) {
      const p = prog(t, C.bl_days + 0.4, C.bl_days_end - 0.2), fill = Math.floor(p * 72 + 1e-6);
      for (let i = 0; i < 72; i++) {
        const x = 880 + (i % 12) * 66, y = 290 + Math.floor(i / 12) * 84;
        const on = i < fill, age = (t - (C.bl_days + 0.4 + (i / 72) * (C.bl_days_end - 0.6 - C.bl_days))) ;
        ctx.strokeStyle = rgba(IV, 0.25 * gA); ctx.lineWidth = 1; ctx.strokeRect(x, y, 52, 60);
        if (on) { ctx.fillStyle = rgba(RED, 0.5 + 0.5 * Math.exp(-Math.max(0, age) / 0.3)); ctx.fillRect(x + 4, y + 4, 44, 52); }
      }
      ctx.font = '500 16px "Noto Sans SC"'; ctx.fillStyle = rgba(IV, 0.45 * gA);
      for (let r = 0; r < 6; r++) ctx.fillText(`第 ${r + 1} 年`, 880 - 90, 290 + r * 84 + 36);
      text(st.dn, String(Math.round(p * 2190)));
      const last = t > C.bl_days_end;
      if (last) { ctx.strokeStyle = rgba(RED, 0.9 * Math.exp(-(t - C.bl_days_end) / 0.6)); ctx.lineWidth = 3; ctx.strokeRect(870, 280, 12 * 66 + 2, 6 * 84 - 4); }
    }
    show(st.cal, gA); show(st.day, gA);
  },
};
