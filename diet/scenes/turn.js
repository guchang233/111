// 七 · So what now: warm light; three plain instructions; then the way to help.
import { el, show, clamp, prog, ease, rgba } from '/film/lib.js';
import { WARM, slam, applySlam, pulse } from '../kit.js';

export default {
  bg: 'warm',
  init(L, D) {
    const st = L.st, ui = L.ui;
    st.words = ['吃够。', '练力量。', '睡够。'].map((w, i) =>
      el(ui, 'div', 'a heavy', w, { left: '0', right: '0', top: `${250 + i * 200}px`, textAlign: 'center', fontSize: '150px', color: '#f6ead9', transformOrigin: '50% 50%' }));
    st.help = el(ui, 'div', 'a', '', { left: '0', right: '0', top: '250px', textAlign: 'center' });
    el(st.help, 'div', 'lab', '心理援助热线', { color: 'rgba(241,197,143,0.75)', fontSize: '22px' });
    el(st.help, 'div', 'num', '12356', { fontSize: '210px', lineHeight: 1, marginTop: '20px', color: WARM, letterSpacing: '0.06em' });
    el(st.help, 'div', 'lab', '或去医院的精神心理科、进食障碍门诊', { marginTop: '30px', fontSize: '22px', color: 'rgba(243,230,212,0.75)', letterSpacing: '0.2em' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, C = D.C, s0 = L.spec.start;
    // dawn: a warm horizon that slowly widens
    const k = ease.out(prog(t, s0, s0 + 3 * C.bar));
    const g = ctx.createRadialGradient(960, 1180, 0, 960, 1180, 300 + 900 * k);
    g.addColorStop(0, rgba(WARM, 0.22 * k)); g.addColorStop(1, rgba(WARM, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    pulse(ctx, t, C.beat * 2, 0.25, WARM);                 // the heart, slower now
    const t3 = [C.eat, C.lift, C.sleep];
    st.words.forEach((e, i) => applySlam(e, { ...slam(t, t3[i], C.bar * 3 - (t3[i] - C.eat) - 0.4, 0.4), dx: 0, dy: 0 }));
    show(st.help, clamp((t - C.help) / 0.5) * (1 - prog(t, C.stop - 0.4, C.stop)));
  },
};
