// Title slam.
import { el } from '/film/lib.js';
import { RED, slam, applySlam } from '../kit.js';

export default {
  init(L, D) {
    const st = L.st;
    st.t = el(L.ui, 'div', 'a heavy', '越饿越胖', { left: '0', right: '0', top: '330px', textAlign: 'center', fontSize: '290px', color: '#f2eee6', letterSpacing: '0.04em' });
    st.s = el(L.ui, 'div', 'a lab', '16 岁 &nbsp;·&nbsp; 体脂率 <span style="color:' + RED + '">48%</span>', { left: '0', right: '0', top: '700px', textAlign: 'center', fontSize: '26px', color: 'rgba(236,231,222,0.7)' });
  },
  draw(L, t, D) {
    const C = D.C;
    applySlam(L.st.t, slam(t, C.title));
    const s = slam(t, C.title + C.beat * 2);
    applySlam(L.st.s, { ...s, s: 1, dx: 0, dy: 0 });
    L.ctx.fillStyle = RED; L.ctx.fillRect(960 - 60, 660, 120 * Math.min(1, (t - C.title) / 0.3), 3);
  },
};
