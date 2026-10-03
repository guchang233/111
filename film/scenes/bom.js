// The bill of materials: everything the teardown left on the table. Part eight cannot be taken apart.
import { C, el, show, env, clamp, ease } from '../lib.js';

const INK = '#171615', MARK = '#c3402e', PW = 356, PH = 118, mid = PH / 2;
const path = (f, n = 400) => { let d = ''; for (let i = 0; i <= n; i++) { const [x, y] = f(i / n); d += (i ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2); } return d; };

export default {
  bg: 'paper', paper: true,
  glyphs: '0123456789.:→…×ΣaₙsinωtHzQTYALSOINP-?',
  init(L, D) {
    const st = L.st, ui = L.ui, S = D.stats;
    el(ui, 'div', 'a kicker', 'BILL OF MATERIALS <em>/</em> 零件清单', { left: '120px', top: '104px' });
    el(ui, 'div', 'a h-title', '拆完了。', { left: '120px', top: '140px' });
    el(ui, 'div', 'a h-sub', `三首钢琴曲，${S.total_notes} 个音，最后只剩这八个零件。`, { left: '120px', top: '230px' });
    el(ui, 'div', 'a mono', 'DWG NO. 99 &nbsp;·&nbsp; BOM<br>SONGS 3 &nbsp;·&nbsp; NOTES ' + S.total_notes, { right: '120px', top: '104px', textAlign: 'right', fontSize: '12.5px', letterSpacing: '0.16em', color: 'rgba(23,22,21,0.5)', lineHeight: 2 });
    const amp = D.a4.partials.map((p) => p[1]);
    const tempos = D.eva_intro.tempos.filter((x) => x[0] < D.C.phrase);
    const pics = {
      octave: () => `<path d="${path((u) => [20 + u * 316, mid - Math.sin(u * 2 * Math.PI) * 30])}" fill="none" stroke="${INK}" stroke-width="1.4"/><path d="${path((u) => [20 + u * 316, mid + Math.sin(u * 2 * Math.PI) * 30])}" fill="none" stroke="${INK}" stroke-width="0.8" opacity="0.45"/><line x1="20" y1="${mid}" x2="336" y2="${mid}" stroke="${INK}" stroke-width="0.6" opacity="0.4"/><circle cx="178" cy="${mid}" r="4" fill="${MARK}"/><circle cx="20" cy="${mid}" r="3" fill="${INK}"/><circle cx="336" cy="${mid}" r="3" fill="${INK}"/>`,
      fifth: () => `<path d="${path((u) => { const t = u * 2 * Math.PI; return [178 + Math.sin(2 * t) * 92, mid + Math.sin(3 * t) * 52]; }, 900)}" fill="none" stroke="${INK}" stroke-width="1.3"/>`,
      triad: () => [4, 5, 6].map((k, i) => `<path d="${path((u) => [20 + u * 316, 22 + i * 37 - Math.sin(u * 2 * Math.PI * k) * 11], 500)}" fill="none" stroke="${INK}" stroke-width="1.2"/>`).join('') + `<line x1="336" y1="6" x2="336" y2="112" stroke="${MARK}" stroke-width="1" stroke-dasharray="2 3"/>`,
      semitone: () => {
        let s = `<line x1="20" y1="70" x2="336" y2="70" stroke="${INK}" stroke-width="1.2"/>`;
        for (let k = 0; k <= 12; k++) { const x = 20 + (k / 12) * 316, big = k % 12 === 0; s += `<line x1="${x}" y1="${70 - (big ? 26 : 14)}" x2="${x}" y2="70" stroke="${k === 1 ? MARK : INK}" stroke-width="${big ? 1.4 : 1}"/>`; }
        for (const r of [16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8]) { const x = 20 + Math.log2(r) * 316; s += `<line x1="${x}" y1="72" x2="${x}" y2="82" stroke="${INK}" stroke-width="0.8" opacity="0.5"/>`; }
        return s + `<text x="20" y="104" font-family="IBM Plex Mono" font-size="11" fill="${INK}" opacity="0.6">1</text><text x="336" y="104" text-anchor="end" font-family="IBM Plex Mono" font-size="11" fill="${INK}" opacity="0.6">2</text>`;
      },
      tempo: () => {
        const x = (t) => 20 + (t / 13.7) * 316, y = (b) => 104 - ((b - 80) / 90) * 92;
        let d = `M${x(0)},${y(158)}`, last = 158;
        for (const [t, b] of tempos) { d += `L${x(t)},${y(last)}L${x(t)},${y(b)}`; last = b; }
        d += `L${x(13.7)},${y(last)}`;
        return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.4"/><line x1="20" y1="104" x2="336" y2="104" stroke="${INK}" stroke-width="0.8"/><circle cx="${x(13.06)}" cy="${y(98)}" r="3.5" fill="${MARK}"/>`;
      },
      timbre: () => {
        let s = `<line x1="20" y1="104" x2="336" y2="104" stroke="${INK}" stroke-width="0.8"/>`;
        amp.forEach((a, i) => { const x = 34 + i * 26, h = Math.max(2, 92 * Math.pow(a, 0.62)); s += `<rect x="${x - 3.5}" y="${104 - h}" width="7" height="${h}" fill="${i === 0 ? MARK : INK}"/>`; });
        return s;
      },
      a440: () => `<path d="${path((u) => [20 + u * 316, mid - Math.sin(u * 2 * Math.PI * 3) * 34], 500)}" fill="none" stroke="${INK}" stroke-width="1.4"/><line x1="20" y1="${mid}" x2="336" y2="${mid}" stroke="${INK}" stroke-width="0.6" opacity="0.4"/>`,
      missing: () => '',
    };
    const parts = [
      { no: 'P-01', pic: 'octave', val: '2 : 1', nm: '八度', en: 'OCTAVE', also: '几乎所有文明的音乐' },
      { no: 'P-02', pic: 'fifth', val: '3 : 2', nm: '纯五度', en: 'FIFTH', also: 'TRAPPIST-1 的行星轨道' },
      { no: 'P-03', pic: 'triad', val: '4 : 5 : 6', nm: '大三和弦', en: 'MAJOR TRIAD', also: '每一个音自带的泛音里' },
      { no: 'P-04', pic: 'semitone', val: '1.059463…', nm: '半音', en: 'SEMITONE', also: '朱载堉，1584' },
      { no: 'P-05', pic: 'tempo', val: '158 → 98', nm: '速度', en: 'TEMPO', also: '心跳：每分钟 60–100 次' },
      { no: 'P-06', pic: 'timbre', val: 'Σ a<sub>n</sub> sin nωt', nm: '音色', en: 'TIMBRE', also: '耳蜗 · JPEG · 核磁共振', serif: true },
      { no: 'P-07', pic: 'a440', val: '440 Hz', nm: '标准音', en: 'CONCERT A', also: '1939 年伦敦国际会议' },
      { no: 'P-08', pic: 'missing', val: '无法拆解', nm: '打动你的那部分', en: '', also: '', missing: true },
    ];
    const grid = el(ui, 'div', 'a', '', { left: '120px', top: '312px', width: '1680px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '22px' });
    st.cards = parts.map((p) => el(grid, 'div', '', `
      <div class="mono" style="font-size:13px;letter-spacing:0.2em;color:var(--mark)">${p.no}</div>
      <div class="mono" style="position:absolute;right:22px;top:18px;font-size:11px;letter-spacing:0.16em;color:rgba(23,22,21,0.42)">${p.missing ? 'QTY ?' : 'QTY 1'}</div>
      <div style="height:118px;margin:10px -4px 6px"><svg viewBox="0 0 ${PW} ${PH}" style="width:100%;height:100%;overflow:visible">${pics[p.pic]()}</svg></div>
      <div style="${p.missing ? 'color:var(--mark);font-family:var(--serif-cn);font-size:30px;font-weight:500;letter-spacing:0.06em' : p.serif ? 'font-family:var(--serif-en);font-size:40px;font-weight:500' : 'font-family:var(--mono);font-size:34px'};line-height:1.1;white-space:nowrap">${p.val}</div>
      <div style="font-family:var(--serif-cn);font-weight:600;font-size:22px;margin-top:10px">${p.nm}${p.en ? `<i style="font-family:var(--serif-en);font-style:normal;font-weight:600;font-size:15px;letter-spacing:0.16em;margin-left:10px;color:rgba(23,22,21,0.55)">${p.en}</i>` : ''}</div>
      ${p.also ? `<div style="font-family:var(--serif-cn);font-size:14.5px;color:rgba(23,22,21,0.62);margin-top:8px;letter-spacing:0.03em"><b class="mono" style="font-weight:400;font-size:11px;letter-spacing:0.16em;color:rgba(23,22,21,0.42);margin-right:8px">ALSO IN</b>${p.also}</div>` : ''}`,
      { position: 'relative', height: '318px', border: p.missing ? '1.3px dashed var(--mark)' : '1.1px solid rgba(23,22,21,0.72)', padding: '18px 22px 0', boxSizing: 'border-box' }));
    st.cards.forEach((c) => c.querySelectorAll('sub').forEach((s) => Object.assign(s.style, { fontSize: '0.55em', verticalAlign: '-0.18em' })));
  },
  draw(L, t, D) {
    const st = L.st, times = D.C.bom_cards;
    st.cards.forEach((c, i) => {
      const k = ease.out(clamp((t - times[i]) / (i === 7 ? 0.9 : 0.35)));
      show(c, k);
      c.style.transform = `translateY(${((1 - k) * 14).toFixed(2)}px)`;
    });
  },
};
