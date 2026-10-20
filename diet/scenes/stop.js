// Ending: one line, then the sources.
import { el, show, clamp, prog } from '/film/lib.js';

const SRC = [
  'Romero-Corral A 等. European Heart Journal, 2010（NHANES III，正常体重肥胖）',
  'Keys A 等. The Biology of Human Starvation, 1950（明尼苏达饥饿实验）',
  'Dulloo AG 等. American Journal of Clinical Nutrition, 1997;65:717–723（脂肪超调）',
  'Fothergill E 等. Obesity, 2016;24:1612–1619（《超级减肥王》6 年追踪）',
  '青少年峰值骨量与功能性下丘脑闭经相关综述',
  'Neumark-Sztainer D 等. Journal of the American Dietetic Association, 2006（Project EAT）',
  'Arcelus J 等. Archives of General Psychiatry, 2011（进食障碍死亡率荟萃分析）',
  '12356：国家卫生健康委全国统一心理援助热线',
];

export default {
  init(L, D) {
    const st = L.st, ui = L.ui;
    st.line = el(ui, 'div', 'a', '别饿了。', { left: '0', right: '0', top: '440px', textAlign: 'center', fontFamily: 'var(--serif-cn)', fontWeight: 700, fontSize: '130px', letterSpacing: '0.12em', color: '#f2eee6' });
    st.src = el(ui, 'div', 'a', `<div class="lab" style="margin-bottom:26px">数据来源</div>` + SRC.map((s) => `<div>${s}</div>`).join('') +
      `<div class="lab" style="margin-top:34px">钢琴音源 Salamander Grand Piano V3 · Alexander Holm · CC BY 3.0 &nbsp;·&nbsp; 画面与声音由代码逐帧生成</div>`,
      { left: '0', right: '0', top: '250px', textAlign: 'center', fontFamily: 'var(--serif-cn)', fontSize: '22px', lineHeight: 2.0, color: 'rgba(236,231,222,0.72)' });
  },
  draw(L, t, D) {
    const C = D.C;
    show(L.st.line, clamp((t - C.stop - C.beat) / 0.6) * (1 - prog(t, C.roll - 0.6, C.roll)));
    show(L.st.src, clamp((t - C.roll) / 0.8) * (1 - prog(t, C.end - 1.2, C.end - 0.1)));
  },
};
